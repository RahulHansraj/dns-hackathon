const db = require('../database/db');

// Get farmer profile
exports.getProfile = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT f.id, f.location_name, f.latitude, f.longitude,
              u.full_name, u.email, u.theme_preference
       FROM farmers f
       JOIN users u ON u.id = f.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    
    if (result[0].length === 0) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }
    
    const farmer = result[0][0];
    
    res.json({
      id: farmer.id,
      fullName: farmer.full_name,
      email: farmer.email,
      themePreference: farmer.theme_preference,
      location: farmer.location_name ? {
        name: farmer.location_name,
        latitude: parseFloat(farmer.latitude),
        longitude: parseFloat(farmer.longitude)
      } : null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update farmer location
exports.updateLocation = async (req, res) => {
  try {
    const { locationName, latitude, longitude } = req.body;
    
    await db.execute(
      `UPDATE farmers 
       SET location_name = ?, latitude = ?, longitude = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [locationName, latitude, longitude, req.user.id]
    );
    
    res.json({
      message: 'Location updated',
      location: { name: locationName, latitude, longitude }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add crop details
exports.addCrop = async (req, res) => {
  try {
    const { cropId, weightKg, harvestDate } = req.body;
    
    // Get farmer id
    const farmerResult = await db.execute(
      'SELECT id FROM farmers WHERE user_id = ?',
      [req.user.id]
    );
    
    if (farmerResult[0].length === 0) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }
    
    const farmerId = farmerResult[0][0].id;
    
    const result = await db.execute(
      `INSERT INTO farmer_crops (farmer_id, crop_id, weight_kg, harvest_date)
       VALUES (?, ?, ?, ?)`,
      [farmerId, cropId, weightKg, harvestDate || new Date()]
    );
    
    res.status(201).json({
      message: 'Crop added',
      id: result[0].insertId
    });
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get farmer's crops
exports.getCrops = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT fc.id, fc.weight_kg, fc.harvest_date, fc.created_at,
              c.id as crop_id, c.name as crop_name, c.category, c.shelf_life_days
       FROM farmer_crops fc
       JOIN crops c ON c.id = fc.crop_id
       JOIN farmers f ON f.id = fc.farmer_id
       WHERE f.user_id = ?
       ORDER BY fc.created_at DESC`,
      [req.user.id]
    );
    
    res.json(result[0].map(row => ({
      id: row.id,
      cropId: row.crop_id,
      cropName: row.crop_name,
      category: row.category,
      weightKg: parseFloat(row.weight_kg),
      harvestDate: row.harvest_date,
      shelfLifeDays: row.shelf_life_days,
      createdAt: row.created_at
    })));
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a crop
exports.deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute(
      `DELETE FROM farmer_crops 
       WHERE id = ? AND farmer_id IN (SELECT id FROM farmers WHERE user_id = ?)`,
      [id, req.user.id]
    );
    
    res.json({ message: 'Crop deleted' });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get profit summary
exports.getProfitSummary = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    let dateFilter = '';
    let historyInterval = '';
    const params = [req.user.id];
    
    if (startDate && endDate) {
      dateFilter = 'AND cm.confirmed_at BETWEEN $2 AND $3';
      params.push(startDate, endDate);
      historyInterval = '';
    } else {
      switch (period) {
        case '1d':
          dateFilter = "AND cm.confirmed_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
          historyInterval = "DATE_SUB(NOW(), INTERVAL 1 DAY)";
          break;
        case '1m':
          dateFilter = "AND cm.confirmed_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
          historyInterval = "DATE_SUB(NOW(), INTERVAL 1 MONTH)";
          break;
        case '5m':
          dateFilter = "AND cm.confirmed_at >= DATE_SUB(NOW(), INTERVAL 5 MONTH)";
          historyInterval = "DATE_SUB(NOW(), INTERVAL 5 MONTH)";
          break;
        case '1y':
          dateFilter = "AND cm.confirmed_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
          historyInterval = "DATE_SUB(NOW(), INTERVAL 1 YEAR)";
          break;
        case 'max':
        default:
          dateFilter = '';
          historyInterval = "DATE_SUB(NOW(), INTERVAL 5 YEAR)";
      }
    }
    
    // Get summary
    const result = await db.execute(
      `SELECT 
         COALESCE(SUM(cm.expected_profit), 0) as total_profit,
         COALESCE(SUM(cm.transport_cost), 0) as total_transport_cost,
         COUNT(*) as total_transactions
       FROM confirmed_markets cm
       JOIN farmers f ON f.id = cm.farmer_id
       WHERE f.user_id = ? AND cm.status = 'completed' ${dateFilter}`,
      params
    );
    
    const summary = result[0][0];
    
    // Get profit history for chart
    const historyResult = await db.execute(
      `SELECT 
         DATE(cm.confirmed_at) as date,
         SUM(cm.expected_profit - cm.transport_cost) as profit
       FROM confirmed_markets cm
       JOIN farmers f ON f.id = cm.farmer_id
       WHERE f.user_id = ? AND cm.status = 'completed' 
         ${historyInterval ? `AND cm.confirmed_at >= ${historyInterval}` : ''}
       GROUP BY DATE(cm.confirmed_at)
       ORDER BY date ASC`,
      [req.user.id]
    );
    
    res.json({
      totalProfit: parseFloat(summary.total_profit),
      totalTransportCost: parseFloat(summary.total_transport_cost),
      totalTransactions: parseInt(summary.total_transactions),
      netProfit: parseFloat(summary.total_profit) - parseFloat(summary.total_transport_cost),
      history: historyResult[0].map(row => ({
        date: row.date,
        profit: parseFloat(row.profit)
      }))
    });
  } catch (error) {
    console.error('Get profit summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

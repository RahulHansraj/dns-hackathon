const db = require('../database/db');

// Get farmer profile
exports.getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.id, f.location_name, f.latitude, f.longitude,
              u.full_name, u.email, u.theme_preference
       FROM farmers f
       JOIN users u ON u.id = f.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }
    
    const farmer = result.rows[0];
    
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
    
    await db.query(
      `UPDATE farmers 
       SET location_name = $1, latitude = $2, longitude = $3, updated_at = NOW()
       WHERE user_id = $4`,
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
    const farmerResult = await db.query(
      'SELECT id FROM farmers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (farmerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }
    
    const farmerId = farmerResult.rows[0].id;
    
    const result = await db.query(
      `INSERT INTO farmer_crops (farmer_id, crop_id, weight_kg, harvest_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [farmerId, cropId, weightKg, harvestDate || new Date()]
    );
    
    res.status(201).json({
      message: 'Crop added',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Add crop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get farmer's crops
exports.getCrops = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT fc.id, fc.weight_kg, fc.harvest_date, fc.created_at,
              c.id as crop_id, c.name as crop_name, c.category, c.shelf_life_days
       FROM farmer_crops fc
       JOIN crops c ON c.id = fc.crop_id
       JOIN farmers f ON f.id = fc.farmer_id
       WHERE f.user_id = $1
       ORDER BY fc.created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows.map(row => ({
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
    
    await db.query(
      `DELETE FROM farmer_crops 
       WHERE id = $1 AND farmer_id IN (SELECT id FROM farmers WHERE user_id = $2)`,
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
          dateFilter = "AND cm.confirmed_at >= NOW() - INTERVAL '1 day'";
          historyInterval = "NOW() - INTERVAL '1 day'";
          break;
        case '1m':
          dateFilter = "AND cm.confirmed_at >= NOW() - INTERVAL '1 month'";
          historyInterval = "NOW() - INTERVAL '1 month'";
          break;
        case '5m':
          dateFilter = "AND cm.confirmed_at >= NOW() - INTERVAL '5 months'";
          historyInterval = "NOW() - INTERVAL '5 months'";
          break;
        case '1y':
          dateFilter = "AND cm.confirmed_at >= NOW() - INTERVAL '1 year'";
          historyInterval = "NOW() - INTERVAL '1 year'";
          break;
        case 'max':
        default:
          dateFilter = '';
          historyInterval = "NOW() - INTERVAL '5 years'";
      }
    }
    
    // Get summary
    const result = await db.query(
      `SELECT 
         COALESCE(SUM(cm.expected_profit), 0) as total_profit,
         COALESCE(SUM(cm.transport_cost), 0) as total_transport_cost,
         COUNT(*) as total_transactions
       FROM confirmed_markets cm
       JOIN farmers f ON f.id = cm.farmer_id
       WHERE f.user_id = $1 AND cm.status = 'completed' ${dateFilter}`,
      params
    );
    
    const summary = result.rows[0];
    
    // Get profit history for chart
    const historyResult = await db.query(
      `SELECT 
         DATE(cm.confirmed_at) as date,
         SUM(cm.expected_profit - cm.transport_cost) as profit
       FROM confirmed_markets cm
       JOIN farmers f ON f.id = cm.farmer_id
       WHERE f.user_id = $1 AND cm.status = 'completed' 
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
      history: historyResult.rows.map(row => ({
        date: row.date,
        profit: parseFloat(row.profit)
      }))
    });
  } catch (error) {
    console.error('Get profit summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

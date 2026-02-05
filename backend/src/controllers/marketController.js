const db = require('../database/db');

// Get all markets
exports.getMarkets = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT id, name, location_name, latitude, longitude
       FROM markets
       WHERE is_active = true
       ORDER BY name`
    );
    
    res.json(result[0].map(row => ({
      id: row.id,
      name: row.name,
      locationName: row.location_name,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude)
    })));
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top 10 performing markets
exports.getTopMarkets = async (req, res) => {
  try {
    const { cropId } = req.query;
    
    let query;
    let params = [];
    
    if (req.user) {
      // Get farmer's historical data
      const farmerResult = await db.execute(
        'SELECT id FROM farmers WHERE user_id = ?',
        [req.user.id]
      );
      
      if (farmerResult[0].length > 0) {
        const farmerId = farmerResult[0][0].id;
        
        // Check if farmer has historical data
        const historyCheck = await db.execute(
          'SELECT COUNT(*) as count FROM confirmed_markets WHERE farmer_id = ?',
          [farmerId]
        );
        
        if (parseInt(historyCheck[0][0].count) > 0) {
          // Rank based on farmer's historical performance
          query = `
            SELECT m.id, m.name, m.location_name, m.latitude, m.longitude,
                   AVG(cm.expected_profit) as avg_profit,
                   COUNT(cm.id) as transaction_count
            FROM markets m
            LEFT JOIN confirmed_markets cm ON cm.market_id = m.id AND cm.farmer_id = ?
            WHERE m.is_active = true
            GROUP BY m.id
            ORDER BY avg_profit DESC, transaction_count DESC
            LIMIT 10
          `;
          params = [farmerId];
        }
      }
    }
    
    // Default: rank by highest selling price
    if (!query) {
      query = `
        SELECT m.id, m.name, m.location_name, m.latitude, m.longitude,
               MAX(ph.price_per_kg) as max_price,
               AVG(ph.price_per_kg) as avg_price
        FROM markets m
        LEFT JOIN price_history ph ON ph.market_id = m.id 
          AND ph.recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ${cropId ? 'AND ph.crop_id = ?' : ''}
        WHERE m.is_active = true
        GROUP BY m.id
        ORDER BY max_price DESC
        LIMIT 10
      `;
      params = cropId ? [cropId] : [];
    }
    
    const result = await db.execute(query, params);
    
    res.json(result[0].map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.name,
      locationName: row.location_name,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      maxPrice: row.max_price ? parseFloat(row.max_price) : null,
      avgPrice: row.avg_price ? parseFloat(row.avg_price) : null,
      avgProfit: row.avg_profit ? parseFloat(row.avg_profit) : null
    })));
  } catch (error) {
    console.error('Get top markets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get market price history
exports.getPriceHistory = async (req, res) => {
  try {
    const { marketId } = req.params;
    const { cropId, period } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case '1d':
        dateFilter = "AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
        break;
      case '1m':
        dateFilter = "AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)";
        break;
      case '5m':
        dateFilter = "AND recorded_at >= DATE_SUB(NOW(), INTERVAL 5 MONTH)";
        break;
      case '1y':
        dateFilter = "AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)";
        break;
      case 'max':
      default:
        dateFilter = '';
    }
    
    const params = [marketId];
    let cropFilter = '';
    if (cropId) {
      cropFilter = 'AND crop_id = ?';
      params.push(cropId);
    }
    
    const result = await db.execute(
      `SELECT price_per_kg, recorded_at, crop_id
       FROM price_history
       WHERE market_id = ? ${cropFilter} ${dateFilter}
       ORDER BY recorded_at ASC`,
      params
    );
    
    // Calculate stats
    const prices = result[0].map(r => parseFloat(r.price_per_kg));
    const stats = {
      highest: prices.length ? Math.max(...prices) : 0,
      lowest: prices.length ? Math.min(...prices) : 0,
      average: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    };
    
    res.json({
      history: result[0].map(row => ({
        price: parseFloat(row.price_per_kg),
        date: row.recorded_at,
        cropId: row.crop_id
      })),
      stats
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get market demands
exports.getMarketDemands = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT md.id, md.demand_price_per_kg, md.quantity_needed_kg, 
              md.valid_from, md.valid_until,
              m.id as market_id, m.name as market_name, m.location_name,
              c.id as crop_id, c.name as crop_name
       FROM market_demands md
       JOIN markets m ON m.id = md.market_id
       JOIN crops c ON c.id = md.crop_id
       WHERE md.is_active = true AND md.valid_until > NOW()
       ORDER BY md.demand_price_per_kg DESC`
    );
    
    res.json(result[0].map(row => ({
      id: row.id,
      marketId: row.market_id,
      marketName: row.market_name,
      locationName: row.location_name,
      cropId: row.crop_id,
      cropName: row.crop_name,
      pricePerKg: parseFloat(row.demand_price_per_kg),
      quantityNeeded: parseFloat(row.quantity_needed_kg),
      validFrom: row.valid_from,
      validUntil: row.valid_until
    })));
  } catch (error) {
    console.error('Get market demands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single market details
exports.getMarketDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.execute(
      `SELECT id, name, location_name, latitude, longitude
       FROM markets WHERE id = ?`,
      [id]
    );
    
    if (result[0].length === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    const market = result[0][0];
    
    // Get current demands
    const demands = await db.execute(
      `SELECT md.id, md.demand_price_per_kg, md.quantity_needed_kg, 
              md.valid_until, c.name as crop_name
       FROM market_demands md
       JOIN crops c ON c.id = md.crop_id
       WHERE md.market_id = ? AND md.is_active = true AND md.valid_until > NOW()`,
      [id]
    );
    
    res.json({
      id: market.id,
      name: market.name,
      locationName: market.location_name,
      latitude: parseFloat(market.latitude),
      longitude: parseFloat(market.longitude),
      demands: demands[0].map(d => ({
        id: d.id,
        cropName: d.crop_name,
        pricePerKg: parseFloat(d.demand_price_per_kg),
        quantityNeeded: parseFloat(d.quantity_needed_kg),
        validUntil: d.valid_until
      }))
    });
  } catch (error) {
    console.error('Get market details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

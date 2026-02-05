const db = require('../database/db');

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate transport cost (simple distance-based)
const calculateTransportCost = (distanceKm, weightKg) => {
  const baseRate = 5; // Rs per km
  const weightFactor = 0.1; // Additional Rs per kg per km
  return (baseRate + weightFactor * weightKg) * distanceKm;
};

// Calculate spoilage risk
const calculateSpoilageRisk = (distanceKm, shelfLifeDays) => {
  // Estimate travel time (average 40 km/h)
  const travelTimeHours = distanceKm / 40;
  const travelTimeDays = travelTimeHours / 24;
  
  // Risk based on shelf life consumption
  const riskPercentage = (travelTimeDays / shelfLifeDays) * 100;
  
  if (riskPercentage < 10) return 'low';
  if (riskPercentage < 30) return 'medium';
  return 'high';
};

// Analyze markets for farmer's crops
exports.analyzeMarkets = async (req, res) => {
  try {
    const { farmerLat, farmerLon, crops } = req.body;
    
    // Get farmer's location if not provided
    let lat = farmerLat;
    let lon = farmerLon;
    
    if (!lat || !lon) {
      if (req.user) {
        const farmerResult = await db.query(
          'SELECT latitude, longitude FROM farmers WHERE user_id = $1',
          [req.user.id]
        );
        if (farmerResult.rows.length > 0 && farmerResult.rows[0].latitude) {
          lat = parseFloat(farmerResult.rows[0].latitude);
          lon = parseFloat(farmerResult.rows[0].longitude);
        }
      }
    }
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Farmer location required' });
    }
    
    // Get all active markets
    const marketsResult = await db.query(
      'SELECT id, name, location_name, latitude, longitude FROM markets WHERE is_active = true'
    );
    
    // If no crops specified, return general market opportunities
    if (!crops || crops.length === 0) {
      const opportunities = await db.query(
        `SELECT md.id, md.demand_price_per_kg, md.quantity_needed_kg, md.valid_until,
                m.id as market_id, m.name as market_name, m.location_name, m.latitude, m.longitude,
                c.id as crop_id, c.name as crop_name
         FROM market_demands md
         JOIN markets m ON m.id = md.market_id
         JOIN crops c ON c.id = md.crop_id
         WHERE md.is_active = true AND md.valid_until > NOW()
         ORDER BY md.demand_price_per_kg DESC
         LIMIT 20`
      );
      
      const results = opportunities.rows.map(opp => {
        const distance = calculateDistance(lat, lon, parseFloat(opp.latitude), parseFloat(opp.longitude));
        return {
          marketId: opp.market_id,
          marketName: opp.market_name,
          locationName: opp.location_name,
          latitude: parseFloat(opp.latitude),
          longitude: parseFloat(opp.longitude),
          cropId: opp.crop_id,
          cropName: opp.crop_name,
          pricePerKg: parseFloat(opp.demand_price_per_kg),
          quantityNeeded: parseFloat(opp.quantity_needed_kg),
          validUntil: opp.valid_until,
          distance: Math.round(distance * 10) / 10
        };
      });
      
      return res.json({ opportunities: results });
    }
    
    // Analyze with crops
    const analysisResults = [];
    
    for (const crop of crops) {
      const { cropId, weightKg } = crop;
      
      // Get crop details
      const cropResult = await db.query(
        'SELECT id, name, shelf_life_days FROM crops WHERE id = $1',
        [cropId]
      );
      
      if (cropResult.rows.length === 0) continue;
      
      const cropInfo = cropResult.rows[0];
      
      for (const market of marketsResult.rows) {
        const marketLat = parseFloat(market.latitude);
        const marketLon = parseFloat(market.longitude);
        
        // Calculate distance
        const distance = calculateDistance(lat, lon, marketLat, marketLon);
        
        // Get current price for this crop at this market
        const priceResult = await db.query(
          `SELECT price_per_kg FROM price_history 
           WHERE market_id = $1 AND crop_id = $2 
           ORDER BY recorded_at DESC LIMIT 1`,
          [market.id, cropId]
        );
        
        const currentPrice = priceResult.rows.length > 0 
          ? parseFloat(priceResult.rows[0].price_per_kg) 
          : 50; // Default price
        
        // Calculate costs and profit
        const transportCost = calculateTransportCost(distance, weightKg);
        const spoilageRisk = calculateSpoilageRisk(distance, cropInfo.shelf_life_days);
        const revenue = currentPrice * weightKg;
        const expectedProfit = revenue - transportCost;
        
        // Apply spoilage penalty
        let adjustedProfit = expectedProfit;
        if (spoilageRisk === 'medium') adjustedProfit *= 0.9;
        if (spoilageRisk === 'high') adjustedProfit *= 0.7;
        
        analysisResults.push({
          marketId: market.id,
          marketName: market.name,
          locationName: market.location_name,
          latitude: marketLat,
          longitude: marketLon,
          cropId: cropInfo.id,
          cropName: cropInfo.name,
          weightKg,
          distance: Math.round(distance * 10) / 10,
          currentPricePerKg: currentPrice,
          transportCost: Math.round(transportCost),
          spoilageRisk,
          revenue: Math.round(revenue),
          expectedProfit: Math.round(adjustedProfit)
        });
      }
    }
    
    // Sort by expected profit (highest first)
    analysisResults.sort((a, b) => b.expectedProfit - a.expectedProfit);
    
    res.json({ 
      farmerLocation: { latitude: lat, longitude: lon },
      analysis: analysisResults 
    });
  } catch (error) {
    console.error('Analyze markets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Confirm market selection
exports.confirmMarket = async (req, res) => {
  try {
    const { marketId, cropId, weightKg, expectedProfit, transportCost, spoilageRisk } = req.body;
    
    // Get farmer id
    const farmerResult = await db.query(
      'SELECT id FROM farmers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (farmerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Farmer profile not found' });
    }
    
    const farmerId = farmerResult.rows[0].id;
    
    // Create confirmed market entry
    const result = await db.query(
      `INSERT INTO confirmed_markets 
       (farmer_id, market_id, crop_id, weight_kg, expected_profit, transport_cost, spoilage_risk)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [farmerId, marketId, cropId, weightKg, expectedProfit, transportCost, spoilageRisk]
    );
    
    res.status(201).json({
      message: 'Market confirmed',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Confirm market error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get confirmed markets
exports.getConfirmedMarkets = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cm.id, cm.weight_kg, cm.expected_profit, cm.transport_cost, 
              cm.spoilage_risk, cm.status, cm.confirmed_at,
              m.id as market_id, m.name as market_name, m.location_name, 
              m.latitude, m.longitude,
              c.id as crop_id, c.name as crop_name,
              f.latitude as farmer_lat, f.longitude as farmer_lon, f.location_name as farmer_location
       FROM confirmed_markets cm
       JOIN markets m ON m.id = cm.market_id
       JOIN crops c ON c.id = cm.crop_id
       JOIN farmers f ON f.id = cm.farmer_id
       WHERE f.user_id = $1
       ORDER BY cm.confirmed_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows.map(row => ({
      id: row.id,
      marketId: row.market_id,
      marketName: row.market_name,
      marketLocation: row.location_name,
      marketLatitude: parseFloat(row.latitude),
      marketLongitude: parseFloat(row.longitude),
      cropId: row.crop_id,
      cropName: row.crop_name,
      weightKg: parseFloat(row.weight_kg),
      expectedProfit: parseFloat(row.expected_profit),
      transportCost: parseFloat(row.transport_cost),
      spoilageRisk: row.spoilage_risk,
      status: row.status,
      confirmedAt: row.confirmed_at,
      farmerLocation: {
        name: row.farmer_location,
        latitude: parseFloat(row.farmer_lat),
        longitude: parseFloat(row.farmer_lon)
      }
    })));
  } catch (error) {
    console.error('Get confirmed markets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Complete a confirmed market transaction
exports.completeTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualProfit } = req.body;
    
    await db.query(
      `UPDATE confirmed_markets 
       SET status = 'completed', completed_at = NOW(),
           expected_profit = COALESCE($1, expected_profit)
       WHERE id = $2 AND farmer_id IN (SELECT id FROM farmers WHERE user_id = $3)`,
      [actualProfit, id, req.user.id]
    );
    
    res.json({ message: 'Transaction completed' });
  } catch (error) {
    console.error('Complete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel a confirmed market
exports.cancelConfirmedMarket = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      `DELETE FROM confirmed_markets 
       WHERE id = $1 AND farmer_id IN (SELECT id FROM farmers WHERE user_id = $2)`,
      [id, req.user.id]
    );
    
    res.json({ message: 'Confirmation cancelled' });
  } catch (error) {
    console.error('Cancel confirmed market error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

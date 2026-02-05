const db = require('../database/db');

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    
    let filter = '';
    if (unreadOnly === 'true') {
      filter = 'AND n.is_read = false';
    }
    
    const result = await db.execute(
      `SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at,
              m.name as market_name, c.name as crop_name
       FROM notifications n
       LEFT JOIN markets m ON m.id = n.market_id
       LEFT JOIN crops c ON c.id = n.crop_id
       JOIN farmers f ON f.id = n.farmer_id
       WHERE f.user_id = ? ${filter}
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    
    res.json(result[0].map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      marketName: row.market_name,
      cropName: row.crop_name,
      createdAt: row.created_at
    })));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute(
      `UPDATE notifications SET is_read = true
       WHERE id = ? AND farmer_id IN (SELECT id FROM farmers WHERE user_id = ?)`,
      [id, req.user.id]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await db.execute(
      `UPDATE notifications SET is_read = true
       WHERE farmer_id IN (SELECT id FROM farmers WHERE user_id = ?)`,
      [req.user.id]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT COUNT(*) as count
       FROM notifications n
       JOIN farmers f ON f.id = n.farmer_id
       WHERE f.user_id = ? AND n.is_read = false`,
      [req.user.id]
    );
    
    res.json({ count: parseInt(result[0][0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create notification (internal use)
exports.createNotification = async (farmerId, type, title, message, marketId = null, cropId = null) => {
  try {
    await db.execute(
      `INSERT INTO notifications (farmer_id, type, title, message, market_id, crop_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [farmerId, type, title, message, marketId, cropId]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Check and create price alerts (called by scheduler)
exports.checkPriceAlerts = async () => {
  try {
    // Find significant price increases in last 24 hours
    const priceChanges = await db.execute(
      `WITH recent_prices AS (
         SELECT market_id, crop_id, price_per_kg,
                LAG(price_per_kg) OVER (PARTITION BY market_id, crop_id ORDER BY recorded_at) as prev_price
         FROM price_history
         WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 2 DAY)
       )
       SELECT rp.market_id, rp.crop_id, rp.price_per_kg, rp.prev_price,
              m.name as market_name, c.name as crop_name
       FROM recent_prices rp
       JOIN markets m ON m.id = rp.market_id
       JOIN crops c ON c.id = rp.crop_id
       WHERE rp.prev_price IS NOT NULL 
         AND rp.price_per_kg > rp.prev_price * 1.1`
    );
    
    // Get all farmers with confirmed markets matching these
    for (const change of priceChanges[0]) {
      const farmers = await db.execute(
        `SELECT DISTINCT f.id, f.user_id
         FROM farmers f
         JOIN confirmed_markets cm ON cm.farmer_id = f.id
         WHERE cm.market_id = ? AND cm.status = 'confirmed'`,
        [change.market_id]
      );
      
      for (const farmer of farmers[0]) {
        const increase = ((change.price_per_kg / change.prev_price - 1) * 100).toFixed(1);
        await exports.createNotification(
          farmer.id,
          'price_rise',
          `Price Rise Alert: ${change.crop_name}`,
          `${change.crop_name} price increased by ${increase}% at ${change.market_name}`,
          change.market_id,
          change.crop_id
        );
      }
    }
  } catch (error) {
    console.error('Check price alerts error:', error);
  }
};

// Check high demand notifications
exports.checkDemandAlerts = async () => {
  try {
    // Find new high-value demands
    const demands = await db.execute(
      `SELECT md.id, md.market_id, md.crop_id, md.demand_price_per_kg,
              m.name as market_name, c.name as crop_name
       FROM market_demands md
       JOIN markets m ON m.id = md.market_id
       JOIN crops c ON c.id = md.crop_id
       WHERE md.is_active = true 
         AND md.valid_until > NOW()
         AND md.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
         AND md.demand_price_per_kg > (
           SELECT AVG(price_per_kg) * 1.2 
           FROM price_history 
           WHERE crop_id = md.crop_id AND recorded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         )`
    );
    
    // Notify farmers who have these crops
    for (const demand of demands[0]) {
      const farmers = await db.execute(
        `SELECT DISTINCT f.id
         FROM farmers f
         JOIN farmer_crops fc ON fc.farmer_id = f.id
         WHERE fc.crop_id = ?`,
        [demand.crop_id]
      );
      
      for (const farmer of farmers[0]) {
        await exports.createNotification(
          farmer.id,
          'high_demand',
          `High Demand: ${demand.crop_name}`,
          `${demand.market_name} is offering ₹${demand.demand_price_per_kg}/kg for ${demand.crop_name}`,
          demand.market_id,
          demand.crop_id
        );
      }
    }
  } catch (error) {
    console.error('Check demand alerts error:', error);
  }
};

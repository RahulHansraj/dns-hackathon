const db = require('../database/db');

// Get all crops
exports.getCrops = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT id, name, category, shelf_life_days FROM crops';
    let params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY name';
    
    const result = await db.execute(query, params);
    
    res.json(result[0].map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      shelfLifeDays: row.shelf_life_days
    })));
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get crop categories
exports.getCategories = async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT DISTINCT category FROM crops ORDER BY category'
    );
    
    res.json(result[0].map(row => row.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search crops
exports.searchCrops = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const result = await db.execute(
      `SELECT id, name, category, shelf_life_days 
       FROM crops 
       WHERE name LIKE ? 
       ORDER BY name 
       LIMIT 20`,
      [`%${q}%`]
    );
    
    res.json(result[0].map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      shelfLifeDays: row.shelf_life_days
    })));
  } catch (error) {
    console.error('Search crops error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

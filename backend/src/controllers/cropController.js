const db = require('../database/db');

// Get all crops
exports.getCrops = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT id, name, category, shelf_life_days FROM crops';
    let params = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY name';
    
    const result = await db.query(query, params);
    
    res.json(result.rows.map(row => ({
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
    const result = await db.query(
      'SELECT DISTINCT category FROM crops ORDER BY category'
    );
    
    res.json(result.rows.map(row => row.category));
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
    
    const result = await db.query(
      `SELECT id, name, category, shelf_life_days 
       FROM crops 
       WHERE name ILIKE $1 
       ORDER BY name 
       LIMIT 20`,
      [`%${q}%`]
    );
    
    res.json(result.rows.map(row => ({
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

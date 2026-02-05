const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const config = require('../config');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Signup with email/password
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    
    // Check if user exists
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const [userResult] = await db.execute(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash]
    );
    
    const userId = userResult.insertId;
    
    // Create farmer profile
    await db.execute(
      'INSERT INTO farmers (user_id) VALUES (?)',
      [userId]
    );
    
    // Get created user
    const [users] = await db.execute(
      'SELECT id, full_name, email, theme_preference FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];
    
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        themePreference: user.theme_preference
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login with email/password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [userResult] = await db.execute(
      'SELECT id, full_name, email, password_hash, theme_preference FROM users WHERE email = ?',
      [email]
    );
    
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult[0];
    
    // Check password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        themePreference: user.theme_preference
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Get current user
exports.me = async (req, res) => {
  try {
    const [userResult] = await db.execute(
      `SELECT u.id, u.full_name, u.email, u.theme_preference, 
              f.id as farmer_id, f.location_name, f.latitude, f.longitude
       FROM users u
       LEFT JOIN farmers f ON f.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult[0];
    
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      themePreference: user.theme_preference,
      farmerId: user.farmer_id,
      location: user.location_name ? {
        name: user.location_name,
        latitude: parseFloat(user.latitude),
        longitude: parseFloat(user.longitude)
      } : null
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update theme preference
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    
    await db.execute(
      'UPDATE users SET theme_preference = ?, updated_at = NOW() WHERE id = ?',
      [theme, req.user.id]
    );
    
    res.json({ message: 'Theme updated', theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

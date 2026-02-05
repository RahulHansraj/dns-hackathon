const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../database/db');
const config = require('../config');

const googleClient = new OAuth2Client(config.google.clientId);

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
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userResult = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, theme_preference',
      [fullName, email, passwordHash]
    );
    
    const user = userResult.rows[0];
    
    // Create farmer profile
    await db.query(
      'INSERT INTO farmers (user_id) VALUES ($1)',
      [user.id]
    );
    
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
    const userResult = await db.query(
      'SELECT id, full_name, email, password_hash, theme_preference FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use Google login for this account' });
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

// Google OAuth login/signup
exports.googleAuth = async (req, res) => {
  try {
    const { credential, accessToken } = req.body;
    
    let googleId, email, name;
    
    if (credential) {
      // Verify Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.google.clientId
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
    } else if (accessToken) {
      // Use access token to get user info
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userInfo = await response.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
    } else {
      return res.status(400).json({ error: 'No credential provided' });
    }
    
    // Check if user exists
    let userResult = await db.query(
      'SELECT id, full_name, email, theme_preference FROM users WHERE email = $1 OR google_id = $2',
      [email, googleId]
    );
    
    let user;
    let isNewUser = false;
    
    if (userResult.rows.length === 0) {
      // Auto-signup new user
      userResult = await db.query(
        'INSERT INTO users (full_name, email, google_id) VALUES ($1, $2, $3) RETURNING id, full_name, email, theme_preference',
        [name, email, googleId]
      );
      user = userResult.rows[0];
      isNewUser = true;
      
      // Create farmer profile
      await db.query(
        'INSERT INTO farmers (user_id) VALUES ($1)',
        [user.id]
      );
    } else {
      user = userResult.rows[0];
      
      // Update google_id if not set
      if (!user.google_id) {
        await db.query(
          'UPDATE users SET google_id = $1 WHERE id = $2',
          [googleId, user.id]
        );
      }
    }
    
    const token = generateToken(user);
    
    res.json({
      message: isNewUser ? 'Signup successful' : 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        themePreference: user.theme_preference
      },
      isNewUser
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
};

// Get current user
exports.me = async (req, res) => {
  try {
    const userResult = await db.query(
      `SELECT u.id, u.full_name, u.email, u.theme_preference, 
              f.id as farmer_id, f.location_name, f.latitude, f.longitude
       FROM users u
       LEFT JOIN farmers f ON f.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
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
    
    await db.query(
      'UPDATE users SET theme_preference = $1, updated_at = NOW() WHERE id = $2',
      [theme, req.user.id]
    );
    
    res.json({ message: 'Theme updated', theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

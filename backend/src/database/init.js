const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const schema = `
-- Drop existing tables if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS confirmed_markets CASCADE;
DROP TABLE IF EXISTS market_demands CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS farmer_crops CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  theme_preference VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Farmers table (extends users)
CREATE TABLE farmers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmers_user_id ON farmers(user_id);

-- Crops table
CREATE TABLE crops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  shelf_life_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Markets table
CREATE TABLE markets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location_name VARCHAR(255),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_markets_location ON markets(latitude, longitude);

-- Price history table (time-series data)
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_market_crop ON price_history(market_id, crop_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);

-- Farmer crops (crops farmer wants to sell)
CREATE TABLE farmer_crops (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
  weight_kg DECIMAL(10, 2) NOT NULL,
  harvest_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_crops_farmer_id ON farmer_crops(farmer_id);

-- Market demands (with validity window)
CREATE TABLE market_demands (
  id SERIAL PRIMARY KEY,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
  demand_price_per_kg DECIMAL(10, 2) NOT NULL,
  quantity_needed_kg DECIMAL(10, 2),
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_demands_active ON market_demands(is_active, valid_until);

-- Confirmed markets (farmer's confirmed transactions)
CREATE TABLE confirmed_markets (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
  crop_id INTEGER REFERENCES crops(id) ON DELETE CASCADE,
  weight_kg DECIMAL(10, 2) NOT NULL,
  expected_profit DECIMAL(10, 2),
  transport_cost DECIMAL(10, 2),
  spoilage_risk VARCHAR(20),
  status VARCHAR(50) DEFAULT 'confirmed',
  confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_confirmed_markets_farmer ON confirmed_markets(farmer_id);
CREATE INDEX idx_confirmed_markets_status ON confirmed_markets(status);

-- Notifications table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  market_id INTEGER REFERENCES markets(id),
  crop_id INTEGER REFERENCES crops(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_farmer ON notifications(farmer_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
`;

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create database if not exists
    const dbName = process.env.DB_NAME || 'farm_market';
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    if (checkDb.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    }
    
    client.release();
    
    // Connect to the new database and create schema
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });
    
    const appClient = await appPool.connect();
    await appClient.query(schema);
    console.log('Schema created successfully');
    appClient.release();
    await appPool.end();
    
  } catch (error) {
    console.error('Error initializing database:', error);
    client.release();
  } finally {
    await pool.end();
  }
}

initDatabase();

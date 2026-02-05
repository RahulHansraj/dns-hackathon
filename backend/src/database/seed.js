const mysql = require('mysql2/promise');
require('dotenv').config();

async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'farm_market',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    ssl: { rejectUnauthorized: false }
  });
}

// Mock data for demo
const crops = [
  { name: 'Tomato', category: 'vegetable', shelf_life_days: 7 },
  { name: 'Potato', category: 'vegetable', shelf_life_days: 30 },
  { name: 'Onion', category: 'vegetable', shelf_life_days: 45 },
  { name: 'Carrot', category: 'vegetable', shelf_life_days: 21 },
  { name: 'Cabbage', category: 'vegetable', shelf_life_days: 14 },
  { name: 'Cauliflower', category: 'vegetable', shelf_life_days: 7 },
  { name: 'Spinach', category: 'leafy', shelf_life_days: 5 },
  { name: 'Brinjal', category: 'vegetable', shelf_life_days: 10 },
  { name: 'Cucumber', category: 'vegetable', shelf_life_days: 7 },
  { name: 'Capsicum', category: 'vegetable', shelf_life_days: 10 },
  { name: 'Green Chilli', category: 'vegetable', shelf_life_days: 14 },
  { name: 'Garlic', category: 'vegetable', shelf_life_days: 60 },
  { name: 'Ginger', category: 'vegetable', shelf_life_days: 30 },
  { name: 'Peas', category: 'vegetable', shelf_life_days: 5 },
  { name: 'Beans', category: 'vegetable', shelf_life_days: 7 },
  { name: 'Corn', category: 'grain', shelf_life_days: 5 },
  { name: 'Rice', category: 'grain', shelf_life_days: 365 },
  { name: 'Wheat', category: 'grain', shelf_life_days: 365 },
  { name: 'Apple', category: 'fruit', shelf_life_days: 30 },
  { name: 'Banana', category: 'fruit', shelf_life_days: 7 },
  { name: 'Mango', category: 'fruit', shelf_life_days: 10 },
  { name: 'Orange', category: 'fruit', shelf_life_days: 21 },
  { name: 'Grapes', category: 'fruit', shelf_life_days: 7 },
  { name: 'Papaya', category: 'fruit', shelf_life_days: 7 },
  { name: 'Watermelon', category: 'fruit', shelf_life_days: 14 },
];

const markets = [
  { name: 'Central Farmers Market', location_name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Green Valley Market', location_name: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Fresh Produce Hub', location_name: 'Nashik', latitude: 19.9975, longitude: 73.7898 },
  { name: 'Organic Market Place', location_name: 'Nagpur', latitude: 21.1458, longitude: 79.0882 },
  { name: 'City Wholesale Market', location_name: 'Aurangabad', latitude: 19.8762, longitude: 75.3433 },
  { name: 'Sunrise Agri Market', location_name: 'Kolhapur', latitude: 16.7050, longitude: 74.2433 },
  { name: 'Eastern Trade Center', location_name: 'Solapur', latitude: 17.6599, longitude: 75.9064 },
  { name: 'Northern Bazaar', location_name: 'Ahmednagar', latitude: 19.0948, longitude: 74.7480 },
  { name: 'Western Mandi', location_name: 'Satara', latitude: 17.6805, longitude: 74.0183 },
  { name: 'Southern Agri Hub', location_name: 'Sangli', latitude: 16.8524, longitude: 74.5815 },
  { name: 'Riverside Market', location_name: 'Thane', latitude: 19.2183, longitude: 72.9781 },
  { name: 'Highland Produce Center', location_name: 'Mahabaleshwar', latitude: 17.9237, longitude: 73.6586 },
  { name: 'Valley Fresh Market', location_name: 'Lonavala', latitude: 18.7546, longitude: 73.4062 },
  { name: 'Metro Wholesale Hub', location_name: 'Navi Mumbai', latitude: 19.0330, longitude: 73.0297 },
  { name: 'Golden Fields Market', location_name: 'Amravati', latitude: 20.9374, longitude: 77.7796 },
];

async function seedDatabase() {
  const connection = await getConnection();
  
  try {
    // Insert crops
    console.log('Inserting crops...');
    for (const crop of crops) {
      await connection.execute(
        'INSERT IGNORE INTO crops (name, category, shelf_life_days) VALUES (?, ?, ?)',
        [crop.name, crop.category, crop.shelf_life_days]
      );
    }
    console.log(`✅ Inserted ${crops.length} crops`);
    
    // Insert markets
    console.log('Inserting markets...');
    for (const market of markets) {
      await connection.execute(
        'INSERT INTO markets (name, location_name, latitude, longitude) VALUES (?, ?, ?, ?)',
        [market.name, market.location_name, market.latitude, market.longitude]
      );
    }
    console.log(`✅ Inserted ${markets.length} markets`);
    
    // Generate price history for last 365 days
    console.log('Generating price history...');
    const [cropsResult] = await connection.execute('SELECT id, name FROM crops');
    const [marketsResult] = await connection.execute('SELECT id FROM markets');
    
    const basePrices = {
      'Tomato': 40, 'Potato': 25, 'Onion': 35, 'Carrot': 45, 'Cabbage': 30,
      'Cauliflower': 50, 'Spinach': 35, 'Brinjal': 40, 'Cucumber': 30, 'Capsicum': 80,
      'Green Chilli': 60, 'Garlic': 150, 'Ginger': 120, 'Peas': 70, 'Beans': 55,
      'Corn': 35, 'Rice': 45, 'Wheat': 30, 'Apple': 150, 'Banana': 40,
      'Mango': 100, 'Orange': 60, 'Grapes': 80, 'Papaya': 45, 'Watermelon': 25
    };
    
    for (const market of marketsResult) {
      for (const crop of cropsResult) {
        const basePrice = basePrices[crop.name] || 50;
        
        // Generate daily prices for last 365 days
        for (let i = 365; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          // Add some variation to price (±30%)
          const variation = (Math.random() - 0.5) * 0.6;
          const price = Math.max(basePrice * (1 + variation), 5).toFixed(2);
          
          await connection.execute(
            'INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES (?, ?, ?, ?)',
            [market.id, crop.id, price, date]
          );
        }
      }
    }
    console.log('✅ Price history generated');
    
    // Generate market demands
    console.log('Generating market demands...');
    for (const market of marketsResult) {
      // 3-5 random demands per market
      const numDemands = Math.floor(Math.random() * 3) + 3;
      const shuffledCrops = [...cropsResult].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < numDemands; i++) {
        const crop = shuffledCrops[i];
        const basePrice = basePrices[crop.name] || 50;
        const demandPrice = (basePrice * (1 + Math.random() * 0.3)).toFixed(2);
        const validDays = Math.floor(Math.random() * 7) + 3;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validDays);
        
        await connection.execute(
          'INSERT INTO market_demands (market_id, crop_id, demand_price_per_kg, quantity_needed_kg, valid_until) VALUES (?, ?, ?, ?, ?)',
          [market.id, crop.id, demandPrice, Math.floor(Math.random() * 500) + 100, validUntil]
        );
      }
    }
    console.log('✅ Market demands generated');
    
    // Create a demo user
    console.log('Creating demo user...');
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('demo123', 10);
    
    const [userResult] = await connection.execute(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      ['Demo Farmer', 'demo@farm.com', passwordHash]
    );
    
    await connection.execute(
      'INSERT INTO farmers (user_id, location_name, latitude, longitude) VALUES (?, ?, ?, ?)',
      [userResult.insertId, 'Baramati', 18.1515, 74.5774]
    );
    
    console.log('✅ Demo user created (email: demo@farm.com, password: demo123)');
    
    console.log('\n🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase();

-- Sample Data for Farm to Market Platform
-- Copy and paste these queries into your MySQL terminal

USE farm_market;

-- Insert Crops (25 crops)
INSERT INTO crops (name, category, shelf_life_days) VALUES 
('Tomato', 'vegetable', 7),
('Potato', 'vegetable', 30),
('Onion', 'vegetable', 45),
('Carrot', 'vegetable', 21),
('Cabbage', 'vegetable', 14),
('Cauliflower', 'vegetable', 7),
('Spinach', 'leafy', 5),
('Brinjal', 'vegetable', 10),
('Cucumber', 'vegetable', 7),
('Capsicum', 'vegetable', 10),
('Green Chilli', 'vegetable', 14),
('Garlic', 'vegetable', 60),
('Ginger', 'vegetable', 30),
('Peas', 'vegetable', 5),
('Beans', 'vegetable', 7),
('Corn', 'grain', 5),
('Rice', 'grain', 365),
('Wheat', 'grain', 365),
('Apple', 'fruit', 30),
('Banana', 'fruit', 7),
('Mango', 'fruit', 10),
('Orange', 'fruit', 21),
('Grapes', 'fruit', 7),
('Papaya', 'fruit', 7),
('Watermelon', 'fruit', 14);

-- Insert Markets (15 markets)
INSERT INTO markets (name, location_name, latitude, longitude) VALUES
('Central Farmers Market', 'Mumbai', 19.0760, 72.8777),
('Green Valley Market', 'Pune', 18.5204, 73.8567),
('Fresh Produce Hub', 'Nashik', 19.9975, 73.7898),
('Organic Market Place', 'Nagpur', 21.1458, 79.0882),
('City Wholesale Market', 'Aurangabad', 19.8762, 75.3433),
('Sunrise Agri Market', 'Kolhapur', 16.7050, 74.2433),
('Eastern Trade Center', 'Solapur', 17.6599, 75.9064),
('Northern Bazaar', 'Ahmednagar', 19.0948, 74.7480),
('Western Mandi', 'Satara', 17.6805, 74.0183),
('Southern Agri Hub', 'Sangli', 16.8524, 74.5815),
('Riverside Market', 'Thane', 19.2183, 72.9781),
('Highland Produce Center', 'Mahabaleshwar', 17.9237, 73.6586),
('Valley Fresh Market', 'Lonavala', 18.7546, 73.4062),
('Metro Wholesale Hub', 'Navi Mumbai', 19.0330, 73.0297),
('Golden Fields Market', 'Amravati', 20.9374, 77.7796);

-- Insert Sample Price History (last 30 days for key crops in major markets)
-- Tomato prices in Mumbai
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(1, 1, 42.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1, 1, 38.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(1, 1, 45.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1, 1, 40.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1, 1, 43.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 1, 39.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 1, 41.00, NOW());

-- Potato prices in Mumbai
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(1, 2, 28.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1, 2, 26.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(1, 2, 24.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1, 2, 25.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1, 2, 27.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 2, 23.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, 25.00, NOW());

-- Onion prices in Mumbai
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(1, 3, 38.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1, 3, 35.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(1, 3, 40.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1, 3, 36.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1, 3, 34.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 3, 37.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 3, 35.00, NOW());

-- Rice prices in Mumbai
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(1, 17, 48.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(1, 17, 46.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(1, 17, 45.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(1, 17, 44.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(1, 17, 47.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(1, 17, 45.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 17, 46.00, NOW());

-- Tomato prices in Pune
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(2, 1, 40.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, 1, 44.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(2, 1, 38.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 1, 42.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 1, 39.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 1, 43.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 1, 40.00, NOW());

-- Potato prices in Pune
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(2, 2, 27.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, 2, 25.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(2, 2, 26.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(2, 2, 24.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(2, 2, 26.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 2, 24.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 2, 25.50, NOW());

-- Mango prices in Nashik
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(3, 21, 105.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(3, 21, 98.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(3, 21, 110.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(3, 21, 95.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(3, 21, 102.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(3, 21, 108.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 21, 100.00, NOW());

-- Apple prices in Nagpur
INSERT INTO price_history (market_id, crop_id, price_per_kg, recorded_at) VALUES
(4, 19, 155.50, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(4, 19, 148.20, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(4, 19, 152.00, DATE_SUB(NOW(), INTERVAL 20 DAY)),
(4, 19, 145.50, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(4, 19, 158.20, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(4, 19, 150.80, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 19, 152.00, NOW());

-- Insert Market Demands (current demands)
INSERT INTO market_demands (market_id, crop_id, demand_price_per_kg, quantity_needed_kg, valid_from, valid_until) VALUES
-- Mumbai demands
(1, 1, 45.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),  -- Tomato
(1, 2, 28.00, 800, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY)), -- Potato
(1, 3, 38.00, 600, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)),  -- Onion
(1, 17, 48.00, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY)),-- Rice

-- Pune demands
(2, 1, 43.00, 400, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)),  -- Tomato
(2, 6, 55.00, 300, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY)),  -- Cauliflower
(2, 19, 160.00, 250, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY)),-- Apple
(2, 15, 60.00, 350, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)), -- Beans

-- Nashik demands
(3, 21, 110.00, 600, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),-- Mango
(3, 3, 36.00, 700, NOW(), DATE_ADD(NOW(), INTERVAL 9 DAY)),  -- Onion
(3, 12, 160.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 12 DAY)),-- Garlic
(3, 1, 44.00, 450, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)),  -- Tomato

-- Nagpur demands
(4, 19, 158.00, 300, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY)),-- Apple
(4, 22, 65.00, 400, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)), -- Orange
(4, 17, 47.00, 900, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY)),-- Rice
(4, 2, 27.00, 850, NOW(), DATE_ADD(NOW(), INTERVAL 11 DAY)),-- Potato

-- Aurangabad demands
(5, 4, 48.00, 350, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY)),  -- Carrot
(5, 5, 33.00, 400, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)),  -- Cabbage
(5, 18, 32.00, 1200, NOW(), DATE_ADD(NOW(), INTERVAL 20 DAY)),-- Wheat

-- Kolhapur demands
(6, 13, 130.00, 250, NOW(), DATE_ADD(NOW(), INTERVAL 9 DAY)),-- Ginger
(6, 8, 44.00, 300, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)),  -- Brinjal
(6, 20, 45.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY)), -- Banana

-- Solapur demands
(7, 16, 38.00, 600, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY)), -- Corn
(7, 18, 31.00, 1100, NOW(), DATE_ADD(NOW(), INTERVAL 18 DAY)),-- Wheat
(7, 2, 26.00, 750, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY)),-- Potato

-- Ahmednagar demands
(8, 3, 37.00, 650, NOW(), DATE_ADD(NOW(), INTERVAL 8 DAY)),  -- Onion
(8, 11, 65.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)), -- Green Chilli
(8, 1, 42.00, 550, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),  -- Tomato

-- Satara demands
(9, 23, 85.00, 400, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY)), -- Grapes
(9, 24, 48.00, 350, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)), -- Papaya
(9, 7, 38.00, 150, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY)),  -- Spinach

-- Sangli demands
(10, 10, 88.00, 250, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),-- Capsicum
(10, 9, 32.00, 400, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)), -- Cucumber
(10, 25, 28.00, 800, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)),-- Watermelon

-- Thane demands
(11, 1, 44.00, 500, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)),  -- Tomato
(11, 14, 75.00, 300, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY)), -- Peas
(11, 19, 155.00, 280, NOW(), DATE_ADD(NOW(), INTERVAL 9 DAY)),-- Apple

-- Mahabaleshwar demands
(12, 23, 90.00, 450, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)), -- Grapes
(12, 7, 40.00, 200, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY)),  -- Spinach
(12, 4, 50.00, 300, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),  -- Carrot

-- Lonavala demands
(13, 16, 40.00, 350, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY)), -- Corn
(13, 5, 35.00, 400, NOW(), DATE_ADD(NOW(), INTERVAL 6 DAY)),  -- Cabbage
(13, 15, 62.00, 280, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY)), -- Beans

-- Navi Mumbai demands
(14, 1, 46.00, 600, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY)),  -- Tomato
(14, 17, 49.00, 950, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY)),-- Rice
(14, 20, 43.00, 550, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY)), -- Banana

-- Amravati demands
(15, 3, 38.00, 700, NOW(), DATE_ADD(NOW(), INTERVAL 9 DAY)),  -- Onion
(15, 18, 33.00, 1050, NOW(), DATE_ADD(NOW(), INTERVAL 19 DAY)),-- Wheat
(15, 2, 28.00, 800, NOW(), DATE_ADD(NOW(), INTERVAL 11 DAY));-- Potato

-- Create Demo User (Password: demo123)
INSERT INTO users (full_name, email, password_hash) VALUES
('Demo Farmer', 'demo@farm.com', '$2a$10$83E8WXCP.v5/NkDmI3eiKu1N8QX046JIjq1hvk05YpRy88BJ.Xy1K');

-- Create Farmer Profile for Demo User
-- This uses a variable to get the inserted user_id
SET @demo_user_id = LAST_INSERT_ID();
INSERT INTO farmers (user_id, location_name, latitude, longitude) VALUES 
(@demo_user_id, 'Baramati', 18.1515, 74.5774);

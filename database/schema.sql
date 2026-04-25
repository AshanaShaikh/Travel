-- Travel Guide Database Schema
-- Run this file in your MySQL client to set up the database

CREATE DATABASE IF NOT EXISTS travel_guide_db;
USE travel_guide_db;

CREATE TABLE IF NOT EXISTS destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  country VARCHAR(100) NOT NULL,
  category ENUM('Adventure', 'Cultural', 'Beach', 'Mountain', 'City', 'Wildlife', 'Historical') NOT NULL,
  description TEXT,
  best_season VARCHAR(100),
  budget ENUM('Budget', 'Mid-range', 'Luxury') DEFAULT 'Mid-range',
  rating DECIMAL(2,1) DEFAULT 0.0,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO destinations (name, country, category, description, best_season, budget, rating, image_url) VALUES
('Santorini', 'Greece', 'Beach', 'Iconic white-washed buildings with blue domes overlooking the Aegean Sea. Famous for stunning sunsets.', 'April - October', 'Luxury', 4.9, 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800'),
('Machu Picchu', 'Peru', 'Historical', 'Ancient Incan citadel set high in the Andes Mountains. A UNESCO World Heritage Site and wonder of the world.', 'May - September', 'Mid-range', 4.8, 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800'),
('Bali', 'Indonesia', 'Cultural', 'Island of the Gods, known for forested volcanic mountains, rice paddies, beaches and coral reefs.', 'April - October', 'Budget', 4.7, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'),
('Safari Serengeti', 'Tanzania', 'Wildlife', 'Witness the Great Migration of wildebeest and zebras across the endless golden plains.', 'June - October', 'Luxury', 4.9, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'),
('Kyoto', 'Japan', 'Cultural', 'Ancient capital of Japan with thousands of temples, shrines, and traditional wooden machiya houses.', 'March - May', 'Mid-range', 4.8, 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800');

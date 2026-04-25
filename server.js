const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── MySQL Connection Pool ────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Abhidogra@7257267',
  database: process.env.DB_NAME || 'travel_guide_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// Test DB connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Make sure MySQL is running and .env is configured correctly.');
  } else {
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME);
    connection.release();
  }
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── READ ALL destinations (with optional search & filter) ──────────────────
app.get('/api/destinations', async (req, res) => {
  try {
    const { search, category, budget, sort } = req.query;
    let query = 'SELECT * FROM destinations WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR country LIKE ? OR description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (budget && budget !== 'All') {
      query += ' AND budget = ?';
      params.push(budget);
    }

    const sortOptions = {
      newest: 'ORDER BY created_at DESC',
      oldest: 'ORDER BY created_at ASC',
      rating: 'ORDER BY rating DESC',
      name: 'ORDER BY name ASC'
    };
    query += ' ' + (sortOptions[sort] || sortOptions.newest);

    const [rows] = await db.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('GET /api/destinations error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ── READ ONE destination ───────────────────────────────────────────────────
app.get('/api/destinations/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM destinations WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Destination not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ── CREATE destination ─────────────────────────────────────────────────────
app.post('/api/destinations', async (req, res) => {
  try {
    const { name, country, category, description, best_season, budget, rating, image_url } = req.body;

    if (!name || !country || !category) {
      return res.status(400).json({ success: false, message: 'Name, country, and category are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO destinations (name, country, category, description, best_season, budget, rating, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, country, category, description || '', best_season || '', budget || 'Mid-range', parseFloat(rating) || 0, image_url || '']
    );

    const [newRow] = await db.query('SELECT * FROM destinations WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Destination created!', data: newRow[0] });
  } catch (err) {
    console.error('POST /api/destinations error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ── UPDATE destination ─────────────────────────────────────────────────────
app.put('/api/destinations/:id', async (req, res) => {
  try {
    const { name, country, category, description, best_season, budget, rating, image_url } = req.body;
    const { id } = req.params;

    const [check] = await db.query('SELECT id FROM destinations WHERE id = ?', [id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Destination not found' });

    await db.query(
      `UPDATE destinations SET name=?, country=?, category=?, description=?, best_season=?, budget=?, rating=?, image_url=?
       WHERE id=?`,
      [name, country, category, description || '', best_season || '', budget || 'Mid-range', parseFloat(rating) || 0, image_url || '', id]
    );

    const [updated] = await db.query('SELECT * FROM destinations WHERE id = ?', [id]);
    res.json({ success: true, message: 'Destination updated!', data: updated[0] });
  } catch (err) {
    console.error('PUT /api/destinations/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ── DELETE destination ─────────────────────────────────────────────────────
app.delete('/api/destinations/:id', async (req, res) => {
  try {
    const [check] = await db.query('SELECT id FROM destinations WHERE id = ?', [req.params.id]);
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Destination not found' });

    await db.query('DELETE FROM destinations WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Destination deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ── STATS endpoint ─────────────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM destinations');
    const [[{ avg_rating }]] = await db.query('SELECT ROUND(AVG(rating), 1) as avg_rating FROM destinations');
    const [categories] = await db.query('SELECT category, COUNT(*) as count FROM destinations GROUP BY category ORDER BY count DESC');
    const [countries] = await db.query('SELECT COUNT(DISTINCT country) as total_countries FROM destinations');
    res.json({ success: true, data: { total, avg_rating, categories, total_countries: countries[0].total_countries } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌍 Travel Guide App running at: http://localhost:${PORT}`);
  console.log(`📦 API base URL: http://localhost:${PORT}/api/destinations\n`);
});

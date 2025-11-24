const express = require('express');
const router = express.Router();
const { pool, query, supabase } = require('../config/database');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM settings ORDER BY key');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update setting
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    
    const result = await query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = $2, updated_at = NOW()
      RETURNING *
    `, [req.params.key, value]);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

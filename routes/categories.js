const express = require('express');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
      try {
    const [rows] = await db.query(
      `SELECT c.id, c.name, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id ORDER BY c.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This category already exists.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// حذف کتگوری (ادمین)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
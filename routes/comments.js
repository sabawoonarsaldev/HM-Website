const express = require('express');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// لیست کامنت‌های یک محصول (همه)
router.get('/:productId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, comment, created_at FROM comments WHERE product_id = ? ORDER BY id DESC',
      [req.params.productId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// افزودن کامنت (همه)
router.post('/:productId', async (req, res) => {
  try {
    const name = (req.body.name || '').trim().slice(0, 80);
    const comment = (req.body.comment || '').trim().slice(0, 1000);
    if (!name || !comment) {
      return res.status(400).json({ message: 'Name and comment are required.' });
    }
    const [p] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.productId]);
    if (!p.length) return res.status(404).json({ message: 'Product not found.' });

    await db.query(
      'INSERT INTO comments (product_id, name, comment) VALUES (?, ?, ?)',
      [req.params.productId, name, comment]
    );
    res.status(201).json({ message: 'Comment added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// حذف کامنت (فقط ادمین)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
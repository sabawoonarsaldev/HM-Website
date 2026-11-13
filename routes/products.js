const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const optimizeImages = require('../middleware/optimize');
const router = express.Router();

// حذف فایل عکس از دیسک
function removeFile(filename) {
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  fs.unlink(filePath, () => {});
}

router.get('/', async (req, res) => {
      try {
    const { search, category, limit, page } = req.query;
    const where = [];
    const params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.short_desc LIKE ? OR c.name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (category) {
      where.push('p.category_id = ?');
      params.push(Number(category));
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const lim = Math.min(Number(limit) || 12, 100);
    const offset = ((Number(page) || 1) - 1) * lim;

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.price, p.short_desc, p.image, p.created_at,
              p.category_id, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p
       LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`,
      params
    );

    res.json({ products: rows, total, page: Number(page) || 1, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/:id', async (req, res) => {
      try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    const [images] = await db.query(
      'SELECT id, image FROM product_images WHERE product_id = ?',
      [req.params.id]
    );
    res.json({ ...rows[0], images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// افزودن محصول (ادمین): عکس اصلی = image ، عکس‌های اضافه = gallery
router.post(
  '/',
  requireAuth,
  requireAdmin,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 6 }]),
  optimizeImages,
  async (req, res) => {
    try {
      const { name, category_id, price, short_desc, description, specs } = req.body;

      if (!name || !price) {
        return res.status(400).json({ message: 'Name and price are required.' });
      }

      const mainImage = req.files?.image?.[0]?.filename || null;

      const [result] = await db.query(
        `INSERT INTO products (name, category_id, price, short_desc, description, specs, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), category_id || null, price, short_desc || null, description || null, specs || null, mainImage]
      );

      const gallery = req.files?.gallery || [];
      for (const file of gallery) {
        await db.query('INSERT INTO product_images (product_id, image) VALUES (?, ?)', [result.insertId, file.filename]);
      }

      res.status(201).json({ id: result.insertId, message: 'Product added successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// ویرایش محصول (ادمین)
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 6 }]),
  optimizeImages,
  async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
      if (!rows.length) return res.status(404).json({ message: 'Product not found.' });
      const old = rows[0];

      const { name, category_id, price, short_desc, description, specs } = req.body;
      let image = old.image;

      if (req.files?.image?.[0]) {
        removeFile(old.image);
        image = req.files.image[0].filename;
      }

      await db.query(
        `UPDATE products SET name=?, category_id=?, price=?, short_desc=?, description=?, specs=?, image=?
         WHERE id=?`,
        [
          name || old.name,
          category_id || null,
          price || old.price,
          short_desc ?? old.short_desc,
          description ?? old.description,
          specs ?? old.specs,
          image,
          req.params.id
        ]
      );

      for (const file of req.files?.gallery || []) {
        await db.query('INSERT INTO product_images (product_id, image) VALUES (?, ?)', [req.params.id, file.filename]);
      }

      res.json({ message: 'Product updated successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// حذف یک عکس از گالری (ادمین)
router.delete('/:id/images/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image FROM product_images WHERE id = ? AND product_id = ?',
      [req.params.imageId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Image not found.' });

    removeFile(rows[0].image);
    await db.query('DELETE FROM product_images WHERE id = ?', [req.params.imageId]);
    res.json({ message: 'Image deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// حذف محصول (ادمین)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });

    const [gallery] = await db.query('SELECT image FROM product_images WHERE product_id = ?', [req.params.id]);
    removeFile(rows[0].image);
    gallery.forEach(g => removeFile(g.image));

    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
const express = require('express');
const db = require('../config/db');
const upload = require('../middleware/upload');
const { uploadBuffer, deleteImage } = require('../config/cloudinary');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const fields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 6 }]);
const money = v => (/^\d{1,8}(\.\d{1,2})?$/.test(String(v)) ? String(v) : null);
const txt = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

// فقط عدد قبول می‌شود (در Express 5 نوشتن regex داخل مسیر ممکن نیست)
const numeric = (req, res, next, val) =>
  /^\d+$/.test(val) ? next() : res.status(404).json({ message: 'Not found.' });
router.param('id', numeric);
router.param('imageId', numeric);

// ---------- لیست ----------
router.get('/', async (req, res) => {
  try {
    const where = [], params = [];
    const search = txt(req.query.search, 100);
    if (search) {
      const like = `%${search.replace(/[%_]/g, '\\$&')}%`;
      where.push('(p.name LIKE ? OR p.short_desc LIKE ? OR c.name LIKE ?)');
      params.push(like, like, like);
    }
    if (req.query.category && /^\d+$/.test(req.query.category)) {
      where.push('p.category_id = ?');
      params.push(Number(req.query.category));
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const lim = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.price, p.short_desc, p.image, p.created_at,
              p.category_id, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
      [...params, lim, (page - 1) * lim]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`, params
    );
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ products: rows, total, page, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ---------- جزئیات ----------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });
    const [images] = await db.query('SELECT id, image FROM product_images WHERE product_id = ?', [req.params.id]);
    const { image_public_id, ...product } = rows[0];
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ ...product, images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ---------- افزودن (ادمین) ----------
router.post('/', requireAuth, requireAdmin, fields, upload.verify, async (req, res) => {
  const uploaded = [];
  try {
    const name = txt(req.body.name, 200), price = money(req.body.price);
    if (!name || !price) return res.status(400).json({ message: 'Valid name and price are required.' });

    let main = { url: null, publicId: null };
    if (req.files?.image?.[0]) { main = await uploadBuffer(req.files.image[0].buffer); uploaded.push(main.publicId); }

    const gallery = [];
    for (const f of req.files?.gallery || []) {
      const g = await uploadBuffer(f.buffer); uploaded.push(g.publicId); gallery.push(g);
    }

    const [result] = await db.query(
      `INSERT INTO products (name, category_id, price, short_desc, description, specs, image, image_public_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, /^\d+$/.test(req.body.category_id || '') ? req.body.category_id : null, price,
       txt(req.body.short_desc, 255), txt(req.body.description, 5000), txt(req.body.specs, 5000),
       main.url, main.publicId]
    );
    for (const g of gallery) {
      await db.query('INSERT INTO product_images (product_id, image, image_public_id) VALUES (?, ?, ?)',
        [result.insertId, g.url, g.publicId]);
    }
    res.status(201).json({ id: result.insertId, message: 'Product added successfully.' });
  } catch (err) {
    await Promise.all(uploaded.map(deleteImage));
    console.error(err);
    res.status(500).json({ message: 'Could not save the product.' });
  }
});

// ---------- ویرایش (ادمین) ----------
router.put('/:id', requireAuth, requireAdmin, fields, upload.verify, async (req, res) => {
  const uploaded = [];
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });
    const old = rows[0];

    const price = req.body.price ? money(req.body.price) : old.price;
    if (!price) return res.status(400).json({ message: 'Invalid price.' });

    let image = old.image, publicId = old.image_public_id;
    if (req.files?.image?.[0]) {
      const m = await uploadBuffer(req.files.image[0].buffer); uploaded.push(m.publicId);
      image = m.url; publicId = m.publicId;
    }
    const gallery = [];
    for (const f of req.files?.gallery || []) {
      const g = await uploadBuffer(f.buffer); uploaded.push(g.publicId); gallery.push(g);
    }

    await db.query(
      `UPDATE products SET name=?, category_id=?, price=?, short_desc=?, description=?, specs=?, image=?, image_public_id=?
       WHERE id=?`,
      [txt(req.body.name, 200) || old.name,
       /^\d+$/.test(req.body.category_id || '') ? req.body.category_id : null, price,
       req.body.short_desc !== undefined ? txt(req.body.short_desc, 255) : old.short_desc,
       req.body.description !== undefined ? txt(req.body.description, 5000) : old.description,
       req.body.specs !== undefined ? txt(req.body.specs, 5000) : old.specs,
       image, publicId, req.params.id]
    );
    for (const g of gallery) {
      await db.query('INSERT INTO product_images (product_id, image, image_public_id) VALUES (?, ?, ?)',
        [req.params.id, g.url, g.publicId]);
    }
    if (req.files?.image?.[0]) await deleteImage(old.image_public_id);
    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    await Promise.all(uploaded.map(deleteImage));
    console.error(err);
    res.status(500).json({ message: 'Could not update the product.' });
  }
});

// ---------- حذف یک عکس گالری ----------
router.delete('/:id/images/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT image_public_id FROM product_images WHERE id = ? AND product_id = ?',
      [req.params.imageId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Image not found.' });
    await db.query('DELETE FROM product_images WHERE id = ?', [req.params.imageId]);
    await deleteImage(rows[0].image_public_id);
    res.json({ message: 'Image deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ---------- حذف محصول ----------
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT image_public_id FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found.' });
    const [gallery] = await db.query('SELECT image_public_id FROM product_images WHERE product_id = ?', [req.params.id]);
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    await Promise.all([rows[0].image_public_id, ...gallery.map(g => g.image_public_id)].map(deleteImage));
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
const express = require('express');
const db = require('../config/db');
const { isValidImage, deleteImage } = require('../config/cloudinary');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const money = v => (/^\d{1,8}(\.\d{1,2})?$/.test(String(v)) ? String(v) : null);
const txt = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);
const catId = v => (/^\d+$/.test(String(v ?? '')) ? Number(v) : null);

const numeric = (req, res, next, val) =>
  /^\d+$/.test(val) ? next() : res.status(404).json({ message: 'Not found.' });
router.param('id', numeric);
router.param('imageId', numeric);

// عکس‌های دریافتی از فرانت را اعتبارسنجی می‌کند
function cleanImg(i) {
  return i && isValidImage(i.url, i.publicId) ? { url: i.url, publicId: i.publicId } : null;
}
function cleanGallery(arr) {
  return (Array.isArray(arr) ? arr : []).slice(0, 6).map(cleanImg).filter(Boolean);
}

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
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const main = cleanImg(b.image);
  const gallery = cleanGallery(b.gallery);
  const cleanup = () => Promise.all([main, ...gallery].filter(Boolean).map(x => deleteImage(x.publicId)));
  try {
    const name = txt(b.name, 200), price = money(b.price);
    if (!name || !price) { await cleanup(); return res.status(400).json({ message: 'Valid name and price are required.' }); }

    const [result] = await db.query(
      `INSERT INTO products (name, category_id, price, short_desc, description, specs, image, image_public_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, catId(b.category_id), price, txt(b.short_desc, 255), txt(b.description, 5000), txt(b.specs, 5000),
       main ? main.url : null, main ? main.publicId : null]
    );
    for (const g of gallery) {
      await db.query('INSERT INTO product_images (product_id, image, image_public_id) VALUES (?, ?, ?)',
        [result.insertId, g.url, g.publicId]);
    }
    res.status(201).json({ id: result.insertId, message: 'Product added successfully.' });
  } catch (err) {
    await cleanup();
    console.error(err);
    res.status(500).json({ message: 'Could not save the product.' });
  }
});

// ---------- ویرایش (ادمین) ----------
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const newMain = cleanImg(b.image);
  const gallery = cleanGallery(b.gallery);
  const cleanup = () => Promise.all([newMain, ...gallery].filter(Boolean).map(x => deleteImage(x.publicId)));
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) { await cleanup(); return res.status(404).json({ message: 'Product not found.' }); }
    const old = rows[0];

    const price = b.price ? money(b.price) : old.price;
    if (!price) { await cleanup(); return res.status(400).json({ message: 'Invalid price.' }); }

    await db.query(
      `UPDATE products SET name=?, category_id=?, price=?, short_desc=?, description=?, specs=?, image=?, image_public_id=?
       WHERE id=?`,
      [txt(b.name, 200) || old.name, catId(b.category_id), price,
       b.short_desc !== undefined ? txt(b.short_desc, 255) : old.short_desc,
       b.description !== undefined ? txt(b.description, 5000) : old.description,
       b.specs !== undefined ? txt(b.specs, 5000) : old.specs,
       newMain ? newMain.url : old.image, newMain ? newMain.publicId : old.image_public_id, req.params.id]
    );
    for (const g of gallery) {
      await db.query('INSERT INTO product_images (product_id, image, image_public_id) VALUES (?, ?, ?)',
        [req.params.id, g.url, g.publicId]);
    }
    if (newMain) await deleteImage(old.image_public_id);
    res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    await cleanup();
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
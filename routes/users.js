const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// لیست یوزرها
router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC'
  );
  res.json(rows);
});

// ساختن یوزر جدید (با نقش دلخواه)
router.post('/', async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (exists.length) return res.status(409).json({ message: 'This email is already registered.' });

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [full_name.trim(), email.trim().toLowerCase(), hash, role === 'admin' ? 'admin' : 'user']
    );
    res.status(201).json({ message: 'User created.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ویرایش پروفایل خودِ ادمین (نام، ایمیل، پسورد)
router.put('/me/profile', async (req, res) => {
  try {
    const full_name = (req.body.full_name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!full_name || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Valid name and email are required.' });
    }
    const [dup] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.user.id]);
    if (dup.length) return res.status(409).json({ message: 'This email is already used by another user.' });

    await db.query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [full_name, email, req.user.id]);
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      await db.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.user.id]);
    }

    const jwt = require('jsonwebtoken');
    const user = { id: req.user.id, name: full_name, email, role: 'admin' };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
    res.json({ message: 'Profile updated.', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// تغییر نقش یا پسورد
router.put('/:id', async (req, res) => {
  try {
    const { role, password } = req.body;
    if (role) {
      if (Number(req.params.id) === req.user.id) {
        return res.status(400).json({ message: 'You cannot change your own role.' });
      }
      await db.query('UPDATE users SET role = ? WHERE id = ?', [role === 'admin' ? 'admin' : 'user', req.params.id]);
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      await db.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.params.id]);
    }
    res.json({ message: 'User updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ message: 'User deleted.' });
});

module.exports = router;
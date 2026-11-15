const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* ---------- بلاک 30 دقیقه‌ای بعد از 4 ورود اشتباه (IP و ایمیل) ---------- */
const attempts = new Map();
const MAX_TRIES = 4;
const BLOCK_MS = 30 * 60 * 1000;

function blockedFor(key) {
  const a = attempts.get(key);
  if (!a || !a.until) return 0;
  if (a.until <= Date.now()) {
    attempts.delete(key);
    return 0;
  }
  return Math.ceil((a.until - Date.now()) / 60000);
}

function fail(key) {
  const a = attempts.get(key) || { n: 0, until: 0 };
  a.n += 1;
  if (a.n >= MAX_TRIES) a.until = Date.now() + BLOCK_MS;
  attempts.set(key, a);
}

setInterval(() => {
  for (const [k, a] of attempts) {
    if (a.until && a.until <= Date.now()) attempts.delete(k);
  }
}, 10 * 60 * 1000).unref();

/* ---------- Token ---------- */
function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.full_name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d', algorithm: 'HS256' }
  );
}

/* ---------- ورود (فقط ادمین) ---------- */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const mail = String(email).trim().toLowerCase().slice(0, 150);
    const keys = ['ip:' + req.ip, 'em:' + mail];
    const wait = Math.max(...keys.map(blockedFor));

    if (wait) {
      return res.status(429).json({
        message: `Too many failed attempts. Blocked for ${wait} more minute(s).`
      });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [mail]);
    const user = rows[0];

    // مقایسه همیشه انجام می‌شود تا زمان پاسخ، وجود ایمیل را لو ندهد
    const hash = user
      ? user.password
      : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali';
    const ok = await bcrypt.compare(String(password), hash);

    if (!user || !ok || user.role !== 'admin') {
      keys.forEach(fail);
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    keys.forEach(k => attempts.delete(k));

    res.json({
      token: createToken(user),
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

/* ---------- اطلاعات کاربر فعلی ---------- */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
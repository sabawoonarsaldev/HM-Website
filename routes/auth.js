const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.full_name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
{ expiresIn: '1d', algorithm: 'HS256' }
  );
}



// ورود
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    res.json({
      token: createToken(user),
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// اطلاعات کاربر فعلی
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
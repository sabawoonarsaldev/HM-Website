const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const transporter = (process.env.MAIL_USER && process.env.MAIL_PASS)
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
    })
  : null;

router.post('/', async (req, res) => {
      try {
    const name = String(req.body.name || '').trim().slice(0, 100);
    const email = String(req.body.email || '').trim().slice(0, 150);
    const phone = String(req.body.phone || '').trim().slice(0, 30);
    const message = String(req.body.message || '').trim().slice(0, 3000);
        if (!name || !message) {
      return res.status(400).json({ message: 'Name and message are required.' });
    }

    await db.query(
      'INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email || null, phone || null, message.trim()]
    );

    let emailSent = false;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"HM Trading Website" <${process.env.MAIL_USER}>`,
          to: process.env.MAIL_TO || process.env.MAIL_USER,
          replyTo: email || undefined,
          subject: `New message from ${name}`,
          text: `Name: ${name}\nEmail: ${email || '-'}\nPhone: ${phone || '-'}\n\n${message}`
        });
        emailSent = true;
      } catch (e) {
        console.error('Email error:', e.message);
      }
    }

    res.status(201).json({ message: 'Message sent.', emailSent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// لیست پیام‌ها (ادمین)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC, id DESC');
  res.json(rows);
});

// حذف پیام (ادمین)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
  res.json({ message: 'Message deleted.' });
});

module.exports = router;
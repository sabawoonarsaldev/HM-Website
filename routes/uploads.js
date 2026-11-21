const express = require('express');
const { signUpload } = require('../config/cloudinary');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// فقط ادمین امضا می‌گیرد
router.get('/sign', requireAuth, requireAdmin, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(signUpload());
});

module.exports = router;
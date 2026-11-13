const jwt = require('jsonwebtoken');

// بررسی اینکه کاربر لاگین است
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Please login first.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please login again.' });
  }
}

// بررسی اینکه کاربر ادمین است
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
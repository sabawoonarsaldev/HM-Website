require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const PROD = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or too short (min 32 characters). Check your .env file.');
  process.exit(1);
}

const app = express();
if (PROD) app.set('trust proxy', 1); // فقط وقتی پشت Nginx/Cloudflare هستید

/* ---------- امنیت: هدرها ---------- */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", "'unsafe-inline'"],
      'script-src-attr': ["'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'"],
      'upgrade-insecure-requests': PROD ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false
}));

/* ---------- سرعت ---------- */
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: PROD ? '1h' : 0 }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '30d', immutable: true, index: false, dotfiles: 'deny'
}));

/* ---------- محدودیت تعداد درخواست ---------- */
const makeLimiter = (minutes, limit, message, extra = {}) => rateLimit({
  windowMs: minutes * 60 * 1000, limit,
  standardHeaders: true, legacyHeaders: false,
  message: { message }, ...extra
});
const onlyPost = mw => (req, res, next) => (req.method === 'POST' ? mw(req, res, next) : next());

app.use('/api', makeLimiter(15, 600, 'Too many requests. Please try again later.'));
app.use('/api/auth/login', makeLimiter(15, 10, 'Too many login attempts. Try again in 15 minutes.', { skipSuccessfulRequests: true }));
app.use('/api/comments', onlyPost(makeLimiter(10, 5, 'Too many comments. Please wait a few minutes.')));
app.use('/api/messages', onlyPost(makeLimiter(30, 5, 'Too many messages. Please try again later.')));

/* ---------- Routes ---------- */
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/site', require('./routes/site'));

/* ---------- خطاها (بدون لو دادن جزئیات داخلی) ---------- */
app.use((err, req, res, next) => {
  const clientError = err instanceof multer.MulterError
    || err.type === 'entity.parse.failed'
    || (err.message || '').startsWith('Only JPG');
  if (clientError) return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Server error.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
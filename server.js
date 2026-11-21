require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const PROD = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET is missing or too short (min 32 characters). Check your .env file.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
if (PROD) app.set('trust proxy', 1); // فقط وقتی پشت Nginx/Cloudflare/Render هستید

/* ---------- امنیت: هدرها ---------- */
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'script-src': ["'self'", "'unsafe-inline'"],
      'script-src-attr': ["'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
      'connect-src': ["'self'", 'https://api.cloudinary.com'],
            'upgrade-insecure-requests': PROD ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false
}));

/* ---------- سرعت ---------- */
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: PROD ? '7d' : 0,
  setHeaders: (res, file) => {
    if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); // HTML همیشه تازه
  }
}));




/* ---------- محدودیت تعداد درخواست ---------- */
const makeLimiter = (minutes, limit, message, extra = {}) => rateLimit({
  windowMs: minutes * 60 * 1000, limit,
  standardHeaders: true, legacyHeaders: false,
  message: { message }, ...extra
});
const onlyPost = mw => (req, res, next) => (req.method === 'POST' ? mw(req, res, next) : next());

const writeLimiter = makeLimiter(1, 30, 'Too many changes. Please slow down.');

app.use('/api', makeLimiter(1, 120, 'Too many requests. Please slow down.'));            // هر IP: 120 در دقیقه
app.use('/api/auth/login', makeLimiter(15, 20, 'Too many login attempts. Try again later.')); // لایه دوم (بلاک 4 بار در auth.js)
app.use('/api/comments', onlyPost(makeLimiter(10, 3, 'Too many comments. Please wait a few minutes.')));
app.use('/api', (req, res, next) =>
  (['POST', 'PUT', 'DELETE'].includes(req.method) ? writeLimiter(req, res, next) : next()));
app.use('/api/uploads/sign', makeLimiter(1, 30, 'Too many upload requests. Please wait.'));
app.use('/api/uploads', require('./routes/uploads'));


/* ---------- Routes ---------- */
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/site', require('./routes/site'));

/* ---------- 404 برای API ---------- */
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found.' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ message: 'Invalid request.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error.' });
});

/* ---------- شروع: اول دیتابیس، بعد سرور ---------- */
const PORT = process.env.PORT || 3000;
require('./config/init-db')()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch(err => {
    console.error('Database setup failed:', err.message);
    process.exit(1);
  });
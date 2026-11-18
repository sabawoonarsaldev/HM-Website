const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const TABLES = [
`CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
`CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
)`,
`CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL,
  short_desc VARCHAR(255),
  description TEXT,
  specs TEXT,
  image VARCHAR(500),
  image_public_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
`CREATE INDEX IF NOT EXISTS idx_products_created ON products (created_at DESC, id DESC)`,
`CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id)`,
`CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image VARCHAR(500) NOT NULL,
  image_public_id VARCHAR(255)
)`,
`CREATE INDEX IF NOT EXISTS idx_pimages_product ON product_images (product_id)`,
`CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`,
`CREATE INDEX IF NOT EXISTS idx_comments_product ON comments (product_id)`,
`CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT
)`,
`CREATE TABLE IF NOT EXISTS phones (
  id SERIAL PRIMARY KEY,
  label VARCHAR(60) NOT NULL,
  phone_number VARCHAR(40) NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  manager VARCHAR(100) NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
)`
];

module.exports = async function initDb() {
  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      };
  if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) config.ssl = { rejectUnauthorized: false };

  const pool = new Pool({ ...config, max: 1 });
  try {
    for (const sql of TABLES) await pool.query(sql);

    const c = await pool.query('SELECT COUNT(*)::int AS n FROM categories');
    if (c.rows[0].n === 0) {
      await pool.query(
        "INSERT INTO categories (name) VALUES ('Mobile Phones'),('Chargers'),('Headphones'),('Power Banks'),('Other Electronics')"
      );
    }
    const b = await pool.query('SELECT COUNT(*)::int AS n FROM brands');
    if (b.rows[0].n === 0) {
      await pool.query("INSERT INTO brands (name) VALUES ('HM Mobile'),('HM Power'),('HM Sound'),('HM Charge')");
    }

    const a = await pool.query("SELECT COUNT(*)::int AS n FROM users WHERE role='admin'");
    if (a.rows[0].n === 0) {
      const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const pass = process.env.ADMIN_PASSWORD || '';
      if (email && pass.length >= 8) {
        await pool.query(
          "INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, 'admin')",
          [process.env.ADMIN_NAME || 'Admin', email, await bcrypt.hash(pass, 10)]
        );
        console.log('First admin created:', email);
      } else {
        console.warn('No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in .env, or run: node create-admin.js');
      }
    }
    console.log('Database ready (PostgreSQL).');
  } finally {
    await pool.end();
  }
};
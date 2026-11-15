const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const TABLES = [
`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
)`,
`CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category_id INT,
  price DECIMAL(10,2) NOT NULL,
  short_desc VARCHAR(255),
  description TEXT,
  specs TEXT,
  image VARCHAR(500),
  image_public_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_created (created_at, id),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
)`,
`CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image VARCHAR(500) NOT NULL,
  image_public_id VARCHAR(255),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)`,
`CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)`,
`CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT
)`,
`CREATE TABLE IF NOT EXISTS phones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(60) NOT NULL,
  phone_number VARCHAR(40) NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  manager VARCHAR(100) NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
)`
];

module.exports = async function initDb() {
  const dbName = process.env.DB_NAME;
  if (!/^[A-Za-z0-9_]+$/.test(dbName || '')) throw new Error('DB_NAME is missing or invalid in .env');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    // اگر یوزر اجازه CREATE ندارد (مثل hm_app)، فرض می‌کنیم دیتابیس از قبل هست
    try {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    } catch (e) {
      console.warn('Skipping database creation:', e.message);
    }
    await conn.query(`USE \`${dbName}\``);

    for (const sql of TABLES) {
      try { await conn.query(sql); }
      catch (e) { console.warn('Skipping table step:', e.message); }
    }

    const [[c]] = await conn.query('SELECT COUNT(*) AS n FROM categories');
    if (c.n === 0) {
      await conn.query(
        "INSERT INTO categories (name) VALUES ('Mobile Phones'),('Chargers'),('Headphones'),('Power Banks'),('Other Electronics')"
      );
    }

    // اولین ادمین از روی .env (فقط اگر هیچ ادمینی نباشد)
    const [[a]] = await conn.query("SELECT COUNT(*) AS n FROM users WHERE role='admin'");
    if (a.n === 0) {
      const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const pass = process.env.ADMIN_PASSWORD || '';
      if (email && pass.length >= 8) {
        await conn.query(
          "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'admin')",
          [process.env.ADMIN_NAME || 'Admin', email, await bcrypt.hash(pass, 10)]
        );
        console.log('First admin created:', email);
      } else {
        console.warn('No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in .env, or run: node create-admin.js');
      }
    }
    console.log('Database ready.');
  } finally {
    await conn.end();
  }
};
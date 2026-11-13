require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.log('Usage: node create-admin.js "Full Name" email password');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, "admin")',
    [name, email, hash]
  );
  console.log('Admin created successfully!');
  process.exit(0);
})();
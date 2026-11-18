const { Pool } = require('pg');
const { types } = require('pg');

// COUNT(*) و SUM در PostgreSQL رشته برمی‌گردانند؛ آن‌ها را عدد می‌کنیم (مثل MySQL)
types.setTypeParser(20, v => parseInt(v, 10));      // BIGINT
types.setTypeParser(1700, v => v);                  // NUMERIC (قیمت) به صورت رشته، مثل DECIMAL در MySQL

const config = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };

if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) {
  config.ssl = { rejectUnauthorized: false };
}

const pool = new Pool({ ...config, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
pool.on('error', err => console.error('Unexpected DB error:', err.message));

// تبدیل ? به $1, $2, ... (بیرون از رشته‌های داخل ' ')
function convertPlaceholders(sql) {
  let n = 0, out = '', inStr = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") inStr = !inStr;
    out += (ch === '?' && !inStr) ? '$' + (++n) : ch;
  }
  return out;
}

/**
 * سازگار با mysql2: const [rows] = await db.query(sql, params)
 * - SELECT  -> [rows]
 * - INSERT  -> [{ insertId, affectedRows }]  (خودکار RETURNING id اضافه می‌شود)
 * - UPDATE/DELETE -> [{ affectedRows }]
 */
async function query(sql, params = []) {
  let text = convertPlaceholders(sql.trim());
  text = text.replace(/\bLIKE\b/g, 'ILIKE');              // جستجوی بدون حساسیت به حروف

  const isInsert = /^INSERT\b/i.test(text);
  const hasReturning = /\bRETURNING\b/i.test(text);
  if (isInsert && !hasReturning && !/ON CONFLICT/i.test(text) ) {
    text += ' RETURNING id';
  }

  const res = await pool.query(text, params);

  if (/^SELECT\b|^WITH\b/i.test(text) || hasReturning && !isInsert) return [res.rows];
  if (isInsert) {
    return [{ insertId: res.rows[0] ? res.rows[0].id : undefined, affectedRows: res.rowCount }];
  }
  return [{ affectedRows: res.rowCount }];
}

module.exports = { query, pool };
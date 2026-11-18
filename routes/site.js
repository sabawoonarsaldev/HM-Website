const express = require('express');
const db = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const adm = [requireAuth, requireAdmin];

// 0749296060 -> 93749296060 (برای WhatsApp)
const toWa = n => {
  let d = String(n || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '93' + d.slice(1);
  return d;
};
const clean = (v, max = 255) => String(v ?? '').trim().slice(0, max);

// ---------- همه معلومات (عمومی) ----------
router.get('/', async (req, res) => {
  try {
    const [s] = await db.query('SELECT setting_key, setting_value FROM settings');
    const [phones] = await db.query('SELECT id, label, phone_number FROM phones ORDER BY id');
    const [branches] = await db.query('SELECT * FROM branches ORDER BY id');
    const [brands] = await db.query('SELECT * FROM brands ORDER BY id');
    const settings = {};
    s.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({
      settings,
      phones: phones.map(p => ({ id: p.id, label: p.label, number: p.phone_number, wa: toWa(p.phone_number) })),
      branches, brands
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ---------- تنظیمات (ادمین) ----------
const KEYS = ['owner_name', 'owner_title', 'email', 'address', 'hours'];
router.put('/settings', adm, async (req, res) => {
  try {
    for (const k of KEYS) {
      if (req.body[k] === undefined) continue;
      await db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
        [k, clean(req.body[k], 300)]
      );
    }
    res.json({ message: 'Saved.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ---------- شماره‌ها ----------
router.post('/phones', adm, async (req, res) => {
  const label = clean(req.body.label, 60), num = clean(req.body.number, 40);
  if (!label || !num) return res.status(400).json({ message: 'Label and phone number are required.' });
  await db.query('INSERT INTO phones (label, phone_number) VALUES (?, ?)', [label, num]);
  res.status(201).json({ message: 'Phone added.' });
});
router.put('/phones/:id', adm, async (req, res) => {
  const label = clean(req.body.label, 60), num = clean(req.body.number, 40);
  if (!label || !num) return res.status(400).json({ message: 'Label and phone number are required.' });
  await db.query('UPDATE phones SET label=?, phone_number=? WHERE id=?', [label, num, req.params.id]);
  res.json({ message: 'Phone updated.' });
});
router.delete('/phones/:id', adm, async (req, res) => {
  await db.query('DELETE FROM phones WHERE id=?', [req.params.id]);
  res.json({ message: 'Phone deleted.' });
});

// ---------- شعبه‌ها ----------
function branchBody(b) {
  return [clean(b.name, 100), clean(b.address), clean(b.phone, 40), clean(b.manager, 100)];
}
router.post('/branches', adm, async (req, res) => {
  const v = branchBody(req.body);
  if (v.some(x => !x)) return res.status(400).json({ message: 'Branch name, address, phone and manager are all required.' });
  await db.query('INSERT INTO branches (name, address, phone, manager) VALUES (?, ?, ?, ?)', v);
  res.status(201).json({ message: 'Branch added.' });
});
router.put('/branches/:id', adm, async (req, res) => {
  const v = branchBody(req.body);
  if (v.some(x => !x)) return res.status(400).json({ message: 'Branch name, address, phone and manager are all required.' });
  await db.query('UPDATE branches SET name=?, address=?, phone=?, manager=? WHERE id=?', [...v, req.params.id]);
  res.json({ message: 'Branch updated.' });
});
router.delete('/branches/:id', adm, async (req, res) => {
  await db.query('DELETE FROM branches WHERE id=?', [req.params.id]);
  res.json({ message: 'Branch deleted.' });
});

// ---------- برندها ----------
router.post('/brands', adm, async (req, res) => {
  const name = clean(req.body.name, 100);
  if (!name) return res.status(400).json({ message: 'Brand name is required.' });
  await db.query('INSERT INTO brands (name) VALUES (?)', [name]);
  res.status(201).json({ message: 'Brand added.' });
});
router.delete('/brands/:id', adm, async (req, res) => {
  await db.query('DELETE FROM brands WHERE id=?', [req.params.id]);
  res.json({ message: 'Brand deleted.' });
});

module.exports = router;
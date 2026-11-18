/* Pani — water tanker booking for DHA Karachi
 * Express + SQLite. Public site, 24h-advance booking with bank-transfer receipt upload,
 * and a password-protected admin panel.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite'); // built into Node 22.13+, no native build needed

const PORT = process.env.PORT || 3000;
// On Vercel only /tmp is writable (and it is temporary: fine for a demo, not for real orders).
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/pani-data' : path.join(__dirname, 'data'));
const RECEIPT_DIR = path.join(DATA_DIR, 'receipts');
fs.mkdirSync(RECEIPT_DIR, { recursive: true });

const TZ_OFFSET_HOURS = 5; // Pakistan Standard Time, no daylight saving

/* ---------------- Database ---------------- */
const db = new DatabaseSync(path.join(DATA_DIR, 'pani.db'));
db.exec('PRAGMA journal_mode = WAL');
// Match better-sqlite3 behaviour: ignore extra keys in named-parameter objects.
const rawPrepare = db.prepare.bind(db);
db.prepare = (sql) => {
  const st = rawPrepare(sql);
  st.setAllowUnknownNamedParameters(true);
  return st;
};
db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phase TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  size INTEGER NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total INTEGER NOT NULL,
  delivery_date TEXT NOT NULL,
  slot TEXT NOT NULL,
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'bank',
  payment_status TEXT NOT NULL DEFAULT 'submitted',
  receipt TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(delivery_date, slot);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT);
CREATE TABLE IF NOT EXISTS order_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, message TEXT, created_at TEXT
);
`);

const DEFAULT_SETTINGS = {
  business: {
    name: 'Pani',
    tagline: 'Clean water tankers for DHA Karachi',
    phone: '0300 0000000',
    whatsapp: '923000000000',
    email: '',
    deliveryHours: '7:00 AM – 9:00 PM, every day',
  },
  prices: { 3000: 12500, 6000: 22000 },
  bank: {
    bankName: 'Meezan Bank',
    accountTitle: 'Pani Water Services',
    accountNumber: '0000 0000000000',
    iban: 'PK00 MEZN 0000 0000 0000 0000',
    extra: 'Easypaisa / JazzCash: 0300 0000000',
  },
  // Offer banner shown across the top of the public site. Empty text hides it.
  promo: { text: '', link: '' },
  minAdvanceHours: 24,
  maxDaysAhead: 30,
  slotCapacity: 4,
  slots: ['07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'],
  phases: ['DHA Phase 1', 'DHA Phase 2', 'DHA Phase 2 Ext', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5', 'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 7 Ext', 'DHA Phase 8'],
};

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const s = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  for (const r of rows) {
    try { s[r.key] = JSON.parse(r.value); } catch (_) { /* ignore bad row */ }
  }
  return s;
}
function saveSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));
}

// Seed admin
if (!db.prepare('SELECT 1 FROM admins LIMIT 1').get()) {
  const u = process.env.ADMIN_USER || 'admin';
  const p = process.env.ADMIN_PASS || 'pani@1234';
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(u, bcrypt.hashSync(p, 10));
  console.log(`[pani] Admin created: ${u} / ${p}  (change it in Admin → Settings)`);
}

/* ---------------- Helpers ---------------- */
const nowIso = () => new Date().toISOString();

// Returns the UTC timestamp of a Karachi local date + "HH:MM"
function karachiToUtcMs(dateStr, hhmm) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh - TZ_OFFSET_HOURS, mm || 0);
}
function karachiToday() {
  const t = new Date(Date.now() + TZ_OFFSET_HOURS * 3600e3);
  return t.toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

function slotBooked(date, slot) {
  const r = db.prepare(
    "SELECT COALESCE(SUM(qty),0) AS n FROM orders WHERE delivery_date = ? AND slot = ? AND status != 'cancelled' AND payment_status != 'rejected'"
  ).get(date, slot);
  return r.n;
}

function availability(date, s = getSettings()) {
  const cutoff = Date.now() + s.minAdvanceHours * 3600e3;
  const lastDay = addDays(karachiToday(), s.maxDaysAhead);
  return s.slots.map((slot) => {
    const start = slot.split('-')[0];
    const tooSoon = karachiToUtcMs(date, start) < cutoff;
    const tooFar = date > lastDay;
    const booked = slotBooked(date, slot);
    const left = Math.max(0, s.slotCapacity - booked);
    return { slot, available: !tooSoon && !tooFar && left > 0, left, reason: tooSoon ? 'cutoff' : tooFar ? 'too_far' : left === 0 ? 'full' : null };
  });
}

function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('0092')) d = d.slice(2);
  if (d.startsWith('92')) d = '0' + d.slice(2);
  if (d.length === 10 && d.startsWith('3')) d = '0' + d;
  return d;
}
const validPkMobile = (d) => /^03\d{9}$/.test(d);

function makeCode() {
  for (let i = 0; i < 20; i++) {
    const code = 'PN-' + crypto.randomInt(100000, 999999);
    if (!db.prepare('SELECT 1 FROM orders WHERE code = ?').get(code)) return code;
  }
  return 'PN-' + Date.now();
}

function logOrder(orderId, message) {
  db.prepare('INSERT INTO order_log (order_id, message, created_at) VALUES (?, ?, ?)').run(orderId, message, nowIso());
}

const clean = (v, max = 300) => String(v ?? '').trim().slice(0, max);

/* ---------------- App ---------------- */
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: 'pani.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === '1', maxAge: 1000 * 60 * 60 * 12 },
}));

// Pages are always revalidated so visitors never get an old page with new styles;
// CSS/JS/images keep a 1 hour cache (their links carry a ?v= number that changes on each update).
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'], maxAge: '1h',
  setHeaders: (res, file) => { if (file.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); },
}));

/* Uploads */
const upload = multer({
  storage: multer.diskStorage({
    destination: RECEIPT_DIR,
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || '').toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 6) || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|heic|heif)$/.test(file.mimetype) || file.mimetype === 'application/pdf';
    cb(ok ? null : new Error('Please upload a JPG, PNG or PDF of your payment receipt.'), ok);
  },
});

/* Simple in-memory rate limiter for order creation */
const hits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: 'Too many attempts. Please try again later or WhatsApp us.' });
    list.push(now); hits.set(key, list); next();
  };
}

/* ---------- Public API ---------- */
app.get('/api/config', (_req, res) => {
  const s = getSettings();
  res.json({
    business: s.business, prices: s.prices, bank: s.bank, promo: s.promo, minAdvanceHours: s.minAdvanceHours,
    maxDaysAhead: s.maxDaysAhead, slots: s.slots, phases: s.phases, today: karachiToday(),
  });
});

app.get('/api/availability', (req, res) => {
  const date = String(req.query.date || '');
  if (!isDate(date)) return res.status(400).json({ error: 'Invalid date' });
  res.json({ date, slots: availability(date) });
});

function validateOrder(body, s, { bypassRules = false } = {}) {
  const errors = {};
  const o = {
    name: clean(body.name, 80),
    phone: normPhone(body.phone),
    phase: clean(body.phase, 60),
    address: clean(body.address, 300),
    landmark: clean(body.landmark, 120),
    size: parseInt(body.size, 10),
    qty: Math.min(10, Math.max(1, parseInt(body.qty, 10) || 1)),
    delivery_date: clean(body.delivery_date, 10),
    slot: clean(body.slot, 20),
    notes: clean(body.notes, 500),
  };
  if (o.name.length < 2) errors.name = 'Please enter your name';
  if (!validPkMobile(o.phone)) errors.phone = 'Enter a valid mobile number, e.g. 0300 1234567';
  if (!s.phases.includes(o.phase)) errors.phase = 'Please choose your DHA phase';
  if (o.address.length < 5) errors.address = 'Please enter your full address';
  if (!s.prices[o.size]) errors.size = 'Please choose a tanker size';
  if (!isDate(o.delivery_date)) errors.delivery_date = 'Please choose a delivery date';
  if (!s.slots.includes(o.slot)) errors.slot = 'Please choose a time slot';
  if (!errors.delivery_date && !errors.slot && !bypassRules) {
    const a = availability(o.delivery_date, s).find((x) => x.slot === o.slot);
    if (!a || !a.available) {
      errors.slot = a && a.reason === 'full'
        ? 'This time slot just filled up. Please pick another.'
        : `Bookings must be made at least ${s.minAdvanceHours} hours before delivery. Please pick a later slot.`;
    } else if (a.left < o.qty) {
      errors.qty = `Only ${a.left} tanker(s) left in this slot.`;
    }
  }
  o.unit_price = s.prices[o.size] || 0;
  o.total = o.unit_price * o.qty;
  return { o, errors };
}

function insertOrder(o, extra) {
  const t = nowIso();
  const code = makeCode();
  const info = db.prepare(`INSERT INTO orders
    (code,name,phone,phase,address,landmark,size,qty,unit_price,total,delivery_date,slot,notes,payment_method,payment_status,receipt,status,source,created_at,updated_at)
    VALUES (@code,@name,@phone,@phase,@address,@landmark,@size,@qty,@unit_price,@total,@delivery_date,@slot,@notes,@payment_method,@payment_status,@receipt,@status,@source,@t,@t)`)
    .run({ ...o, ...extra, code, t });
  return { id: info.lastInsertRowid, code };
}

app.post('/api/orders', rateLimit(8, 60 * 60 * 1000), (req, res) => {
  upload.single('receipt')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Receipt file is too large (max 8 MB).' : err.message });
    const s = getSettings();
    const { o, errors } = validateOrder(req.body, s);
    if (!req.file) errors.receipt = 'Please upload your payment screenshot';
    if (Object.keys(errors).length) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(422).json({ error: 'Please check the highlighted fields.', fields: errors });
    }
    const { id, code } = insertOrder(o, {
      payment_method: 'bank', payment_status: 'submitted', receipt: req.file.filename, status: 'pending', source: 'web',
    });
    logOrder(id, 'Order placed on website with payment screenshot');
    res.status(201).json({ code, total: o.total, delivery_date: o.delivery_date, slot: o.slot, size: o.size, qty: o.qty });
  });
});

app.get('/api/track', rateLimit(30, 15 * 60 * 1000), (req, res) => {
  const code = clean(req.query.code, 20).toUpperCase().replace(/^PN(\d)/, 'PN-$1');
  const phone = normPhone(req.query.phone);
  const r = db.prepare('SELECT code,name,size,qty,total,delivery_date,slot,phase,status,payment_status,created_at FROM orders WHERE code = ? AND phone = ?').get(code, phone);
  if (!r) return res.status(404).json({ error: 'No booking found with that number and phone.' });
  r.name = r.name.split(' ')[0];
  res.json(r);
});

/* ---------- Admin ---------- */
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  if (req.path.startsWith('/receipt')) return res.status(401).send('Login required');
  res.status(401).json({ error: 'Login required' });
}

const loginLimiter = rateLimit(10, 15 * 60 * 1000);
app.post('/admin/api/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  const a = db.prepare('SELECT * FROM admins WHERE username = ?').get(clean(username, 60));
  if (!a || !bcrypt.compareSync(String(password || ''), a.password_hash)) return res.status(401).json({ error: 'Wrong username or password' });
  req.session.regenerate(() => {
    req.session.admin = { id: a.id, username: a.username };
    res.json({ ok: true, username: a.username });
  });
});
app.post('/admin/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get('/admin/api/me', (req, res) => res.json({ admin: req.session.admin || null }));

const admin = express.Router();
admin.use(requireAdmin);

admin.get('/receipt/:file', (req, res) => {
  const f = path.basename(req.params.file);
  const p = path.join(RECEIPT_DIR, f);
  if (!fs.existsSync(p)) return res.status(404).send('Not found');
  res.sendFile(p);
});

admin.get('/api/stats', (_req, res) => {
  const today = karachiToday();
  const tomorrow = addDays(today, 1);
  const monthStart = today.slice(0, 8) + '01';
  const q = (sql, ...a) => db.prepare(sql).get(...a);
  res.json({
    today,
    deliveriesToday: q("SELECT COUNT(*) n, COALESCE(SUM(qty),0) t FROM orders WHERE delivery_date=? AND status NOT IN ('cancelled')", today),
    deliveriesTomorrow: q("SELECT COUNT(*) n, COALESCE(SUM(qty),0) t FROM orders WHERE delivery_date=? AND status NOT IN ('cancelled')", tomorrow),
    toVerify: q("SELECT COUNT(*) n FROM orders WHERE payment_status='submitted' AND status!='cancelled'").n,
    pending: q("SELECT COUNT(*) n FROM orders WHERE status='pending'").n,
    monthRevenue: q("SELECT COALESCE(SUM(total),0) s FROM orders WHERE payment_status='verified' AND status!='cancelled' AND delivery_date>=?", monthStart).s,
    monthOrders: q("SELECT COUNT(*) n FROM orders WHERE status!='cancelled' AND delivery_date>=?", monthStart).n,
    deliveredMonth: q("SELECT COUNT(*) n FROM orders WHERE status='delivered' AND delivery_date>=?", monthStart).n,
  });
});

function listOrders(qs) {
  const where = []; const args = [];
  if (qs.status && qs.status !== 'all') { where.push('status = ?'); args.push(qs.status); }
  if (qs.payment && qs.payment !== 'all') { where.push('payment_status = ?'); args.push(qs.payment); }
  if (isDate(qs.from)) { where.push('delivery_date >= ?'); args.push(qs.from); }
  if (isDate(qs.to)) { where.push('delivery_date <= ?'); args.push(qs.to); }
  if (qs.size && qs.size !== 'all') { where.push('size = ?'); args.push(parseInt(qs.size, 10)); }
  if (qs.q) {
    where.push('(code LIKE ? OR name LIKE ? OR phone LIKE ? OR address LIKE ? OR phase LIKE ?)');
    const like = `%${clean(qs.q, 60)}%`; args.push(like, like, like, like, like);
  }
  const order = qs.sort === 'created' ? 'created_at DESC' : 'delivery_date ASC, slot ASC, id ASC';
  const sql = `SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT 1000`;
  return db.prepare(sql).all(...args);
}

admin.get('/api/orders', (req, res) => res.json(listOrders(req.query)));

admin.get('/api/orders/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  o.log = db.prepare('SELECT message, created_at FROM order_log WHERE order_id = ? ORDER BY id DESC').all(o.id);
  res.json(o);
});

const STATUSES = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
const PAY = ['submitted', 'verified', 'rejected', 'unpaid', 'cash'];

admin.patch('/api/orders/:id', (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  const s = getSettings();
  const up = {}; const msgs = [];
  if (b.status && STATUSES.includes(b.status) && b.status !== o.status) { up.status = b.status; msgs.push(`Status → ${b.status}`); }
  if (b.payment_status && PAY.includes(b.payment_status) && b.payment_status !== o.payment_status) { up.payment_status = b.payment_status; msgs.push(`Payment → ${b.payment_status}`); }
  if (b.admin_note !== undefined && clean(b.admin_note, 1000) !== (o.admin_note || '')) { up.admin_note = clean(b.admin_note, 1000); msgs.push('Note updated'); }
  if (b.delivery_date && isDate(b.delivery_date) && b.delivery_date !== o.delivery_date) { up.delivery_date = b.delivery_date; msgs.push(`Date → ${b.delivery_date}`); }
  if (b.slot && s.slots.includes(b.slot) && b.slot !== o.slot) { up.slot = b.slot; msgs.push(`Slot → ${b.slot}`); }
  if (!Object.keys(up).length) return res.json(o);
  up.updated_at = nowIso();
  const sets = Object.keys(up).map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE orders SET ${sets} WHERE id = @id`).run({ ...up, id: o.id });
  logOrder(o.id, `${msgs.join(', ')} (by ${req.session.admin.username})`);
  res.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id));
});

// Manual order (phone / WhatsApp orders entered by staff). Skips 24h + capacity rules.
admin.post('/api/orders', (req, res) => {
  const s = getSettings();
  const { o, errors } = validateOrder(req.body || {}, s, { bypassRules: true });
  if (Object.keys(errors).length) return res.status(422).json({ error: 'Please check the highlighted fields.', fields: errors });
  if (req.body.unit_price) { o.unit_price = Math.max(0, parseInt(req.body.unit_price, 10) || o.unit_price); o.total = o.unit_price * o.qty; }
  const pay = PAY.includes(req.body.payment_status) ? req.body.payment_status : 'unpaid';
  const src = ['whatsapp', 'phone', 'walk-in'].includes(req.body.source) ? req.body.source : 'phone';
  const { id, code } = insertOrder(o, { payment_method: pay === 'cash' ? 'cash' : 'bank', payment_status: pay, receipt: null, status: 'confirmed', source: src });
  logOrder(id, `Order added manually from ${src} (by ${req.session.admin.username})`);
  res.status(201).json({ id, code });
});

admin.get('/api/availability', (req, res) => {
  const date = String(req.query.date || '');
  if (!isDate(date)) return res.status(400).json({ error: 'Invalid date' });
  res.json({ date, slots: availability(date) });
});

admin.get('/api/settings', (_req, res) => res.json(getSettings()));

admin.put('/api/settings', (req, res) => {
  const b = req.body || {};
  const cur = getSettings();
  if (b.business) saveSetting('business', {
    name: clean(b.business.name, 60) || cur.business.name,
    tagline: clean(b.business.tagline, 120),
    phone: clean(b.business.phone, 30),
    whatsapp: String(b.business.whatsapp || '').replace(/\D/g, '').slice(0, 15),
    email: clean(b.business.email, 120),
    deliveryHours: clean(b.business.deliveryHours, 80),
  });
  if (b.prices) {
    const p = {};
    for (const k of Object.keys(b.prices)) { const v = parseInt(b.prices[k], 10); if (/^\d+$/.test(k) && v > 0) p[k] = v; }
    if (Object.keys(p).length) saveSetting('prices', p);
  }
  if (b.bank) saveSetting('bank', {
    bankName: clean(b.bank.bankName, 80), accountTitle: clean(b.bank.accountTitle, 80),
    accountNumber: clean(b.bank.accountNumber, 40), iban: clean(b.bank.iban, 40), extra: clean(b.bank.extra, 200),
  });
  if (b.promo) {
    const link = clean(b.promo.link, 200);
    saveSetting('promo', { text: clean(b.promo.text, 160), link: /^(https?:\/\/|\/|#)/.test(link) ? link : '' });
  }
  if (b.minAdvanceHours !== undefined) saveSetting('minAdvanceHours', Math.min(168, Math.max(0, parseInt(b.minAdvanceHours, 10) || 0)));
  if (b.maxDaysAhead !== undefined) saveSetting('maxDaysAhead', Math.min(120, Math.max(1, parseInt(b.maxDaysAhead, 10) || 30)));
  if (b.slotCapacity !== undefined) saveSetting('slotCapacity', Math.min(100, Math.max(1, parseInt(b.slotCapacity, 10) || 1)));
  if (Array.isArray(b.slots)) {
    const sl = b.slots.map((x) => clean(x, 20)).filter((x) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(x));
    if (sl.length) saveSetting('slots', sl);
  }
  if (Array.isArray(b.phases)) {
    const ph = b.phases.map((x) => clean(x, 60)).filter(Boolean);
    if (ph.length) saveSetting('phases', ph);
  }
  res.json(getSettings());
});

admin.post('/api/password', (req, res) => {
  const { current, next: nw } = req.body || {};
  const a = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.admin.id);
  if (!bcrypt.compareSync(String(current || ''), a.password_hash)) return res.status(400).json({ error: 'Current password is wrong' });
  if (String(nw || '').length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(String(nw), 10), a.id);
  res.json({ ok: true });
});

admin.get('/api/export.csv', (req, res) => {
  const rows = listOrders(req.query);
  const cols = ['code', 'created_at', 'delivery_date', 'slot', 'name', 'phone', 'phase', 'address', 'landmark', 'size', 'qty', 'unit_price', 'total', 'payment_status', 'status', 'source', 'notes', 'admin_note'];
  const esc = (v) => { const t = String(v ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pani-orders-${karachiToday()}.csv"`);
  res.send('﻿' + csv);
});

app.get(['/admin', '/admin/'], (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));
app.use('/admin', admin);

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong' }); });

if (require.main === module) {
  app.listen(PORT, () => console.log(`[pani] running on http://localhost:${PORT}`));
}
module.exports = app; // used by Vercel

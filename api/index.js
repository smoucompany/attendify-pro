/* =========================================================
   ATTENDIFY PRO — Vercel Serverless Backend
   Node.js + Express على نفس دومين الـ frontend
   ========================================================= */

const express  = require('express');
const cors     = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ── CORS — whitelist frontend domain only ─────────────────────
const _allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Same-domain serverless or no-origin (health checks, curl)
    if (!origin) return cb(null, true);
    if (_allowedOrigins.length === 0 || _allowedOrigins.includes(origin)) return cb(null, true);
    // Also allow *.vercel.app previews from this project
    if (/^https:\/\/attendify[^.]*\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Security headers ──────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options',            'nosniff');
  res.setHeader('X-Frame-Options',                   'DENY');
  res.setHeader('X-XSS-Protection',                  '1; mode=block');
  res.setHeader('Referrer-Policy',                   'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',                'geolocation=(), camera=(), microphone=()');
  next();
});

app.use(express.json({ limit: '5mb' }));

// ── In-memory rate limiter (login endpoint) ───────────────────
// Vercel: instances are short-lived — this gives per-instance protection
const _loginAttempts = new Map();
const _RL_WINDOW = 15 * 60 * 1000; // 15 minutes
const _RL_MAX    = 10;              // max attempts per window

function _rateLimitLogin(req, res, next) {
  const ip  = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  let rec   = _loginAttempts.get(ip);
  if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + _RL_WINDOW };
  if (rec.count >= _RL_MAX) {
    const wait = Math.ceil((rec.resetAt - now) / 60000);
    return res.status(429).json({ error: `محاولات كثيرة جداً. انتظر ${wait} دقيقة ثم حاول مجدداً.` });
  }
  rec.count++;
  _loginAttempts.set(ip, rec);
  // Cleanup stale entries every 1000 requests to prevent memory growth
  if (_loginAttempts.size > 1000) {
    for (const [k, v] of _loginAttempts) { if (now > v.resetAt) _loginAttempts.delete(k); }
  }
  next();
}

// ── Sanitize env vars (strip BOM / invisible chars) ───────────
function cleanEnv(key) {
  const val = process.env[key] || '';
  // Remove BOM (U+FEFF), zero-width spaces, and other invisible chars
  return val.replace(/[\uFEFF\u200B\u200C\u200D\u00AD\u200E\u200F]/g, '').trim();
}

// ── Supabase Clients ──────────────────────────────────────────
const supabaseAdmin = createClient(
  cleanEnv('SUPABASE_URL'),
  cleanEnv('SUPABASE_SERVICE_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const supabaseAnon = createClient(
  cleanEnv('SUPABASE_URL'),
  cleanEnv('SUPABASE_ANON_KEY'),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Auth Middleware ───────────────────────────────────────────
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'غير مصرّح' });
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'انتهت الجلسة' });
  req.user = user;
  next();
}

const ALLOWED = new Set([
  'company','departments','employees','shifts','attendance',
  'leaves','requests','notifications','payroll','deductions','loans',
  'locations','roles','audit_logs',
]);

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── First Setup Check (بدون auth — للمستخدم الجديد) ─────────
app.get('/api/first-setup', async (req, res) => {
  try {
    // هل يوجد أي مستخدم في النظام؟
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
    if (error) return res.json({ firstSetup: true });
    // إذا لا يوجد مستخدمين → إعداد أولي
    res.json({ firstSetup: !users?.users?.length });
  } catch(e) {
    res.json({ firstSetup: true });
  }
});

// ── Auth ─────────────────────────────────────────────────────
app.post('/api/auth/login', _rateLimitLogin, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'بريد إلكتروني غير صحيح' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'كلمة مرور غير صحيحة' });
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: data.user });
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
  const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name: name || email.split('@')[0] },
  });
  if (createErr) return res.status(400).json({ error: createErr.message });
  const { data: sd, error: se } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (se) return res.json({ user: newUser.user, token: null, refreshToken: null });
  res.json({ token: sd.session.access_token, refreshToken: sd.session.refresh_token, user: sd.user });
});

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'لا يوجد refresh token' });
  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return res.status(401).json({ error: 'انتهت الجلسة — سجّل دخولك' });
  res.json({ token: data.session.access_token, refreshToken: data.session.refresh_token, user: data.user });
});

app.post('/api/auth/password', authenticate, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'كلمة المرور قصيرة' });
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Load ALL data in one shot (replaces 13 sequential requests) ──
app.get('/api/data/all', authenticate, async (req, res) => {
  const tables = [
    'company','departments','employees','shifts','attendance',
    'leaves','requests','notifications','payroll','deductions','loans',
    'locations','roles','audit_logs',
  ];
  try {
    const results = await Promise.all(tables.map(async (table) => {
      if (table === 'company') {
        const { data, error } = await supabaseAdmin.from('company').select('data').eq('id','main').maybeSingle();
        return { table, single: true, data: error ? null : (data?.data || null) };
      }
      const { data, error } = await supabaseAdmin.from(table).select('id,data').order('created_at', { ascending: true });
      return { table, rows: error ? [] : (data || []) };
    }));
    const out = {};
    results.forEach(r => { out[r.table] = r; });
    res.json({ ok: true, data: out });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Data ─────────────────────────────────────────────────────
app.get('/api/data/:table', authenticate, async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED.has(table)) return res.status(404).json({ error: 'جدول غير موجود' });
  if (table === 'company') {
    const { data, error } = await supabaseAdmin.from('company').select('data').eq('id','main').maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ single: true, data: data?.data || null });
  }
  const { data, error } = await supabaseAdmin.from(table).select('id,data').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ rows: data || [] });
});

app.post('/api/data/:table/upsert', authenticate, async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED.has(table)) return res.status(404).json({ error: 'جدول غير موجود' });
  const raw  = Array.isArray(req.body) ? req.body : [req.body];
  const rows = raw.filter(r => r && r.id).map(r => ({ id: r.id, data: r.data ?? r }));
  if (!rows.length) return res.status(400).json({ error: 'لا توجد بيانات صالحة' });
  const { error } = await supabaseAdmin.from(table).upsert(rows);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.delete('/api/data/:table/:id', authenticate, async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED.has(table)) return res.status(404).json({ error: 'جدول غير موجود' });
  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Backup endpoints ─────────────────────────────────────────
app.get('/api/backup/list', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_backups')
      .select('id, created_at, data->size, data->label')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ backups: data || [] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/backup/save', authenticate, async (req, res) => {
  try {
    const { snapshot, label } = req.body;
    if (!snapshot) return res.status(400).json({ error: 'لا توجد بيانات' });
    const id = `bk-${Date.now()}`;
    const { error } = await supabaseAdmin.from('system_backups').insert({
      id,
      data: { ...snapshot, label: label || 'نسخة تلقائية', savedAt: new Date().toISOString(), size: JSON.stringify(snapshot).length }
    });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backup/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('system_backups').select('data').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'النسخة غير موجودة' });
    res.json({ snapshot: data.data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/backup/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('system_backups').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Employee Portal Login (public, rate-limited) ──────────────
// يتيح للموظف تسجيل الدخول بكوده وكلمة المرور من أي جهاز
app.post('/api/emp/login', _rateLimitLogin, async (req, res) => {
  const { empNo, password, email } = req.body || {};
  if (!empNo && !email) return res.status(400).json({ error: 'أدخل كود الموظف' });

  const { data, error } = await supabaseAdmin
    .from('employees').select('id, data').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'خطأ في الخادم' });

  const rows = data || [];
  let empRow;
  if (email) {
    empRow = rows.find(r => r.data?.email?.toLowerCase() === email.trim().toLowerCase());
  } else {
    const code = String(empNo).trim();
    empRow = rows.find(r => r.data?.no === code || r.data?.no === code.padStart(3, '0'));
  }

  if (!empRow) return res.status(401).json({ error: 'كود الموظف غير صحيح' });

  const emp = empRow.data || {};
  const validPass = emp.password || emp.no;
  if (password !== validPass) return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });

  // إرجاع بيانات الموظف بدون كلمة المرور
  const { password: _pw, ...safeEmp } = emp;
  res.json({ ok: true, emp: safeEmp });
});

// ── Employee Portal: جلب بيانات الموظف الحالي وسجل حضوره ──────
// يُستخدم بعد تسجيل الدخول لتحديث البيانات من السيرفر
app.get('/api/emp/data/:empId', _rateLimitLogin, async (req, res) => {
  const { empId } = req.params;
  if (!empId) return res.status(400).json({ error: 'معرّف الموظف مطلوب' });

  try {
    const [empRes, attRes, shiftsRes, deptsRes, leavesRes] = await Promise.all([
      supabaseAdmin.from('employees').select('id,data').eq('id', empId).single(),
      supabaseAdmin.from('attendance').select('id,data').order('created_at', { ascending: false }).limit(60),
      supabaseAdmin.from('shifts').select('id,data'),
      supabaseAdmin.from('departments').select('id,data'),
      supabaseAdmin.from('leaves').select('id,data').order('created_at', { ascending: false }).limit(30),
    ]);

    if (empRes.error || !empRes.data) return res.status(404).json({ error: 'الموظف غير موجود' });

    const { password: _pw, ...safeEmp } = empRes.data.data || {};
    res.json({
      ok: true,
      emp:        safeEmp,
      attendance: (attRes.data || []).map(r => r.data).filter(r => r?.empId === empId),
      shifts:     (shiftsRes.data || []).map(r => r.data),
      departments:(deptsRes.data || []).map(r => r.data),
      leaves:     (leavesRes.data || []).map(r => r.data).filter(r => r?.empId === empId),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;

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

// ── In-memory rate limiters ────────────────────────────────────
function _makeRateLimiter(windowMs, max) {
  const store = new Map();
  return function rl(req, res, next) {
    const ip  = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let rec   = store.get(ip);
    if (!rec || now > rec.resetAt) rec = { count: 0, resetAt: now + windowMs };
    if (rec.count >= max) {
      const wait = Math.ceil((rec.resetAt - now) / 60000);
      return res.status(429).json({ error: `محاولات كثيرة جداً. انتظر ${wait} دقيقة ثم حاول مجدداً.` });
    }
    rec.count++;
    store.set(ip, rec);
    if (store.size > 1000) {
      for (const [k, v] of store) { if (now > v.resetAt) store.delete(k); }
    }
    next();
  };
}

// تسجيل دخول: 10 محاولات / 15 دقيقة
const _rateLimitLogin   = _makeRateLimiter(15 * 60 * 1000, 10);
// جلب بيانات الموظف: 60 طلب / دقيقة
const _rateLimitEmpData = _makeRateLimiter(60 * 1000, 60);
// مساعد AI: 20 رسالة / دقيقة (يستهلك توكنز حقيقية على حساب المستخدم)
const _rateLimitAI      = _makeRateLimiter(60 * 1000, 20);

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
  'expenses','locations','roles','audit_logs',
]);

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Employee Login Diagnostics (no auth — safe, returns counts only) ──
app.get('/api/emp/ping', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('employees').select('id, data').order('created_at', { ascending: true });
    if (error) return res.json({ ok: false, error: error.message, supabase: 'error' });
    const rows = data || [];
    const sample = rows.map(r => ({
      id: r.id,
      no: r.data?.no,
      name: r.data?.name?.split(' ')[0] || '—',
      pass: r.data?.password || '(كود الموظف)',
    }));
    res.json({ ok: true, count: rows.length, sample });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// ── Reset all employee passwords to empty (so login uses employee code) ──
// POST /api/emp/reset-passwords  — requires admin auth
app.post('/api/emp/reset-passwords', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('employees').select('id, data');
    if (error) return res.status(500).json({ error: error.message });
    const rows = data || [];
    const updates = rows.map(r => ({
      id: r.id,
      data: { ...r.data, password: '' },
    }));
    const { error: upErr } = await supabaseAdmin.from('employees').upsert(updates);
    if (upErr) return res.status(500).json({ error: upErr.message });
    res.json({ ok: true, updated: updates.length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

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

app.post('/api/auth/signup', _rateLimitLogin, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'بريد إلكتروني غير صحيح' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'كلمة المرور قصيرة (8 أحرف على الأقل)' });
  // السماح بالتسجيل فقط عند الإعداد الأول — بعده يُمنع إنشاء حسابات جديدة
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
  if (existing?.users?.length > 0) return res.status(403).json({ error: 'التسجيل غير مسموح به' });
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
    'expenses','locations','roles','audit_logs',
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
  if (error) {
    console.error('[emp/login] supabase error:', error.message);
    return res.status(500).json({ error: 'خطأ في الخادم — تعذّر الوصول إلى قاعدة البيانات' });
  }

  const rows = data || [];
  let empRow;
  if (email) {
    const emailLow = email.trim().toLowerCase();
    empRow = rows.find(r => r.data?.email?.toLowerCase() === emailLow);
  } else {
    const code    = String(empNo).trim();
    const codeLow = code.toLowerCase();
    const codeNum = code.replace(/\D/g, '').replace(/^0+/, '') || code;
    empRow = rows.find(r => {
      const no  = String(r.data?.no || '').trim();
      const id  = String(r.data?.id || r.id || '').trim();
      const noN = no.replace(/\D/g, '').replace(/^0+/, '') || no;
      return (
        no  === code || id  === code ||
        no.toLowerCase() === codeLow || id.toLowerCase() === codeLow ||
        noN === codeNum ||
        no  === code.padStart(3, '0') ||
        no.padStart(3, '0') === code.padStart(3, '0')
      );
    });
  }

  if (!empRow) return res.status(401).json({ error: 'كود الموظف غير موجود' });

  const emp  = empRow.data || {};
  const s    = v => String(v || '').trim();
  const norm = v => s(v).replace(/^0+/, '') || '0';
  const p    = s(password);
  const no   = s(emp.no);
  const id   = s(emp.id);

  // Employee code or id always works as password (default)
  const codeMatch = p === no || norm(p) === norm(no) || p === id || norm(p) === norm(id);
  // Custom password (only if set and different from code)
  const custom      = s(emp.password);
  const customMatch = custom && custom !== no && p === custom;

  if (!codeMatch && !customMatch) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة — كلمة المرور الافتراضية هي كود الموظف' });
  }

  // إرجاع بيانات الموظف بدون كلمة المرور
  const { password: _pw, ...safeEmp } = emp;
  res.json({ ok: true, emp: safeEmp });
});

// ── Employee Portal: جلب بيانات الموظف الحالي وسجل حضوره ──────
// يُستخدم بعد تسجيل الدخول لتحديث البيانات من السيرفر
app.get('/api/emp/data/:empId', _rateLimitEmpData, async (req, res) => {
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

// ── Employee Portal: تسجيل الحضور والانصراف ──────────────────
// endpoint عام محمي بـ rate limit — يحفظ سجل الحضور في Supabase
app.post('/api/emp/checkin', _rateLimitLogin, async (req, res) => {
  const { empId, date, checkIn, checkOut, method, status, lateMin, overtime } = req.body || {};
  if (!empId || !date) return res.status(400).json({ error: 'بيانات ناقصة' });

  // التحقق أن الموظف موجود فعلاً
  const { data: empRow, error: empErr } = await supabaseAdmin
    .from('employees').select('id').eq('id', empId).maybeSingle();
  if (empErr || !empRow) return res.status(404).json({ error: 'الموظف غير موجود' });

  // البحث عن سجل اليوم الحالي
  const { data: existing } = await supabaseAdmin
    .from('attendance').select('id, data').eq('id', `att-${empId}-${date}`).maybeSingle();

  const id = existing?.id || `att-${empId}-${date}`;

  let newData;
  if (checkOut && existing) {
    // تحديث وقت الانصراف فقط
    newData = { ...existing.data, checkOut, overtime: overtime || null };
  } else {
    // سجل حضور جديد
    newData = {
      id, empId, date,
      checkIn:  checkIn  || null,
      checkOut: checkOut || null,
      method:   method   || 'manual',
      status:   status   || 'present',
      lateMin:  lateMin  || null,
      overtime: overtime || null,
    };
  }

  const { error } = await supabaseAdmin.from('attendance').upsert({ id, data: newData });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id });
});

// ── Employee Portal: طلب إجازة ──────────────────────────────────
app.post('/api/emp/leave', _rateLimitLogin, async (req, res) => {
  const { empId, type, from, to, days, reason, appliedOn } = req.body || {};
  if (!empId || !from || !to) return res.status(400).json({ error: 'بيانات ناقصة' });

  const { data: empRow } = await supabaseAdmin
    .from('employees').select('id').eq('id', empId).maybeSingle();
  if (!empRow) return res.status(404).json({ error: 'الموظف غير موجود' });

  const id      = `leave-${empId}-${Date.now()}`;
  const newData = { id, empId, type: type||'annual', from, to, days: days||1,
                    reason: reason||'', status: 'pending',
                    appliedOn: appliedOn || new Date().toISOString().split('T')[0] };

  const { error } = await supabaseAdmin.from('leaves').upsert({ id, data: newData });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id, leave: newData });
});

// ── Employee Portal: طلب سلفة / طلب عام ──────────────────────────
app.post('/api/emp/request', _rateLimitLogin, async (req, res) => {
  const { empId, type, amount, reason, date } = req.body || {};
  if (!empId || !type) return res.status(400).json({ error: 'بيانات ناقصة' });

  const { data: empRow } = await supabaseAdmin
    .from('employees').select('id,data').eq('id', empId).maybeSingle();
  if (!empRow) return res.status(404).json({ error: 'الموظف غير موجود' });

  const id      = `req-${empId}-${Date.now()}`;
  const newData = { id, empId, empName: empRow.data?.name || '',
                    type, amount: amount||null, reason: reason||'',
                    status: 'pending',
                    date: date || new Date().toISOString().split('T')[0] };

  const { error } = await supabaseAdmin.from('requests').upsert({ id, data: newData });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, id, request: newData });
});

// ── AI Assistant — Service Layer ────────────────────────────
// Reads business data from Supabase directly (never from the frontend/DOM),
// builds a compact context, and forwards the question to the configured
// LLM provider. API key + provider settings live in company.settingsCenter.values.ai.

async function _getAISettings() {
  const { data, error } = await supabaseAdmin.from('company').select('data').eq('id', 'main').maybeSingle();
  if (error || !data?.data) return null;
  // 'ai-center' is the Settings Center v2 storage key (settings-center/src/features/ai-center).
  // Fall back to the legacy 'ai' key for any data saved before that migration.
  return data.data.settingsCenter?.values?.['ai-center'] || data.data.settingsCenter?.values?.ai || null;
}

async function _buildBusinessContext() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7);

  const [empRes, attRes, leavesRes, deptRes, payrollRes, reqRes] = await Promise.all([
    supabaseAdmin.from('employees').select('id,data'),
    supabaseAdmin.from('attendance').select('id,data').order('created_at', { ascending: false }).limit(500),
    supabaseAdmin.from('leaves').select('id,data').order('created_at', { ascending: false }).limit(100),
    supabaseAdmin.from('departments').select('id,data'),
    supabaseAdmin.from('payroll').select('id,data').order('created_at', { ascending: false }).limit(200),
    supabaseAdmin.from('requests').select('id,data').order('created_at', { ascending: false }).limit(100),
  ]);

  const employees   = (empRes.data || []).map(r => r.data).filter(Boolean);
  const attendance  = (attRes.data || []).map(r => r.data).filter(Boolean);
  const leaves      = (leavesRes.data || []).map(r => r.data).filter(Boolean);
  const departments = (deptRes.data || []).map(r => r.data).filter(Boolean);
  const payroll     = (payrollRes.data || []).map(r => r.data).filter(Boolean);
  const requests    = (reqRes.data || []).map(r => r.data).filter(Boolean);

  const empById = new Map(employees.map(e => [String(e.id), e]));
  const nameOf  = id => empById.get(String(id))?.name || String(id);

  const todayAtt   = attendance.filter(a => a.date === today);
  const monthAtt   = attendance.filter(a => (a.date || '').startsWith(monthStart));

  const lateCounts = {};
  const absentCounts = {};
  monthAtt.forEach(a => {
    if (a.status === 'late')   lateCounts[a.empId]   = (lateCounts[a.empId]   || 0) + 1;
    if (a.status === 'absent') absentCounts[a.empId] = (absentCounts[a.empId] || 0) + 1;
  });
  const topLate = Object.entries(lateCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, count]) => ({ name: nameOf(id), lateCount: count }));
  const topAbsent = Object.entries(absentCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, count]) => ({ name: nameOf(id), absentCount: count }));

  const deptHeadcount = departments.map(d => ({
    name: d.name,
    activeEmployees: employees.filter(e => e.dept === d.id && e.status !== 'inactive').length,
  }));

  return {
    date: today,
    employees: {
      total: employees.length,
      active: employees.filter(e => e.status === 'active').length,
      inactive: employees.filter(e => e.status === 'inactive').length,
    },
    todayAttendance: {
      present: todayAtt.filter(a => a.status === 'present').length,
      late:    todayAtt.filter(a => a.status === 'late').length,
      absent:  todayAtt.filter(a => a.status === 'absent').length,
      absentNames: todayAtt.filter(a => a.status === 'absent').map(a => nameOf(a.empId)).slice(0, 20),
      lateNames:   todayAtt.filter(a => a.status === 'late').map(a => nameOf(a.empId)).slice(0, 20),
    },
    monthToDateAttendance: { topLate, topAbsent },
    departments: deptHeadcount,
    leaves: {
      pending: leaves.filter(l => l.status === 'pending').length,
      pendingList: leaves.filter(l => l.status === 'pending').slice(0, 15).map(l => ({
        employee: nameOf(l.empId), type: l.type, from: l.from, to: l.to, days: l.days,
      })),
    },
    requests: { pending: requests.filter(r => r.status === 'pending').length },
    payroll: {
      monthlyTotal: payroll.filter(p => p.month === monthStart).reduce((s, p) => s + (p.total || 0), 0),
      currency: 'SAR',
    },
  };
}

const _AI_PROVIDERS = {
  OpenAI:   { kind: 'openai',    baseUrl: 'https://api.openai.com/v1/chat/completions',         defaultModel: 'gpt-4o-mini' },
  DeepSeek: { kind: 'openai',    baseUrl: 'https://api.deepseek.com/chat/completions',           defaultModel: 'deepseek-chat' },
  Claude:   { kind: 'anthropic', baseUrl: 'https://api.anthropic.com/v1/messages',               defaultModel: 'claude-sonnet-4-6' },
  Gemini:   { kind: 'gemini',    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models', defaultModel: 'gemini-2.0-flash' },
};

async function _callProvider({ provider, apiKey, model, temperature, maxTokens, system, history, message }) {
  const cfg = _AI_PROVIDERS[provider] || _AI_PROVIDERS.OpenAI;
  const useModel = model || cfg.defaultModel;
  const temp = typeof temperature === 'number' ? temperature : 0.7;
  const tokens = maxTokens || 1500;

  if (cfg.kind === 'openai') {
    const r = await fetch(cfg.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: useModel,
        temperature: temp,
        max_tokens: tokens,
        messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || `${provider} API error (${r.status})`);
    return j.choices?.[0]?.message?.content || '';
  }

  if (cfg.kind === 'anthropic') {
    const r = await fetch(cfg.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: useModel,
        max_tokens: tokens,
        temperature: temp,
        system,
        messages: [...history, { role: 'user', content: message }],
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || `Claude API error (${r.status})`);
    return (j.content || []).map(c => c.text).join('') || '';
  }

  if (cfg.kind === 'gemini') {
    const r = await fetch(`${cfg.baseUrl}/${useModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
          { role: 'user', parts: [{ text: message }] },
        ],
        generationConfig: { temperature: temp, maxOutputTokens: tokens },
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || `Gemini API error (${r.status})`);
    return j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  }

  throw new Error('مزود الذكاء الاصطناعي غير مدعوم');
}

app.post('/api/ai/chat', authenticate, _rateLimitAI, async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'الرسالة فارغة' });
    }
    if (message.length > 2000) return res.status(400).json({ error: 'الرسالة طويلة جداً' });

    const ai = await _getAISettings();
    if (!ai?.apiKey) {
      return res.status(400).json({ error: 'لم يتم إعداد مفتاح API للذكاء الاصطناعي — أضفه من الإعدادات ← المساعد الذكي' });
    }

    const safeHistory = Array.isArray(history)
      ? history.filter(h => h && typeof h.content === 'string' && ['user', 'assistant'].includes(h.role)).slice(-8)
      : [];

    const context = await _buildBusinessContext();
    const system = [
      ai.systemPrompt || 'You are a smart HR and operations assistant for Attendify Pro.',
      'أجب بنفس لغة سؤال المستخدم (عربي أو إنجليزي). استخدم فقط البيانات المرفقة أدناه — لا تخترع بيانات غير موجودة فيها.',
      'إذا طُلب منك عرض قائمة أو مقارنة، استخدم جدول Markdown.',
      'كن مختصراً ومباشراً.',
      `بيانات النظام الحالية (JSON):\n${JSON.stringify(context)}`,
    ].join('\n\n');

    const reply = await _callProvider({
      provider: ai.provider || 'OpenAI',
      apiKey: ai.apiKey,
      model: ai.model,
      temperature: ai.temperature,
      maxTokens: ai.maxTokens,
      system,
      history: safeHistory,
      message: message.trim(),
    });

    res.json({ ok: true, reply });
  } catch (e) {
    console.error('[ai/chat] error:', e.message);
    res.status(502).json({ error: e.message || 'تعذّر الاتصال بمزود الذكاء الاصطناعي' });
  }
});

module.exports = app;

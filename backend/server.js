/* =========================================================
   ATTENDIFY PRO — Node.js + Express Backend
   Auth · CRUD · Supabase Admin (service role)
   ========================================================= */

const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const app = express();

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── SUPABASE CLIENTS ──────────────────────────────────────────

// Admin client — service role key (bypasses RLS, NEVER sent to frontend)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Anon client — used ONLY for user auth operations
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'غير مصرّح — يرجى تسجيل الدخول' });
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'انتهت الجلسة — يرجى تسجيل الدخول مجدداً' });
  req.user = user;
  next();
}

// ── ALLOWED TABLES ────────────────────────────────────────────
const ALLOWED = new Set([
  'company','departments','employees','shifts','attendance',
  'leaves','requests','notifications','payroll','deductions',
  'locations','roles','audit_logs',
]);

// ════════════════════════════════════════════════════════
//  HEALTH
// ════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' });
});

// ════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════

// تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'يرجى إدخال البريد وكلمة المرور' });

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error)
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });

  res.json({ token: data.session.access_token, user: data.user });
});

// إنشاء حساب (يُنفَّذ على السيرفر — يؤكد البريد تلقائياً)
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'بيانات ناقصة' });

  // إنشاء المستخدم مع تأكيد فوري (لا انتظار بريد)
  const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || email.split('@')[0] },
  });
  if (createErr)
    return res.status(400).json({ error: createErr.message });

  // تسجيل دخول فوري
  const { data: sd, error: signInErr } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (signInErr)
    return res.status(200).json({ user: newUser.user, token: null, message: 'تم الإنشاء — سجّل دخولك الآن' });

  res.json({ token: sd.session.access_token, user: sd.user });
});

// بيانات المستخدم الحالي
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// تغيير كلمة المرور
app.post('/api/auth/password', authenticate, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8)
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════
//  DATA ROUTES (CRUD)
// ════════════════════════════════════════════════════════

// جلب البيانات من جدول
app.get('/api/data/:table', authenticate, async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED.has(table))
    return res.status(404).json({ error: 'جدول غير موجود' });

  // Company: صف واحد
  if (table === 'company') {
    const { data, error } = await supabaseAdmin
      .from('company').select('data').eq('id', 'main').maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ single: true, data: data?.data || null });
  }

  const { data, error } = await supabaseAdmin
    .from(table).select('id,data').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ rows: data || [] });
});

// حفظ / تحديث (upsert)
app.post('/api/data/:table/upsert', authenticate, async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED.has(table))
    return res.status(404).json({ error: 'جدول غير موجود' });

  const rows = Array.isArray(req.body) ? req.body : [req.body];
  const { error } = await supabaseAdmin.from(table).upsert(rows);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// حذف سجل
app.delete('/api/data/:table/:id', authenticate, async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED.has(table))
    return res.status(404).json({ error: 'جدول غير موجود' });

  const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Attendify Backend running on port ${PORT}`);
});

/* =========================================================
   ATTENDIFY PRO — Vercel Serverless Backend
   Node.js + Express على نفس دومين الـ frontend
   ========================================================= */

const express  = require('express');
const cors     = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ── Supabase Clients ──────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
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
  'leaves','requests','notifications','payroll','deductions',
  'locations','roles','audit_logs',
]);

// ── Health ───────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Auth ─────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
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

module.exports = app;

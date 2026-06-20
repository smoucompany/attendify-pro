-- =========================================================
--  ATTENDIFY PRO — SUPABASE SCHEMA
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- =========================================================

-- Enable UUID extension (optional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── COMPANY (single row) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS company (
  id      TEXT PRIMARY KEY DEFAULT 'main',
  data    JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── DEPARTMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMPLOYEES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SHIFTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shifts (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ATTENDANCE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── LEAVES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaves (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── REQUESTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTIFICATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYROLL ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id         TEXT PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE company        ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (suitable for internal systems)
-- To restrict access, replace these with proper user-based policies
CREATE POLICY "allow_all" ON company        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON departments    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON employees      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON shifts         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON attendance     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON leaves         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON requests       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON notifications  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON payroll        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON audit_logs     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── INDEXES (optional, for large datasets) ───────────────
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance ((data->>'date'));
CREATE INDEX IF NOT EXISTS idx_attendance_empid ON attendance ((data->>'empId'));
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees ((data->>'status'));

-- ── REALTIME (optional) ──────────────────────────────────
-- Uncomment to enable real-time subscriptions:
-- ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
-- ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

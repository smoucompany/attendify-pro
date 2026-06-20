-- ================================================================
--  ATTENDIFY PRO — SUPABASE SCHEMA v3.0  (نظيفة بدون أخطاء)
--
--  الخطوات:
--  1. افتح Supabase → SQL Editor → New Query
--  2. الصق الملف كاملاً
--  3. اضغط RUN
-- ================================================================


-- ════════════════════════════════════════════════════
--  حذف كل شيء قديم أولاً
-- ════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS get_payroll_report(TEXT)        CASCADE;
DROP FUNCTION IF EXISTS get_attendance_stats(TEXT,TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_attendance_stats(DATE,DATE) CASCADE;
DROP FUNCTION IF EXISTS set_updated_at()                CASCADE;

DROP VIEW IF EXISTS v_dept_stats        CASCADE;
DROP VIEW IF EXISTS v_payroll_detail    CASCADE;
DROP VIEW IF EXISTS v_leaves_detail     CASCADE;
DROP VIEW IF EXISTS v_monthly_summary   CASCADE;
DROP VIEW IF EXISTS v_attendance_detail CASCADE;

DROP TABLE IF EXISTS audit_logs    CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payroll       CASCADE;
DROP TABLE IF EXISTS requests      CASCADE;
DROP TABLE IF EXISTS leaves        CASCADE;
DROP TABLE IF EXISTS attendance    CASCADE;
DROP TABLE IF EXISTS shifts        CASCADE;
DROP TABLE IF EXISTS locations     CASCADE;
DROP TABLE IF EXISTS employees     CASCADE;
DROP TABLE IF EXISTS departments   CASCADE;
DROP TABLE IF EXISTS roles         CASCADE;
DROP TABLE IF EXISTS company       CASCADE;


-- ════════════════════════════════════════════════════
--  Extensions
-- ════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ════════════════════════════════════════════════════
--  الجداول  (بدون generated columns من نوع cast)
-- ════════════════════════════════════════════════════

-- 1. إعدادات الشركة (صف واحد دائماً id = 'main')
CREATE TABLE company (
  id         TEXT        PRIMARY KEY DEFAULT 'main',
  data       JSONB       NOT NULL    DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL    DEFAULT now()
);

-- 2. الأقسام
CREATE TABLE departments (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. الموظفون
CREATE TABLE employees (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. الأدوار والصلاحيات
CREATE TABLE roles (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. الورديات وتعيينات الموظفين
CREATE TABLE shifts (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. مواقع العمل (GPS)
CREATE TABLE locations (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. سجلات الحضور
CREATE TABLE attendance (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. الإجازات
CREATE TABLE leaves (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. طلبات الموظفين
CREATE TABLE requests (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. كشوف الرواتب
CREATE TABLE payroll (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. الإشعارات
CREATE TABLE notifications (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. سجل المراجعة
CREATE TABLE audit_logs (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════
--  الفهارس  (على JSONB مباشرة — سريعة وآمنة)
-- ════════════════════════════════════════════════════

-- employees
CREATE INDEX idx_emp_name    ON employees  ((data->>'name'));
CREATE INDEX idx_emp_no      ON employees  ((data->>'no'));
CREATE INDEX idx_emp_dept    ON employees  ((data->>'dept'));
CREATE INDEX idx_emp_status  ON employees  ((data->>'status'));
CREATE INDEX idx_emp_email   ON employees  ((data->>'email'));
CREATE INDEX idx_emp_name_trgm ON employees USING gin ((data->>'name') gin_trgm_ops);

-- attendance
CREATE INDEX idx_att_emp     ON attendance ((data->>'empId'));
CREATE INDEX idx_att_date    ON attendance ((data->>'date'));
CREATE INDEX idx_att_status  ON attendance ((data->>'status'));
CREATE INDEX idx_att_emp_dt  ON attendance ((data->>'empId'), (data->>'date'));

-- leaves
CREATE INDEX idx_lv_emp      ON leaves ((data->>'empId'));
CREATE INDEX idx_lv_status   ON leaves ((data->>'status'));
CREATE INDEX idx_lv_from     ON leaves ((data->>'from'));

-- requests
CREATE INDEX idx_req_emp     ON requests ((data->>'empId'));
CREATE INDEX idx_req_status  ON requests ((data->>'status'));
CREATE INDEX idx_req_type    ON requests ((data->>'type'));

-- payroll
CREATE INDEX idx_pay_emp     ON payroll ((data->>'empId'));
CREATE INDEX idx_pay_period  ON payroll ((data->>'period'));
CREATE INDEX idx_pay_emp_per ON payroll ((data->>'empId'), (data->>'period'));

-- notifications
CREATE INDEX idx_notif_emp   ON notifications ((data->>'empId'));
CREATE INDEX idx_notif_read  ON notifications ((data->>'read'));

-- audit
CREATE INDEX idx_audit_user  ON audit_logs ((data->>'userId'));
CREATE INDEX idx_audit_mod   ON audit_logs ((data->>'module'));
CREATE INDEX idx_audit_time  ON audit_logs (created_at DESC);

-- shifts
CREATE INDEX idx_shift_type  ON shifts ((data->>'type'));
CREATE INDEX idx_shift_emp   ON shifts ((data->>'empId'));

-- departments
CREATE INDEX idx_dept_name   ON departments ((data->>'name'));


-- ════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════

ALTER TABLE company       ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves        ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all ON company       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON departments   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON employees     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON roles         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON shifts        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON locations     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON attendance    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON leaves        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON requests      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON payroll       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON audit_logs    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════
--  Trigger: updated_at تلقائي
-- ════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_upd    BEFORE UPDATE ON company     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_depts_upd      BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_upd  BEFORE UPDATE ON employees   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roles_upd      BEFORE UPDATE ON roles       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shifts_upd     BEFORE UPDATE ON shifts      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_locations_upd  BEFORE UPDATE ON locations   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_upd BEFORE UPDATE ON attendance  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leaves_upd     BEFORE UPDATE ON leaves      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_requests_upd   BEFORE UPDATE ON requests    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payroll_upd    BEFORE UPDATE ON payroll     FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════
--  Views للتقارير
-- ════════════════════════════════════════════════════

-- الحضور مع اسم الموظف والقسم
CREATE VIEW v_attendance_detail AS
SELECT
  a.id,
  a.data->>'empId'       AS emp_id,
  e.data->>'name'        AS emp_name,
  e.data->>'dept'        AS dept_id,
  d.data->>'name'        AS dept_name,
  a.data->>'date'        AS att_date,
  a.data->>'status'      AS status,
  a.data->>'checkIn'     AS check_in,
  a.data->>'checkOut'    AS check_out,
  (a.data->>'lateMinutes')::int  AS late_minutes,
  (a.data->>'overtime')::int     AS overtime_minutes,
  a.created_at
FROM attendance a
LEFT JOIN employees   e ON e.id = a.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- ملخص الحضور الشهري لكل موظف
CREATE VIEW v_monthly_summary AS
SELECT
  a.data->>'empId'                             AS emp_id,
  left(a.data->>'date', 7)                     AS period,
  count(*)                                     AS total_days,
  count(*) FILTER (WHERE a.data->>'status' = 'present') AS present_days,
  count(*) FILTER (WHERE a.data->>'status' = 'late')    AS late_days,
  count(*) FILTER (WHERE a.data->>'status' = 'absent')  AS absent_days,
  coalesce(sum((a.data->>'lateMinutes')::int), 0)       AS total_late_min,
  coalesce(sum((a.data->>'overtime')::int), 0)          AS total_overtime_min
FROM attendance a
WHERE a.data->>'date' IS NOT NULL
GROUP BY a.data->>'empId', left(a.data->>'date', 7);


-- الإجازات مع اسم الموظف
CREATE VIEW v_leaves_detail AS
SELECT
  l.id,
  l.data->>'empId'      AS emp_id,
  e.data->>'name'       AS emp_name,
  d.data->>'name'       AS dept_name,
  l.data->>'type'       AS leave_type,
  l.data->>'from'       AS from_date,
  l.data->>'to'         AS to_date,
  l.data->>'status'     AS status,
  (l.data->>'days')::int AS days_count,
  l.data->>'reason'     AS reason,
  l.created_at
FROM leaves l
LEFT JOIN employees   e ON e.id = l.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- كشوف الرواتب مع اسم الموظف
CREATE VIEW v_payroll_detail AS
SELECT
  p.id,
  p.data->>'empId'                        AS emp_id,
  e.data->>'name'                         AS emp_name,
  d.data->>'name'                         AS dept_name,
  p.data->>'period'                       AS period,
  (p.data->>'base')::numeric              AS base,
  (p.data->>'housing')::numeric           AS housing,
  (p.data->>'transport')::numeric         AS transport,
  (p.data->>'food')::numeric              AS food,
  (p.data->>'overtime')::numeric          AS overtime,
  (p.data->>'absentDeduction')::numeric   AS absent_deduction,
  (p.data->>'lateDeduction')::numeric     AS late_deduction,
  (p.data->>'total')::numeric             AS net_salary,
  p.created_at
FROM payroll p
LEFT JOIN employees   e ON e.id = p.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- إحصائيات الموظفين حسب القسم
CREATE VIEW v_dept_stats AS
SELECT
  d.id                                                          AS dept_id,
  d.data->>'name'                                               AS dept_name,
  count(e.id)                                                   AS total,
  count(e.id) FILTER (WHERE e.data->>'status' = 'active')      AS active,
  count(e.id) FILTER (WHERE e.data->>'status' = 'on_leave')    AS on_leave,
  count(e.id) FILTER (WHERE e.data->>'status' = 'inactive')    AS inactive
FROM departments d
LEFT JOIN employees e ON e.data->>'dept' = d.id
GROUP BY d.id, d.data->>'name';


-- ════════════════════════════════════════════════════
--  Realtime
-- ════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;


-- ════════════════════════════════════════════════════
--  دوال التقارير
--  مثال: SELECT * FROM get_attendance_stats('2025-06-01','2025-06-30')
--  مثال: SELECT * FROM get_payroll_report('2025-06')
-- ════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_attendance_stats(p_from TEXT, p_to TEXT)
RETURNS TABLE (
  emp_id       TEXT,
  emp_name     TEXT,
  dept_name    TEXT,
  present_days BIGINT,
  late_days    BIGINT,
  absent_days  BIGINT,
  late_minutes NUMERIC,
  overtime_min NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    a.data->>'empId',
    e.data->>'name',
    d.data->>'name',
    count(*) FILTER (WHERE a.data->>'status' = 'present'),
    count(*) FILTER (WHERE a.data->>'status' = 'late'),
    count(*) FILTER (WHERE a.data->>'status' = 'absent'),
    coalesce(sum((a.data->>'lateMinutes')::numeric), 0),
    coalesce(sum((a.data->>'overtime')::numeric), 0)
  FROM attendance a
  LEFT JOIN employees   e ON e.id = a.data->>'empId'
  LEFT JOIN departments d ON d.id = e.data->>'dept'
  WHERE a.data->>'date' >= p_from
    AND a.data->>'date' <= p_to
  GROUP BY a.data->>'empId', e.data->>'name', d.data->>'name';
$$;


CREATE OR REPLACE FUNCTION get_payroll_report(p_period TEXT)
RETURNS TABLE (
  emp_name   TEXT,
  dept_name  TEXT,
  base       NUMERIC,
  allowances NUMERIC,
  overtime   NUMERIC,
  deductions NUMERIC,
  net        NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    e.data->>'name',
    d.data->>'name',
    (p.data->>'base')::numeric,
    coalesce((p.data->>'housing')::numeric, 0)
      + coalesce((p.data->>'transport')::numeric, 0)
      + coalesce((p.data->>'food')::numeric, 0),
    coalesce((p.data->>'overtime')::numeric, 0),
    coalesce((p.data->>'absentDeduction')::numeric, 0)
      + coalesce((p.data->>'lateDeduction')::numeric, 0),
    (p.data->>'total')::numeric
  FROM payroll p
  LEFT JOIN employees   e ON e.id = p.data->>'empId'
  LEFT JOIN departments d ON d.id = e.data->>'dept'
  WHERE p.data->>'period' = p_period
  ORDER BY e.data->>'name';
$$;


-- ════════════════════════════════════════════════════
--  بيانات أولية للشركة
-- ════════════════════════════════════════════════════

INSERT INTO company (id, data) VALUES ('main', '{
  "name": "",
  "nameEn": "",
  "logo": "",
  "address": "",
  "phone": "",
  "email": "",
  "timezone": "Asia/Riyadh",
  "currency": "SAR",
  "workStart": "08:00",
  "workEnd": "17:00",
  "lateThreshold": 15,
  "overtimeEnabled": true,
  "workDays": ["sat","sun","mon","tue","wed","thu"],
  "branches": [],
  "holidays": [
    {"id":"h1","name":"اليوم الوطني","date":"2025-09-23","days":2}
  ],
  "leaveTypes": [
    {"key":"annual",    "l":"إجازة سنوية",     "days":21, "paid":true,  "carry":true,  "color":"#6366f1"},
    {"key":"sick",      "l":"إجازة مرضية",     "days":10, "paid":true,  "carry":false, "color":"#10b981"},
    {"key":"emergency", "l":"إجازة طارئة",     "days":3,  "paid":true,  "carry":false, "color":"#f59e0b"},
    {"key":"maternity", "l":"إجازة أمومة",     "days":70, "paid":true,  "carry":false, "color":"#ec4899"},
    {"key":"paternity", "l":"إجازة أبوة",      "days":3,  "paid":true,  "carry":false, "color":"#06b6d4"},
    {"key":"unpaid",    "l":"إجازة بدون راتب", "days":0,  "paid":false, "carry":false, "color":"#94a3b8"}
  ],
  "notifChannels": {
    "Email": true,
    "WhatsApp": true,
    "SMS": false,
    "Browser": true,
    "In-App": true,
    "Auto Reports": false
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════
--  انتهى ✓
--  12 جدول  |  22 فهرس  |  5 views  |  2 functions
--  Triggers updated_at  |  RLS مفعّل  |  Realtime × 4
-- ════════════════════════════════════════════════════

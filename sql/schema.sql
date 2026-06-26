-- ================================================================
--  ATTENDIFY PRO — SUPABASE SCHEMA v5.0  (شاملة ونظيفة)
--
--  الجداول: 16 جدول
--  company · departments · employees · roles · shifts · locations
--  attendance · leaves · requests · payroll · notifications
--  audit_logs · loans · deductions · expenses · system_backups
--
--  الخطوات:
--  1. افتح Supabase → SQL Editor → New Query
--  2. الصق الملف كاملاً
--  3. اضغط RUN
--
--  ملاحظة: هذا الملف يحذف كل الجداول القديمة ويعيد إنشاءها من صفر.
--  إذا كان عندك بيانات مهمة في Supabase، خذ نسخة احتياطية أولاً.
-- ================================================================


-- ════════════════════════════════════════════════════
--  STEP 1: حذف كل شيء قديم (CASCADE)
-- ════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS get_payroll_report(TEXT)        CASCADE;
DROP FUNCTION IF EXISTS get_attendance_stats(TEXT,TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_attendance_stats(DATE,DATE) CASCADE;
DROP FUNCTION IF EXISTS get_expenses_summary(TEXT,TEXT) CASCADE;
DROP FUNCTION IF EXISTS set_updated_at()                CASCADE;

DROP VIEW IF EXISTS v_dept_stats          CASCADE;
DROP VIEW IF EXISTS v_payroll_detail      CASCADE;
DROP VIEW IF EXISTS v_leaves_detail       CASCADE;
DROP VIEW IF EXISTS v_monthly_summary     CASCADE;
DROP VIEW IF EXISTS v_attendance_detail   CASCADE;
DROP VIEW IF EXISTS v_loans_detail        CASCADE;
DROP VIEW IF EXISTS v_deductions_detail   CASCADE;
DROP VIEW IF EXISTS v_expenses_detail     CASCADE;

DROP TABLE IF EXISTS system_backups CASCADE;
DROP TABLE IF EXISTS expenses        CASCADE;
DROP TABLE IF EXISTS deductions      CASCADE;
DROP TABLE IF EXISTS loans           CASCADE;
DROP TABLE IF EXISTS audit_logs      CASCADE;
DROP TABLE IF EXISTS notifications   CASCADE;
DROP TABLE IF EXISTS payroll         CASCADE;
DROP TABLE IF EXISTS requests        CASCADE;
DROP TABLE IF EXISTS leaves          CASCADE;
DROP TABLE IF EXISTS attendance      CASCADE;
DROP TABLE IF EXISTS shifts          CASCADE;
DROP TABLE IF EXISTS locations       CASCADE;
DROP TABLE IF EXISTS employees       CASCADE;
DROP TABLE IF EXISTS departments     CASCADE;
DROP TABLE IF EXISTS roles           CASCADE;
DROP TABLE IF EXISTS company         CASCADE;


-- ════════════════════════════════════════════════════
--  STEP 2: Extensions
-- ════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ════════════════════════════════════════════════════
--  STEP 3: إنشاء الجداول
--
--  كل جدول يستخدم نمط JSONB واحد:
--    id         TEXT  PRIMARY KEY  (يُولَّد في الـ frontend)
--    data       JSONB             (كل بيانات السجل)
--    created_at TIMESTAMPTZ       (تلقائي)
--    updated_at TIMESTAMPTZ       (يُحدَّث بالـ Trigger)
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

-- 6. مواقع العمل (GPS/Geofencing)
CREATE TABLE locations (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. سجلات الحضور والانصراف
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

-- 12. سجل المراجعة والتدقيق
CREATE TABLE audit_logs (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. السلف والقروض
--   data: { id, empId, type ('advance'|'loan'), amount, installment,
--           months, remainingAmount, reason, requestDate, startMonth,
--           status ('pending'|'approved'|'rejected'|'paid'),
--           approvedDate?, payments: [{amount, date}] }
CREATE TABLE loans (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. الخصومات
--   data: { id, empId, type ('loan'|'advance'|'fine'|'admin'|'custody'|
--           'insurance'|'tax'|'other'), amount, period (YYYY-MM),
--           reason, status ('pending'|'applied'), date, appliedAt? }
CREATE TABLE deductions (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. المصروفات
--   data: { id, empId, category ('travel'|'meals'|'accommodation'|
--           'transport'|'communication'|'supplies'|'other'),
--           amount, date, description, attachmentNote,
--           status ('pending'|'approved'|'rejected'),
--           approvedBy?, approvedAt?, createdAt }
CREATE TABLE expenses (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. النسخ الاحتياطية
CREATE TABLE system_backups (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ════════════════════════════════════════════════════
--  STEP 4: الفهارس (على JSONB — سريعة وآمنة)
-- ════════════════════════════════════════════════════

-- employees
CREATE INDEX idx_emp_name     ON employees  ((data->>'name'));
CREATE INDEX idx_emp_no       ON employees  ((data->>'no'));
CREATE INDEX idx_emp_dept     ON employees  ((data->>'dept'));
CREATE INDEX idx_emp_status   ON employees  ((data->>'status'));
CREATE INDEX idx_emp_email    ON employees  ((data->>'email'));
CREATE INDEX idx_emp_name_trgm ON employees USING gin ((data->>'name') gin_trgm_ops);

-- departments
CREATE INDEX idx_dept_name    ON departments ((data->>'name'));

-- attendance
CREATE INDEX idx_att_emp      ON attendance ((data->>'empId'));
CREATE INDEX idx_att_date     ON attendance ((data->>'date'));
CREATE INDEX idx_att_status   ON attendance ((data->>'status'));
CREATE INDEX idx_att_emp_dt   ON attendance ((data->>'empId'), (data->>'date'));
CREATE INDEX idx_att_method   ON attendance ((data->>'method'));

-- leaves
CREATE INDEX idx_lv_emp       ON leaves ((data->>'empId'));
CREATE INDEX idx_lv_status    ON leaves ((data->>'status'));
CREATE INDEX idx_lv_from      ON leaves ((data->>'from'));
CREATE INDEX idx_lv_type      ON leaves ((data->>'type'));

-- requests
CREATE INDEX idx_req_emp      ON requests ((data->>'empId'));
CREATE INDEX idx_req_status   ON requests ((data->>'status'));
CREATE INDEX idx_req_type     ON requests ((data->>'type'));

-- payroll
CREATE INDEX idx_pay_emp      ON payroll ((data->>'empId'));
CREATE INDEX idx_pay_period   ON payroll ((data->>'period'));
CREATE INDEX idx_pay_emp_per  ON payroll ((data->>'empId'), (data->>'period'));
CREATE INDEX idx_pay_status   ON payroll ((data->>'status'));

-- notifications
CREATE INDEX idx_notif_emp    ON notifications ((data->>'empId'));
CREATE INDEX idx_notif_read   ON notifications ((data->>'read'));
CREATE INDEX idx_notif_time   ON notifications (created_at DESC);

-- audit_logs
CREATE INDEX idx_audit_user   ON audit_logs ((data->>'userId'));
CREATE INDEX idx_audit_mod    ON audit_logs ((data->>'module'));
CREATE INDEX idx_audit_time   ON audit_logs (created_at DESC);

-- shifts
CREATE INDEX idx_shift_type   ON shifts ((data->>'type'));
CREATE INDEX idx_shift_emp    ON shifts ((data->>'empId'));

-- loans
CREATE INDEX idx_loans_emp    ON loans ((data->>'empId'));
CREATE INDEX idx_loans_status ON loans ((data->>'status'));
CREATE INDEX idx_loans_type   ON loans ((data->>'type'));
CREATE INDEX idx_loans_start  ON loans ((data->>'startMonth'));

-- deductions
CREATE INDEX idx_ded_emp      ON deductions ((data->>'empId'));
CREATE INDEX idx_ded_type     ON deductions ((data->>'type'));
CREATE INDEX idx_ded_status   ON deductions ((data->>'status'));
CREATE INDEX idx_ded_period   ON deductions ((data->>'period'));

-- expenses
CREATE INDEX idx_exp_emp      ON expenses ((data->>'empId'));
CREATE INDEX idx_exp_status   ON expenses ((data->>'status'));
CREATE INDEX idx_exp_category ON expenses ((data->>'category'));
CREATE INDEX idx_exp_date     ON expenses ((data->>'date'));

-- system_backups
CREATE INDEX idx_backups_created ON system_backups (created_at DESC);


-- ════════════════════════════════════════════════════
--  STEP 5: Row Level Security (RLS)
-- ════════════════════════════════════════════════════

ALTER TABLE company        ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE deductions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- وصول كامل لجميع المستخدمين المصادق عليهم (anon + authenticated)
CREATE POLICY allow_all ON company        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON departments    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON employees      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON roles          FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON shifts         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON locations      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON attendance     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON leaves         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON requests       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON payroll        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON notifications  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON audit_logs     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON loans          FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON deductions     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON expenses       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- النسخ الاحتياطية: للمصادق عليهم فقط (بدون anon)
CREATE POLICY allow_authenticated ON system_backups FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════
--  STEP 6: Trigger — updated_at تلقائي
-- ════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_upd      BEFORE UPDATE ON company      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_depts_upd        BEFORE UPDATE ON departments  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_upd    BEFORE UPDATE ON employees    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roles_upd        BEFORE UPDATE ON roles        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shifts_upd       BEFORE UPDATE ON shifts       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_locations_upd    BEFORE UPDATE ON locations    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_upd   BEFORE UPDATE ON attendance   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leaves_upd       BEFORE UPDATE ON leaves       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_requests_upd     BEFORE UPDATE ON requests     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payroll_upd      BEFORE UPDATE ON payroll      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_loans_upd        BEFORE UPDATE ON loans        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_deductions_upd   BEFORE UPDATE ON deductions   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_expenses_upd     BEFORE UPDATE ON expenses     FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════
--  STEP 7: Views للتقارير والاستعلامات
-- ════════════════════════════════════════════════════

-- 7.1 الحضور مع اسم الموظف والقسم
CREATE VIEW v_attendance_detail AS
SELECT
  a.id,
  a.data->>'empId'              AS emp_id,
  e.data->>'name'               AS emp_name,
  e.data->>'no'                 AS emp_no,
  e.data->>'dept'               AS dept_id,
  d.data->>'name'               AS dept_name,
  a.data->>'date'               AS att_date,
  a.data->>'status'             AS status,
  a.data->>'checkIn'            AS check_in,
  a.data->>'checkOut'           AS check_out,
  a.data->>'method'             AS method,
  (a.data->>'lateMinutes')::int AS late_minutes,
  (a.data->>'overtime')::int    AS overtime_minutes,
  a.created_at
FROM attendance a
LEFT JOIN employees   e ON e.id = a.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- 7.2 ملخص الحضور الشهري لكل موظف
CREATE VIEW v_monthly_summary AS
SELECT
  a.data->>'empId'                                               AS emp_id,
  left(a.data->>'date', 7)                                      AS period,
  count(*)                                                      AS total_days,
  count(*) FILTER (WHERE a.data->>'status' = 'present')        AS present_days,
  count(*) FILTER (WHERE a.data->>'status' = 'late')           AS late_days,
  count(*) FILTER (WHERE a.data->>'status' = 'absent')         AS absent_days,
  coalesce(sum((a.data->>'lateMinutes')::int), 0)              AS total_late_min,
  coalesce(sum((a.data->>'overtime')::int), 0)                 AS total_overtime_min
FROM attendance a
WHERE a.data->>'date' IS NOT NULL
GROUP BY a.data->>'empId', left(a.data->>'date', 7);


-- 7.3 الإجازات مع اسم الموظف والقسم
CREATE VIEW v_leaves_detail AS
SELECT
  l.id,
  l.data->>'empId'       AS emp_id,
  e.data->>'name'        AS emp_name,
  d.data->>'name'        AS dept_name,
  l.data->>'type'        AS leave_type,
  l.data->>'from'        AS from_date,
  l.data->>'to'          AS to_date,
  l.data->>'status'      AS status,
  (l.data->>'days')::int AS days_count,
  l.data->>'reason'      AS reason,
  l.created_at
FROM leaves l
LEFT JOIN employees   e ON e.id = l.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- 7.4 كشوف الرواتب مع اسم الموظف والقسم
CREATE VIEW v_payroll_detail AS
SELECT
  p.id,
  p.data->>'empId'                        AS emp_id,
  e.data->>'name'                         AS emp_name,
  d.data->>'name'                         AS dept_name,
  p.data->>'period'                       AS period,
  (p.data->>'base')::numeric              AS base,
  coalesce((p.data->>'housing')::numeric,   0) AS housing,
  coalesce((p.data->>'transport')::numeric, 0) AS transport,
  coalesce((p.data->>'food')::numeric,      0) AS food,
  coalesce((p.data->>'phone')::numeric,     0) AS phone,
  coalesce((p.data->>'special')::numeric,   0) AS special,
  coalesce((p.data->>'overtime')::numeric,  0) AS overtime,
  coalesce((p.data->>'absentDeduction')::numeric, 0) AS absent_deduction,
  coalesce((p.data->>'lateDeduction')::numeric,   0) AS late_deduction,
  (p.data->>'total')::numeric             AS net_salary,
  p.data->>'status'                       AS status,
  p.created_at
FROM payroll p
LEFT JOIN employees   e ON e.id = p.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- 7.5 السلف والقروض مع اسم الموظف
CREATE VIEW v_loans_detail AS
SELECT
  l.id,
  l.data->>'empId'                           AS emp_id,
  e.data->>'name'                            AS emp_name,
  d.data->>'name'                            AS dept_name,
  l.data->>'type'                            AS loan_type,
  (l.data->>'amount')::numeric               AS amount,
  coalesce((l.data->>'remainingAmount')::numeric, 0) AS remaining,
  coalesce((l.data->>'installment')::numeric, 0)     AS installment,
  coalesce((l.data->>'months')::int, 0)              AS months,
  l.data->>'status'                          AS status,
  l.data->>'startMonth'                      AS start_month,
  l.data->>'requestDate'                     AS request_date,
  l.created_at
FROM loans l
LEFT JOIN employees   e ON e.id = l.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- 7.6 الخصومات مع اسم الموظف
CREATE VIEW v_deductions_detail AS
SELECT
  d.id,
  d.data->>'empId'              AS emp_id,
  e.data->>'name'               AS emp_name,
  dp.data->>'name'              AS dept_name,
  d.data->>'type'               AS ded_type,
  (d.data->>'amount')::numeric  AS amount,
  d.data->>'period'             AS period,
  d.data->>'status'             AS status,
  d.data->>'reason'             AS reason,
  d.created_at
FROM deductions d
LEFT JOIN employees   e  ON e.id  = d.data->>'empId'
LEFT JOIN departments dp ON dp.id = e.data->>'dept';


-- 7.7 المصروفات مع اسم الموظف والقسم
CREATE VIEW v_expenses_detail AS
SELECT
  ex.id,
  ex.data->>'empId'              AS emp_id,
  e.data->>'name'                AS emp_name,
  d.data->>'name'                AS dept_name,
  ex.data->>'category'           AS category,
  (ex.data->>'amount')::numeric  AS amount,
  ex.data->>'date'               AS expense_date,
  ex.data->>'description'        AS description,
  ex.data->>'attachmentNote'     AS receipt_note,
  ex.data->>'status'             AS status,
  ex.data->>'approvedBy'         AS approved_by,
  ex.data->>'approvedAt'         AS approved_at,
  ex.created_at
FROM expenses ex
LEFT JOIN employees   e ON e.id = ex.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- 7.8 إحصائيات الموظفين حسب القسم
CREATE VIEW v_dept_stats AS
SELECT
  d.id                                                               AS dept_id,
  d.data->>'name'                                                    AS dept_name,
  count(e.id)                                                        AS total,
  count(e.id) FILTER (WHERE e.data->>'status' = 'active')           AS active,
  count(e.id) FILTER (WHERE e.data->>'status' = 'on_leave')         AS on_leave,
  count(e.id) FILTER (WHERE e.data->>'status' = 'inactive')         AS inactive,
  d.data->>'manager'                                                 AS manager
FROM departments d
LEFT JOIN employees e ON e.data->>'dept' = d.id
GROUP BY d.id, d.data->>'name', d.data->>'manager';


-- ════════════════════════════════════════════════════
--  STEP 8: دوال التقارير
-- ════════════════════════════════════════════════════

-- 8.1 تقرير الحضور لفترة زمنية
--   مثال: SELECT * FROM get_attendance_stats('2025-06-01','2025-06-30');
CREATE OR REPLACE FUNCTION get_attendance_stats(p_from TEXT, p_to TEXT)
RETURNS TABLE (
  emp_id        TEXT,
  emp_name      TEXT,
  dept_name     TEXT,
  present_days  BIGINT,
  late_days     BIGINT,
  absent_days   BIGINT,
  late_minutes  NUMERIC,
  overtime_min  NUMERIC
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
  GROUP BY a.data->>'empId', e.data->>'name', d.data->>'name'
  ORDER BY e.data->>'name';
$$;


-- 8.2 تقرير الرواتب لشهر محدد
--   مثال: SELECT * FROM get_payroll_report('2025-06');
CREATE OR REPLACE FUNCTION get_payroll_report(p_period TEXT)
RETURNS TABLE (
  emp_name    TEXT,
  dept_name   TEXT,
  base        NUMERIC,
  allowances  NUMERIC,
  overtime    NUMERIC,
  deductions  NUMERIC,
  net         NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    e.data->>'name',
    d.data->>'name',
    (p.data->>'base')::numeric,
    coalesce((p.data->>'housing')::numeric,   0)
      + coalesce((p.data->>'transport')::numeric, 0)
      + coalesce((p.data->>'food')::numeric,      0)
      + coalesce((p.data->>'phone')::numeric,     0)
      + coalesce((p.data->>'special')::numeric,   0),
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


-- 8.3 ملخص المصروفات لفترة زمنية
--   مثال: SELECT * FROM get_expenses_summary('2025-06-01','2025-06-30');
CREATE OR REPLACE FUNCTION get_expenses_summary(p_from TEXT, p_to TEXT)
RETURNS TABLE (
  emp_name    TEXT,
  dept_name   TEXT,
  category    TEXT,
  total       NUMERIC,
  count       BIGINT,
  status      TEXT
) LANGUAGE sql STABLE AS $$
  SELECT
    e.data->>'name',
    d.data->>'name',
    ex.data->>'category',
    sum((ex.data->>'amount')::numeric),
    count(*),
    ex.data->>'status'
  FROM expenses ex
  LEFT JOIN employees   e ON e.id = ex.data->>'empId'
  LEFT JOIN departments d ON d.id = e.data->>'dept'
  WHERE ex.data->>'date' >= p_from
    AND ex.data->>'date' <= p_to
  GROUP BY e.data->>'name', d.data->>'name', ex.data->>'category', ex.data->>'status'
  ORDER BY e.data->>'name';
$$;


-- ════════════════════════════════════════════════════
--  STEP 9: Realtime
-- ════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE loans;
ALTER PUBLICATION supabase_realtime ADD TABLE deductions;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;


-- ════════════════════════════════════════════════════
--  STEP 10: بيانات أولية للشركة
-- ════════════════════════════════════════════════════

INSERT INTO company (id, data) VALUES ('main', '{
  "name":           "",
  "nameEn":         "",
  "logo":           "",
  "favicon":        "",
  "address":        "",
  "phone":          "",
  "email":          "",
  "website":        "",
  "timezone":       "Asia/Riyadh",
  "currency":       "SAR",
  "workStart":      "08:00",
  "workEnd":        "17:00",
  "lateThreshold":  15,
  "breakEnabled":   false,
  "overtimeEnabled":true,
  "workDays":       ["sat","sun","mon","tue","wed","thu"],
  "weekend":        ["fri"],
  "branches":       [],
  "workPeriods": [
    {"id":"wp1","label":"فترة العمل","start":"08:00","end":"17:00"}
  ],
  "holidays": [
    {"id":"h1","name":"اليوم الوطني","date":"2025-09-23","days":2},
    {"id":"h2","name":"عيد الفطر",   "date":"2025-03-30","days":4},
    {"id":"h3","name":"عيد الأضحى", "date":"2025-06-05","days":4}
  ],
  "leaveTypes": [
    {"key":"annual",    "l":"إجازة سنوية",     "days":21, "paid":true,  "carry":true,  "color":"#6366f1"},
    {"key":"sick",      "l":"إجازة مرضية",     "days":10, "paid":true,  "carry":false, "color":"#10b981"},
    {"key":"emergency", "l":"إجازة طارئة",     "days":3,  "paid":true,  "carry":false, "color":"#f59e0b"},
    {"key":"maternity", "l":"إجازة أمومة",     "days":70, "paid":true,  "carry":false, "color":"#ec4899"},
    {"key":"paternity", "l":"إجازة أبوة",      "days":3,  "paid":true,  "carry":false, "color":"#06b6d4"},
    {"key":"unpaid",    "l":"إجازة بدون راتب", "days":0,  "paid":false, "carry":false, "color":"#94a3b8"}
  ],
  "payrollComponents": {
    "housing":false,"transport":false,"phone":false,
    "special":false,"annualBonus":false,"performanceBonus":false
  },
  "portalSettings": {
    "enabled":true,"checkin":true,"leaves":true,
    "payslip":true,"profile":true,"msg":false,"forceChange":true
  },
  "securitySettings": {
    "twoFactor":false,"autoLogout":true,"idleTimeout":"30",
    "singleSession":false,"logLogins":true,
    "passMinLen":8,"passRenewalDays":90,"passMaxAttempts":5,
    "passNums":true,"passSymbols":false,"passMixed":true,"passHistory":true,
    "ipRestrict":false,"allowedIPs":""
  },
  "backupSettings": {
    "auto":true,"freq":"daily","time":"02:00","retention":30,"loc":"local"
  },
  "notifChannels": {
    "Email":true,"WhatsApp":true,"SMS":false,
    "Browser":true,"In-App":true,"Auto Reports":false
  }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════
--  ✓ انتهى بنجاح
--
--  الملخص:
--    16 جدول     : company, departments, employees, roles, shifts,
--                  locations, attendance, leaves, requests, payroll,
--                  notifications, audit_logs, loans, deductions,
--                  expenses, system_backups
--    39 فهرس
--    8  views    : v_attendance_detail, v_monthly_summary,
--                  v_leaves_detail, v_payroll_detail,
--                  v_loans_detail, v_deductions_detail,
--                  v_expenses_detail, v_dept_stats
--    3  functions: get_attendance_stats, get_payroll_report,
--                  get_expenses_summary
--    13 triggers : updated_at تلقائي على كل جدول (ما عدا notifications,
--                  audit_logs, system_backups)
--    RLS مفعّل   : على جميع الجداول
--    Realtime    : attendance, notifications, leaves, requests,
--                  loans, deductions, expenses
-- ════════════════════════════════════════════════════

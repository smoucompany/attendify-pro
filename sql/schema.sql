-- ================================================================
--  ATTENDIFY PRO — SUPABASE COMPLETE SCHEMA v2.0
--  النسخة الكاملة والشاملة لجميع جداول النظام
--
--  كيفية الاستخدام:
--  1. افتح Supabase Dashboard → SQL Editor → New Query
--  2. انسخ هذا الملف كاملاً والصقه
--  3. اضغط RUN
--
--  ملاحظة: هذا الملف يحذف جميع الجداول القديمة ويعيد إنشاءها
-- ================================================================


-- ════════════════════════════════════════════════════════════════
--  STEP 1: حذف جميع الجداول القديمة (Cascade)
-- ════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS audit_logs     CASCADE;
DROP TABLE IF EXISTS notifications  CASCADE;
DROP TABLE IF EXISTS payroll        CASCADE;
DROP TABLE IF EXISTS requests       CASCADE;
DROP TABLE IF EXISTS leaves         CASCADE;
DROP TABLE IF EXISTS attendance     CASCADE;
DROP TABLE IF EXISTS shifts         CASCADE;
DROP TABLE IF EXISTS locations      CASCADE;
DROP TABLE IF EXISTS employees      CASCADE;
DROP TABLE IF EXISTS departments    CASCADE;
DROP TABLE IF EXISTS roles          CASCADE;
DROP TABLE IF EXISTS company        CASCADE;


-- ════════════════════════════════════════════════════════════════
--  STEP 2: Extensions
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- للبحث النصي السريع


-- ════════════════════════════════════════════════════════════════
--  STEP 3: إنشاء الجداول
-- ════════════════════════════════════════════════════════════════


-- ── 1. COMPANY ───────────────────────────────────────────────
--  صف واحد فقط يحمل إعدادات الشركة الكاملة
--  يشمل: الاسم، الشعار (base64)، ساعات العمل، الإجازات الرسمية،
--         أنواع الإجازات، أيام العمل، الفروع، قنوات الإشعارات
CREATE TABLE company (
  id            TEXT        PRIMARY KEY DEFAULT 'main',
  data          JSONB       NOT NULL    DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE company IS 'إعدادات الشركة — صف واحد دائماً id=main';


-- ── 2. DEPARTMENTS ───────────────────────────────────────────
--  الأقسام والإدارات
CREATE TABLE departments (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  -- حقول مُستخرجة للأداء
  name          TEXT        GENERATED ALWAYS AS (data->>'name')          STORED,
  manager_id    TEXT        GENERATED ALWAYS AS (data->>'manager')       STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE departments IS 'الأقسام والإدارات';


-- ── 3. EMPLOYEES ─────────────────────────────────────────────
--  بيانات الموظفين الكاملة
--  data يحمل: name, nameEn, no, email, phone, position, dept,
--             salary, housing, transport, food, hireDate, status,
--             avatar, avatarColor, shift, password, ...
CREATE TABLE employees (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  -- حقول مُستخرجة للبحث والفلترة السريعة
  name          TEXT        GENERATED ALWAYS AS (data->>'name')          STORED,
  emp_no        TEXT        GENERATED ALWAYS AS (data->>'no')            STORED,
  dept_id       TEXT        GENERATED ALWAYS AS (data->>'dept')          STORED,
  status        TEXT        GENERATED ALWAYS AS (data->>'status')        STORED,
  email         TEXT        GENERATED ALWAYS AS (data->>'email')         STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE employees IS 'بيانات الموظفين الكاملة';


-- ── 4. ROLES ─────────────────────────────────────────────────
--  الأدوار والصلاحيات
--  data يحمل: name, nameEn, color, users[], permissions{}
CREATE TABLE roles (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  role_name     TEXT        GENERATED ALWAYS AS (data->>'name')          STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'الأدوار وصلاحيات الوصول للوحدات';


-- ── 5. SHIFTS ────────────────────────────────────────────────
--  تعريفات الورديات وتعيينات الموظفين
--  data يحمل (للوردية): name, start, end, days[], color, type
--  data يحمل (للتعيين): type='assignment', empId, shiftId, from, to
CREATE TABLE shifts (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  shift_type    TEXT        GENERATED ALWAYS AS (data->>'type')          STORED,
  emp_id        TEXT        GENERATED ALWAYS AS (data->>'empId')         STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE shifts IS 'تعريفات الورديات وتعيينات الموظفين';


-- ── 6. LOCATIONS ─────────────────────────────────────────────
--  مواقع العمل الجغرافية (Geofencing)
--  data يحمل: name, lat, lng, radius, branch, active
CREATE TABLE locations (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  location_name TEXT        GENERATED ALWAYS AS (data->>'name')          STORED,
  active        BOOLEAN     GENERATED ALWAYS AS ((data->>'active')::boolean) STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE locations IS 'مواقع العمل الجغرافية وإعدادات Geofencing';


-- ── 7. ATTENDANCE ────────────────────────────────────────────
--  سجلات الحضور والانصراف اليومية
--  data يحمل: empId, date, checkIn, checkOut, status, lateMinutes,
--             overtime, lat, lng, method, notes
CREATE TABLE attendance (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  -- حقول مُستخرجة للفلترة السريعة (الأكثر استخداماً)
  emp_id        TEXT        GENERATED ALWAYS AS (data->>'empId')         STORED,
  att_date      DATE        GENERATED ALWAYS AS ((data->>'date')::date)  STORED,
  status        TEXT        GENERATED ALWAYS AS (data->>'status')        STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE attendance IS 'سجلات الحضور والانصراف اليومية';


-- ── 8. LEAVES ────────────────────────────────────────────────
--  طلبات الإجازات
--  data يحمل: empId, type, from, to, days, reason, status,
--             approvedBy, approvedAt, attachments
CREATE TABLE leaves (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  emp_id        TEXT        GENERATED ALWAYS AS (data->>'empId')         STORED,
  leave_type    TEXT        GENERATED ALWAYS AS (data->>'type')          STORED,
  status        TEXT        GENERATED ALWAYS AS (data->>'status')        STORED,
  from_date     DATE        GENERATED ALWAYS AS ((data->>'from')::date)  STORED,
  to_date       DATE        GENERATED ALWAYS AS ((data->>'to')::date)    STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE leaves IS 'طلبات الإجازات وحالة الموافقة';


-- ── 9. REQUESTS ──────────────────────────────────────────────
--  طلبات الموظفين العامة (تعديل حضور، سلف، شهادات، ...)
--  data يحمل: empId, type, subject, details, status, priority,
--             approvedBy, approvedAt, attachment
CREATE TABLE requests (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  emp_id        TEXT        GENERATED ALWAYS AS (data->>'empId')         STORED,
  req_type      TEXT        GENERATED ALWAYS AS (data->>'type')          STORED,
  status        TEXT        GENERATED ALWAYS AS (data->>'status')        STORED,
  priority      TEXT        GENERATED ALWAYS AS (data->>'priority')      STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE requests IS 'طلبات الموظفين العامة';


-- ── 10. PAYROLL ──────────────────────────────────────────────
--  كشوف الرواتب الشهرية
--  data يحمل: empId, period (YYYY-MM), base, housing, transport,
--             food, overtime, absentDeduction, lateDeduction,
--             total, absentDays
CREATE TABLE payroll (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  emp_id        TEXT        GENERATED ALWAYS AS (data->>'empId')         STORED,
  period        TEXT        GENERATED ALWAYS AS (data->>'period')        STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE payroll IS 'كشوف الرواتب الشهرية محسوبة من بيانات الحضور';


-- ── 11. NOTIFICATIONS ────────────────────────────────────────
--  الإشعارات داخل النظام
--  data يحمل: title, desc, type, icon, iconBg, time, read, empId
CREATE TABLE notifications (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  emp_id        TEXT        GENERATED ALWAYS AS (data->>'empId')         STORED,
  notif_type    TEXT        GENERATED ALWAYS AS (data->>'type')          STORED,
  is_read       BOOLEAN     GENERATED ALWAYS AS ((data->>'read')::boolean) STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'الإشعارات الداخلية للنظام';


-- ── 12. AUDIT LOGS ───────────────────────────────────────────
--  سجل المراجعة لجميع العمليات
--  data يحمل: userId, action, module, details, ip, time
CREATE TABLE audit_logs (
  id            TEXT        PRIMARY KEY,
  data          JSONB       NOT NULL    DEFAULT '{}',
  user_id       TEXT        GENERATED ALWAYS AS (data->>'userId')        STORED,
  module        TEXT        GENERATED ALWAYS AS (data->>'module')        STORED,
  action        TEXT        GENERATED ALWAYS AS (data->>'action')        STORED,
  log_time      TIMESTAMPTZ GENERATED ALWAYS AS ((data->>'time')::timestamptz) STORED,
  created_at    TIMESTAMPTZ NOT NULL    DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'سجل مراجعة شامل لجميع عمليات النظام';


-- ════════════════════════════════════════════════════════════════
--  STEP 4: الفهارس (Indexes) لتسريع الاستعلامات
-- ════════════════════════════════════════════════════════════════

-- Employees
CREATE INDEX idx_emp_status    ON employees (status);
CREATE INDEX idx_emp_dept      ON employees (dept_id);
CREATE INDEX idx_emp_no        ON employees (emp_no);
CREATE INDEX idx_emp_email     ON employees (email);
CREATE INDEX idx_emp_name_trgm ON employees USING gin (name gin_trgm_ops);

-- Attendance
CREATE INDEX idx_att_emp       ON attendance (emp_id);
CREATE INDEX idx_att_date      ON attendance (att_date);
CREATE INDEX idx_att_status    ON attendance (status);
CREATE INDEX idx_att_emp_date  ON attendance (emp_id, att_date);

-- Leaves
CREATE INDEX idx_leave_emp     ON leaves (emp_id);
CREATE INDEX idx_leave_status  ON leaves (status);
CREATE INDEX idx_leave_dates   ON leaves (from_date, to_date);

-- Requests
CREATE INDEX idx_req_emp       ON requests (emp_id);
CREATE INDEX idx_req_status    ON requests (status);

-- Payroll
CREATE INDEX idx_pay_emp       ON payroll (emp_id);
CREATE INDEX idx_pay_period    ON payroll (period);
CREATE INDEX idx_pay_emp_per   ON payroll (emp_id, period);

-- Notifications
CREATE INDEX idx_notif_emp     ON notifications (emp_id);
CREATE INDEX idx_notif_read    ON notifications (is_read);

-- Audit Logs
CREATE INDEX idx_audit_user    ON audit_logs (user_id);
CREATE INDEX idx_audit_module  ON audit_logs (module);
CREATE INDEX idx_audit_time    ON audit_logs (log_time DESC);

-- Shifts
CREATE INDEX idx_shift_type    ON shifts (shift_type);
CREATE INDEX idx_shift_emp     ON shifts (emp_id);


-- ════════════════════════════════════════════════════════════════
--  STEP 5: Row Level Security (RLS)
-- ════════════════════════════════════════════════════════════════

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

-- سياسات وصول مفتوحة (للأنظمة الداخلية)
-- يمكنك لاحقاً تضييقها حسب auth.uid()
CREATE POLICY "allow_all" ON company       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON departments   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON employees     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON roles         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON shifts        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON locations     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON attendance    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON leaves        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON requests      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON payroll       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON audit_logs    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════
--  STEP 6: Updated_at Trigger (تحديث تلقائي لوقت التعديل)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_company_updated       BEFORE UPDATE ON company       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_departments_updated   BEFORE UPDATE ON departments   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employees_updated     BEFORE UPDATE ON employees     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roles_updated         BEFORE UPDATE ON roles         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shifts_updated        BEFORE UPDATE ON shifts        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_locations_updated     BEFORE UPDATE ON locations     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_updated    BEFORE UPDATE ON attendance    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leaves_updated        BEFORE UPDATE ON leaves        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_requests_updated      BEFORE UPDATE ON requests      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payroll_updated       BEFORE UPDATE ON payroll       FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════════════════
--  STEP 7: Views مفيدة للتقارير
-- ════════════════════════════════════════════════════════════════

-- عرض: الحضور مع اسم الموظف
CREATE OR REPLACE VIEW v_attendance_detail AS
SELECT
  a.id,
  a.emp_id,
  e.name                          AS emp_name,
  e.dept_id,
  d.name                          AS dept_name,
  a.att_date,
  a.status,
  a.data->>'checkIn'              AS check_in,
  a.data->>'checkOut'             AS check_out,
  (a.data->>'lateMinutes')::int   AS late_minutes,
  (a.data->>'overtime')::int      AS overtime_minutes,
  a.created_at
FROM attendance a
LEFT JOIN employees   e ON e.id = a.emp_id
LEFT JOIN departments d ON d.id = e.dept_id;

COMMENT ON VIEW v_attendance_detail IS 'عرض الحضور مع أسماء الموظفين والأقسام';


-- عرض: ملخص الحضور الشهري لكل موظف
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
  emp_id,
  TO_CHAR(att_date, 'YYYY-MM')                       AS period,
  COUNT(*)                                            AS total_days,
  COUNT(*) FILTER (WHERE status = 'present')          AS present_days,
  COUNT(*) FILTER (WHERE status = 'late')             AS late_days,
  COUNT(*) FILTER (WHERE status = 'absent')           AS absent_days,
  SUM((data->>'lateMinutes')::int)                    AS total_late_minutes,
  SUM((data->>'overtime')::int)                       AS total_overtime_minutes
FROM attendance
GROUP BY emp_id, TO_CHAR(att_date, 'YYYY-MM');

COMMENT ON VIEW v_monthly_summary IS 'ملخص الحضور الشهري لكل موظف';


-- عرض: طلبات الإجازات مع اسم الموظف
CREATE OR REPLACE VIEW v_leaves_detail AS
SELECT
  l.id,
  l.emp_id,
  e.name          AS emp_name,
  e.dept_id,
  d.name          AS dept_name,
  l.leave_type,
  l.from_date,
  l.to_date,
  l.status,
  (l.data->>'days')::int   AS days_count,
  l.data->>'reason'        AS reason,
  l.created_at
FROM leaves l
LEFT JOIN employees   e ON e.id = l.emp_id
LEFT JOIN departments d ON d.id = e.dept_id;

COMMENT ON VIEW v_leaves_detail IS 'عرض الإجازات مع أسماء الموظفين والأقسام';


-- عرض: كشوف الرواتب مع اسم الموظف
CREATE OR REPLACE VIEW v_payroll_detail AS
SELECT
  p.id,
  p.emp_id,
  e.name                               AS emp_name,
  e.dept_id,
  d.name                               AS dept_name,
  p.period,
  (p.data->>'base')::numeric           AS base,
  (p.data->>'housing')::numeric        AS housing,
  (p.data->>'transport')::numeric      AS transport,
  (p.data->>'food')::numeric           AS food,
  (p.data->>'overtime')::numeric       AS overtime,
  (p.data->>'absentDeduction')::numeric AS absent_deduction,
  (p.data->>'lateDeduction')::numeric  AS late_deduction,
  (p.data->>'total')::numeric          AS net_salary,
  p.created_at
FROM payroll p
LEFT JOIN employees   e ON e.id = p.emp_id
LEFT JOIN departments d ON d.id = e.dept_id;

COMMENT ON VIEW v_payroll_detail IS 'عرض كشوف الرواتب مع أسماء الموظفين';


-- عرض: إحصائيات الموظفين حسب القسم
CREATE OR REPLACE VIEW v_dept_stats AS
SELECT
  d.id            AS dept_id,
  d.name          AS dept_name,
  COUNT(e.id)                                        AS total_employees,
  COUNT(e.id) FILTER (WHERE e.status = 'active')    AS active_employees,
  COUNT(e.id) FILTER (WHERE e.status = 'on_leave')  AS on_leave,
  COUNT(e.id) FILTER (WHERE e.status = 'inactive')  AS inactive_employees
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.id
GROUP BY d.id, d.name;

COMMENT ON VIEW v_dept_stats IS 'إحصائيات الموظفين مجمّعة حسب القسم';


-- ════════════════════════════════════════════════════════════════
--  STEP 8: Realtime (تفعيل الوقت الفعلي)
-- ════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE requests;


-- ════════════════════════════════════════════════════════════════
--  STEP 9: بيانات أولية (Seed Data)
--  يمكنك حذف هذا القسم إذا لم تحتج بيانات تجريبية
-- ════════════════════════════════════════════════════════════════

INSERT INTO company (id, data) VALUES (
  'main',
  '{
    "name": "",
    "nameEn": "",
    "logo": "",
    "address": "",
    "phone": "",
    "email": "",
    "website": "",
    "timezone": "Asia/Riyadh",
    "currency": "SAR",
    "workStart": "08:00",
    "workEnd": "17:00",
    "lateThreshold": 15,
    "breakEnabled": false,
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
    "workPeriods": [
      {"id":"wp1","label":"فترة العمل","start":"08:00","end":"17:00"}
    ],
    "notifChannels": {
      "Email": true,
      "WhatsApp": true,
      "SMS": false,
      "Browser": true,
      "In-App": true,
      "Auto Reports": false
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════
--  STEP 10: دوال مساعدة للتقارير
-- ════════════════════════════════════════════════════════════════

-- دالة: إحصائيات الحضور لفترة محددة
CREATE OR REPLACE FUNCTION get_attendance_stats(
  p_from DATE,
  p_to   DATE
)
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
    a.emp_id,
    e.name,
    d.name,
    COUNT(*) FILTER (WHERE a.status = 'present'),
    COUNT(*) FILTER (WHERE a.status = 'late'),
    COUNT(*) FILTER (WHERE a.status = 'absent'),
    COALESCE(SUM((a.data->>'lateMinutes')::numeric), 0),
    COALESCE(SUM((a.data->>'overtime')::numeric), 0)
  FROM attendance a
  LEFT JOIN employees   e ON e.id = a.emp_id
  LEFT JOIN departments d ON d.id = e.dept_id
  WHERE a.att_date BETWEEN p_from AND p_to
  GROUP BY a.emp_id, e.name, d.name;
$$;

COMMENT ON FUNCTION get_attendance_stats IS 'إحصائيات الحضور لفترة محددة — مثال: SELECT * FROM get_attendance_stats(''2025-06-01'', ''2025-06-30'')';


-- دالة: تقرير رواتب شهر محدد
CREATE OR REPLACE FUNCTION get_payroll_report(p_period TEXT)
RETURNS TABLE (
  emp_name      TEXT,
  dept_name     TEXT,
  base          NUMERIC,
  allowances    NUMERIC,
  overtime      NUMERIC,
  deductions    NUMERIC,
  net           NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT
    e.name,
    d.name,
    (p.data->>'base')::numeric,
    (p.data->>'housing')::numeric + (p.data->>'transport')::numeric + (p.data->>'food')::numeric,
    (p.data->>'overtime')::numeric,
    (p.data->>'absentDeduction')::numeric + (p.data->>'lateDeduction')::numeric,
    (p.data->>'total')::numeric
  FROM payroll p
  LEFT JOIN employees   e ON e.id = p.emp_id
  LEFT JOIN departments d ON d.id = e.dept_id
  WHERE p.period = p_period
  ORDER BY e.name;
$$;

COMMENT ON FUNCTION get_payroll_report IS 'تقرير رواتب شهر محدد — مثال: SELECT * FROM get_payroll_report(''2025-06'')';


-- ════════════════════════════════════════════════════════════════
--  انتهى — النظام جاهز للاستخدام
--
--  الجداول: 12 جدول
--  الفهارس: 17 فهرس
--  العروض:  5 views
--  الدوال:  2 functions
--  Realtime: attendance, notifications, leaves, requests
-- ════════════════════════════════════════════════════════════════

-- ================================================================
--  ATTENDIFY PRO — Migration v4: جداول الوحدات الجديدة
--
--  الجداول المضافة:
--    • loans         — السلف والقروض
--    • deductions     — الخصومات
--    • system_backups — النسخ الاحتياطية
--
--  الخطوات:
--  1. افتح Supabase → SQL Editor → New Query
--  2. الصق هذا الملف كاملاً
--  3. اضغط RUN
--  (لا تحتاج تشغيل schema.sql من جديد — هذا migration إضافي فقط)
-- ================================================================


-- ════════════════════════════════════════════════════
--  1. جدول السلف والقروض
--
--  بنية data JSONB:
--  {
--    id, empId, type ('advance'|'loan'),
--    amount, installment, months,
--    remainingAmount, reason,
--    requestDate, startMonth,
--    status ('pending'|'approved'|'rejected'|'paid'),
--    approvedDate?, payments: [{amount, date}]
--  }
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS loans (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس السلف
CREATE INDEX IF NOT EXISTS idx_loans_emp    ON loans ((data->>'empId'));
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_loans_type   ON loans ((data->>'type'));
CREATE INDEX IF NOT EXISTS idx_loans_start  ON loans ((data->>'startMonth'));

-- RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON loans;
CREATE POLICY allow_all ON loans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_loans_upd ON loans;
CREATE TRIGGER trg_loans_upd
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════
--  2. جدول الخصومات
--
--  بنية data JSONB:
--  {
--    id, empId,
--    type ('loan'|'advance'|'fine'|'admin'|'custody'|'insurance'|'tax'|'other'),
--    amount, period (YYYY-MM),
--    reason, status ('pending'|'applied'),
--    date, appliedAt?
--  }
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS deductions (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهارس الخصومات
CREATE INDEX IF NOT EXISTS idx_ded_emp    ON deductions ((data->>'empId'));
CREATE INDEX IF NOT EXISTS idx_ded_type   ON deductions ((data->>'type'));
CREATE INDEX IF NOT EXISTS idx_ded_status ON deductions ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_ded_period ON deductions ((data->>'period'));

-- RLS
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON deductions;
CREATE POLICY allow_all ON deductions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_deductions_upd ON deductions;
CREATE TRIGGER trg_deductions_upd
  BEFORE UPDATE ON deductions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ════════════════════════════════════════════════════
--  3. جدول النسخ الاحتياطية
--
--  بنية data JSONB:
--  {
--    label, savedAt, size,
--    ...snapshot كامل للـ DB
--  }
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_backups (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للترتيب بالتاريخ
CREATE INDEX IF NOT EXISTS idx_backups_created ON system_backups (created_at DESC);

-- RLS — النسخ الاحتياطية للأدمن فقط (authenticated)
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all ON system_backups;
CREATE POLICY allow_authenticated ON system_backups
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ════════════════════════════════════════════════════
--  4. Views للتقارير (اختيارية — مفيدة للاستعلامات)
-- ════════════════════════════════════════════════════

-- السلف مع اسم الموظف
DROP VIEW IF EXISTS v_loans_detail CASCADE;
CREATE VIEW v_loans_detail AS
SELECT
  l.id,
  l.data->>'empId'                           AS emp_id,
  e.data->>'name'                            AS emp_name,
  d.data->>'name'                            AS dept_name,
  l.data->>'type'                            AS loan_type,
  (l.data->>'amount')::numeric               AS amount,
  (l.data->>'remainingAmount')::numeric      AS remaining,
  (l.data->>'installment')::numeric          AS installment,
  (l.data->>'months')::int                   AS months,
  l.data->>'status'                          AS status,
  l.data->>'startMonth'                      AS start_month,
  l.data->>'requestDate'                     AS request_date,
  l.created_at
FROM loans l
LEFT JOIN employees   e ON e.id = l.data->>'empId'
LEFT JOIN departments d ON d.id = e.data->>'dept';


-- الخصومات مع اسم الموظف
DROP VIEW IF EXISTS v_deductions_detail CASCADE;
CREATE VIEW v_deductions_detail AS
SELECT
  d.id,
  d.data->>'empId'                  AS emp_id,
  e.data->>'name'                   AS emp_name,
  dp.data->>'name'                  AS dept_name,
  d.data->>'type'                   AS ded_type,
  (d.data->>'amount')::numeric      AS amount,
  d.data->>'period'                 AS period,
  d.data->>'status'                 AS status,
  d.data->>'reason'                 AS reason,
  d.created_at
FROM deductions d
LEFT JOIN employees   e  ON e.id  = d.data->>'empId'
LEFT JOIN departments dp ON dp.id = e.data->>'dept';


-- ════════════════════════════════════════════════════
--  5. Realtime للجداول الجديدة
-- ════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE loans;
ALTER PUBLICATION supabase_realtime ADD TABLE deductions;


-- ════════════════════════════════════════════════════
--  انتهى ✓
--  3 جداول جديدة  |  9 فهارس  |  2 views
--  RLS مفعّل  |  Triggers updated_at  |  Realtime × 2
-- ════════════════════════════════════════════════════

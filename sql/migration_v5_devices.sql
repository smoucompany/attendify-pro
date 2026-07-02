-- ════════════════════════════════════════════════════
--  MIGRATION v5 — تكامل أجهزة البصمة (ZKTeco/Suprema)
--  Devices, DeviceSyncHistory, SyncErrors, DeviceEvents
-- ════════════════════════════════════════════════════

-- 1. الأجهزة
--   data: { name, serialNumber, ipAddress, port, location, branch,
--           status ('online'|'offline'|'unknown'), lastSeen,
--           firmware, model, syncEnabled, lastSyncCursor,
--           lastSyncAt, lastError }
CREATE TABLE devices (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. سجل عمليات المزامنة لكل جهاز
--   data: { deviceId, startedAt, finishedAt, recordsFetched,
--           recordsImported, status ('success'|'partial'|'failed'),
--           responseTimeMs, triggeredBy ('schedule'|'manual'|'command') }
CREATE TABLE device_sync_history (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. أخطاء المزامنة والاتصال
--   data: { deviceId, message, stack, context, severity }
CREATE TABLE sync_errors (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. أحداث/أوامر الأجهزة (قناة التواصل بين اللوحة وخدمة المزامنة المحلية)
--   data: { deviceId, type ('command'|'heartbeat'|'connect'|'disconnect'),
--           command ('sync'|'test'|'restart'), status ('pending'|'done'|'failed'),
--           message, requestedAt, completedAt }
CREATE TABLE device_events (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── الفهارس ────────────────────────────────────────────

CREATE INDEX idx_dev_branch      ON devices ((data->>'branch'));
CREATE INDEX idx_dev_status      ON devices ((data->>'status'));
CREATE INDEX idx_dev_ip          ON devices ((data->>'ipAddress'));

CREATE INDEX idx_dsh_device      ON device_sync_history ((data->>'deviceId'));
CREATE INDEX idx_dsh_time        ON device_sync_history (created_at DESC);
CREATE INDEX idx_dsh_device_time ON device_sync_history ((data->>'deviceId'), created_at DESC);

CREATE INDEX idx_serr_device     ON sync_errors ((data->>'deviceId'));
CREATE INDEX idx_serr_time       ON sync_errors (created_at DESC);

CREATE INDEX idx_devev_device    ON device_events ((data->>'deviceId'));
CREATE INDEX idx_devev_status    ON device_events ((data->>'status'));
CREATE INDEX idx_devev_type      ON device_events ((data->>'type'));
CREATE INDEX idx_devev_time      ON device_events (created_at DESC);


-- ── Row Level Security ─────────────────────────────────

ALTER TABLE devices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_errors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_events       ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all ON devices             FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON device_sync_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON sync_errors         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY allow_all ON device_events       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- ── Trigger — updated_at تلقائي (devices فقط، الباقي append-only logs) ──

CREATE TRIGGER trg_devices_upd BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

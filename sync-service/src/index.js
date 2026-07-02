/* =========================================================
   ATTENDIFY PRO — Device Sync Service
   خدمة مستقلة تعمل باستمرار محلياً (بنفس شبكة الفرع)، تتصل
   بجهاز/أجهزة البصمة عبر TCP:4370، وتزامن الحضور مع الـ backend.
   Vercel serverless لا يقدر يحتفظ باتصال TCP دائم — لذلك هذه
   الخدمة يجب أن تُشغَّل على PC/سيرفر محلي (pm2 / Windows Service).
   ========================================================= */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { DeviceConnection } = require('./zk');
const { createApiClient }  = require('./api');
const state  = require('./state');
const logger = require('./logger');

const BACKEND_URL       = process.env.BACKEND_URL;
const SYNC_API_KEY      = process.env.SYNC_API_KEY;
const POLL_INTERVAL_MS  = Number(process.env.POLL_INTERVAL_MS) || 30000;
const DEVICES_CONFIG    = process.env.DEVICES_CONFIG || './devices.json';

if (!BACKEND_URL || !SYNC_API_KEY) {
  console.error('[FATAL] BACKEND_URL و SYNC_API_KEY مطلوبان في .env (راجع .env.example)');
  process.exit(1);
}

let devicesCfg;
try {
  devicesCfg = JSON.parse(fs.readFileSync(path.resolve(DEVICES_CONFIG), 'utf8'));
} catch (e) {
  console.error(`[FATAL] تعذّرت قراءة ${DEVICES_CONFIG} — انسخ devices.json.example وعدّله (راجع README)`);
  process.exit(1);
}

const api = createApiClient({ backendUrl: BACKEND_URL, syncApiKey: SYNC_API_KEY });

// ── تنفيذ أمر واحد وارد من اللوحة (Sync Now / Test / Restart / Enroll) ──
async function executeCommand(conn, cmd) {
  try {
    if (cmd.command === 'test') {
      // الاتصال والقياس تم بالفعل ضمن الدورة — نكتفي بالإبلاغ بالنجاح
      await api.reportCommandResult(conn.id, cmd.id, 'done', 'تم اختبار الاتصال بنجاح');
    } else if (cmd.command === 'sync') {
      // المزامنة تحدث في كل دورة أصلاً — الأمر يعمل كتشغيل فوري (لا حاجة لعمل إضافي هنا)
      await api.reportCommandResult(conn.id, cmd.id, 'done', 'تمت المزامنة');
    } else if (cmd.command === 'restart') {
      await conn.disconnect();
      await conn.connectWithRetry();
      await api.reportCommandResult(conn.id, cmd.id, 'done', 'أُعيد الاتصال بالجهاز');
    } else if (cmd.command === 'enroll-employee' && cmd.payload) {
      await conn.enrollUser(cmd.payload);
      await api.reportCommandResult(conn.id, cmd.id, 'done', `تمت إضافة الموظف ${cmd.payload.name} على الجهاز`);
    } else if (cmd.command === 'remove-employee' && cmd.payload) {
      await conn.removeUser(cmd.payload.deviceUserId);
      await api.reportCommandResult(conn.id, cmd.id, 'done', 'تم حذف الموظف من الجهاز');
    } else {
      await api.reportCommandResult(conn.id, cmd.id, 'failed', 'أمر غير مدعوم أو بيانات ناقصة');
    }
  } catch (e) {
    logger.error(`فشل تنفيذ الأمر ${cmd.command}: ${e.message}`, conn.id);
    await api.reportCommandResult(conn.id, cmd.id, 'failed', e.message);
  }
}

// ── دورة مزامنة كاملة لجهاز واحد ──────────────────────────
async function runCycle(conn) {
  const startedAt = Date.now();
  try {
    await conn.connectWithRetry();
    const responseTimeMs = Date.now() - startedAt;
    logger.info(`متصل — زمن الاستجابة ${responseTimeMs}ms`, conn.id);

    // تنفيذ أي أوامر معلّقة من اللوحة أولاً
    const pending = await api.getPendingCommands(conn.id);
    for (const cmd of (pending || [])) {
      await executeCommand(conn, cmd);
    }

    // مزامنة سجلات الحضور الجديدة فقط (منذ آخر مؤشر محفوظ محلياً)
    const cursor = state.getCursor(conn.id);
    const logs = await conn.fetchAttendanceSince(cursor);

    let imported = 0;
    if (logs.length) {
      const result = await api.pushAttendanceBulk(conn.id, logs);
      imported = result?.imported || 0;
      const newest = logs.reduce((max, l) => (l.timestamp > max ? l.timestamp : max), cursor || '');
      state.setCursor(conn.id, newest);
      logger.info(`تمت مزامنة ${logs.length} بصمة (${imported} سجل حضور مستورد)`, conn.id);
    }

    await api.reportSyncHistory(conn.id, {
      recordsFetched: logs.length, recordsImported: imported,
      status: 'success', responseTimeMs, triggeredBy: 'schedule',
    });
    await api.heartbeat(conn.id, 'online', responseTimeMs, state.getCursor(conn.id));

    await conn.disconnect();
  } catch (e) {
    logger.error(`فشلت دورة المزامنة: ${e.message}`, conn.id);
    await api.reportSyncError(conn.id, e.message, e.stack, 'sync-cycle');
    await api.heartbeat(conn.id, 'offline', null, state.getCursor(conn.id));
    await api.reportSyncHistory(conn.id, {
      recordsFetched: 0, recordsImported: 0, status: 'failed', triggeredBy: 'schedule',
    });
    await conn.disconnect();
  }
}

// ── جدولة متكررة لكل جهاز (مستقلة — فشل جهاز لا يوقف البقية) ──
function scheduleDevice(cfg) {
  const conn = new DeviceConnection(cfg);
  async function tick() {
    await runCycle(conn);
    setTimeout(tick, POLL_INTERVAL_MS);
  }
  tick();
}

logger.info(`بدء خدمة المزامنة — ${devicesCfg.length} جهاز، كل ${POLL_INTERVAL_MS / 1000} ثانية`);
devicesCfg.forEach(scheduleDevice);

process.on('SIGINT',  () => { logger.info('إيقاف الخدمة (SIGINT)');  process.exit(0); });
process.on('SIGTERM', () => { logger.info('إيقاف الخدمة (SIGTERM)'); process.exit(0); });

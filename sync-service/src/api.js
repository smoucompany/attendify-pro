// عميل HTTP للتواصل مع Attendify Pro backend — يستخدم مفتاح آلة-لآلة
// (SYNC_API_KEY) بدل جلسة مستخدم، لأن هذه خدمة خلفية بلا واجهة.
const axios = require('axios');
const logger = require('./logger');

function createApiClient({ backendUrl, syncApiKey }) {
  const http = axios.create({
    baseURL: backendUrl,
    timeout: 15000,
    headers: { 'x-sync-key': syncApiKey, 'Content-Type': 'application/json' },
  });

  async function _safe(fn, label, deviceId) {
    try {
      return await fn();
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      logger.error(`${label} فشل: ${msg}`, deviceId);
      return null;
    }
  }

  return {
    getPendingCommands: (deviceId) =>
      _safe(() => http.get(`/api/devices/${deviceId}/commands/pending`).then(r => r.data.commands), 'جلب الأوامر', deviceId),

    reportCommandResult: (deviceId, commandId, status, message) =>
      _safe(() => http.post(`/api/devices/${deviceId}/command-result`, { commandId, status, message }), 'رفع نتيجة الأمر', deviceId),

    heartbeat: (deviceId, status, responseTimeMs, lastSyncCursor) =>
      _safe(() => http.post(`/api/devices/${deviceId}/heartbeat`, { status, responseTimeMs, lastSyncCursor }), 'heartbeat', deviceId),

    reportSyncError: (deviceId, message, stack, context) =>
      _safe(() => http.post(`/api/devices/${deviceId}/sync-error`, { message, stack, context }), 'رفع خطأ', deviceId),

    reportSyncHistory: (deviceId, payload) =>
      _safe(() => http.post(`/api/devices/${deviceId}/sync-history`, payload), 'رفع سجل المزامنة', deviceId),

    pushAttendanceBulk: (deviceId, logs) =>
      _safe(() => http.post(`/api/devices/${deviceId}/attendance-bulk`, { logs }).then(r => r.data), 'رفع سجلات الحضور', deviceId),
  };
}

module.exports = { createApiClient };

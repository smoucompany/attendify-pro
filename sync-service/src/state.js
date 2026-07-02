// حفظ آخر مؤشر مزامنة (cursor) لكل جهاز محلياً — لتجنّب إعادة استيراد
// نفس سجلات الحضور عند إعادة تشغيل الخدمة.
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'state.json');

function _readAll() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function getCursor(deviceId) {
  const all = _readAll();
  return all[deviceId]?.lastSyncedAt || null;
}

function setCursor(deviceId, isoTimestamp) {
  const all = _readAll();
  all[deviceId] = { ...(all[deviceId] || {}), lastSyncedAt: isoTimestamp };
  fs.writeFileSync(STATE_FILE, JSON.stringify(all, null, 2));
}

module.exports = { getCursor, setCursor };

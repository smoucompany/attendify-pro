// طبقة اتصال جهاز البصمة (ZKTeco) عبر TCP/IP:4370 — تستخدم مكتبة node-zklib.
// كل الاستدعاءات هنا معزولة عن باقي الخدمة حتى يسهل استبدال المكتبة لاحقاً
// (مثلاً عند دعم أجهزة Suprema بمكتبة مختلفة).
const ZKLib = require('node-zklib');
const logger = require('./logger');

const CONNECT_TIMEOUT_MS = 10000;
const RETRY_DELAYS_MS = [5000, 10000, 30000]; // backoff تصاعدي، يثبت عند آخر قيمة

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class DeviceConnection {
  constructor({ id, ip, port }) {
    this.id = id;
    this.ip = ip;
    this.port = port;
    this.zk = null;
  }

  // يحاول الاتصال مع إعادة محاولة تلقائية بتأخير تصاعدي عند الفشل
  async connectWithRetry(maxAttempts = RETRY_DELAYS_MS.length + 1) {
    let attempt = 0;
    let lastErr = null;
    while (attempt < maxAttempts) {
      try {
        this.zk = new ZKLib(this.ip, this.port, CONNECT_TIMEOUT_MS, 4000);
        await this.zk.createSocket();
        return true;
      } catch (e) {
        lastErr = e;
        const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
        logger.warn(`فشل الاتصال (محاولة ${attempt + 1}) — إعادة المحاولة بعد ${delay / 1000}ث: ${e.message}`, this.id);
        await sleep(delay);
        attempt++;
      }
    }
    throw lastErr || new Error('تعذّر الاتصال بالجهاز');
  }

  async disconnect() {
    try { await this.zk?.disconnect(); } catch (_) {}
    this.zk = null;
  }

  // اختبار اتصال سريع — يقيس زمن الاستجابة فقط
  async testConnection() {
    const started = Date.now();
    await this.connectWithRetry(1);
    const responseTimeMs = Date.now() - started;
    await this.disconnect();
    return responseTimeMs;
  }

  // يجلب كل سجلات البصمة، ثم يستبعد ما هو أقدم من آخر مزامنة محلياً
  // (dedup — لا نعتمد على الجهاز لحذف السجلات القديمة تلقائياً)
  async fetchAttendanceSince(sinceIso) {
    const res = await this.zk.getAttendances();
    const raw = res?.data || [];
    const sinceMs = sinceIso ? new Date(sinceIso).getTime() : 0;
    const logs = raw
      .map(r => ({
        deviceUserId: r.deviceUserId ?? r.userId ?? r.uid,
        timestamp: new Date(r.recordTime).toISOString(),
      }))
      .filter(r => r.deviceUserId != null && new Date(r.timestamp).getTime() > sinceMs);
    return logs;
  }

  async enrollUser({ deviceUserId, name, password }) {
    // توقيع node-zklib: setUser(uid, userid, name, password, role, cardno)
    await this.zk.setUser(deviceUserId, deviceUserId, name, password || '', 0, 0);
  }

  async removeUser(deviceUserId) {
    await this.zk.deleteUser(deviceUserId);
  }
}

module.exports = { DeviceConnection };

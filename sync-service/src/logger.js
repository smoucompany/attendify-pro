const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function _write(level, deviceId, message) {
  const line = `[${new Date().toISOString()}] [${level}]${deviceId ? ` [${deviceId}]` : ''} ${message}`;
  console.log(line);
  const file = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFile(file, line + '\n', () => {});
}

module.exports = {
  info:  (msg, deviceId) => _write('INFO',  deviceId, msg),
  warn:  (msg, deviceId) => _write('WARN',  deviceId, msg),
  error: (msg, deviceId) => _write('ERROR', deviceId, msg),
};

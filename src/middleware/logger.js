// Logger middleware: zaman damgası, method, endpoint, durum kodu ve yanıt süresi
// Kayıtlar konsola ve LOG_FILE dosyasına yazılır
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.resolve(process.env.LOG_FILE || 'logs/requests.log');
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const logger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const timestamp = new Date().toISOString();

  // Yanıt gönderildiğinde durum kodu ve süre belli olur
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;
    console.log(line);
    fs.appendFile(LOG_FILE, line + '\n', (err) => {
      if (err) console.error('Log dosyasına yazılamadı:', err.message);
    });
  });

  next();
};

module.exports = logger;

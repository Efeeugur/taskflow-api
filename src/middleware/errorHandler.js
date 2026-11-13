// Merkezi hata yönetimi: tüm hatalar aynı formatta döner
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Bozuk JSON gövdesi
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'İstek gövdesi geçerli bir JSON değil' });
  }

  const statusCode = err.statusCode || 500;
  const body = {
    success: false,
    error: statusCode === 500 ? 'Sunucu hatası' : err.message,
  };
  if (err.details) body.details = err.details;
  if (statusCode === 500) console.error(err);

  return res.status(statusCode).json(body);
};

module.exports = errorHandler;

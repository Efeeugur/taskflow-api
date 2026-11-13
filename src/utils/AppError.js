// Beklenen hatalar için özel hata sınıfı (durum kodu + mesaj)
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = AppError;

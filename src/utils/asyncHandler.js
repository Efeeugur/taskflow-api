// Async controller hatalarını merkezi hata middleware'ine iletir
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

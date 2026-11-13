// Validation middleware (yönerge İsteğe Bağlı 02)
// title, description, priority, assignee (ve güncellemede status) alanlarını doğrular.
// Hatalı veya eksik veride 400 Bad Request ve alan bazlı hata listesi döner.
const AppError = require('../utils/AppError');
const { STATUSES, PRIORITIES, LIMITS } = require('../utils/constants');

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const checkString = (errors, body, field, { required = false, max }) => {
  const value = body[field];
  if (value === undefined || value === null) {
    if (required) errors.push({ field, message: `${field} alanı zorunludur` });
    return;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: `${field} metin (string) olmalıdır` });
    return;
  }
  if (required && value.trim() === '') {
    errors.push({ field, message: `${field} boş olamaz` });
    return;
  }
  if (max && value.length > max) {
    errors.push({ field, message: `${field} en fazla ${max} karakter olabilir` });
  }
};

const checkEnum = (errors, body, field, allowed) => {
  const value = body[field];
  if (value === undefined) return;
  if (!allowed.includes(value)) {
    errors.push({ field, message: `${field} şu değerlerden biri olmalıdır: ${allowed.join(', ')}` });
  }
};

const ALLOWED_FIELDS = ['title', 'description', 'priority', 'assignee', 'status'];

const validate = (mode) => (req, res, next) => {
  const body = req.body;
  if (!isPlainObject(body)) {
    return next(new AppError(400, 'İstek gövdesi bir JSON nesnesi olmalıdır'));
  }

  const errors = [];

  const unknown = Object.keys(body).filter((k) => !ALLOWED_FIELDS.includes(k));
  if (unknown.length) {
    errors.push({ field: unknown.join(', '), message: 'Tanımsız alan gönderildi' });
  }

  if (mode === 'create') {
    if (body.status !== undefined) {
      errors.push({ field: 'status', message: 'Yeni görev her zaman "todo" durumunda başlar, status gönderilmez' });
    }
    checkString(errors, body, 'title', { required: true, max: LIMITS.title });
  } else {
    const updatable = Object.keys(body).filter((k) => ALLOWED_FIELDS.includes(k));
    if (!updatable.length) {
      errors.push({ field: '-', message: 'Güncellenecek en az bir alan gönderilmelidir' });
    }
    if (body.title !== undefined) checkString(errors, body, 'title', { required: true, max: LIMITS.title });
    checkEnum(errors, body, 'status', STATUSES);
  }

  checkString(errors, body, 'description', { max: LIMITS.description });
  checkString(errors, body, 'assignee', { max: LIMITS.assignee });
  checkEnum(errors, body, 'priority', PRIORITIES);

  if (errors.length) {
    return next(new AppError(400, 'Doğrulama hatası', errors));
  }

  // Metin alanlarındaki baştaki/sondaki boşlukları temizle
  ['title', 'description', 'assignee'].forEach((f) => {
    if (typeof body[f] === 'string') body[f] = body[f].trim();
  });

  return next();
};

module.exports = { validateCreate: validate('create'), validateUpdate: validate('update') };

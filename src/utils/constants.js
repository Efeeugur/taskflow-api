// Görev alanları için izin verilen değerler ve kurallar
const STATUSES = ['todo', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

// Durum geçiş kuralları: mevcut durum -> gidilebilecek durumlar
const STATUS_TRANSITIONS = {
  todo: ['in-progress'],
  'in-progress': ['completed', 'todo'],
  completed: [],
};

const LIMITS = { title: 100, description: 500, assignee: 50 };

module.exports = { STATUSES, PRIORITIES, STATUS_TRANSITIONS, LIMITS };

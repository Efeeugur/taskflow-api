// Filtreleme, arama, sıralama ve sayfalama yardımcıları (yönerge İsteğe Bağlı 01)
const AppError = require('./AppError');
const { STATUSES, PRIORITIES } = require('./constants');

const SORTABLE = ['createdAt', 'updatedAt', 'priority', 'title', 'id'];
const PRIORITY_ORDER = { low: 1, medium: 2, high: 3 };

const filterTasks = (tasks, query) => {
  const { status, priority, assignee } = query;
  let result = tasks;

  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      throw new AppError(400, `status şu değerlerden biri olmalıdır: ${STATUSES.join(', ')}`);
    }
    result = result.filter((t) => t.status === status);
  }
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) {
      throw new AppError(400, `priority şu değerlerden biri olmalıdır: ${PRIORITIES.join(', ')}`);
    }
    result = result.filter((t) => t.priority === priority);
  }
  if (assignee !== undefined) {
    const name = String(assignee).toLocaleLowerCase('tr');
    result = result.filter((t) => (t.assignee || '').toLocaleLowerCase('tr') === name);
  }
  return result;
};

const searchTasks = (tasks, keyword) => {
  const kw = String(keyword).trim().toLocaleLowerCase('tr');
  if (!kw) throw new AppError(400, 'keyword parametresi zorunludur');
  return tasks.filter((t) =>
    `${t.title} ${t.description}`.toLocaleLowerCase('tr').includes(kw)
  );
};

// sort=createdAt (artan) veya sort=-createdAt (azalan)
const sortTasks = (tasks, sort) => {
  if (sort === undefined) return tasks;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  if (!SORTABLE.includes(field)) {
    throw new AppError(400, `sort şu alanlardan biri olmalıdır: ${SORTABLE.join(', ')} (azalan için başına - ekleyin)`);
  }
  const value = (t) => (field === 'priority' ? PRIORITY_ORDER[t.priority] : t[field]);
  const sorted = [...tasks].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (va < vb) return -1;
    if (va > vb) return 1;
    return 0;
  });
  return desc ? sorted.reverse() : sorted;
};

const toPositiveInt = (raw, name) => {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, `${name} pozitif bir tam sayı olmalıdır`);
  return n;
};

// page ve limit verilmezse tüm liste döner
const paginate = (tasks, query) => {
  if (query.page === undefined && query.limit === undefined) {
    return { items: tasks, meta: { total: tasks.length } };
  }
  const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
  const limit = query.limit === undefined ? 10 : toPositiveInt(query.limit, 'limit');
  if (limit > 100) throw new AppError(400, 'limit en fazla 100 olabilir');
  const start = (page - 1) * limit;
  return {
    items: tasks.slice(start, start + limit),
    meta: { total: tasks.length, page, limit, totalPages: Math.ceil(tasks.length / limit) },
  };
};

module.exports = { filterTasks, searchTasks, sortTasks, paginate };

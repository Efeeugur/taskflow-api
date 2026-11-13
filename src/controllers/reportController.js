// Raporlama servisleri (yönerge İsteğe Bağlı 03)
const taskStore = require('../services/taskStore');
const { sendSuccess } = require('../utils/response');
const { STATUSES, PRIORITIES } = require('../utils/constants');

const countBy = (tasks, key, keys) =>
  keys.reduce((acc, k) => ({ ...acc, [k]: tasks.filter((t) => t[key] === k).length }), {});

// GET /reports/completed
const completed = async (req, res) => {
  const tasks = (await taskStore.getAll()).filter((t) => t.status === 'completed');
  return sendSuccess(res, 200, { count: tasks.length, tasks });
};

// GET /reports/pending  (todo + in-progress)
const pending = async (req, res) => {
  const tasks = (await taskStore.getAll()).filter((t) => t.status !== 'completed');
  return sendSuccess(res, 200, { count: tasks.length, tasks });
};

// GET /reports/summary
const summary = async (req, res) => {
  const tasks = await taskStore.getAll();
  const total = tasks.length;
  const byStatus = countBy(tasks, 'status', STATUSES);
  const byPriority = countBy(tasks, 'priority', PRIORITIES);

  const byAssignee = tasks.reduce((acc, t) => {
    const name = t.assignee || 'Atanmamış';
    acc[name] = acc[name] || { total: 0, completed: 0 };
    acc[name].total += 1;
    if (t.status === 'completed') acc[name].completed += 1;
    return acc;
  }, {});

  const completionRate = total ? Math.round((byStatus.completed / total) * 100) : 0;
  const highPriorityOpen = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

  return sendSuccess(res, 200, {
    total,
    completionRate: `%${completionRate}`,
    highPriorityOpen,
    byStatus,
    byPriority,
    byAssignee,
  });
};

module.exports = { completed, pending, summary };

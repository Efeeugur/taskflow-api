const taskStore = require('../services/taskStore');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { STATUS_TRANSITIONS } = require('../utils/constants');
const { filterTasks, searchTasks, sortTasks, paginate } = require('../utils/query');

const UPDATABLE_FIELDS = ['title', 'description', 'status', 'priority', 'assignee'];

const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'Geçersiz görev id değeri');
  }
  return id;
};

const listResponse = (res, tasks, query) => {
  const sorted = sortTasks(tasks, query.sort);
  const { items, meta } = paginate(sorted, query);
  return sendSuccess(res, 200, items, meta);
};

// GET /tasks  (?status= &priority= &assignee= &sort= &page= &limit=)
const getTasks = async (req, res) => {
  const tasks = filterTasks(await taskStore.getAll(), req.query);
  return listResponse(res, tasks, req.query);
};

// GET /tasks/search?keyword=
const searchTasksHandler = async (req, res) => {
  const tasks = searchTasks(await taskStore.getAll(), req.query.keyword ?? '');
  return listResponse(res, tasks, req.query);
};

// GET /tasks/assignee/:name
const getTasksByAssignee = async (req, res) => {
  const tasks = filterTasks(await taskStore.getAll(), { assignee: req.params.name });
  return listResponse(res, tasks, req.query);
};

// GET /tasks/:id
const getTaskById = async (req, res) => {
  const id = parseId(req.params.id);
  const task = await taskStore.getById(id);
  if (!task) throw new AppError(404, `${id} numaralı görev bulunamadı`);
  return sendSuccess(res, 200, task);
};

// POST /tasks
const createTask = async (req, res) => {
  const task = await taskStore.create(req.body);
  return sendSuccess(res, 201, task);
};

// PUT /tasks/:id
const updateTask = async (req, res) => {
  const id = parseId(req.params.id);
  const current = await taskStore.getById(id);
  if (!current) throw new AppError(404, `${id} numaralı görev bulunamadı`);

  // Tamamlanan görev kilitlidir
  if (current.status === 'completed') {
    throw new AppError(409, 'Tamamlanan görev değiştirilemez');
  }

  // Durum geçiş kuralı
  const nextStatus = req.body.status;
  if (nextStatus !== undefined && nextStatus !== current.status) {
    const allowed = STATUS_TRANSITIONS[current.status];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        409,
        `"${current.status}" durumundaki görev "${nextStatus}" durumuna geçemez. İzin verilen: ${allowed.join(', ') || 'yok'}`
      );
    }
  }

  const fields = {};
  for (const key of UPDATABLE_FIELDS) {
    if (req.body[key] !== undefined) fields[key] = req.body[key];
  }
  const task = await taskStore.update(id, fields);
  return sendSuccess(res, 200, task);
};

// DELETE /tasks/:id
const deleteTask = async (req, res) => {
  const id = parseId(req.params.id);
  const task = await taskStore.remove(id);
  if (!task) throw new AppError(404, `${id} numaralı görev bulunamadı`);
  return sendSuccess(res, 200, task);
};

module.exports = {
  getTasks,
  searchTasks: searchTasksHandler,
  getTasksByAssignee,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

// Görevleri JSON dosyasında saklar (fs/promises ile asenkron okuma-yazma)
const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.resolve(process.env.DATA_FILE || 'src/data/tasks.json');

// Dosya biçimi: { "lastId": 3, "tasks": [ ... ] }
// lastId sayesinde silinen görevin id'si yeni bir göreve tekrar verilmez
const readData = async () => {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      // Eski biçim (yalnızca dizi) desteklenir
      return { lastId: data.reduce((m, t) => Math.max(m, t.id), 0), tasks: data };
    }
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') return { lastId: 0, tasks: [] }; // Dosya yoksa boş başla
    throw err;
  }
};

const writeData = async (data) => {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const readTasks = async () => (await readData()).tasks;

const getAll = () => readTasks();

const getById = async (id) => {
  const tasks = await readTasks();
  return tasks.find((t) => t.id === id);
};

const create = async (fields) => {
  const data = await readData();
  const nextId = data.lastId + 1;
  const now = new Date().toISOString();
  const task = {
    id: nextId,
    title: fields.title,
    description: fields.description || '',
    status: 'todo',
    priority: fields.priority || 'medium',
    assignee: fields.assignee || null,
    createdAt: now,
    updatedAt: now,
  };
  data.tasks.push(task);
  data.lastId = nextId;
  await writeData(data);
  return task;
};

const update = async (id, fields) => {
  const data = await readData();
  const index = data.tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  data.tasks[index] = { ...data.tasks[index], ...fields, id, updatedAt: new Date().toISOString() };
  await writeData(data);
  return data.tasks[index];
};

const remove = async (id) => {
  const data = await readData();
  const index = data.tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const [removed] = data.tasks.splice(index, 1);
  await writeData(data);
  return removed;
};

module.exports = { getAll, getById, create, update, remove };

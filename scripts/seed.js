// Örnek veriyle tasks.json dosyasını sıfırlar: npm run seed
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(process.env.DATA_FILE || 'src/data/tasks.json');
const now = Date.now();
const at = (hoursAgo) => new Date(now - hoursAgo * 3600 * 1000).toISOString();

const tasks = [
  { id: 1, title: 'Veri modelini tasarla', description: 'Task alanlarını ve kurallarını belirle', status: 'completed', priority: 'high', assignee: 'Efe', createdAt: at(72), updatedAt: at(60) },
  { id: 2, title: 'Express iskeletini kur', description: 'Klasör yapısı, routing ve middleware sırası', status: 'completed', priority: 'high', assignee: 'Efe', createdAt: at(70), updatedAt: at(48) },
  { id: 3, title: 'Logger middleware yaz', description: 'Method, endpoint, zaman damgası, durum kodu ve süre', status: 'in-progress', priority: 'medium', assignee: 'Ayşe', createdAt: at(50), updatedAt: at(20) },
  { id: 4, title: 'Postman testlerini hazırla', description: 'CRUD uç noktaları için test scriptleri', status: 'todo', priority: 'medium', assignee: 'Mehmet', createdAt: at(30), updatedAt: at(30) },
  { id: 5, title: 'README ve dokümantasyon', description: 'Kurulum adımları ve API dokümanı', status: 'todo', priority: 'low', assignee: 'Ayşe', createdAt: at(10), updatedAt: at(10) },
  { id: 6, title: 'Docker yapılandırması', description: 'Dockerfile ve docker-compose ile backend çalıştırma', status: 'todo', priority: 'high', assignee: null, createdAt: at(5), updatedAt: at(5) },
];

fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
fs.writeFileSync(DATA_FILE, JSON.stringify({ lastId: tasks.length, tasks }, null, 2), 'utf-8');
console.log(`${tasks.length} örnek görev ${DATA_FILE} dosyasına yazıldı`);

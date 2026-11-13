// Otomatik API testleri - Node.js yerleşik test çalıştırıcısı (ek paket yok): npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Testler gerçek veriyi bozmasın diye geçici dosyalar kullanılır
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskflow-'));
process.env.DATA_FILE = path.join(tmpDir, 'tasks.json');
process.env.LOG_FILE = path.join(tmpDir, 'requests.log');

const app = require('../src/app');

let server;
let base;

const call = async (method, url, body) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

before(async () => {
  fs.writeFileSync(process.env.DATA_FILE, JSON.stringify({ lastId: 0, tasks: [] }));
  console.log = () => {}; // Logger çıktısını test raporundan gizle
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('CRUD: görev ekleme 201 döner, varsayılanlar atanır', async () => {
  const { status, body } = await call('POST', '/tasks', { title: 'Test görevi', assignee: 'Efe' });
  assert.equal(status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data.id, 1);
  assert.equal(body.data.status, 'todo');
  assert.equal(body.data.priority, 'medium');
});

test('CRUD: listeleme 200 ve toplam sayı döner', async () => {
  const { status, body } = await call('GET', '/tasks');
  assert.equal(status, 200);
  assert.equal(body.meta.total, 1);
});

test('CRUD: detay 200, olmayan görev 404, geçersiz id 400', async () => {
  assert.equal((await call('GET', '/tasks/1')).status, 200);
  assert.equal((await call('GET', '/tasks/999')).status, 404);
  assert.equal((await call('GET', '/tasks/abc')).status, 400);
});

test('CRUD: güncelleme 200 döner ve updatedAt değişir', async () => {
  const before = (await call('GET', '/tasks/1')).body.data;
  const { status, body } = await call('PUT', '/tasks/1', { priority: 'high' });
  assert.equal(status, 200);
  assert.equal(body.data.priority, 'high');
  assert.notEqual(body.data.updatedAt, before.updatedAt);
});

test('Validation: başlıksız, hatalı öncelikli veya bozuk JSON istek 400 döner', async () => {
  assert.equal((await call('POST', '/tasks', {})).status, 400);
  assert.equal((await call('POST', '/tasks', { title: 'x', priority: 'urgent' })).status, 400);
  assert.equal((await call('POST', '/tasks', { title: 'a'.repeat(101) })).status, 400);
  assert.equal((await call('POST', '/tasks', '{bozuk')).status, 400);
});

test('Durum geçişi: todo -> completed yasak (409), sıralı geçiş serbest', async () => {
  assert.equal((await call('PUT', '/tasks/1', { status: 'completed' })).status, 409);
  assert.equal((await call('PUT', '/tasks/1', { status: 'in-progress' })).status, 200);
  assert.equal((await call('PUT', '/tasks/1', { status: 'completed' })).status, 200);
  assert.equal((await call('PUT', '/tasks/1', { title: 'değişmez' })).status, 409);
});

test('Filtreleme, arama ve raporlama doğru sonuç verir', async () => {
  await call('POST', '/tasks', { title: 'Backend dokümanı', priority: 'low' });
  const done = await call('GET', '/tasks?status=completed');
  assert.equal(done.body.data.length, 1);
  const found = await call('GET', '/tasks/search?keyword=backend');
  assert.equal(found.body.data.length, 1);
  const summary = await call('GET', '/reports/summary');
  assert.equal(summary.body.data.total, 2);
  assert.equal(summary.body.data.byStatus.completed, 1);
});

test('CRUD: silme 200 ve silinen görevi döner, tekrar silme 404', async () => {
  const { status, body } = await call('DELETE', '/tasks/2');
  assert.equal(status, 200);
  assert.equal(body.data.id, 2);
  assert.equal((await call('DELETE', '/tasks/2')).status, 404);
});

test('Silinen görevin id değeri tekrar kullanılmaz', async () => {
  const { body } = await call('POST', '/tasks', { title: 'Yeni görev' });
  assert.equal(body.data.id, 3);
});

test('Logger: istekler log dosyasına yazılır', async () => {
  await new Promise((r) => setTimeout(r, 50));
  const log = fs.readFileSync(process.env.LOG_FILE, 'utf-8');
  assert.match(log, /\[.+\] POST \/tasks 201 \d+\.\dms/);
});

test('Swagger dokümanı yayınlanır', async () => {
  const spec = await call('GET', '/api-docs.json');
  assert.equal(spec.status, 200);
  assert.equal(spec.body.info.title, 'TASKFLOW API');
  const page = await fetch(base + '/api-docs/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /swagger-ui/);
});

test('Ana adres tarayıcıyı Swagger arayüzüne yönlendirir, istemciye JSON döner', async () => {
  const browser = await fetch(base + '/', { headers: { Accept: 'text/html' }, redirect: 'manual' });
  assert.equal(browser.status, 302);
  assert.equal(browser.headers.get('location'), '/api-docs');
  const client = await call('GET', '/');
  assert.equal(client.status, 200);
  assert.equal(client.body.data.name, 'TASKFLOW API');
});

test('Tanımsız rota 404 döner', async () => {
  assert.equal((await call('GET', '/olmayan')).status, 404);
});

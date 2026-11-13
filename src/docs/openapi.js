// OpenAPI 3 tanımı: Swagger UI bu dosyadan /api-docs sayfasını oluşturur
const { STATUSES, PRIORITIES, LIMITS } = require('../utils/constants');

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Görev id değeri',
  schema: { type: 'integer', minimum: 1 },
  example: 1,
};

const json = (schema, example) => ({
  'application/json': { schema, ...(example !== undefined ? { example } : {}) },
});

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const resp = (description, name) => ({ description, content: json(ref(name)) });

const errors = {
  400: resp('Geçersiz veri, parametre veya bozuk JSON', 'ValidationError'),
  404: resp('Görev bulunamadı', 'Error'),
  409: resp('Durum geçiş kuralına aykırı istek', 'Error'),
};

const listParams = [
  { name: 'sort', in: 'query', description: 'Sıralama alanı; azalan için başına - ekleyin (ör. -createdAt)', schema: { type: 'string', enum: ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'priority', '-priority', 'title', '-title', 'id', '-id'] } },
  { name: 'page', in: 'query', description: 'Sayfa numarası', schema: { type: 'integer', minimum: 1 } },
  { name: 'limit', in: 'query', description: 'Sayfa başına kayıt (en fazla 100)', schema: { type: 'integer', minimum: 1, maximum: 100 } },
];

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'TASKFLOW API',
    version: '1.0.0',
    description:
      'Görev ve Proje Yönetim Sistemi REST API. Görev oluşturma, çalışana atama, durum ve öncelik takibi, filtreleme ve raporlama.\n\n' +
      '**Durum akışı:** `todo` → `in-progress` → `completed`. `in-progress` görev tekrar `todo` durumuna alınabilir, tamamlanan görev değiştirilemez (409).',
  },
  servers: [{ url: '/', description: 'Bu sunucu' }],
  tags: [
    { name: 'Görevler', description: 'Görev CRUD işlemleri, filtreleme ve arama' },
    { name: 'Raporlar', description: 'Görev istatistikleri' },
  ],
  paths: {
    '/tasks': {
      get: {
        tags: ['Görevler'],
        summary: 'Görevleri listele',
        description: 'Tüm parametreler isteğe bağlıdır ve birlikte kullanılabilir.',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: STATUSES } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: PRIORITIES } },
          { name: 'assignee', in: 'query', description: 'Kişi adı (büyük/küçük harf duyarsız)', schema: { type: 'string' } },
          ...listParams,
        ],
        responses: { 200: resp('Görev listesi', 'TaskList'), 400: errors[400] },
      },
      post: {
        tags: ['Görevler'],
        summary: 'Yeni görev ekle',
        description: 'Yeni görev her zaman `todo` durumunda başlar; `status` gönderilemez.',
        requestBody: {
          required: true,
          content: json(ref('TaskCreate'), { title: 'Ödeme sayfası', description: 'Kart ile ödeme akışı', priority: 'high', assignee: 'Efe' }),
        },
        responses: { 201: resp('Görev oluşturuldu', 'TaskResponse'), 400: errors[400] },
      },
    },
    '/tasks/search': {
      get: {
        tags: ['Görevler'],
        summary: 'Görevlerde ara',
        description: 'Başlık ve açıklamada büyük/küçük harf duyarsız arama.',
        parameters: [
          { name: 'keyword', in: 'query', required: true, schema: { type: 'string' }, example: 'backend' },
          ...listParams,
        ],
        responses: { 200: resp('Eşleşen görevler', 'TaskList'), 400: errors[400] },
      },
    },
    '/tasks/assignee/{name}': {
      get: {
        tags: ['Görevler'],
        summary: 'Bir kişiye atanmış görevler',
        parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' }, example: 'Efe' }, ...listParams],
        responses: { 200: resp('Kişinin görevleri', 'TaskList') },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Görevler'],
        summary: 'Görev detayı',
        parameters: [idParam],
        responses: { 200: resp('Görev', 'TaskResponse'), 400: errors[400], 404: errors[404] },
      },
      put: {
        tags: ['Görevler'],
        summary: 'Görevi güncelle',
        description: 'Yalnızca gönderilen alanlar değişir. En az bir alan gönderilmelidir.',
        parameters: [idParam],
        requestBody: { required: true, content: json(ref('TaskUpdate'), { status: 'in-progress' }) },
        responses: { 200: resp('Güncel görev', 'TaskResponse'), 400: errors[400], 404: errors[404], 409: errors[409] },
      },
      delete: {
        tags: ['Görevler'],
        summary: 'Görevi sil',
        description: 'Silinen görevi döner. Silinen id tekrar kullanılmaz.',
        parameters: [idParam],
        responses: { 200: resp('Silinen görev', 'TaskResponse'), 400: errors[400], 404: errors[404] },
      },
    },
    '/reports/completed': {
      get: { tags: ['Raporlar'], summary: 'Tamamlanan görevler', responses: { 200: resp('Sayı ve liste', 'TaskReport') } },
    },
    '/reports/pending': {
      get: { tags: ['Raporlar'], summary: 'Bekleyen görevler (todo + in-progress)', responses: { 200: resp('Sayı ve liste', 'TaskReport') } },
    },
    '/reports/summary': {
      get: { tags: ['Raporlar'], summary: 'Genel özet', responses: { 200: resp('Özet istatistikler', 'Summary') } },
    },
  },
  components: {
    schemas: {
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', maxLength: LIMITS.title, example: 'Veri modelini tasarla' },
          description: { type: 'string', maxLength: LIMITS.description, example: 'Task alanlarını ve kurallarını belirle' },
          status: { type: 'string', enum: STATUSES, example: 'todo' },
          priority: { type: 'string', enum: PRIORITIES, example: 'high' },
          assignee: { type: 'string', nullable: true, maxLength: LIMITS.assignee, example: 'Efe' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TaskCreate: {
        type: 'object',
        required: ['title'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', maxLength: LIMITS.title },
          description: { type: 'string', maxLength: LIMITS.description },
          priority: { type: 'string', enum: PRIORITIES, default: 'medium' },
          assignee: { type: 'string', maxLength: LIMITS.assignee },
        },
      },
      TaskUpdate: {
        type: 'object',
        minProperties: 1,
        additionalProperties: false,
        properties: {
          title: { type: 'string', maxLength: LIMITS.title },
          description: { type: 'string', maxLength: LIMITS.description },
          status: { type: 'string', enum: STATUSES },
          priority: { type: 'string', enum: PRIORITIES },
          assignee: { type: 'string', maxLength: LIMITS.assignee },
        },
      },
      TaskResponse: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true }, data: ref('Task') },
      },
      TaskList: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: ref('Task') },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 6 },
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              totalPages: { type: 'integer', example: 1 },
            },
          },
        },
      },
      TaskReport: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object', properties: { count: { type: 'integer' }, tasks: { type: 'array', items: ref('Task') } } },
        },
      },
      Summary: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 6 },
              completionRate: { type: 'string', example: '%33' },
              highPriorityOpen: { type: 'integer', example: 1 },
              byStatus: { type: 'object', example: { todo: 3, 'in-progress': 1, completed: 2 } },
              byPriority: { type: 'object', example: { low: 1, medium: 2, high: 3 } },
              byAssignee: { type: 'object', example: { Efe: { total: 2, completed: 2 } } },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: { success: { type: 'boolean', example: false }, error: { type: 'string', example: '99 numaralı görev bulunamadı' } },
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Doğrulama hatası' },
          details: {
            type: 'array',
            items: { type: 'object', properties: { field: { type: 'string', example: 'title' }, message: { type: 'string', example: 'title boş olamaz' } } },
          },
        },
      },
    },
  },
};

module.exports = openapi;

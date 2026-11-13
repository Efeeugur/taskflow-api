const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const logger = require('./middleware/logger');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware sırası önemli: önce istek loglanır (bozuk JSON dahil), sonra gövde okunur,
// sonra rotalar, en sonda 404 ve hata yönetimi
app.use(logger);
app.use(express.json());

// Ana adres: tarayıcıdan açılınca Swagger arayüzüne yönlendirir,
// API istemcilerine (Postman, fetch) kısa bir JSON bilgi döner
app.get('/', (req, res) => {
  if (req.accepts(['json', 'html']) === 'html') {
    return res.redirect('/api-docs');
  }
  return res.json({
    success: true,
    data: {
      name: 'TASKFLOW API',
      version: '1.0.0',
      docs: '/api-docs',
      endpoints: ['/tasks', '/tasks/search?keyword=', '/tasks/assignee/:name', '/reports/summary'],
    },
  });
});

// Swagger UI: tarayıcıda canlı API dokümanı ve deneme ekranı
app.get('/api-docs.json', (req, res) => res.json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'TASKFLOW API Dokümanı' }));

app.use('/tasks', taskRoutes);
app.use('/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

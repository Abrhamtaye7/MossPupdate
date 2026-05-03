const configureRoutes = (app) => {
  app.use('/api/auth', require('./api/auth'));
  app.use('/api/users', require('./api/users'));
  app.use('/api/mails', require('./api/mails'));
  app.use('/api/chips', require('./api/chips'));
  app.use('/api/admin', require('./api/admin'));
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });
  app.get('/metrics', (req, res) => {
    res.status(200).json({ timestamp: new Date().toISOString() });
  });
  app.use('/', (req, res) => {
    res.status(200).send('Welcome to MossPok!');
  });
};

module.exports = configureRoutes;

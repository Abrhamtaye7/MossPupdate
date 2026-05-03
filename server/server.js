const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cron = require('node-cron');
const config = require('./config');
const connectDB = require('./config/db');
const connectRedis = require('./config/redis');
const configureMiddleware = require('./middleware');
const configureRoutes = require('./routes');
const gameSocket = require('./socket/index');
const ConnectionManager = require('./socket/connectionManager');
const { removeEmptyStaleRooms } = require('./socket/roomStore');
const logger = require('./helpers/logger');

const startServer = async () => {
  let db;
  let redisClient;
  try {
    db = await connectDB(5, 2000, logger);
    redisClient = await connectRedis(logger).catch(() => null);
  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }

  const app = express();
  configureMiddleware(app);
  app.use(express.static(path.join('server', 'public')));
  app.locals.featureFlags = config.FEATURE_FLAGS
    ? JSON.parse(config.FEATURE_FLAGS)
    : {};

  configureRoutes(app);

  const server = http.createServer(app);
  const io = socketio(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const connectionManager = new ConnectionManager();

  io.on('connection', (socket) => {
    connectionManager.add(socket.id);
    gameSocket.init(socket, io);
    socket.on('disconnect', () => connectionManager.remove(socket.id));
  });

  server.listen(config.PORT, () => {
    logger.info(
      `Server is running in ${config.NODE_ENV} mode and is listening on port ${config.PORT}...`,
    );
  });

  cron.schedule('*/5 * * * *', () => {
    removeEmptyStaleRooms(30 * 60 * 1000);
  });

  cron.schedule('0 * * * *', () => {
    logger.info('Running hourly revenue reconciliation.');
  });

  cron.schedule('*/30 * * * *', () => {
    logger.info('Running collusion pattern detection.');
  });

  const gracefulShutdown = async () => {
    logger.info('Shutting down server...');
    server.close(async () => {
      if (db) {
        await db.disconnect();
      }
      if (redisClient) {
        await redisClient.disconnect();
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled rejection: ${err.message}`);
    gracefulShutdown();
  });
};

startServer();

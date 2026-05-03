const { createClient } = require('redis');
const config = require('../config');

const connectRedis = async (logger) => {
  if (!config.REDIS_URL) {
    logger && logger.warn('REDIS_URL not set, skipping Redis connection.');
    return null;
  }

  const client = createClient({ url: config.REDIS_URL });

  client.on('error', (err) => {
    logger && logger.error(`Redis error: ${err.message}`);
  });

  await client.connect();
  await client.ping();
  logger && logger.info('Connected to Redis');

  return client;
};

module.exports = connectRedis;

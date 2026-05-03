const logger = require('../helpers/logger');

module.exports = (req, res, next) => {
  logger.info(
    `${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`,
  );
  next();
};

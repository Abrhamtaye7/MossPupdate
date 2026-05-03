const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async (retries = 5, delayMs = 2000, logger = console) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const db = await mongoose.connect(config.MONGO_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      });
      logger.info('Successfully connected to MongoDB!');
      return db;
    } catch (err) {
      logger.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}`);
      if (attempt === retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = connectDB;

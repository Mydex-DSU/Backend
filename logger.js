// logger.js
// const { createLogger, format, transports } = require('winston');

// const logger = createLogger({
//     level: 'info',
//     format: format.combine(
//         format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//         format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
//     ),
//     transports: [
//         new transports.Console(),
//         // new transports.File({ filename: 'combined.log' })
//     ]
// });

// module.exports = logger;

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} ${level}: ${message} ${stack || ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;

const winston = require('winston');
const winstonTimestampColorize = require('winston-timestamp-colorize');

// creating the logger instance
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp(),
        winston.format.colorize(),
        winstonTimestampColorize({color: 'red'}),
        winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
    level: 'debug',
    transports: [
        new winston.transports.Console({}),
    ],
});

// log with it ;)
logger.debug('hello world');

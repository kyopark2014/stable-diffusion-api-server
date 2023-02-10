# Winston Timestamp Colorizer Format

this is a simple library for adding colorization to timestamps of winston.

### installation:
    npm install --save winston-timestamp-colorize

### usage:
just add winston-timestamp-colorize to your winston formats after winston.format.timestamp()
```javascript
const winstonTimestampColorize = require('winston-timestamp-colorize');

winston.createLogger({
    ...
    format: winston.format.combine(
        ...
        winston.format.timestamp(),
        winstonTimestampColorize(),
        ...
    ),
    ...
});
```

you can pass an optional {color: '...' } parameter to winstonTimestampColorize to change the color of timestamp. available colors are:
- black
- red
- green
- yellow
- blue
- magenta
- cyan
- white
- gray
- grey

### full example:
```javascript
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
```
//var config = require('./config');
//var symbol = config.variables.symbol;

const winston = require('winston')
require('winston-daily-rotate-file')
require('date-utils')
 
const winstonTimestampColorize = require('winston-timestamp-colorize');

const timezoned = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Seoul'
    });
}

const { combine, timestamp, label, printf, colorize } = winston.format;
const myFormat = printf(({ timestamp, label, level, message   }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;    // log format
  });

var symbol = 'inference';

const logger = winston.createLogger({
    level: 'debug',   // { emerg: 0, alert: 1, crit: 2, error: 3, warning: 4, notice: 5, info: 6, debug: 7 }
    transports: [
        new winston.transports.DailyRotateFile({
            //filename : '/tmp/log/'+symbol+'.log', 
            filename : '/tmp/log/inference.log', 
            zippedArchive: true, 
            handleExceptions: true,
            colorize: false,
            format: combine( 
                label({ label: symbol }),
                // label({ label: 'inference' }),
                timestamp({format: timezoned}),
                myFormat
            )
        }),

        new winston.transports.Console({
            handleExceptions: true,
            //filename : '/tmp/log/'+symbol+'.log', 
            filename : '/tmp/log/inference.log', 
            format: combine(
                label({ label: symbol }),
                //label({ label: 'inference' }),
                timestamp({format: timezoned}),
                colorize(),
                winstonTimestampColorize({color: 'yellow'}),
                myFormat
            )
        })
    ]
})
module.exports = logger
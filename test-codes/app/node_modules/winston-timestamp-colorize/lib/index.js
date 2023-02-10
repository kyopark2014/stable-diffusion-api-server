const winston = require('winston');
const colors = require('colors/safe');


module.exports = winston.format((info, opts) => {
    if (info.timestamp) {
        let color = colors.yellow;

        if (opts && opts.color && colors[opts.color]) {
            color = colors[opts.color];
        }

        info.timestamp = color(info.timestamp);
    }

    return info;
});

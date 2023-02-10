const {expect} = require('chai');
const colors = require('colors');

const winstonTimestampColorize = require('../lib');

describe('winston-timestamp-colorize', function() {
    it('should colorize input message timestamp', function() {
        const str = 'abc';
        const info = {timestamp: str};

        winstonTimestampColorize().transform(info);

        expect(info.timestamp).to.be.equal(colors.yellow(str));
    });

    it('should colorize input message with custom color provided', function() {
        const str = 'abc';
        const info = {timestamp: str};

        winstonTimestampColorize().transform(info, {color: 'blue'});

        expect(info.timestamp).to.be.equal(colors.blue(str));
    });

    it('should colorize input message with yellow if wrong color is passed', function() {
        const str = 'abc';
        const info = {timestamp: str};

        winstonTimestampColorize().transform(info, {color: 'xxxx'});

        expect(info.timestamp).to.be.equal(colors.yellow(str));
    });
});

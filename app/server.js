const express = require('express');
const server = express();

const { PythonShell } = require("python-shell");

const logger = require('./logger'); 

server.get('/', (req,res) => {
	res.send('Hello World!');
});

server.listen(8080, () => {
	console.log('This server is running on port 8080\n');
});

server.get('/text', (req,res) => {
	text = req.header('text');

    logger.debug('text:'+text);		

    var options = {
        mode: "json",
        pythonPath: "",
        pythonOptions: ["-u"],
        scriptPath: "",
        args: ["hello"],
    };

    result = PythonShell.run("predict.py", options, function(err, results) {
        if(err) throw err;
        
        console.log(results);
    });

    logger.debug('result:'+JSON.stringify(result));		

    res.send('request was received.');
});

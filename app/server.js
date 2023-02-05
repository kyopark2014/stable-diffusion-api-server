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

    res.send('request was received.');

    var options = {
        mode: "json",
        pythonPath: "",
        pythonOptions: ["-u"],
        scriptPath: "",
        args: [input],
    };

    result = PythonShell.run("predict.py", options, function(err, results) {
        if(err) throw err;
        
        console.log(results);
    });

    logger.debug('result:'+result);		
});

//const app = express();
//const port = 8000;

//const logger = require('./logger'); 

// const express = require('express');
// const server = express();


//const { PythonShell } = require("python-shell");
//app.use(express.json());
//app.use(express.static(path.join(__dirname, "model")));


/*
server.get('/text', (req,res) => {
	text = req.header('text');
		
    console.log(text);

    res.send('request was received.');
});

server.listen(8000, () => {
	console.log("Start server...");
}); */

/*
app.get("/get", (req, res) => {
    text = req.header('text');
    console.log(text);

    var options = {
        mode: "json",
        pythonPath: "",
        pythonOptions: ["-u"],
        scriptPath: "",
        args: [input],
    };

    PythonShell.run("predict.py", options, function(err, results) {
        if(err) throw err;
        
        console.log(results);
    });
});

app.listen(port, ()=>{
    console.log(`app listening at http://localhost:$(port})`);
}); */
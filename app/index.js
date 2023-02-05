const express = require("express");
const { PythonShell } = require("python-shell");
const app = express();
const port = 8080;

app.use(express.json());
//app.use(express.static(path.join(__dirname, "model")));

app.get("/", (req, res) => {
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
});
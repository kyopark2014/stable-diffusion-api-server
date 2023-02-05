const express = require("express");
const { PythonShell } = require("python-shell");
const app = express();
const port = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "model")));

app.get("/", (req, res) => {
    let input = parseInt(req._parseUrl.path.split("/")[1]);
    if(isNaN(input)) {
        return res.send("bad reqest");
    }
    var options = {
        mode: "json",
        pythonPath: "",
        pythonOptions: ["-u"],
        scriptPath: "",
        args: [input],
    };

    PythonShell.run("predict.py", options, function(err, results) {
        
    })
})
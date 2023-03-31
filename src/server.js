const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const rubric = require("./rubric.json")
var fs = require('fs');
const rubricRes = require('./rubric_result.json')

const app = express();

const { exec, spawn, fork } = require('child_process');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended:true
}))

app.use(cors({
    credentials: true,
    origin: "http://localhost:4200"
}));

app.post("/Compile", (req, res)=>{
    exec('javac tempJava.java', (error , stdout , stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            res.send("Compilation Failed")
        }
        else if (stderr) {
            console.log(stderr)
            res.send("Compilation Failed")
        }
        else{
            console.log(stdout)
            res.send("Compilation Successful")
        }
    })
})

function codeRunner(inputParams){
    return new Promise(function (resolve, reject) {
        let output = ""
        let errors = ""
        
        const process = spawn('java', ["tempJava"]);
        process.stdin.write(inputParams);
        process.stdin.end();

        process.stdout.on('data', (data) => {
            output = data.toString();
        });
            
        process.stderr.on('data', (data) => {
            errors += data.toString();
        });
            
        process.on('exit', (code) => {
            if(code === 1){
                console.log(errors)
                resolve(errors);
            }
            resolve(output);
        });
    })
}


app.post("/Run",async (req, res) => {
    ip = "5 7"; 
    const result = await codeRunner(ip);
    res.send(result)
})  


function writetoRubricRes(s){
    return new Promise(function (resolve, reject){
        fs.writeFile('./rubric_result.json', '', function(){resolve('done')})
        fs.appendFile('./rubric_result.json', JSON.stringify(s), (err) => resolve(err))
    })
}


app.post("/RunTestCases", async (req, res) => {
    const testCases = rubric.criteria.blackboxtests;
    let testCaseInput = "";
    let testCaseOutput = "";
    let jsonRes = [];
    for(let i=0; i<testCases.length; i++){
        testCaseInput = testCases[i].rule.input;
        testCaseOutput = testCases[i].rule.output;
        codeRunnerOutput = await codeRunner(testCaseInput);
        //console.log(codeRunnerOutput)

        if(codeRunnerOutput.trim() === testCaseOutput){
            message = "Test Passed";
            jsonRes.push({"Test Case No." : i,  "Status" : message});
        }
        else{
            message = "Test Failed";
            jsonRes.push({"Test Case No." : i,  "Status" : message});
        }
    }

    await writetoRubricRes(jsonRes).then(res.send("Success!"));
})


const port = 5000;
app.listen(port, ()=>{
    console.log(port)
})


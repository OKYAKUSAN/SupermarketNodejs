/*
var http = require("http");
var fs = require("fs");
*/
var express=require("express");
var app=express();
var readPage=require("./bll/readPage");
var cookieParser=require("cookie-parser");
var config=require("./bll/config.js");

/*
http.createServer(function (req, res) {
    var url = req.url;
    console.log(__dirname + url);
    if (url != "/favicon.ico") {
        if (url == "/" || url == "/index.html") {
            res.writeHead(200, { "Content-type": "text/html" });
            fs.createReadStream(__dirname + "/index.html").pipe(res);
        }else{
            res.writeHead(200,{"Content-type":"text/html"});
            fs.createReadStream(__dirname+"/web"+url).pipe(res);
        }
    }
}).listen(8888);
console.log("Server is running...");
*/
app.use("/static", express.static("static"));

app.use(cookieParser(config.cookieSecret));

app.set("view engine", "ejs");
readPage(app, __dirname);

app.listen(8888, function () {
    console.log("Server is running...");
});
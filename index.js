/*
var http = require("http");
var fs = require("fs");
*/
var express=require("express");
var app=express();
var readPage=require("./bll/readPage");
var cookieParser=require("cookie-parser");
var session=require("express-session");
var config=require("./bll/config.js");
var cookieCheck=require("./bll/cookieCheck.js");

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
app.set("view engine", "ejs");

app.use("/static", express.static("static"));

app.use(cookieParser(config.cookieSecret));

app.use(session({
        secret:config.cookieSecret,
        resave:true,
        saveUninitialized:false,
        cookie:{
            maxAge:1000 * 60 * 15
        },
        rolling:true
    })
);

app.use(function(req,res,next){
    var pathArray=config.specialUrl;

    var specialUrl=false;
    //console.log("遍历之前："+req.url+(specialUrl?" true":" false"));
    pathArray.forEach(function(item){
        if(item==req.url) specialUrl=true;
    });
    //console.log("遍历之后："+req.url+(specialUrl?" true":" false"));
    if(!specialUrl){
        if(!req.session.userName){
            //res.render(__dirname+"/web/login.ejs",{login:false,loginFailed:false});
            res.redirect("/login.html");
        }else next();
    }else next();
});

readPage(app, __dirname);

// 参数["0.0.0.0"]只是为能获取ipv4地址，没有此项参数则是默认的ipv6地址
app.listen(8888,'0.0.0.0', function () {
    console.log("Server is running...");
});
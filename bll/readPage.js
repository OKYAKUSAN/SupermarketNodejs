var sql=require("mssql");
var urls=require("url");
var querystring=require("querystring");
var pageNumber=require("./pageNumberControl.js");
var statisticsArgument=require("./statisticsArgument.js");
var errorObj=require("./error.js");
var strUrl;
/*
var config={
    cookieSecret:"This_is_my_first_cookie_object!",
    dbConfig:{
        user:'sa',
        password:'MSSql',
        server:'PPTV3-20181225X\\SQLSERVER2008',
        database:'SupermarketServer'
    }
}
*/
var config=require("./config.js");
module.exports = function (app, url) {
    var pool=new sql.ConnectionPool(config.dbConfig);
    //app.use(cookieParser("wyz_87"));

    app.get("/", function (req, res) {
        if(req.signedCookies.bwf){
            if(req.signedCookies.bwf=="OKYAKUSAN") console.log(req.signedCookies);
            else console.log("cookie被篡改");
        }else{
            res.cookie("bwf","OKYAKUSAN",{signed:true});
            console.log("创建cookie");
        }
        res.sendFile(url + "/web" + "/index.html");
    });
    app.get("/frame/top.html", function (req, res) {
        res.sendFile(url + "/web" + "/frame/top.html");
    });
    app.get("/frame/left.html", function (req, res) {
        res.sendFile(url + "/web" + "/frame/left.html");
    });
    app.get("/frame/bottom.html", function (req, res) {
        res.sendFile(url + "/web" + "/frame/bottom.html");
    });
    app.get("/home.html", function (req, res) {  
        pool.connect().then(function(sqlPool){
            var today=new Date();
            var yesterday=new Date(today.setDate(today.getDate()+1));
            var todayStr=today.getFullYear()+"-"+(parseInt(today.getMonth())+1)+"-"+today.getDate();
            var yesterdayStr=yesterday.getFullYear()+"-"+(parseInt(yesterday.getMonth())+1)+"-"+yesterday.getDate();
            return sqlPool.request().query(`select * from Goods;select * from Goods where Goods_Onsale=1`);
        }).then(function(result){
            res.render(url+"/web/home.ejs",{total1:result.rowsAffected[0],total2:result.rowsAffected[1]});
            pool.close();
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.get("/basic/sortlist.html", function (req, res) {
        //res.sendFile(url + "/web" + "/home.html");
        //var data1=[{id:1,name:"烟"},{id:2,name:"饮料"}];
        strUrl=urls.parse(req.url).query;
        var page=strUrl==null?1:querystring.parse(strUrl)["page"];
        page=(isNaN(page)||page<=0)?1:page;
        //if(strUrl==null) console.log("没有参数！");
        //else console.log(querystring.parse(strUrl)["p"]);
        /*
        var pool=new sql.ConnectionPool(config);
        console.log("准备连接...");
        pool.connect(function(err){
            if(err){console.log("数据库连接失败！");}
            else {console.log("数据库连接成功！");}
        });
        console.log("连接结束...");
        pool.close();
        */
        pool.connect().then(function(sqlPool){
            return sqlPool.request().query('select * from Sort order by Sort_Id desc');
        }).then(function(result){
            //console.dir(result);
            var dataObj=result.recordset;
            var count=result.rowsAffected[0];
            var reqUrl=urls.parse(req.url).pathname;
            var viewCount=15;
            var viewList=pageNumber.pickList(dataObj,page,viewCount);
            var numHtml=pageNumber.numberList(count,page,viewCount,reqUrl);
            res.render(url+"/web/basic/sortlist.ejs",{data:viewList,numControl:numHtml});
            pool.close();
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.get("/basic/sortedit.html", function (req, res) {
        strUrl=urls.parse(req.url).query;
        if(strUrl!=null){
            var sortId=querystring.parse(strUrl)["sortId"];
            pool.connect().then(function(sqlPool){
                return sqlPool.request().input("sortId",sql.Int,sortId).query(`select * from Sort where Sort_Id=@sortId`);
            }).then(function(result){
                var dataObj=result.recordset[0];
                res.render(url+"/web/basic/sortedit.ejs",{data:dataObj});
                pool.close();
            }).catch(function(err){});
        }else{
            var dataObj={Sort_Id:0,Sort_Name:""}
            res.render(url+"/web/basic/sortedit.ejs",{data:dataObj});
        }
    });
    app.post("/basic/sortsend.html", function (req, res) {
        var dataPost="";
        req.on("data",function(chunk){
            dataPost+=chunk;
        });
        req.on("end",function(){
            dataPost=querystring.parse(dataPost);
            if(dataPost.sortId==0){
                pool.connect().then(function(sqlPool){
                    return pool.request().input("sortName",sql.NVarChar,dataPost.formSortName).query(`if not exists (select * from Sort where Sort_Name=@sortName) insert into Sort values (@sortName)`);
                }).then(function(result){
                    //console.log("添加成功！");
                    console.log(result);
                    if(result.rowsAffected>0){res.render(url+"/web/basic/sortsend.ejs",{data:"添加成功！"});}
                    else res.render(url+"/web/basic/sortsend.ejs",{data:"添加失败！该分类已存在。"});
                    pool.close();
                }).catch(function(err){});
            }else{
                //var pool=new sql.ConnectionPool(config);
                pool.connect().then(function(sqlPool){
                    return sqlPool.request().input("sortId",sql.Int,dataPost.sortId).input("sortName",sql.NVarChar,dataPost.formSortName).query(`update Sort set Sort_Name=@sortName where Sort_Id=@sortId`);
                }).then(function(result){
                    console.log(result);
                    if(result.rowsAffected>0) res.render(url+"/web/basic/sortsend.ejs",{data:"修改成功！"});
                    else res.render(url+"/web/basic/sortsend.ejs",{data:"修改失败！"});
                    pool.close();
                }).catch(function(err){});
            }
        })
    });
    app.get("/basic/sortdelete.html",function(req,res){
        strUrl=urls.parse(req.url).query;
        if(strUrl!=null){
            var sortId=querystring.parse(strUrl)["sortId"];
            //var pool=new sql.ConnectionPool(config);
            pool.connect().then(function(sqlPool){
                return sqlPool.request().input("sortId",sql.Int,sortId).query(`if not exists (select * from Goods where Goods_Sort=@sortId) delete from Sort_Modification where Sort_Id=@sortId;if not exists (select * from Goods where Goods_Sort=@sortId) delete from Sort where Sort_Id=@sortId`);
            }).then(function(result){
                if(result.rowsAffected[1]>0) res.render(url+"/web/basic/sortdelete.ejs",{data:"删除成功！"});
                else res.render(url+"/web/basic/sortdelete.ejs",{data:"删除失败！存在所属分类的商品。"});
                pool.close();
            }).catch(function(err){});
        }else{
            res.render(url+"/web/basic/sortdelete.ejs",{data:"删除失败！分类ID错误。"});
        }
    });
    app.get("/basic/goodslist.html",function(req,res){
        strUrl=urls.parse(req.url).query;
        var page=strUrl==null?1:querystring.parse(strUrl)["page"];
        page=(isNaN(page)||page<=0)?1:page;
        pool.connect().then(function(sqlPool){
            return sqlPool.request().query(`select g.Goods_Id, g.Goods_Name, s.Sort_Id, s.Sort_Name, g.Goods_Price, g.Goods_Cost, g.Goods_Onsale from Goods as g, Sort as s where g.Goods_Sort=s.Sort_Id order by g.Goods_Id desc`);
        }).then(function(result){
            var dataObj=result.recordset;
            var count=result.rowsAffected[0];
            var reqUrl=urls.parse(req.url).pathname;
            var viewCount=15;
            var viewList=pageNumber.pickList(dataObj,page,viewCount);
            var numHtml=pageNumber.numberList(count,page,viewCount,reqUrl);
            res.render(url+"/web/basic/goodslist.ejs",{data:viewList,numControl:numHtml});
            pool.close();
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.get("/basic/goodsedit.html",function(req,res){
        strUrl=urls.parse(req.url).query;
        var goodsId=strUrl==null?0:querystring.parse(strUrl)["goodsId"];
        if(goodsId!=0){
            pool.connect().then(function(sqlPool){
                return sqlPool.request().input("goodsId",sql.Int,goodsId).query(`select * from Goods where Goods_Id=@goodsId;select * from Sort`);
            }).then(function(result){
                var dataObj=result.recordsets[0][0];
                var sortSelectObj=result.recordsets[1];
                res.render(url+"/web/basic/goodsedit.ejs",{data:dataObj,sortList:sortSelectObj});
                pool.close();
            }).catch(function(err){});
        }else{
            var dataObj={Goods_Id:0}
            pool.connect().then(function(sqlPool){
                return sqlPool.request().query(`select * from Sort`);
            }).then(function(result){
                var sortSelectObj=result.recordset;
                res.render(url+"/web/basic/goodsedit.ejs",{data:dataObj,sortList:sortSelectObj});
                pool.close();
            }).catch(function(err){});
        }
    });
    app.post("/basic/goodssend.html",function(req,res){
        var dataPost="";
        req.on("data",function(chunk){
            dataPost+=chunk;
        });
        req.on("end",function(){
            dataPost=querystring.parse(dataPost);
            var time=new Date();
            // console.log(Date());
            // console.log(time);
            // console.log(time.toLocaleString());
            // console.log(time.getTimezoneOffset());
            // var strTime=time.getFullYear().toString()+"-"+(time.getMonth()+1).toString()+"-"+time.getDate()+" ";
            // strTime+=time.getHours()<10?("0"+time.getHours().toString()):time.getHours.toString();
            // strTime+=":"+(time.getMinutes()<10?("0"+time.getMinutes().toString()):time.getMinutes().toString());
            // strTime+=":"+(time.getSeconds()<10?("0"+time.getSeconds().toString()):time.getSeconds().toString());
            if(dataPost.goodsId>0){
                pool.connect().then(function(sqlPool){
                    var sqlRequest=sqlPool.request();
                    sqlRequest.input("goodsId",sql.Int,dataPost.goodsId);
                    sqlRequest.input("goodsName",sql.NVarChar,dataPost.formGoodsName);
                    sqlRequest.input("goodsSort",sql.Int,dataPost.formSortId);
                    sqlRequest.input("goodsPrice",sql.Float,dataPost.formGoodsPrice);
                    sqlRequest.input("goodsCost",sql.Float,dataPost.formGoodsCost);
                    sqlRequest.input("goodsOnsale",sql.Bit,dataPost.formGoodsOnsale);
                    return sqlRequest.query(`update Goods set Goods_Name=@goodsName,Goods_Sort=@goodsSort,Goods_Price=@goodsPrice,Goods_Cost=@goodsCost,Goods_Onsale=@goodsOnsale where Goods_Id=@goodsId`);
                }).then(function(result){
                    if(result.rowsAffected>0){
                        pool.close();
                        pool.connect().then(function(sqlPool){
                            var sqlRequest=sqlPool.request();
                            sqlRequest.input("goodsId",sql.Int,dataPost.goodsId);
                            sqlRequest.input("goodsName",sql.NVarChar,dataPost.formGoodsName);
                            sqlRequest.input("goodsSort",sql.Int,dataPost.formSortId);
                            sqlRequest.input("goodsPrice",sql.Float,dataPost.formGoodsPrice);
                            sqlRequest.input("goodsCost",sql.Float,dataPost.formGoodsCost);
                            sqlRequest.input("goodsOnsale",sql.Bit,dataPost.formGoodsOnsale);
                            sqlRequest.input("modifyDate",sql.DateTime2,time);
                            return sqlRequest.query(`insert into Goods_Modification values (@goodsId,@goodsName,@goodsSort,@goodsPrice,@goodsCost,@goodsOnsale,@modifyDate);select @@IDENTITY as Id`);
                        }).then(function(result){
                            if(result.recordset[0].Id>0){
                                //console.log("第二次连接数据库成功执行T-SQL语句！");
                                res.render(url+"/web/basic/goodssend.ejs",{data:"修改成功!"});
                                pool.close();
                            }else{
                                //console.log("第二次连接数据库失败");
                                res.render(url+"/web/basic/goodssend.ejs",{data:"修改失败!商品已不存在。"});
                                pool.close();
                            }
                        });
                    }else{
                        res.render(url+"/web/basic/goodssend.ejs",{data:"修改失败!商品已不存在。"});
                        pool.close();
                    }
                }).catch(function(err){ console.log(err.message)});
            }else{
                pool.connect().then(function(sqlPool){
                    var sqlRequest=sqlPool.request();
                    sqlRequest.input("goodsName",sql.NVarChar,dataPost.formGoodsName);
                    sqlRequest.input("goodsSort",sql.Int,dataPost.formSortId);
                    sqlRequest.input("goodsPrice",sql.Float,dataPost.formGoodsPrice);
                    sqlRequest.input("goodsCost",sql.Float,dataPost.formGoodsCost);
                    sqlRequest.input("goodsOnsale",sql.Bit,dataPost.formGoodsOnsale);
                    return sqlRequest.query(`if not exists (select * from Goods where Goods_Name=@goodsName) insert into Goods values (@goodsName,@goodsSort,@goodsPrice,@goodsCost,@goodsOnsale);select @@IDENTITY as Id`);
                }).then(function(result){
                    if(result.recordset[0].Id>0){
                        pool.close();
                        pool.connect().then(function(sqlPool){
                            var sqlRequest=sqlPool.request();
                            sqlRequest.input("goodsId",sql.Int,result.recordset[0].Id);
                            sqlRequest.input("goodsName",sql.NVarChar,dataPost.formGoodsName);
                            sqlRequest.input("goodsSort",sql.Int,dataPost.formSortId);
                            sqlRequest.input("goodsPrice",sql.Float,dataPost.formGoodsPrice);
                            sqlRequest.input("goodsCost",sql.Float,dataPost.formGoodsCost);
                            sqlRequest.input("goodsOnsale",sql.Bit,dataPost.formGoodsOnsale);
                            sqlRequest.input("modifyDate",sql.DateTime2,time);
                            return sqlRequest.query(`insert into Goods_Modification values (@goodsId,@goodsName,@goodsSort,@goodsPrice,@goodsCost,@goodsOnsale,@modifyDate);select @@IDENTITY as Id`);
                        }).then(function(result){
                            if(result.recordset[0].Id>0){
                                res.render(url+"/web/basic/goodssend.ejs",{data:"添加成功!"});
                                pool.close();
                            }else{
                                res.render(url+"/web/basic/goodssend.ejs",{data:"添加失败!"});
                                pool.close();
                            }
                        }).catch(function(err){ 
                            console.log(err.message);
                            pool.close();
                        });
                    }else{
                        res.render(url+"/web/basic/goodssend.ejs",{data:"添加失败!商品已存在。"});
                        pool.close();
                    }
                }).catch(function(err){
                    console.log(err.message);
                    pool.close();
                });
            }
        });
    });
    app.get("/basic/goodsdelete.html",function(req,res){
        strUrl=urls.parse(req.url).query;
        if(strUrl!=null){
            var goodsId=parseInt(querystring.parse(strUrl)["goodsId"]);
            if(!isNaN(goodsId)&&goodsId>0){
                pool.connect().then(function(sqlPool){
                    var sqlRequest=sqlPool.request();
                    sqlRequest.input("goodsId",sql.Int,goodsId);
                    return sqlRequest.query(`if not exists (select Sale.Sale_Id, S.Stock_Id from Sale full join (select Stock.Stock_Id, Stock.Stock_Goods from Stock) S on Sale.Sale_Goods=S.Stock_Goods where Sale.Sale_Goods=@goodsId or S.Stock_Goods=@goodsId) delete from Goods_Modification where Goods_Modification.Goods_Id=@goodsId;if not exists (select Sale.Sale_Id, S.Stock_Id from Sale full join (select Stock.Stock_Id, Stock.Stock_Goods from Stock) S on Sale.Sale_Goods=S.Stock_Goods where Sale.Sale_Goods=@goodsId or S.Stock_Goods=@goodsId) delete from Goods where Goods.Goods_Id=@goodsId`);
                }).then(function(result){
                    console.log(result)
                    if(result.rowsAffected[1]>0){
                        res.render(url+"/web/basic/goodsdelete.ejs",{data:"删除成功！"});
                        pool.close();
                    }else{
                        res.render(url+"/web/basic/goodsdelete.ejs",{data:"删除失败！存在与该商品相关的销售或进货记录。"});
                        pool.close();
                    }
                }).catch(function(err){
                    console.log("==========");
                    console.log(Date());
                    console.log("请求地址："+req.url);
                    console.log("error:"+err.message);
                    console.log("==========");
                    pool.close();
                });
            }else{
                res.render(url+"/web/basic/goodsdelete.ejs",{data:"删除失败！商品ID错误。"});
            }
        }
    });
    app.get("/transaction/salelist.html",function(req,res){
        var strUrl=urls.parse(req.url).query;
        var page=strUrl!=null?parseInt(querystring.parse(strUrl)["page"]):1;
        page=(isNaN(page)||page<=0)?1:page;
        pool.connect().then(function(sqlPool){
            return sqlPool.request().query(`select sa.Sale_Id, g.Goods_Name, so.Sort_Name, sa.Sale_Number, sa.Sale_Price, sa.Sale_Count, sa.Sale_Unit, sa.Sale_Date from Sale as sa, Goods as g, Sort as so where sa.Sale_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id order by sa.Sale_Id desc`)
        }).then(function(result){
            var dataObj=result.recordset;
            var count=result.rowsAffected[0];
            var reqUrl=urls.parse(req.url).pathname;
            var viewCount=15;
            var viewList=pageNumber.pickList(dataObj,page,viewCount);
            var numHtml=pageNumber.numberList(count,page,viewCount,reqUrl);
            res.render(url+"/web/transaction/salelist.ejs",{data:viewList,numControl:numHtml});
            pool.close();
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.get("/transaction/saleedit.html",function(req,res){
        var strUrl=urls.parse(req.url).query;
        var saleId=strUrl!=null?querystring.parse(strUrl)["saleId"]:0;
        //console.log(saleId);
        saleId=isNaN(saleId)||saleId<=0?0:saleId;
        //console.log(saleId);
        pool.connect().then(function(sqlPool){
            return sqlPool.request().input("saleId",sql.Int,saleId).query(`select * from Sort order by Sort_Name;select Goods_Id, Goods_Name, Goods_Sort, Goods_Price from Goods order by Goods_Name;select sa.Sale_Id, g.Goods_Id, so.Sort_Id, sa.Sale_Number, sa.Sale_Price, sa.Sale_Count, sa.Sale_Unit, sa.Sale_Date from Sale as sa, Goods as g, Sort as so where sa.Sale_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and Sale_Id=@saleId`);
        }).then(function(result){
            //console.log(result);
            if(result.rowsAffected[2]>0) {
                res.render(url+"/web/transaction/saleedit.ejs",{data:result.recordsets[2][0],sortList:result.recordsets[0],goodsList:result.recordsets[1]});
                pool.close();
            }else{
                res.render(url+"/web/transaction/saleedit.ejs",{data:{Sale_Id:0},sortList:result.recordsets[0],goodsList:result.recordsets[1]});
                pool.close();
            }
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.post("/transaction/salesend.html",function(req,res){
        var dataPost="";
        req.on("data",function(chunk){
            dataPost+=chunk;
        });
        req.on("end",function(){
            var dataObj=querystring.parse(dataPost);
            var now=new Date();
            var saleNumber="SA";
            var dataObjTimeStr="";
            dataObjTimeStr+=dataObj.formSaleYear;
            dataObjTimeStr+="-"+(dataObj.formSaleMonth<10?"0"+dataObj.formSaleMonth:dataObj.formSaleMonth);
            dataObjTimeStr+="-"+(dataObj.formSaleDay<10?"0"+dataObj.formSaleDay:dataObj.formSaleDay);
            dataObjTimeStr+=" "+(dataObj.formSaleHours<10?"0"+dataObj.formSaleHours:dataObj.formSaleHours);
            dataObjTimeStr+=":"+(dataObj.formSaleMinutes<10?"0"+dataObj.formSaleMinutes:dataObj.formSaleMinutes);
            dataObjTimeStr+=":"+(dataObj.formSaleSecond<10?"0"+dataObj.formSaleSecond:dataObj.formSaleSecond);
            pool.connect().then(function(sqlPool){
                var sqlRequest=sqlPool.request();
                sqlRequest.input("goodsId",sql.Int,dataObj.formGoodsId);
                sqlRequest.input("salePrice",sql.Float,dataObj.formSalePrice);
                sqlRequest.input("saleCount",sql.Int,dataObj.formSaleCount);
                sqlRequest.input("saleUnit",sql.NVarChar,dataObj.formSaleUnit);
                sqlRequest.input("saleDate",sql.DateTime2,dataObjTimeStr);
                if(dataObj.saleId>0){
                    sqlRequest.input("saleId",sql.Int,dataObj.saleId);
                    sqlRequest.input("saleNumber",sql.NVarChar,dataObj.saleNumber);
                    return sqlRequest.query(`update Sale set Sale_Goods=@goodsId,Sale_Number=@saleNumber,Sale_Price=@salePrice,Sale_Count=@saleCount,Sale_Unit=@saleUnit,Sale_Date=@saleDate where Sale_Id=@saleId`);
                }else{
                    var _year=now.getFullYear().toString();
                    var _month=now.getMonth()<9?"0"+(now.getMonth()+1).toString():(now.getMonth()+1).toString();
                    var _date=now.getDate()<10?"0"+now.getDate().toString():now.getDate().toString();
                    var _hour=now.getHours()<10?"0"+now.getHours().toString():now.getHours().toString();
                    var _minute=now.getMinutes()<10?"0"+now.getMinutes().toString():now.getMinutes().toString();
                    var _second=now.getSeconds()<10?"0"+now.getSeconds().toString():now.getSeconds().toString();
                    saleNumber+=_year+_month+_date+_hour+_minute+_second;
                    sqlRequest.input("saleNumber",sql.NVarChar,saleNumber);
                    return sqlRequest.query(`insert into Sale values (@goodsId,@saleNumber,@salePrice,@saleCount,@saleUnit,@saleDate);select @@IDENTITY as Id;`);
                }
            }).then(function(result){
                if(dataObj.saleId>0){
                    if(result.rowsAffected[0]>0){
                        pool.close();
                        pool.connect().then(function(sqlPool){
                            var sqlRequest=sqlPool.request();
                            sqlRequest.input("saleId",sql.Int,dataObj.saleId);
                            sqlRequest.input("goodsId",sql.Int,dataObj.formGoodsId);
                            sqlRequest.input("saleNumber",sql.NVarChar,dataObj.saleNumber);
                            sqlRequest.input("salePrice",sql.Float,dataObj.formSalePrice);
                            sqlRequest.input("saleCount",sql.Int,dataObj.formSaleCount);
                            sqlRequest.input("saleUnit",sql.NVarChar,dataObj.formSaleUnit);
                            sqlRequest.input("saleDate",sql.DateTime2,dataObjTimeStr);
                            sqlRequest.input("saleModifyDate",sql.DateTime2,now);
                            return sqlRequest.query(`insert into Sale_Modification values (@saleId,@goodsId,@saleNumber,@salePrice,@saleCount,@saleUnit,@saleDate,@saleModifyDate);select @@IDENTITY as Id`);
                        }).then(function(_result){
                            if(_result.recordset[0].Id>0){
                                res.render(url+"/web/transaction/salesend.ejs",{data:"修改成功！"});
                                pool.close();
                            }else{
                                res.render(url+"/web/transaction/salesend.ejs",{data:"修改成功！但“修改记录表”添加失败"});
                                pool.close();
                            }
                        }).catch(function(err){
                            console.log("==========");
                            console.log(Date());
                            console.log("修改记录表添加记录出错！");
                            console.log("error:"+err.message);
                            console.log("==========");
                            pool.close();
                        });
                    }else{
                        res.render(url+"/web/transaction/salesend.ejs",{data:"修改失败！该记录已不存在。"});
                        pool.close();
                    }
                }else{
                    if(result.recordset[0].Id>0){
                        pool.close();
                        pool.connect().then(function(sqlPool){
                            var sqlRequest=sqlPool.request();
                            sqlRequest.input("saleId",sql.Int,result.recordset[0].Id);
                            sqlRequest.input("goodsId",sql.Int,dataObj.formGoodsId);
                            sqlRequest.input("saleNumber",sql.NVarChar,saleNumber);
                            sqlRequest.input("salePrice",sql.Float,dataObj.formSalePrice);
                            sqlRequest.input("saleCount",sql.Int,dataObj.formSaleCount);
                            sqlRequest.input("saleUnit",sql.NVarChar,dataObj.formSaleUnit);
                            sqlRequest.input("saleDate",sql.DateTime2,dataObjTimeStr);
                            sqlRequest.input("saleModifyDate",sql.DateTime2,now);
                            return sqlRequest.query(`insert into Sale_Modification values (@saleId,@goodsId,@saleNumber,@salePrice,@saleCount,@saleUnit,@saleDate,@saleModifyDate);select @@IDENTITY as Id`);
                        }).then(function(_result){
                            console.log(_result.recordset[0].Id);
                            if(_result.recordset[0].Id>0){
                                res.render(url+"/web/transaction/salesend.ejs",{data:"添加成功！"});
                                pool.close();
                            }else{
                                res.render(url+"/web/transaction/salesend.ejs",{data:"添加成功！但“修改记录表”添加失败。"});
                                pool.close()
                            }
                        }).catch(function(err){
                            console.log("==========");
                            console.log(Date());
                            console.log("修改记录表添加记录出错！");
                            console.log("error:"+err.message);
                            console.log("==========");
                            pool.close();
                        });
                    }else{
                        res.render(url+"/web/transaction/salesend.ejs",{data:"添加失败！"});
                        pool.close();
                    }
                }
            }).catch(function(err){
                console.log("==========");
                console.log(Date());
                console.log("请求地址："+req.url);
                console.log("error:"+err.message);
                console.log("==========");
                pool.close();
            });
        });
    });
    app.get("/transaction/saledelete.html",function(req,res){
        var strUrl=urls.parse(req.url).query;
        var saleId=strUrl==null?0:querystring.parse(strUrl)["saleId"];
        saleId=(isNaN(saleId)||saleId<=0)?0:saleId;
        if(saleId>0){
            pool.connect().then(function(sqlPool){
                var sqlRequest=sqlPool.request();
                return sqlRequest.input("saleId",sql.Int,saleId).query(`delete from Sale_Modification where Sale_Id=@saleId;delete from Sale where Sale_Id=@saleId`);
            }).then(function(result){
                if(result.rowsAffected[1]>0){
                    res.render(url+"/web/transaction/saledelete.ejs",{data:"删除成功！"});
                    pool.close();
                }else{
                    res.render(url+"/web/transaction/saledelete.ejs",{data:"删除失败！记录ID错误。"});
                    pool.close();
                }
            }).catch(function(err){
                console.log("==========");
                console.log(Date());
                console.log("请求地址："+req.url);
                console.log("error:"+err.message);
                console.log("==========");
                pool.close();
            });
        }else{
            res.render(url+"/web/transaction/saledelete.ejs",{data:"删除失败！记录ID错误。"});
        }
    });
    app.get("/transaction/stocklist.html",function(req,res){
        strUrl=urls.parse(req.url).query;
        var page=strUrl==null?1:querystring.parse(strUrl)["page"];
        page=(isNaN(page)||page<=0)?1:page;
        pool.connect().then(function(sqlPool){
            return sqlPool.request().query(`select st.Stock_Id, g.Goods_Name, so.Sort_Name, st.Stock_Number, st.Stock_Price, st.Stock_Count, st.Stock_Unit, st.Stock_Date from Stock as st, Goods as g, Sort as so where st.Stock_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id order by st.Stock_Id desc`);
        }).then(function(result){
            var dataObj=result.recordset;
            var count=result.rowsAffected[0];
            var reqUrl=urls.parse(req.url).pathname;
            var viewCount=15;
            var viewList=pageNumber.pickList(dataObj,page,viewCount);
            var numHtml=pageNumber.numberList(count,page,viewCount,reqUrl);
            res.render(url+"/web/transaction/stocklist.ejs",{data:viewList,numControl:numHtml});
            pool.close();
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.get("/transaction/stockedit.html",function(req,res){
        var strUrl=urls.parse(req.url).query;
        var stockId=strUrl!=null?querystring.parse(strUrl)["stockId"]:0;
        stockId=(isNaN(stockId)||stockId<=0)?0:stockId;
        pool.connect().then(function(sqlPool){
            return sqlPool.request().input("stockId",sql.Int,stockId).query(`select * from Sort order by Sort_Name;select Goods_Id, Goods_Name, Goods_Sort, Goods_Price from Goods order by Goods_Name;select st.Stock_Id, g.Goods_Id, so.Sort_Id, st.Stock_Number, st.Stock_Price, st.Stock_Count, st.Stock_Unit, st.Stock_Date from Stock as st, Goods as g, Sort as so where st.Stock_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and st.Stock_Id=@stockId`);
        }).then(function(result){
            if(result.rowsAffected[2]>0){
                res.render(url+"/web/transaction/stockedit.ejs",{data:result.recordsets[2][0],sortList:result.recordsets[0],goodsList:result.recordsets[1]});
                pool.close();
            }else{
                res.render(url+"/web/transaction/stockedit.ejs",{data:{Stock_Id:0},sortList:result.recordsets[0],goodsList:result.recordsets[1]});
                pool.close();
            }
        }).catch(function(err){
            console.log("==========");
            console.log(Date());
            console.log("请求地址："+req.url);
            console.log("error:"+err.message);
            console.log("==========");
            pool.close();
        });
    });
    app.post("/transaction/stocksend.html",function(req,res){
        var dataPost="";
        req.on("data",function(chunk){
            dataPost+=chunk;
        });
        req.on("end",function(){
            var dataObj=querystring.parse(dataPost);
            var now=new Date();
            var stockNumber="ST";
            var dataObjTimeStr="";
            dataObjTimeStr+=dataObj.formStockYear;
            dataObjTimeStr+="-"+(dataObj.formStockMonth<10?"0"+dataObj.formStockMonth:dataObj.formStockMonth);
            dataObjTimeStr+="-"+(dataObj.formStockDay<10?"0"+dataObj.formStockDay:dataObj.formStockDay);
            dataObjTimeStr+=" "+(dataObj.formStockHours<10?"0"+dataObj.formStockHours:dataObj.formStockHours);
            dataObjTimeStr+=":"+(dataObj.formStockMinutes<10?"0"+dataObj.formStockMinutes:dataObj.formStockMinutes);
            dataObjTimeStr+=":"+(dataObj.formStockSecond<10?"0"+dataObj.formStockSecond:dataObj.formStockSecond);
            pool.connect().then(function(sqlPool){
                var sqlRequest=sqlPool.request();
                sqlRequest.input("goodsId",sql.Int,dataObj.formGoodsId);
                sqlRequest.input("stockPrice",sql.Float,dataObj.formStockPrice);
                sqlRequest.input("stockCount",sql.Int,dataObj.formStockCount);
                sqlRequest.input("stockUnit",sql.NVarChar,dataObj.formStockUnit);
                sqlRequest.input("stockDate",sql.DateTime2,dataObjTimeStr);
                if(dataObj.stockId>0){
                    sqlRequest.input("stockId",sql.Int,dataObj.stockId);
                    sqlRequest.input("stockNumber",sql.NVarChar,dataObj.stockNumber);
                    return sqlRequest.query(`update Stock set Stock_Goods=@goodsId,Stock_Number=@stockNumber,Stock_Price=@stockPrice,Stock_Count=@stockCount,Stock_Unit=@stockUnit,Stock_Date=@stockDate where Stock_Id=@stockId`);
                }else{
                    var _year=now.getFullYear().toString();
                    var _month=now.getMonth()<9?"0"+(now.getMonth()+1).toString():(now.getMonth()+1).toString();
                    var _date=now.getDate()<10?"0"+now.getDate().toString():now.getDate().toString();
                    var _hour=now.getHours()<10?"0"+now.getHours().toString():now.getHours().toString();
                    var _minute=now.getMinutes()<10?"0"+now.getMinutes().toString():now.getMinutes().toString();
                    var _second=now.getSeconds()<10?"0"+now.getSeconds().toString():now.getSeconds().toString();
                    stockNumber+=_year+_month+_date+_hour+_minute+_second;
                    sqlRequest.input("stockNumber",sql.NVarChar,stockNumber);
                    return sqlRequest.query(`insert into Stock values (@goodsId,@stockNumber,@stockPrice,@stockCount,@stockUnit,@stockDate);select @@IDENTITY as Id`);
                }
            }).then(function(result){
                if(dataObj.stockId>0){
                    if(result.rowsAffected[0]>0){
                        pool.close();
                        pool.connect().then(function(sqlPool){
                            var sqlRequest=sqlPool.request();
                            sqlRequest.input("stockId",sql.Int,dataObj.stockId);
                            sqlRequest.input("goodsId",sql.Int,dataObj.formGoodsId);
                            sqlRequest.input("stockNumber",sql.NVarChar,dataObj.stockNumber);
                            sqlRequest.input("stockPrice",sql.Float,dataObj.formStockPrice);
                            sqlRequest.input("stockCount",sql.Int,dataObj.formStockCount);
                            sqlRequest.input("stockUnit",sql.NVarChar,dataObj.formStockUnit);
                            sqlRequest.input("stockDate",sql.DateTime2,dataObjTimeStr);
                            sqlRequest.input("stockModifyDate",sql.DateTime2,now);
                            return sqlRequest.query(`insert into Stock_Modification values (@stockId,@goodsId,@stockNumber,@stockPrice,@stockCount,@stockUnit,@stockDate,@stockModifyDate);select @@IDENTITY as Id`);
                        }).then(function(_result){
                            if(_result.recordset[0].Id>0){
                                res.render(url+"/web/transaction/stocksend.ejs",{data:"修改成功！"});
                                pool.close();
                            }else{
                                res.render(url+"/web/transaction/stocksend.ejs",{data:"修改成功！但“修改记录表”添加失败。"});
                                pool.close();
                            }
                        }).catch(function(err){
                            console.log("==========");
                            console.log(Date());
                            console.log("请求地址："+req.url);
                            console.log("修改进货记录后，进货记录修改表操作");
                            console.log("error:"+err.message);
                            console.log("==========");
                            pool.close();
                        });
                    }else{
                        res.render(url+"/web/transaction/stocksend.ejs",{data:"修改失败！该记录已不存在。"})
                        pool.close();
                    }
                }else{
                    if(result.recordset[0].Id>0){
                        pool.close();
                        pool.connect().then(function(sqlPool){
                            var sqlRequest=sqlPool.request();
                            sqlRequest.input("stockId",sql.Int,result.recordset[0].Id);
                            sqlRequest.input("goodsId",sql.Int,dataObj.formGoodsId);
                            sqlRequest.input("stockNumber",sql.NVarChar,stockNumber);
                            sqlRequest.input("stockPrice",sql.Float,dataObj.formStockPrice);
                            sqlRequest.input("stockCount",sql.Int,dataObj.formStockCount);
                            sqlRequest.input("stockUnit",sql.NVarChar,dataObj.formStockUnit);
                            sqlRequest.input("stockDate",sql.DateTime2,dataObjTimeStr);
                            sqlRequest.input("stockModifyDate",sql.DateTime2,now);
                            return sqlRequest.query(`insert into Stock_Modification values (@stockId,@goodsId,@stockNumber,@stockPrice,@stockCount,@stockUnit,@stockDate,@stockModifyDate);select @@IDENTITY as Id`);
                        }).then(function(_result){
                            if(_result.recordset[0].Id>0){
                                res.render(url+"/web/transaction/stocksend.ejs",{data:"添加成功！"});
                                pool.close();
                            }else{
                                res.render(url+"/web/transaction/stocksend.ejs",{data:"添加成功！但“修改记录表”添加失败。"});
                                pool.close();
                            }
                        }).catch(function(err){
                            console.log("==========");
                            console.log(Date());
                            console.log("请求地址："+req.url);
                            console.log("添加进货记录后，进货记录修改表操作");
                            console.log("error:"+err.message);
                            console.log("==========");
                            pool.close();
                        });
                    }else{
                        res.render(url+"/web/transaction/stocksend.ejs",{data:"添加失败！"});
                        pool.close();
                    }
                }
            }).catch(function(err){
                console.log("==========");
                console.log(Date());
                console.log("请求地址："+req.url);
                console.log("error:"+err.message);
                console.log("==========");
                pool.close();
            });
        });
    });
    app.get("/transaction/stockdelete.html",function(req,res){
        var strUrl=urls.parse(req.url).query;
        var stockId=strUrl==null?0:querystring.parse(strUrl)["stockId"];
        stockId=(isNaN(stockId)||stockId<=0)?0:stockId;
        if(stockId>0){
            pool.connect().then(function(sqlPool){
                return sqlPool.request().input("stockId",sql.Int,stockId).query(`delete from Stock_Modification where Stock_Id=@stockId;delete from Stock where Stock_Id=@stockId;`);
            }).then(function(result){
                if(result.rowsAffected[1]>0){
                    res.render(url+"/web/transaction/stockdelete.ejs",{data:"删除成功！"});
                    pool.close();
                }else{
                    res.render(url+"/web/transaction/stockdelete.ejs",{data:"删除失败！记录不存在。"});
                    pool.close();
                }
            }).catch(function(err){
                console.log("==========");
                console.log(Date());
                console.log("请求地址："+req.url);
                console.log("error:"+err.message);
                console.log("==========");
                pool.close();
            });
        }else{
            res.render(url+"/web/transaction/stockdelete.ejs",{data:"删除失败！记录ID错误。"});
        }
    });
    app.get("/statistics/salesstatistics.html",function(req,res){
        var argument=statisticsArgument.getArgument(req.url);
        pool.connect().then(function(sqlPool){
            var startTimeStr=argument.startTime.getFullYear()+"-"+(parseInt(argument.startTime.getMonth())+1)+"-"+argument.startTime.getDate();
            var endTimeStr=argument.endTime.getFullYear()+"-"+(parseInt(argument.endTime.getMonth())+1)+"-"+argument.endTime.getDate();
            var sqlRequest=sqlPool.request();
            sqlRequest.input("startTime",sql.DateTime2,startTimeStr);
            sqlRequest.input("endTime",sql.DateTime2,endTimeStr);
            return sqlRequest.query(`select sum(Sale_Price*Sale_Count) as SaleTotal from Sale where Sale_Date between @startTime and @endTime;select so.Sort_Id,so.Sort_Name,sum(sa.Sale_Price*sa.Sale_Count) as Total from Sale as sa,Goods as g,Sort as so where sa.Sale_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and sa.Sale_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name order by Total desc;select so.Sort_Id,so.Sort_Name,g.Goods_Name,sum(sa.Sale_Price*sa.Sale_Count) as Total from Sale as sa,Goods as g,Sort as so where sa.Sale_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and sa.Sale_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name,g.Goods_Name order by Total desc`);
        }).then(function(result){
            var totalCanvaData=statisticsArgument.parseTotalHtml(result,0);
            var classifyCanvaData=statisticsArgument.parseClassifyHtml(result,0);

            var title="";
            if(argument.year!=null){
                title+=argument.year+"年";
                if(argument.month!=null){
                    title+=argument.month+"月";
                    if(argument.date!=null){
                        title+=argument.date+"日";
                    }
                }
            }else{
                title+="今日";
            }

            res.render(url+"/web/statistics/salesstatistics.ejs",{total:result.recordsets[0][0].SaleTotal,sortList:result.recordsets[1],title:title,canvaDataAll:totalCanvaData,canvaDataClassify:classifyCanvaData,type:0});
            pool.close();
        }).catch(function(err){
            errorObj.error(err,req.url);
            pool.close();
        });
    });
    app.get("/statistics/salecountstatistics.html",function(req,res){
        var argument=statisticsArgument.getArgument(req.url);
        pool.connect().then(function(sqlPool){
            var startTime=argument.startTime.getFullYear()+"-"+(parseInt(argument.startTime.getMonth())+1)+"-"+argument.startTime.getDate();
            var endTime=argument.endTime.getFullYear()+"-"+(parseInt(argument.endTime.getMonth())+1)+"-"+argument.endTime.getDate();
            var sqlRequest=sqlPool.request();
            sqlRequest.input("startTime",sql.DateTime2,startTime);
            sqlRequest.input("endTime",sql.DateTime2,endTime);
            return sqlRequest.query(`select sum(Sale_Count) as CountTotal from Sale where Sale_Date between @startTime and @endTime;select so.Sort_Id,so.Sort_Name,sum(sa.Sale_Count) as Total from Sale as sa,Goods as g,Sort as so where sa.Sale_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and sa.Sale_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name order by Total desc;select so.Sort_Id,so.Sort_Name,g.Goods_Name,sum(sa.Sale_Count) as Total from Sale as sa,Goods as g,Sort as so where sa.Sale_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and sa.Sale_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name,g.Goods_Name order by Total desc;`);
        }).then(function(result){
            var totalCanvaData=statisticsArgument.parseTotalHtml(result,1);
            var classifyCanvaData=statisticsArgument.parseClassifyHtml(result,1);

            var title="";
            if(argument.year!=null){
                title+=argument.year+"年";
                if(argument.month!=null){
                    title+=argument.month+"月";
                    if(argument.date!=null){
                        title+=argument.date+"日";
                    }
                }
            }else{
                title+="今日";
            }

            res.render(url+"/web/statistics/salesstatistics.ejs",{total:result.recordsets[0][0].CountTotal,sortList:result.recordsets[1],title:title,canvaDataAll:totalCanvaData,canvaDataClassify:classifyCanvaData,type:1});
            pool.close();
        }).catch(function(err){
            errorObj.error(err,req.url);
            pool.close();
        });
    });
    app.get("/statistics/stockstatistics.html",function(req,res){
        var argument=statisticsArgument.getArgument(req.url);
        pool.connect().then(function(sqlPool){
            var startTime=argument.startTime.getFullYear()+"-"+(parseInt(argument.startTime.getMonth())+1)+"-"+argument.startTime.getDate();
            var endTime=argument.endTime.getFullYear()+"-"+(parseInt(argument.endTime.getMonth())+1)+"-"+argument.endTime.getDate();
            var sqlRequest=sqlPool.request();
            sqlRequest.input("startTime",sql.DateTime2,startTime);
            sqlRequest.input("endTime",sql.DateTime2,endTime);
            return sqlRequest.query(`select sum(Stock_Price*Stock_Count) as StockTotal from Stock where Stock_Date between @startTime and @endTime;select so.Sort_Id,so.Sort_Name,sum(st.Stock_Price*st.Stock_Count) as Total from Stock as st,Goods as g,Sort as so where st.Stock_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and st.Stock_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name order by Total desc;select so.Sort_Id,so.Sort_Name,g.Goods_Name,sum(st.Stock_Price*st.Stock_Count) as Total from Stock as st,Goods as g,Sort as so where st.Stock_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and st.Stock_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name,g.Goods_Name order by Total desc`);
        }).then(function(result){
            var totalCanvaData=statisticsArgument.parseTotalHtml(result,2);
            var classifyCanvaData=statisticsArgument.parseClassifyHtml(result,2);

            var title="";
            if(argument.year!=null){
                title+=argument.year+"年";
                if(argument.month!=null){
                    title+=argument.month+"月";
                    if(argument.date!=null){
                        title+=argument.date+"日";
                    }
                }
            }else{
                title+="今日";
            }

            res.render(url+"/web/statistics/salesstatistics.ejs",{total:result.recordsets[0][0].StockTotal,sortList:result.recordsets[1],title:title,canvaDataAll:totalCanvaData,canvaDataClassify:classifyCanvaData,type:2});
            pool.close();
        }).catch(function(err){
            errorObj.error(err,req.url);
            pool.close();
        });
    });
    app.get("/statistics/stockcountstatistics.html",function(req,res){
        var argument=statisticsArgument.getArgument(req.url);
        pool.connect().then(function(sqlPool){
            var startTime=argument.startTime.getFullYear()+"-"+(parseInt(argument.startTime.getMonth())+1)+"-"+argument.startTime.getDate();
            var endTime=argument.endTime.getFullYear()+"-"+(parseInt(argument.endTime.getMonth())+1)+"-"+argument.endTime.getDate();
            var sqlRequest=sqlPool.request();
            sqlRequest.input("startTime",sql.DateTime2,startTime);
            sqlRequest.input("endTime",sql.DateTime2,endTime);
            return sqlRequest.query(`select sum(Stock_Count) as CountTotal from Stock where Stock_Date between @startTime and @endTime;select so.Sort_Id,so.Sort_Name,sum(st.Stock_Count) as Total from Stock as st,Goods as g,Sort as so where st.Stock_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and st.Stock_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name order by Total desc;select so.Sort_Id,so.Sort_Name,g.Goods_Name,sum(st.Stock_Count) as Total from Stock as st,Goods as g,Sort as so where st.Stock_Goods=g.Goods_Id and g.Goods_Sort=so.Sort_Id and st.Stock_Date between @startTime and @endTime group by so.Sort_Id,so.Sort_Name,g.Goods_Name order by Total desc;`);
        }).then(function(result){
            var totalCanvaData=statisticsArgument.parseTotalHtml(result,3);
            var classifyCanvaData=statisticsArgument.parseClassifyHtml(result,3);

            var title="";
            if(argument.year!=null){
                title+=argument.year+"年";
                if(argument.month!=null){
                    title+=argument.month+"月";
                    if(argument.date!=null){
                        title+=argument.date+"日";
                    }
                }
            }else{
                title+="今日";
            }

            res.render(url+"/web/statistics/salesstatistics.ejs",{total:result.recordsets[0][0].CountTotal,sortList:result.recordsets[1],title:title,canvaDataAll:totalCanvaData,canvaDataClassify:classifyCanvaData,type:3});
            pool.close();
        }).catch(function(err){
            errorObj.error(err,req.url);
            pool.close();
        });
    });
}
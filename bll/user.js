var bcrypt=require("bcrypt");
var mssql=require("mssql");
var config=require("./config.js");
var errorObj=require("./error.js");

var pool=new mssql.ConnectionPool(config.dbConfig);

module.exports={
    login:async function(uid,upwd){
        /* =============================== */
        // from DB or Config
        //const dbId=config.user.id;
        //const dbPwd=config.user.pwd;
        var dbPwd;
        //var pool=new mssql.ConnectionPool(config.dbConfig);
        //(async function(){
            var sqlPool=await pool.connect();
            var result =await sqlPool.request().input(`usersAccount`,mssql.NVarChar,uid).query(`select * from Users where Users_Account=@usersAccount`);
            //console.log(result);
            if(result.rowsAffected[0]>0){
                dbPwd=result.recordset[0].Users_Password;
            }else{
                dbPwd="";
            }
            pool.close();
            var success=true;
            //if(uid!=dbId) success=false;
            /*
            bcrypt.compareSync(upwd,dbPwd,function(err,res){
                console.log("bcrypt!");
                if(!res) success=false;
            });
            */
            success=bcrypt.compareSync(upwd,dbPwd);
            return success;
            /*
            pool.connect().then(function(sqlPool){
                var sqlRequest=sqlPool.request();
                sqlRequest.input("usersAccount",mssql.NVarChar,uid);
                return sqlRequest.query(`select * from Users where Users_Account=@usersAccount`);
            }).then(function(result){
                console.log(result);
                if(result.rowsAffected[0]>0){
                    dbPwd=result.recordset[0].Users_Password;
                }else{
                    dbPwd="";
                }
                pool.close();
            }).catch(function(err){
                errorObj.error(err,"/login.html");
                pool.close();
            });
            */
        //})()
        //console.log(uid+","+upwd);
        /* =============================== */
        /*
        var success=true;
        console.log(dbPwd);
        //if(uid!=dbId) success=false;
        bcrypt.compareSync(upwd,dbPwd,function(err,res){
            if(!res) success=false;
        });
        return success;
        */
        
    },
    getLevel:async function(uid){
        var sqlPool=await pool.connect();
        var result=await sqlPool.request().input(`usersAccount`,mssql.NVarChar,uid).query(`select u.Users_Id,u.Users_Account,ug.UsersGroup_Name,ug.UsersGroup_Level from Users as u,UsersGroup as ug where u.Users_Group=ug.UsersGroup_Id and u.Users_Account=@usersAccount`);
        pool.close();
        if(result.rowsAffected[0]>0) return result.recordset[0].UsersGroup_Level;
        else return -1;
    }
}
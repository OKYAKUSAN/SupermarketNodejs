var config=require("./config.js");

module.exports={
    checkUserId:function(req){
        if(req.signedCookies.user_id){
            var id=req.signedCookies.user_id;
            if(id.toString()==config.user.id) return true;
            else return false;
        }else return false;
    },

    checkLogin:function(req){
        if(req.signedCookies.login){
            var login=req.signedCookies.login;
            if(login==1) return true;
            else return false;
        }else return false;
    }
}
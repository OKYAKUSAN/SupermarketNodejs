var url=require("url");
var querystring=require("querystring");

module.exports={
    getArgument:function(reqUrl){
        var strUrl=url.parse(reqUrl).query;
        var type=strUrl!=null?querystring.parse(strUrl)["type"]:0;
        type=(isNaN(type)||type<0||type>3)?0:type;
        var yearStr=querystring.parse(strUrl)["year"];
        var monthStr=querystring.parse(strUrl)["month"];
        var dateStr=querystring.parse(strUrl)["date"];
        var time=new Date();
        var time2=new Date(time);
        time2=new Date(time2.setDate(time2.getDate()+1));
        if(yearStr!=null){
            var timeStr=yearStr;
            if(monthStr!=null){
                timeStr+="-"+monthStr;
                if(dateStr!=null){
                    timeStr+="-"+dateStr;
                    time=new Date(timeStr);
                    time2=new Date(time);
                    time2=new Date(time2.setDate(time2.getDate()+1));
                }else{
                    time=new Date(timeStr);
                    time2=new Date(time);
                    time2=new Date(time2.setMonth(time2.getMonth()+1));
                }
            }else{
                time=new Date(timeStr);
                time2=new Date(time);
                time2=new Date(time2.setFullYear(time2.getFullYear()+1));
            }
        }

        var result={
            type:type,      // 0：销售额；1：销售量；2：采购额；3：采购量
            year:yearStr,
            month:monthStr,
            date:dateStr,
            startTime:time,
            endTime:time2
        }
        return result;
    },

    parseTotalHtml:function(sqlDate,type){
        var totalCanvaData="";
        if(sqlDate.rowsAffected[1]>0){
            totalCanvaData+="[";
            var theFirst=true;
            sqlDate.recordsets[1].forEach(function(item){
                if(!theFirst){
                    totalCanvaData+=",";
                }else theFirst=false;
                totalCanvaData+="{name:'"+item.Sort_Name+"',";
                totalCanvaData+="y:"+(type==0||type==2?parseFloat(item.Total):item.Total)+"}";
            });
            totalCanvaData+="]";
        }else{
            totalCanvaData="[{name:'',y:0}]";
        }
        return totalCanvaData;
    },

    parseClassifyHtml:function(sqlDate,type){
        var sortIdArray=[];
        var classifyCanvaData="";
        var classifyCanvaDataTemp=[];
        if(sqlDate.rowsAffected[1]>0){
            sqlDate.recordsets[1].forEach(function(item){
                sortIdArray.push(item.Sort_Id);
                classifyCanvaDataTemp.push([]);
            });
        }
        var getIndex=function(id){
            for(var i=0;i<sortIdArray.length;i++){
                if(id==sortIdArray[i]) return i;
            }
        }
        sqlDate.recordsets[2].forEach(function(item){
            classifyCanvaDataTemp[getIndex(item.Sort_Id)].push({
                name:item.Goods_Name,
                y:type==0||type==2?parseFloat(item.Total):item.Total
            });
        });
        var parentFirst=true;
        var subFirst=true;
        classifyCanvaData+="[";
        classifyCanvaDataTemp.forEach(function(item){
            if(!parentFirst) classifyCanvaData+=",";
            else parentFirst=false;
            classifyCanvaData+="[";
            item.forEach(function(_item){
                if(!subFirst) classifyCanvaData+=",";
                else subFirst=false;
                classifyCanvaData+="{name:'"+_item.name+"',";
                classifyCanvaData+="y:"+_item.y+"}";
            });
            classifyCanvaData+="]";
            subFirst=true;
        });
        classifyCanvaData+="]";

        return classifyCanvaData;
    }
}
module.exports={
    numberList:function(count,page,viewCount,url){
        if(count>viewCount){
            var viewNum=10;
            var maxPage=count%viewCount==0?count/viewCount:parseInt(count/viewCount)+1;
            var startPage=parseInt(page/viewNum)*viewNum+1;
            var endPage=(parseInt(page/viewNum)+1)*viewNum;
            endPage=endPage>maxPage?maxPage:endPage;
            var html="";
            html+="<div class='pageNumControl'><div class='pageNum'>";
            html+=page==1?"":"<a href='"+url+"?page="+(page-1)+"' target='rightFrame'>上一页</a>";
            if(page>10){
                html+="<a href='"+url+"?page=1' target='rightFrame'>1</a>";
                html+="<span>...</span>";
            }
            for(var i=startPage;i<=endPage;i++){
                html+="<a href='"+url+"?page="+i+"' target='rightFrame'"+(page==i?" class='sel'":"")+">"+i+"</a>";
            }
            if(endPage<maxPage){
                html+="<span>...</span>";
                html+="<a href='"+url+"?page="+maxPage+"' target='rightFrame'>"+maxPage+"</a>";
            }
            html+=page==maxPage?"":"<a href='"+url+"?page="+(parseInt(page)+1)+"' target='rightFrame'>下一页</a>";
            html+="</div></div>";

            return html;
        }else return "";
    },
    numberList:function(count,page,viewCount,url,argument){
        if(count>viewCount){
            var arg="";
            for(var key in argument) arg+="&"+key+"="+argument[key];
            var viewNum=10;
            var maxPage=count%viewCount==0?count/viewCount:parseInt(count/viewCount)+1;
            var startPage=parseInt(page/viewNum)*viewNum+1;
            var endPage=(parseInt(page/viewNum)+1)*viewNum;
            endPage=endPage>maxPage?maxPage:endPage;
            var html="";
            html+="<div class='pageNumControl'><div class='pageNum'>";
            html+=page==1?"":"<a href='"+url+"?page="+(page-1)+arg+"' target='rightFrame'>上一页</a>";
            /*
            if(page==1) html+="";
            else {
                html+="<a href='"+url+"?page="+(page-1);
                keyArr.forEach(function(key){
                    html+="&"+key+"="+argument[key];
                });
                html+="' target='rightFrame'>上一页</a>";
            }
            */
            if(page>10){
                html+="<a href='"+url+"?page=1"+arg+"' target='rightFrame'>1</a>";
                html+="<span>...</span>";
            }
            for(var i=startPage;i<=endPage;i++){
                html+="<a href='"+url+"?page="+i+arg+"' target='rightFrame'"+(page==i?" class='sel'":"")+">"+i+"</a>";
            }
            if(endPage<maxPage){
                html+="<span>...</span>";
                html+="<a href='"+url+"?page="+maxPage+arg+"' target='rightFrame'>"+maxPage+"</a>";
            }
            html+=page==maxPage?"":"<a href='"+url+"?page="+(parseInt(page)+1)+arg+"' target='rightFrame'>下一页</a>";
            html+="</div></div>";

            return html;
        }else return "";
    },
    pickList:function(list,page,viewCount){
        var resultList=[];
        var count=list.length;
        var startIndex=(page-1)*viewCount;
        var endIndex=page*viewCount-1;
        if(endIndex>count-1) endIndex=count-1;
        for(var i=startIndex;i<=endIndex;i++){
            resultList.push(list[i]);
        }
        return resultList;
    }
}
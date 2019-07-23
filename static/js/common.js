var dateselector=function(yearObj,monthObj,dateObj){
    var currentDate=new Date();
    var year=currentDate.getFullYear();
    for(var i=2018;i<=year;i++){
        yearObj.append("<option value='"+i+"'>"+i+"</option>");
    }
    for(var j=1;j<=12;j++){
        monthObj.append("<option value='"+j+"'>"+j+"</option>");
    }
    for(var k=1;k<=31;k++){
        dateObj.append("<option value='"+k+"'>"+k+"</option>");
    }
    var year;
    yearObj.change(function(){
        year=$(this).val();
        dateObj.val("");
        dateObj.children(":gt(0)").hide();
        dateObj.attr("disabled","disabled");
        monthObj.val("");
        if(year!="") monthObj.removeAttr("disabled");
        else monthObj.attr("disabled","disabled");
    });
    monthObj.change(function(){
        var month=$(this).val();
        var leapyear=true;
        dateObj.val("");
        dateObj.children(":gt(0)").hide();
        if(month==1||month==3||month==5||month==7||month==8||month==10||month==12){
            dateObj.children(":gt(0)").show();
            dateObj.removeAttr("disabled");
        }else if(month==4||month==6||month==9||month==11){
            dateObj.children(":lt(31)").show();
            dateObj.removeAttr("disabled");
        }else if(month==2){
            if((year%4==0&&year%100!=0)||year%400==0) leapyear=true;
            else leapyear=false;
            if(leapyear){
                dateObj.children(":lt(30)").show();
                dateObj.removeAttr("disabled");
            }else{
                dateObj.children(":lt(29)").show();
                dateObj.removeAttr("disabled");
            }
        }else dateObj.attr("disabled","disabled");
    });
}
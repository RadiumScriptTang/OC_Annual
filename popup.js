function showQR(qrDiv,user_id){
    new QRCode(document.getElementById("qrcode"),{
        text: "http://10.162.58.36/?user_id=" + user_id,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    qrDiv.show();
}
document.getElementById("accept").addEventListener("click", function (event){
    let tipSpan = $("#tip");
    let qrDiv = $("#qrcode");
    tipSpan.show();
    chrome.tabs.getSelected(null, function (tab) {　　// 先获取当前页面的tabID
        chrome.tabs.sendMessage(tab.id, {action: "collect"}, function(response) {
            console.log(response);
            let user_id = response.user_id;
            let exist = false;
            $.ajax({
                url: "http://10.162.58.36/api/index/check?user_id=" + user_id,
                type: "get",
                async: false,
                success: function (data){
                    exist = data.res != null;
                }
            });
            if(exist){
                tipSpan.hide();
                showQR(qrDiv, user_id);
                return;
            }
            $.ajax({
                url: "http://10.162.58.36/api/index/upload",
                type: "post",
                data:{
                    user_id: response.user_id,
                    course: JSON.stringify({
                        courses: response.courses,
                        groups: response.groups
                    })
                },
                async: false,
                success: function (data){
                    res = data;

                }, error: function (data){
                    res = data;
                }
            });
            console.log(res.responseText);
            tipSpan.hide();
            showQR(qrDiv, user_id);

        });
    });

});
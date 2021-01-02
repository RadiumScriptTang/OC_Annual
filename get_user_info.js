
let courses;
let groups;
let user_id;

// 设置popup 操作的响应
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse){
        if(request.action === "collect"){
            collect();
            sendResponse({user_id: user_id, courses: courses, groups: groups});
            return true;
        }
    }
)


function simplifyCourseData(data){
    let ben = [], shuo = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i].course_code.indexOf('本') > -1){
            ben.push(data[i]);
        } else if (data[i].course_code.indexOf('研') > -1){
            shuo.push(data[i]);
        }
    }
    let res = [], obj = null;
    if (ben.length > shuo.length){
        obj = ben;
    } else {
        obj = shuo;
    }
    for (const objElement of obj) {
        res.push({
            id: objElement.id,
            name: objElement.name
        });
    }
    return res;
}

function simplifyGroupData(data, courses){
    let res = [];
    for (const datum of data) {
        let course_id = datum.course_id;
        let course_name = '';
        for (const course of courses) {
            if (course.id === course_id){
                course_name = course.name;
                break;
            }
        }
        res.push({
            name: datum.name,
            course_name: course_name
        });
    }
    return res;
}

function parseAssignment(course_id, data, courses){
    let assignments = data[0].assignments;
    let i;
    for (i = 0; i < courses.length; i++) {
        if (courses[i].id === course_id){
            break;
        }
    }
    let res = [];
    for (const assignment of assignments) {
        res.push({
            name: assignment.name,
            ddl: assignment.due_at
        });
    }
    courses[i].assignments = res;

}

function collect(){
    // 用户名
    $.ajax({
        url: "https://oc.sjtu.edu.cn/profile/settings",
        type: "get",
        async: false,
        success: function (data){
            console.log()
            let username = data.toString().match(/","sortable_name":"(.*?)","/i)[1];
            user_id = md5(username);
        }, error: function (data){


        }
    });
    // 课程
    $.ajax({
        url: "https://oc.sjtu.edu.cn/api/v1/users/self/favorites/courses?include[]=term&exclude[]=enrollments",
        type: "get",
        async: false,
        success: function (data){
            courses = simplifyCourseData(data);
        }, error: function (data){
            data = JSON.parse(data.responseText.substring(9));
            courses = simplifyCourseData(data);

        }
    });

    // 小组
    $.ajax({
        url: "https://oc.sjtu.edu.cn/api/v1/users/self/groups?include[]=can_access",
        type: "get",
        async: false,
        success: function (data){
            groups = simplifyGroupData(data, courses);
        }, error: function (data){
            data = JSON.parse(data.responseText.substring(9));
            groups = simplifyGroupData(data, courses);
        }
    });

    // 作业
    for (const course of courses) {
        $.ajax({
            url: "https://oc.sjtu.edu.cn/api/v1/courses/" + course.id + "/assignment_groups?include%5B%5D=assignments&include%5B%5D" +
                "=discussion_topic&exclude_response_fields%5B%5D=description&exclude_response_fields%5B%5D=rubric&" +
                "override_assignment_dates=true",
            type: "get",
            async: false,
            success: function (data){
                parseAssignment(course.id, data, courses);
            }, error: function (data){
                data = JSON.parse(data.responseText.substring(9));
                parseAssignment(course.id, data, courses);
            }
        });
    }



    chrome.runtime.sendMessage({action: "send", user_id: user_id, courses: courses, groups: groups} ,function (response){
        console.log(response);
    });


    // $.ajax({
    //     url: "http://10.162.58.36/api/index/upload",
    //     type: "post",
    //     data:{
    //         user_id: user_id,
    //         course: JSON.stringify({
    //             courses: courses,
    //             groups: groups
    //         })
    //     },
    //     async: false,
    //     success: function (data){
    //         console.log(data);
    //     }, error: function (data){
    //         console.log(data);
    //     }
    // });
}
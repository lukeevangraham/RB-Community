console.log("here comes vimeo")

let Vimeo = require('vimeo').Vimeo;
let client = new Vimeo("{ac57edb9326ac766be6e2a7aa4d47eabb0ffd7ec}", "{kZL4S+dplgl8zw+XlITWX4xUSToQzagNXrYs7gYD1sWlnWzpD2HH72cMOD23sJAJmoOUn6xQX4YoYDjN0T2z3YQ8npEvu6IEKa4+ZYs+/Nq67PFzdAnBcLVQ02tYkiAj}", "{21b5f2de40eda8eb72b6b1fb87fdae76}");


client.request({
    method: 'GET',
    path: '/tutorial'
}, function (error, body, status_code, headers) {
    if (error) {
        console.log(error);
    }

    console.log(body);
})
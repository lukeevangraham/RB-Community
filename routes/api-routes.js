var db = require("../models");
let Vimeo = require('vimeo').Vimeo;
let client = new Vimeo("{ac57edb9326ac766be6e2a7aa4d47eabb0ffd7ec}", "{kZL4S+dplgl8zw+XlITWX4xUSToQzagNXrYs7gYD1sWlnWzpD2HH72cMOD23sJAJmoOUn6xQX4YoYDjN0T2z3YQ8npEvu6IEKa4+ZYs+/Nq67PFzdAnBcLVQ02tYkiAj}", "{21b5f2de40eda8eb72b6b1fb87fdae76}");

module.exports = function (app) {   
    // client.request({
    //   method: 'GET',
    //   path: '/tutorial'
    // }, function (error, body, status_code, headers) {
    //   if (error) {
    //     console.log(error);
    //   }
    
    //   console.log(body);
    // })


    // GET route for getting all of the posts
    app.get("/api/events/", function (req, res) {
        db.Event.findAll({})
            .then(function (dbPost) {
                res.json(dbPost);
            });
    });


    // POST route for saving a new event post
    app.post("/api/posts", function (req, res) {
        // console.log(req.body);
        db.Event.create({
            title: req.body.title,
            date: req.body.date,
            longdate: req.body.longdate,
            month: req.body.month,
            time: req.body.time,
            location: req.body.location,
            description: req.body.description,
            imgurl: req.body.imgurl,
            featured: req.body.featured,
            published: req.body.featured,
        })
            .then(function (dbPost) {
                console.log("dbPost: ", dbPost)
                res.json(dbPost);
            });
    });


        // POST route for saving a new event post
        app.post("/api/postblog", function (req, res) {
          console.log(req.body);
          db.Blog.create({
              title: req.body.title,
              author: req.body.author,
              imgurl: req.body.imgurl,
              date: req.body.date,
              longdate: req.body.longdate,
              month: req.body.month,
              time: req.body.time,
              maincontent: req.body.maincontent,
              shortenedmain: req.body.shortenedmain,
              featured: req.body.featured,
              published: req.body.featured,
          })
              .then(function (dbPost) {
                  console.log("dbPost: ", dbPost)
                  res.json(dbPost);
              });
      });
}
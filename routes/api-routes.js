var db = require("../models");

module.exports = function (app) {
    // GET route for getting all of the posts
    app.get("/api/events/", function (req, res) {
        db.Event.findAll({})
            .then(function (dbPost) {
                res.json(dbPost);
            });
    });


    // POST route for saving a new post
    app.post("/api/posts", function (req, res) {
        // console.log(req.body);
        db.Event.create({
            title: req.body.title,
            date: req.body.date,
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
}
var path = require("path");

// Import the model (event.js) to use its database functions
var db = require("../models/");

// Routes
module.exports = function (app) {
    // app.get("/", function (req, res) {
    //     res.sendFile(path.join(__dirname, "../public.blog.html"));
    // });

    app.get('/', function (req, res) {
        db.Event.findAll({
            raw: true,
        })
            .then(function (dbEvent) {
                var hbsObject = {
                    events: dbEvent,
                    headContent: `<link rel="stylesheet" type="text/css" href="styles/main_styles.css">
        <link rel="stylesheet" type="text/css" href="styles/responsive.css">`
                };

                res.render('home', hbsObject);
            })
    })

    app.get("/cms", function (req, res) {
        res.sendFile(path.join(__dirname, "../public/cms.html"));
    });

    // app.get("/events", function (req, res) {
    //     res.sendFile(path.join(__dirname, "../public/events.html"));
    // })

    app.get("/events", function (req, res) {

        // formatedResults = [];

        db.Event.findAll({
            raw: true,
        })
            .then(function (dbEvent) {
                console.log("dbEvent: ", dbEvent);
                var hbsObject = {
                    events: dbEvent,
                    headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`
                };
                return res.render("events", hbsObject)
            })

    })

    app.get('/about', function (req, res) {
        res.render ('about', {headContent:`<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`})
    })

    app.get('/blog', function (req, res) {
        res.render ('blog', {headContent:`<link rel="stylesheet" type="text/css" href="styles/blog.css">
        <link rel="stylesheet" type="text/css" href="styles/blog_responsive.css">`})
    })

    app.get('/sermons', function (req, res) {
        res.render ('sermons', {headContent:`<link rel="stylesheet" type="text/css" href="styles/sermons.css">
        <link rel="stylesheet" type="text/css" href="styles/sermons_responsive.css">`})
    })


    app.get('/contact', function (req, res) {
        res.render ('contact', {headContent:`<link rel="stylesheet" type="text/css" href="styles/contact.css">
        <link rel="stylesheet" type="text/css" href="styles/contact_responsive.css">`})
    })
}
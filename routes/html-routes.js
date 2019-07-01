var path = require("path");

// Routes
module.exports = function(app) {
    // app.get("/", function (req, res) {
    //     res.sendFile(path.join(__dirname, "../public.blog.html"));
    // });

    app.get("/cms", function (req, res) {
        res.sendFile(path.join(__dirname, "../public/cms.html"));
    });

    app.get("/events", function (req, res) {
        res.sendFile(path.join(__dirname, "../public/events.html"));
    })
}
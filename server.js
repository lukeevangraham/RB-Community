var express = require("express");
var exphbs = require('express-handlebars');
var app = express();


// var MomentHandler = require("handlebars.moment")
// MomentHandler.registerHelpers(exphbs);

var db = require("./models");

var PORT = process.env.PORT || 3000;

app.engine('handlebars', exphbs({
    helpers: {
        // formatDate: function(date, format) {
        //     return MomentHandler(date).format(format);
        // }
        // function(name, options) {
        //     if(!this._sections) this._section = {};
        //     this._sections[name] = options.fn(this);
        //     return null
        // }
    }
}));
app.set('view engine', 'handlebars')

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static directory
app.use(express.static("public"));

// Routes
// =============================================================
require("./routes/api-routes.js")(app);
require("./routes/html-routes.js")(app);

db.sequelize.sync().then(function() {
    app.listen(PORT, function() {
        console.log("Listening on port %s", PORT);
    });
});
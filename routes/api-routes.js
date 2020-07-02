// let router = require('express').Router();
var db = require("../models");


module.exports = function (app) {
    app.get("/api/comments", function(req, res) {
        db.Comments.find().then(function(dbComments) {
            res.json(dbComments)
        })
    })
    
    app.post("/api/comments", function (req, res) {
        // db.Comments.create({
    
        // })
    })
}
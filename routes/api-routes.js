// let router = require('express').Router();
var db = require("../models");
let moment = require('moment')
let today = moment().startOf('day')


module.exports = function (app) {
    app.get("/api/comments", function(req, res) {
        db.Comments.find({
            date: {
                $gte: today.toDate(),
            }
        }).then(function(dbComments) {
            res.json(dbComments)
        })
    })
    
    app.post("/api/comments", function (req, res) {
        // db.Comments.create({
    
        // })
    })
}
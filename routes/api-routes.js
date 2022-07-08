const axios = require("axios").default;
const main = require("../controllers/nodemailer");

// let router = require('express').Router();
var db = require("../models");
let moment = require("moment");
let today = moment().startOf("day");

module.exports = function (app) {
  app.get("/api/comments", function (req, res) {
    db.Comments.find({
      date: {
        $gte: today.toDate(),
      },
    }).then(function (dbComments) {
      res.json(dbComments);
    });
  });

  app.post("/api/comments", function (req, res) {
    // db.Comments.create({
    // })
  });

  app.post("/api/email", (req, res) => {
    console.log("BODY: ", req.body);
    axios
      .get(`https://admin.rbcommunity.org/staff-members/${req.body.recipient}`)
      .then((res) => main(req.body, res.data.Email));
  });
};

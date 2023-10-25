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

  app.post("/api/contact", (req, res) => {
    // main(req.body, "info@rbcpc.org").then(res.json("Message sent"));

    let data = JSON.stringify({
      recipients: [{ address: "info@rbcpc.org" }],
      content: {
        from: {
          email: "donotreply@mail.grahamwebworks.com",
          name: "RBCOMMUNITY.ORG",
        },
        subject: "An email via RBCOMMUNITY.ORG",
        text: `${req.body.name}, (${req.body.email}) sent you a message from RBCOMMUNITY.ORG saying: \n\n  ${req.body.message}`, // plain text body
      },
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.sparkpost.com/api/v1/transmissions",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.SPARKPOST_API_KEY,
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        res.json({ status: 200, message: "Message sent" });
      })
      .catch((error) => {
        console.log("Error: ", error);
      });
  });
};

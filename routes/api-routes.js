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
    // 1. Extract IP address safely (handling potential reverse proxies)
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    // Clean up IPv6 loopback or formatting if necessary (e.g., "::ffff:127.0.0.1")
    const clientIp =
      typeof rawIp === "string" ? rawIp.split(",")[0].trim() : rawIp;

    // 2. Extract User Agent passed from client (fallback if not provided in request body)
    const userAgent =
      req.body.userAgent || req.headers["user-agent"] || "Unknown Device";

    // 3. Create a clean ISO timestamp
    const timestamp = new Date().toISOString();

    // 4. Construct the updated email body with the security metadata footer
    const emailText =
      `${req.body.name}, (${req.body.email}) sent you a message from RBCOMMUNITY.ORG saying: \n\n` +
      `${req.body.message}\n\n` +
      `--------------------------------------------------\n` +
      `🔒 SECURITY METADATA (INVESTIGATIVE LOG)\n` +
      `--------------------------------------------------\n` +
      `Timestamp: ${timestamp}\n` +
      `Source IP: ${clientIp}\n` +
      `User Agent: ${userAgent}\n`;

    let data = JSON.stringify({
      recipients: [{ address: "info@rbcpc.org" }],
      content: {
        from: {
          email: "donotreply@mail.grahamwebworks.com",
          name: "RBCOMMUNITY.ORG",
        },
        subject: "An email via RBCOMMUNITY.ORG",
        text: emailText, // Updated plain text body containing metadata
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
        res.status(500).json({ status: 500, message: "Internal server error" });
      });
  });
  // Note: Ensure curly brace syntax aligns with your outer enclosure context
};

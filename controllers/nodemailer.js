require("dotenv").config();
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function main(body, recipient) {
  console.log("MAIN RUNNING", body);
  console.log("Recipient", recipient);

  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "mail.gandi.net",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `DoNotReply <donotreply@rbcpc.org>`, // sender address
    to: recipient, // list of receivers
    subject: "An email via RBCOMMUNITY.ORG", // Subject line
    text: `${body.name}, (${body.email}) sent you a message from RBCOMMUNITY.ORG saying: \n\n  ${body.message}`, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

// main().catch(console.error);

module.exports = main;

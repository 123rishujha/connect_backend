require("dotenv").config();
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

const SENDER_EMAIL = process.env.SENDER_EMAIL;
// const SENDER_PASS = process.env.SENDER_PASS;
const CLIENT_ID = process.env.GOOGLE_PRO_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_PRO_CLIENT_SECRET;
const OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN;
const OAUTH_PLAYGROUND = "https://developers.google.com/oauthplayground";

const sendMailsFunc = async (to, subject, html) => {
  const oauthClient = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    OAUTH_PLAYGROUND
  );

  console.log("xyz", CLIENT_ID, CLIENT_SECRET);

  oauthClient.setCredentials({ refresh_token: OAUTH_REFRESH_TOKEN });

  try {
    const accessToken = await oauthClient.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: SENDER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: OAUTH_REFRESH_TOKEN,
        access_token: accessToken,
      },
    });

    const mailOptons = {
      from: SENDER_EMAIL,
      to: to,
      subject: subject,
      html: html,
    };

    const message = await transporter.sendMail(mailOptons);
    return { success: true, msg: message };
  } catch (error) {
    console.log(
      "error while sending mail in nodemailer---------------------",
      error
    );
    return {
      success: false,
      msg: "error while sending mail in nodemailer",
      err: error,
    };
  }
};

module.exports = {
  sendMailsFunc,
};
// http://192.168.1.9:8080

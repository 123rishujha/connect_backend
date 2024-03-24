const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const generateTokens = {
  activateAccountToken: (payload) => {
    let tempToken = jwt.sign(payload, process.env.activateAccountTokenKey, {
      expiresIn: "5m",
    });
    return tempToken;
  },
};

module.exports = generateTokens;

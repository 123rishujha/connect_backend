const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const generateTokens = {
  activateAccountToken: (payload) => {
    let tempToken = jwt.sign(payload, process.env.ACTIVATE_ACCOUNT_TOKEN_KEY, {
      expiresIn: "10m",
    });
    return tempToken;
  },
};

module.exports = generateTokens;

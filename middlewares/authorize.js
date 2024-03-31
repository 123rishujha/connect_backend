const jwt = require("jsonwebtoken");
const {
  checkTokenExpiryErr,
} = require("../utils/commonFunc/checkTokenExpiryErr");
const { UserModel } = require("../models/userModel");
require("dotenv").config();

const authorize = async (req, res, next) => {
  //   let token = req.header("Authorization");
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ msg: "Invalid authentication" });
  }

  token = token.split(" ")[1];

  try {
    let decoded = jwt.verify(token, `${process.env.ACCESS_TOKEN_KEY}`);
    if (decoded.userId) {
      const user = await UserModel.findById(decoded.userId);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(400).json({ success: false, msg: "user not exist" });
      }
    } else {
      res.status(400).json({ success: false, msg: "Access Forbiden" });
    }
  } catch (error) {
    let tokenExpiredError = checkTokenExpiryErr(error);
    if (tokenExpiredError) {
      res.status(400).json(tokenExpiredError);
    } else {
      res.status(500).json({ success: false, msg: "Internal server error" });
    }
  }
};

module.exports = {
  authorize,
};

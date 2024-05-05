require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { UserModel } = require("../models/userModel");
const generateTokens = require("../utils/commonFunc/generateTokens");
const { sendMailsFunc } = require("../utils/commonFunc/sendMail");
const {
  checkTokenExpiryErr,
} = require("../utils/commonFunc/checkTokenExpiryErr");
const fs = require("fs");
const path = require("path");

const CLIENT_URL = process.env.CLIENT_URL;

const authCtrl = {
  register: async (req, res) => {
    const { avatar, username, email, password, role } = req.body;
    //checking if required fields are not provided
    if (!username) {
      return res
        .status(400)
        .json({ msg: "username is required", success: false });
    } else if (!email) {
      return res.status(400).json({ msg: "email is required", success: false });
    } else if (!password) {
      return res
        .status(400)
        .json({ msg: "password is required", success: false });
    }
    if (role === "ADMIN") {
      return res
        .status(400)
        .json({ success: false, msg: "Invalid Authentication" });
    }

    try {
      const userAlreadyExist = await UserModel.findOne({ email: email });
      if (userAlreadyExist) {
        return res.status(400).json({
          success: false,
          msg: "User already exist with provided email",
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 12);
        const userObj = {
          avatar,
          username,
          email,
          password: hashedPassword,
          role,
        };
        const activateAccountToken = generateTokens.activateAccountToken({
          userObj,
        });
        const verificationLink = `${CLIENT_URL}/activate/${activateAccountToken}`;

        let htmlContent = fs.readFileSync(
          path.join(__dirname, "..", "public", "verification.html"),
          "utf8"
        );
        htmlContent = htmlContent.replace(
          /verificationLink/g,
          verificationLink
        );
        const sendMail = await sendMailsFunc(
          // "jharishu796@gmail.com",
          email,
          "Verifiy Your Email",
          htmlContent
        );
        if (sendMail?.success) {
          res
            .status(200)
            .json({ success: true, msg: "Plase check your email." });
        } else {
          res.status(400).json({
            success: false,
            msg: "Something went wrong",
            err: sendMail?.err,
          });
        }
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, msg: "Internal server error", err: error });
    }
  },
  activateAccount: async (req, res) => {
    const { token } = req.body;

    try {
      const decoded = jwt.verify(
        token,
        `${process.env.ACTIVATE_ACCOUNT_TOKEN_KEY}`
      );
      if (decoded) {
        const userObj = decoded.userObj;

        if (userObj.role === "Admin" || !userObj) {
          return res.status(400).json({
            success: false,
            msg: "Invalid authentication credentials.",
          });
        }

        const { username, email, password, role, avatar } = userObj;

        //checking if user already exist with the provide email
        const userAlreadyExist = await UserModel.findOne({ email });

        if (userAlreadyExist) {
          return res.status(400).json({
            success: false,
            msg: "An account with the provided email already exists. Please log in.",
          });
        }

        //creating new user
        const createdUser = new UserModel({
          username,
          email,
          password,
          role,
          avatar,
        });

        await createdUser.save();
        res
          .status(200)
          .json({ success: true, msg: "Account activated successfully" });
      }
    } catch (error) {
      //check if activation token expires;
      if (error.name === "TokenExpiredError") {
        res.status(400).json({
          success: false,
          msg: "The activation token has expired. Please register again",
        });
      }

      return res
        .status(500)
        .json({ success: false, msg: "Internal Server Error", err: error });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    try {
      let userFound = await UserModel.findOne({ email });
      if (userFound) {
        const passwordMatched = await bcrypt.compare(
          password, // hashed
          userFound.password // plain
        );
        if (!passwordMatched) {
          return res
            .status(400)
            .json({ success: false, msg: "wrong credential" });
        }

        const refreshToken = generateTokens.refreshToken({
          userId: userFound._id,
        });
        const accesssToken = generateTokens.accessToken({
          userId: userFound._id,
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          path: "/auth/refresh-token",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 2 days
        });

        res.status(200).json({
          success: true,
          msg: "Login Successfull",
          data: {
            accesssToken,
            user: { ...userFound._doc, password: "" },
          },
        });
      } else {
        res.status(400).json({ success: false, msg: "Wrong email address" });
      }
    } catch (error) {
      console.log("error in login ctrl", error);
      res
        .status(500)
        .json({ success: false, msg: "Internal Server Error", err: error });
    }
  },
  logout: async (req, res) => {
    if (!req.user) {
      return res.status(200).json({
        success: false,
        msg: "Invalid Authentication User not exist in req body",
      });
    }
    try {
      res.clearCookie("refreshToken", { path: "auth/refresh-token" });
      res.status(200).json({ success: true, msg: "Logout Success!" });
    } catch (error) {
      res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
  },
  refreshToken: async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(400).json({ success: false, msg: "Please Login Now" });
    }

    try {
      let decoded = jwt.verify(token, `${process.env.REFRESH_TOKEN_KEY}`);
      // console.log("decoded", decoded);
      if (!decoded.userId) {
        return res
          .status(400)
          .json({ success: false, msg: "Please Login Now" });
      }

      const user = await UserModel.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(400).json({ success: false, msg: "Please Login" });
      } else {
        const accesssToken = generateTokens.accessToken({
          userId: user._id,
        });
        res.status(200).json({ success: true, accesssToken, user });
      }
    } catch (err) {
      console.log("error in refresh token get", JSON.stringify(err));

      let tokenExpiredError = checkTokenExpiryErr(err);
      if (tokenExpiredError) {
        res.status(400).json(tokenExpiredError);
      } else {
        res
          .status(500)
          .json({ success: false, msg: "Internal server error", err: err });
      }
    }
  },
  resetPassword: async (req, res) => {
    const { password } = req.body;
    if (req.user) {
      try {
        const hashedPassword = await bcrypt.hash(password, 12);
        if (hashedPassword) {
          await UserModel.findOneAndUpdate(
            { _id: req.user._id },
            { password: hashedPassword }
          );
          //findByIdAndUpdate
          res
            .status(200)
            .json({ success: true, msg: "Password updated successfully" });
        } else {
          return res.status(500).json({
            success: false,
            msg: "something went wrong during hashing",
          });
        }
      } catch (error) {
        res
          .status(500)
          .json({ success: false, msg: "Internal server error", err: error });
      }
    } else {
      res.status(400).json({ success: false, msg: "User not found" });
    }
  },
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await UserModel.findOne({ email });
      if (!user)
        return res
          .status(400)
          .json({ success: false, msg: "User not found with provided email" });
      const accessToken = generateTokens.accessToken({ userId: user._id });
      const forgotUrl = `${process.env.CLIENT_URL}/forgot_password/${accessToken}`;
      let htmlContent = fs.readFileSync(
        path.join(__dirname, "..", "public", "forgotPassword.html"),
        "utf8"
      );
      htmlContent = htmlContent.replace(/resetPasswordLink/g, forgotUrl);

      const sendMail = await sendMailsFunc(
        email,
        "Forgot Password",
        htmlContent
      );
      if (sendMail?.success) {
        res.status(200).json({ success: true, msg: "Plase check your email." });
      } else {
        res.status(400).json({
          success: false,
          msg: "Something went wrong",
          err: sendMail?.err,
        });
      }
    } catch (err) {
      console.log("error in forgot password", err);
      res
        .status(500)
        .json({ success: false, msg: "Internal server error", err });
    }
  },
};
module.exports = authCtrl;

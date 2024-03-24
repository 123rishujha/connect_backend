const bcrypt = require("bcrypt");
const { UserModel } = require("../models/userModel");
const generateTokens = require("../utils/commonFunc/generateTokens");
const { sendMailsFunc } = require("../utils/commonFunc/sendMail");

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

    try {
      const userAlreadyExist = await UserModel.findOne({ email: email });
      if (userAlreadyExist) {
        E;
        return res.status(400).json({
          success: false,
          msg: "User already exist with provided email",
        });
      } else {
        const hashedPassword = await bcrypt.hash(password, 5);
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
        console.log(activateAccountToken);
        const sendMail = await sendMailsFunc(
          "jharishu796@gmail.com",
          "mail function test",
          `<h1>is it working</h1>
          <p>${activateAccountToken}</p>
          `
        );
        if (sendMail) {
          console.log("mail send", sendMail);
          res.status(200).json({ msg: "Plase check your email." });
        } else {
          res.status(400).json({ msg: "Something went wrong" });
        }
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, msg: "Internal server error", err: error });
    }
  },
};
module.exports = authCtrl;

const express = require("express");
const authCtrl = require("../controllers/authCtrl");

const authRouter = express.Router();

authRouter.post("/register", authCtrl.register);

module.exports = authRouter;

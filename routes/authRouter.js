const express = require("express");
const authCtrl = require("../controllers/authCtrl");

const authRouter = express.Router();

authRouter.post("/register", authCtrl.register);
authRouter.post("/activate", authCtrl.activateAccount);
authRouter.post("/login", authCtrl.login);
authRouter.get("/refresh-token", authCtrl.refreshToken);

module.exports = authRouter;

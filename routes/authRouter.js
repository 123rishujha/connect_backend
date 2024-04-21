const express = require("express");
const authCtrl = require("../controllers/authCtrl");
const { authorize } = require("../middlewares/authorize");

const authRouter = express.Router();

authRouter.post("/register", authCtrl.register);
authRouter.post("/activate", authCtrl.activateAccount);
authRouter.post("/login", authCtrl.login);
authRouter.post("/logout", authorize, authCtrl.logout);
authRouter.get("/refresh-token", authCtrl.refreshToken);
authRouter.post("/reset_password", authorize, authCtrl.resetPassword);
authRouter.post("/forgot_password", authCtrl.forgotPassword);

module.exports = authRouter;

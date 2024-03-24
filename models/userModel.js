const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  avatar: {
    type: String,
    default: "",
    trim: true,
  },
  username: {
    type: String,
    required: [true, "user name is required"],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
    trim: true,
  },
  role: {
    type: String,
    default: "USER",
    enum: ["USER", "ADMIN", "SUB_ADMIN"],
  },
});

const UserModel = mongoose.model("user", userSchema);

module.exports = { UserModel };

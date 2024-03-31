const mongoose = require("mongoose");
require("dotenv").config();

const mongodb_url =
  `${process.env.MONGO_DB_URL}/mydatabase` ||
  "mongodb://localhost:27017/mydatabase";

const makeConnection = async () => {
  try {
    await mongoose.connect(mongodb_url);
    console.log("connected to server");
  } catch (error) {
    console.log("909 error in connection", error);
  }
};

module.exports = makeConnection;

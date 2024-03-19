const mongoose = require("mongoose");

const mongodb_url = process.env.MONGO_DB_URL || "mongodb://localhost:27017";

const makeConnection = async () => {
  try {
    await mongoose.connect(mongodb_url);
  } catch (error) {
    console.log("909 error", error);
  }
};

module.exports = makeConnection;

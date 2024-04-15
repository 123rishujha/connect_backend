const express = require("express");
const cors = require("cors");
const routes = require("./routes/index.js");
const makeConnection = require("./connection.js");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/auth", routes.authRouter);

const PORT = 8080;

app.listen(PORT, async () => {
  try {
    await makeConnection();
  } catch (error) {
    console.log("error while connecting to server", error);
  }
  console.log("server is running on", PORT);
});

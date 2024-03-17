const express = require("express");
const routes = require("./routes/index.js");

const app = express();

app.use(express.json());

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

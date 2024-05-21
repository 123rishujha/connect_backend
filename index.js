require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const routes = require("./routes/index.js");
const makeConnection = require("./connection.js");
const initializeSocket = require("./utils/socket/initializeSocket.js");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: `${process.env.CLIENT_URL}`,
  },
});

app.use(
  cors({
    origin: `${process.env.CLIENT_URL}`,
    // origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/auth", routes.authRouter);

const PORT = 8080;

server.listen(PORT, async () => {
  try {
    await makeConnection();
  } catch (error) {
    console.log("error while connecting to server", error);
  }
  console.log("server is running on", PORT);
});

initializeSocket(io);

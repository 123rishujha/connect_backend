const initializeSocket = (io) => {
  const onlineUser = {};

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    onlineUser[socket.id] = true;
    // notify all the sockets that new user come online
    io.emit("onlineUsers", { onlineUsers: Object.keys(onlineUser).length });
    //get active users;
    socket.on("getOnlineUser", () => {
      socket.emit("onlineUsers", {
        onlineUsers: Object.keys(onlineUser).length,
      });
    });

    socket.on("disconnect", () => {
      delete onlineUser[socket.id];
      io.emit("onlineUsers", { onlineUsers: Object.keys(onlineUser).length });
      console.log("user disconnected", socket.id);
    });
  });
};

module.exports = initializeSocket;

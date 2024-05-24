const initializeSocket = (io) => {
  const activeUser = {
    onlineUser: {},
    textRoom: {},
    videoRoom: {},
  };

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    activeUser.onlineUser[socket.id] = true;
    // notify all the sockets that new user come online
    io.emit("onlineUsers", {
      onlineUsers: Object.keys(activeUser.onlineUser).length,
      textRoom: Object.keys(activeUser.textRoom).length,
      videoRoom: Object.keys(activeUser.videoRoom).length,
    });
    //get active users;
    socket.on("getOnlineUser", () => {
      socket.emit("onlineUsers", {
        onlineUsers: Object.keys(activeUser.onlineUser).length,
        textRoom: Object.keys(activeUser.textRoom).length,
        videoRoom: Object.keys(activeUser.videoRoom).length,
      });
    });

    socket.on("disconnect", () => {
      delete activeUser.onlineUser[socket.id];
      if (activeUser.textRoom[socket.id]) delete activeUser.textRoom[socket.id];
      if (activeUser.videoRoom[socket.id])
        delete activeUser.videoRoom[socket.id];

      io.emit("onlineUsers", {
        onlineUsers: Object.keys(activeUser.onlineUser).length,
        textRoom: Object.keys(activeUser.textRoom).length,
        videoRoom: Object.keys(activeUser.videoRoom).length,
      });
      console.log("user disconnected", socket.id);
    });
  });
};

module.exports = initializeSocket;

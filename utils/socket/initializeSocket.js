const ROOM_TYPE_CONST = {
  text: "TEXT_ROOM",
  video: "VIDEO_ROOM",
};

const initializeSocket = (io) => {
  const activeUsers = {
    online: new Map(),
    textRoom: new Map(),
    videoRoom: new Map(),
  };

  const pendingConnections = {
    textChat: new Map(),
    videoChat: new Map(),
  };

  const establishedConnections = {
    textChat: new Map(),
    videoChat: new Map(),
  };

  const emitOnlineUser = (socket = null) => {
    let data = {
      onlineUsers: activeUsers.online.size,
      textRoom: activeUsers.textRoom.size,
      videoRoom: activeUsers.videoRoom.size,
    };
    if (socket) {
      socket.emit("onlineUsers", data);
    } else {
      io.emit("onlineUsers", data);
    }
  };

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    // activeUsers.onlineUser[socket.id] = true;
    activeUsers.online.set(socket.id, true);
    // notify all the sockets that new user come online
    emitOnlineUser();

    //get active users;
    socket.on("getOnlineUser", () => {
      emitOnlineUser(socket);
    });

    //joined text room;
    socket.on("joinTextRoom", ({ socketId, data }) => {
      activeUsers.textRoom.set(socketId, true);
      pendingConnections.textChat.set(socketId, {
        socketId: socketId,
        data: data,
      });
      emitOnlineUser();
    });

    // sender socket id and data
    socket.on("connectWithSomeOneInTextRoom", ({ socketId, data }) => {
      // if (Object.keys(notConnectedUsers.textChat)?.length){
      if (pendingConnections.textChat.size) {
        let availableUser = null;
        let findingInMap = pendingConnections.textChat;
        for (let [_, value] of findingInMap.entries()) {
          if (value.socketId !== socketId) {
            availableUser = value;
            break;
          }
        }
        if (availableUser) {
          //want to connect -> connected with;
          establishedConnections.textChat.set(socketId, availableUser);

          establishedConnections.textChat.set(availableUser.socketId, {
            socketId,
            data,
          });

          // socket.to(socket.id).emit("connectedWith", availableUser);
          socket.emit("connectedWith", availableUser);

          socket
            .to(availableUser.socketId)
            .emit("connectedWith", { socketId, data });

          pendingConnections.textChat.delete(socketId);
          pendingConnections.textChat.delete(availableUser.socketId);
        } else {
          console.log("909 no user available for connection");
        }
        console.log(
          "909 establishedConnections",
          establishedConnections.textChat.entries()
        );
      } else {
        console.log("909 no user active now");
      }
    });

    socket.on("skipChat", ({ socketId, roomType }) => {
      if (roomType === ROOM_TYPE_CONST.text) {
        let connectdWithUser = establishedConnections.textChat.get(socketId);
        establishedConnections.textChat.delete(connectdWithUser.socketId);
        establishedConnections.textChat.delete(socketId);

        //again move users to pending connections
        pendingConnections.textChat.set(socketId);
        pendingConnections.textChat.set(connectdWithUser.socketId);
      } else {
        let connectdWithUser = establishedConnections.videoChat.get(socketId);
        establishedConnections.videoChat.delete(connectdWithUser.socketId);
        establishedConnections.videoChat.delete(socketId);

        //again move users to pending connections
        pendingConnections.videoChat.set(socketId);
        pendingConnections.videoChat.set(connectdWithUser.socketId);
      }
    });

    socket.on("sendMsgToRandomConnection", ({ msg, senderSocketId }) => {
      //will get receiver sockt id from textChat object;
      let receiver = establishedConnections.textChat.get(senderSocketId);
      if (receiver?.socketId) {
        socket
          .to(receiver.socketId)
          .emit("gotMsgFromRandomConnection", { msg: msg });
        console.log("909 receiver msg send", receiver, msg);
      } else {
        console.log(
          `No established connection found for senderSocketId: ${senderSocketId}`
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("socket Id user discounnted", socket.id);
      activeUsers.online.delete(socket.id);
      activeUsers.textRoom.delete(socket.id);
      activeUsers.videoRoom.delete(socket.id);

      //user discounnect then the user connected with this connection should return back to pendingConnections map -------------
      const connectedWithInTextChat = establishedConnections.textChat.get(
        socket.id
      );

      if (connectedWithInTextChat) {
        establishedConnections.textChat.delete(
          connectedWithInTextChat.socketId
        );

        socket.to(connectedWithInTextChat).emit("needReconnect");
      }
      const connectedWithInVideoChat = establishedConnections.videoChat.get(
        socket.id
      );
      if (connectedWithInVideoChat) {
        establishedConnections.videoChat.delete(
          connectedWithInVideoChat.socketId
        );
        socket.to(connectedWithInTextChat).emit("needReconnect");
      }
      //user discounnect then the user connected with this connection should return back to pendingConnections map -------------

      pendingConnections.textChat.delete(socket.id);
      pendingConnections.videoChat.delete(socket.id);

      establishedConnections.textChat.delete(socket.id);
      establishedConnections.videoChat.delete(socket.id);

      console.log(
        "909 establishedConnections",
        establishedConnections.textChat.entries()
      );

      emitOnlineUser();
    });
  });
};

module.exports = initializeSocket;

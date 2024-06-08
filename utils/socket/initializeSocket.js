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

  const handleReconnect = (socket, socketId) => {
    socket.to(socketId).emit("needReconnect");
  };

  io.on("connection", (socket) => {
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
      console.log(
        "909 after joing pending-entries",
        pendingConnections.textChat.entries()
      );
      emitOnlineUser();
    });

    // sender socket id and data
    socket.on("connectWithSomeOneInTextRoom", ({ socketId, data }) => {
      // if (Object.keys(notConnectedUsers.textChat)?.length){
      if (pendingConnections.textChat.size) {
        let availableUser = null;
        let findingInMap = pendingConnections.textChat;
        console.log(
          "909 before connection entries line 70",
          findingInMap.entries()
        );
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
      } else {
        console.log("909 no user active now");
      }
      console.log(
        "909 connection code completion 105",
        establishedConnections?.textChat?.entries(),
        pendingConnections?.textChat?.entries()
      );
    });

    // skip conversation with a user and connect with someone else
    //socketId => socketId of person who want to skip the chat
    socket.on("skipChat", ({ socketId, roomType }) => {
      if (roomType === ROOM_TYPE_CONST.text) {
        let connectdWithUser = establishedConnections.textChat.get(socketId);
        let userWantToSkip = establishedConnections.textChat.get(
          connectdWithUser?.socketId
        );

        establishedConnections.textChat.delete(connectdWithUser.socketId);
        establishedConnections.textChat.delete(socketId);

        //again move users to pending connections
        if (userWantToSkip) {
          pendingConnections.textChat.set(socketId, {
            socketId: socketId,
            data: userWantToSkip?.data,
          });
        }
        if (connectdWithUser) {
          pendingConnections.textChat.set(connectdWithUser.socketId, {
            socketId: connectdWithUser.socketId,
            data: connectdWithUser?.data,
          });
          socket.to(connectdWithUser.socketId).emit("userSkippedChat", "");
        }
      } else {
        let connectdWithUser = establishedConnections.videoChat.get(socketId);
        let userWantToSkip = establishedConnections.videoChat.get(
          connectdWithUser.socketId
        );

        establishedConnections.videoChat.delete(connectdWithUser.socketId);
        establishedConnections.videoChat.delete(socketId);

        //again move users to pending connections
        if (userWantToSkip) {
          pendingConnections.videoChat.set(socketId, {
            socketId: socketId,
            data: userWantToSkip.data,
          });
        }
        if (connectdWithUser) {
          pendingConnections.videoChat.set(connectdWithUser.socketId, {
            socketId: connectdWithUser?.socketId,
            data: connectdWithUser.data,
          });
        }
      }
      console.log(
        "909 connection after skipping---",
        establishedConnections.textChat.entries(),
        pendingConnections.textChat.entries()
      );
    });

    // leave the text chat or video chat room;
    socket.on("leaveChat", ({ socketId, roomType }) => {
      if (roomType === ROOM_TYPE_CONST.text) {
        let connectdWithUser = establishedConnections.textChat.get(socketId);

        establishedConnections.textChat.delete(socketId);

        //again move users to pending connections
        // pendingConnections.textChat.set(socketId); // have left the chat so we don't move him to any chat room
        if (connectdWithUser) {
          establishedConnections.textChat.delete(connectdWithUser.socketId);
          pendingConnections.textChat.set(connectdWithUser.socketId, {
            socketId: connectdWithUser.socketId,
            data: connectdWithUser.data,
          });
        }
      } else {
        let connectdWithUser = establishedConnections.videoChat.get(socketId);

        establishedConnections.videoChat.delete(socketId);

        //again move users to pending connections
        if (connectdWithUser) {
          establishedConnections.videoChat.delete(connectdWithUser.socketId);
          pendingConnections.videoChat.set(connectdWithUser.socketId);
        }
      }
    });

    socket.on("sendMsgToRandomConnection", ({ msg, senderSocketId }) => {
      //will get receiver sockt id from textChat object;
      let receiver = establishedConnections.textChat.get(senderSocketId);
      if (receiver?.socketId) {
        socket
          .to(receiver.socketId)
          .emit("gotMsgFromRandomConnection", { msg: msg });
      } else {
        console.log(
          `No established connection found for senderSocketId: ${senderSocketId}`
        );
      }
      console.log("send msg called backend----", msg, senderSocketId);
    });

    socket.on("disconnect", () => {
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

        handleReconnect(socket, connectedWithInTextChat.socketId);
      }
      const connectedWithInVideoChat = establishedConnections.videoChat.get(
        socket.id
      );
      if (connectedWithInVideoChat) {
        establishedConnections.videoChat.delete(
          connectedWithInVideoChat.socketId
        );
        // socket.to(connectedWithInVideoChat).emit("needReconnect");
        handleReconnect(socket, connectedWithInVideoChat.socketId);
      }
      //user discounnect then the user connected with this connection should return back to pendingConnections map -------------

      pendingConnections.textChat.delete(socket.id);
      pendingConnections.videoChat.delete(socket.id);

      establishedConnections.textChat.delete(socket.id);
      establishedConnections.videoChat.delete(socket.id);

      emitOnlineUser();
    });
  });
};

module.exports = initializeSocket;

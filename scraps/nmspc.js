const nsp = io.of("/conversation");
nsp.on("connection");
nsp.on("connection", convSocket => {
  console.log("conv connected");
  convSocket.on("conversationAuth", async (convData, userData, key) => {
    try {
      console.log(convSocket.room);
      convSocket.leave(convSocket.room);
      var conversation = await Conversation.findOne({ url: convData.url });
      if (!conversation) {
        console.log("wrong conversation");
        convSocket.disconnect(true);
        return false;
      }
      console.log(conversation.connectedUsersCount);
      if (userData.id !== conversation.owner) {
        if (
          conversation.secondUser &&
          conversation.secondUser !== userData.id
        ) {
          console.log("WRONG ID");
          convSocket.emit("wrongID", false);
          convSocket.disconnect(true);
          return false;
        }
        if (
          conversation.secondUser &&
          conversation.secondUser === userData.id
        ) {
          var secUsrId = userData.id;
        } else {
          secUsrId = uuidv4();
        }
        console.log("SEC USER");

        conversation.secondUser = secUsrId;
        userData.id = secUsrId;

        convSocket.emit("secUserId", secUsrId);
      }
      if (conversation.publicKeys.length < 3) {
        console.log("add key");
        conversation.publicKeys.push(key);
      } else {
        console.log("THERE ARE KEYS ALREADY");
      }
      conversation.connectedUsersCount++;
      console.log(conversation.connectedUsersCount);
      convSocket.room = convData.url;
      convSocket.join(convData.url);
      console.log(convSocket.room);
      await conversation.save();
      convSocket.data = userData.id;
      convSocket.emit("currentUsrId", userData.id);
      let allUsers = [conversation.owner, conversation.secondUser];
      console.log(allUsers);
      convSocket.emit("allUsers", allUsers);
      convSocket.broadcast.to(convSocket.room).emit("allUsers", allUsers);

      convSocket.emit("keys", conversation.publicKeys);
      convSocket.broadcast
        .to(convSocket.room)
        .emit("keys", conversation.publicKeys);

      if (conversation.messages.length > 0) {
        console.log("mesagess send");
        for (var ir = 0; ir < conversation.messages.length; ir++) {
          convSocket.emit("message", conversation.messages[ir]);
        }
      }

      //send server notification that user has connected
      let serverMsg = {
        type: "userJoined",
        date: moment().format("HH:mm:ss"),
        user: userData.id,
        order: false,
        author: "Server"
      };

      convSocket.emit("serverNotification", serverMsg);
      convSocket.broadcast
        .to(convSocket.room)
        .emit("serverNotification", serverMsg);

      convSocket.conversation = conversation;
      //console.log(convSocket);
    } catch (err) {
      console.log(err);
      convSocket.emit("error", err);
    }
  });

  convSocket.on("disconnect", async () => {
    try {
      let serverMsg = {
        type: "userDisconnected",
        date: moment().format("HH:mm:ss"),
        user: convSocket.data,
        order: false,
        author: "Server"
      };

      convSocket.emit("serverNotification", serverMsg);
      convSocket.broadcast
        .to(convSocket.room)
        .emit("serverNotification", serverMsg);

      //delete conv if no users remain
      let conv = await Conversation.findById(convSocket.conversation.id);
      console.log(conv.connectedUsersCount);
      conv.connectedUsersCount--;
      console.log(conv.connectedUsersCount);

      await conv.save();
      if (conv.connectedUsersCount === 0) {
        //wait for 15 minutes and then delete if still empty
        sleep(1500000).then(async () => {
          console.log("spiulki");
          console.log(conv.url);
          let con = await Conversation.findById(convSocket.conversation.id);
          if (con.connectedUsersCount === 0) {
            await con.remove();
          }
        });
      }
    } catch (err) {
      let serverMsg = {
        type: "error",
        date: moment().format("HH:mm:ss"),
        order: false,
        author: "Server",
        text: "There was error with disconnection"
      };
      convSocket.emit("serverNotification", serverMsg);
      console.log(err);
    }
  });

  convSocket.on("message", async msg => {
    try {
      console.log(msg);
      let conv = await Conversation.findById(convSocket.conversation.id);
      console.log(conv.url);
      console.log(convSocket.room);
      msg.date = moment().format("HH:mm:ss");
      conv.messages.push(msg);
      await conv.save();
      convSocket.emit("message", msg);
      convSocket.broadcast.to(convSocket.room).emit("message", msg);
    } catch (err) {
      let serverMsg = {
        type: "error",
        date: moment().format("HH:mm:ss"),
        order: false,
        author: "Server",
        text: "There was error with sending a message"
      };
      convSocket.emit("serverNotification", serverMsg);
      console.log(err);
    }
  });

  convSocket.on("colorChange", color => {
    convSocket.broadcast.to(convSocket.room).emit("colorChange", color);
  });

  convSocket.on("delete", async usrId => {
    try {
      let conv = await Conversation.findById(convSocket.conversation.id);
      if (conv.owner === usrId) {
        convSocket.in(convSocket.room).disconnect(true);
        await conv.remove();
      }
    } catch (err) {
      let serverMsg = {
        type: "error",
        date: moment().format("HH:mm:ss"),
        order: false,
        author: "Server",
        text: "Unable to delete. Try again."
      };
      convSocket.emit("serverNotification", serverMsg);
      console.log(err);
    }
  });
});

socket.on("switchRoom", async newroom => {
  // leave the current room (stored in session)
  socket.leave(socket.room);
  // join new room, received as function parameter
  socket.join(newroom.id);
  var channelOptions = await Channel.findOne({ name: newroom.id });
  if (channelOptions.password.length) {
    console.log(channelOptions.password);
    console.log(newroom.id);
    console.log(newroom.pwd);
    let pwdCheck = await bcrypt.compare(newroom.pwd, channelOptions.password);
    console.log(pwdCheck);
    if (!pwdCheck) {
      let msg = {
        text: "Wrong pwd!",
        author: msg.author
      };
      socket.emit("message", msg);
      return 0;
    }
  }
  console.log(channelOptions.logMessages);
  socket.channel = channelOptions;
  socket.emit("updatechat", "You have connected to room: " + newroom);
  // sent message to OLD room
  socket.broadcast
    .to(socket.room)
    .emit("updatechat", `${socket.name} has left this room`);
  // update socket session room title
  socket.room = newroom;
  console.log(socket.room);

  socket.broadcast
    .to(newroom)
    .emit("updatechat", `${socket.name} has joined this room`);
  //socket.emit("updaterooms", newroom);
});

socket.on("username", user => {
  var this_user = user;
  user.room = socket.room;
  socket.name = user.name;
  users.push(user);
  console.log(`${user.name} has connected`);
  let usersInThisRoom = users.filter(usr => usr.room === socket.room);
  if (socket.room === "public") {
    for (let i = 0; i < messages.length; i++) {
      socket.emit("message", messages[i]);
    }
  }
  socket.emit("userconnected", usersInThisRoom);
  socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);
});

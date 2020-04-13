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

<div className="list">
  <a className="clickable looklikep" href="/room/public">
    - Public (Online:{" "}
    {this.state.userlist.filter(usr => usr.room === "public").length})
  </a>
  {this.state.channels
    .filter(chn => chn.name !== "public")
    .map((channel, index) => (
      <a
        key={index}
        className="clickable looklikep"
        href={`/room/${channel.name}`}
      >
        {" "}
        - {channel.name} (Online:{" "}
        {this.state.userlist.filter(usr => usr.room === channel.name).length})
      </a>
    ))}
</div>;

const form0 = document.getElementById("postform");
if ($(".fastform").length) {
  const form1 = document.getElementsByClassName("fastform")[0];
  form1.addEventListener("submit", incremenetCounter);
}
form0.addEventListener("submit", incremenetCounter);

//initialize and stuff

const isDisplayVisible = () => {
  if (!document.getElementById("counterDisplay")) {
    return false;
  }
  return true;
};

const elementExists = element => {
  if (!localStorage.getItem(element)) {
    return false;
  }
  return true;
};

const initializeElementInLocalStorage = (el, val) => {
  localStorage.setItem(el, val);
};

const initializeLocalStorage = () => {
  if (!elementExists("counter")) {
    initializeElementInLocalStorage("counter", 2000);
  }
  if (!elementExists("display")) {
    initializeElementInLocalStorage("display", "exists");
  }
};

const appendDisplay = () => {
  //don't add the same element twice
  if (!isDisplayVisible) {
    return;
  }

  var count = localStorage.getItem("counter");

  let newHElement = document.createElement("h1");
  newHElement.innerHTML = `Posts counter: ${count}`;
  newHElement.setAttribute("id", "counterDisplay");

  document.getElementsByClassName("boardBanner")[0].appendChild(newHElement);
};

const updateDisplayedValue = value => {
  let element = document.getElementById("counterDisplay");
  element.innerHTML = `Posts counter: ${value}`;
};

const incremenetCounter = () => {
  if (!elementExists("counter")) {
    initializeCounter(2000);
  }

  let currentCount = parseInt(localStorage.getItem("counter"));
  currentCount++;

  localStorage.setItem("counter", currentCount);
  updateDisplayedValue(currentCount);
};

const run = () => {
  initializeLocalStorage();
  appendDisplay();

  document.addEventListener("submit", incremenetCounter);
};

run();

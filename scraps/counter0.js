if (process.env.NODE_ENV === "test") {
  const Mockgoose = require("mockgoose").Mockgoose;
  const mockgoose = new Mockgoose(mongoose);

  mockgoose.prepareStorage().then(() => {
    mongoose
      .connect(mongo, { useNewUrlParser: true, useCreateIndex: true })
      .then((res, err) => {
        if (err) return reject(err);
        resolve();
      });
  });
} else {
  var mongoDB = process.env.MONGODB_URI || mongo;
  mongoose.connect(mongoDB, {
    useNewUrlParser: true
  });
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "MongoDB connection error:"));
}


const utilNSP = io.of("/util");
utilNSP.on("connection", uSocket => {
  console.log("util connected");
  uSocket.on("auth", async authData => {
    console.log("auth con");
    console.log(authData.token);
    let token = false;
    let user = await getUserDataFromJWT(authData.token);
    if (!user) {
      user = await createUser();
      token = generateToken(user);
    }
    if (user.invites.length) {
      for (let i = 0; i < user.invites.length; i++) {
        uSocket.emit("friendRequest", user.invites[i]);
      }
    }

    console.log(uSocket.id);
    uSocket.room = user.notificationRoomID;
    uSocket.join(user.notificationRoomID);

    if (token) {
      let tok = "Bearer " + token;
      uSocket.emit("token", tok);
    }
    let list = user.friends;
    let pies = Array.from(new Set(list));
    let est = Array.from(new Set(pies.map(a => a.pmName))).map(pmName => {
      return pies.find(a => a.pmName === pmName);
    });
    // let get = est.map(ug => (ug.proxyID = ug.proxyID ? ug.proxyID : uuidv4()));
    user.friends = est;
    let snd = sanitizeFriendList(est);
    console.log(snd);
    await user.save();
    uSocket.emit("pmRoom", user.username);
    uSocket.emit("friendList", snd);
    uSocket.user = user;
    uSocket.uid = user.id;
    if (user.messages.length) {
      for (let j = 0; j < user.messages.length; j++) {
        uSocket.emit("message", user.messages[j]);
      }
    }
  });



  ![gif showing adapting layout](https://im2.ezgif.com/tmp/ezgif-2-7a039f2b4f45.gif)

  ## Article page

  ![gif showing adapting layout](https://im2.ezgif.com/tmp/ezgif-2-dd58b201d5e4.gif)

  ## Contact me page

  ![gif showing adapting layout](https://im2.ezgif.com/tmp/ezgif-2-a8b6c6bf6d17.gif)

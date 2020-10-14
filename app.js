var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var cors = require("cors");
var passport = require("passport");
const Cryptr = require("cryptr");
const dotenv = require("dotenv");
dotenv.config();
const cryptr = new Cryptr(process.env.CRYPTSEED);
var bcrypt = require("bcryptjs");
var moment = require("moment");
const swStats = require("swagger-stats");
const apiSpec = require("./swagger.json");
//var RSA = require("hybrid-crypto-js").RSA;
//var Crypt = require("hybrid-crypto-js").Crypt;
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
//const supervillains = require("supervillains");

var rateLimit = require("express-rate-limit");
const { MessagesHelper } = require("./SocketController");
const {
  SocketHelper,
  User,
  ContactsManager,
  FriendsFacade
} = require("./SocketHelper");
var limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200 // limit each IP to 100 requests per windowMs
});

var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15
});

logger(":method :url :status :res[content-length] - :response-time ms");

// view engine setup
app.set("views", path.join(__dirname, "views"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(swStats.getMiddleware({ swaggerSpec: apiSpec }));
var mongoose = require("mongoose");

var mongoDB = process.env.MONGODB_URI || process.env.ATLASMONGO;

mongoose.Promise = global.Promise;

if (process.env.NODE_ENV === "test") {
  const Mockgoose = require("mockgoose").Mockgoose;
  const mockgoose = new Mockgoose(mongoose);

  mockgoose.prepareStorage().then(function() {
    mongoose.connect(
      mongoDB,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      function(err) {
        console.log(err);
        console.log("connected");
      }
    );
  });
} else {
  mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const ChatUser = require("./models/ChatUser");
const Channel = require("./models/Channel");
const Message = require("./models/Message");
const Invite = require("./models/Invite");

/*
const xpkej = async () => {
  const doc = await ChatUser.find({ username: "randomis" });
  const changeStream = doc.watch().on("change", change => console.log(change));
  doc.email = "psipies@test.com";
  await doc.save();
};
xpkej();
*/

app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(express.json());
app.use(bodyParser.json());
require("./config/passport.js")(passport);
app.use(passport.initialize());
app.use(passport.session());
var apiRouter = require("./routes/api")(app, express, passport);
app.use("/api", apiRouter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
if (process.env.NODE_ENV === "production") {
  app.use("/api", limiter);
}

app.use(function(req, res, next) {
  req.io = io;
  next();
});

const getUserDataFromJWT = async token => {
  if (!token) {
    throw new ValidationError("No token");
  }
  let bearer = token.split(" ");
  let ugh = bearer[1];
  let decodedUserToken = await jwt.verify(ugh, process.env.JWT_TOKEN);
  console.log(decodedUserToken);
  if (!decodedUserToken) {
    throw new ValidationError("Wrong token");
  }
  //let user = await ChatUser.findById(decodedUserToken.data.id);
  return decodedUserToken.data.id;
};

console.log("PROCCESS ENV");
console.log(process.env.TESTTEST);
console.log(process.env.NODE_ENV);
console.log(process.env.PORT);
var users = [];
//var rooms = [];

const sanitizeFriendList = async list => {
  let sanitizedList = [];
  for (let i = 0; i < list.length; i++) {
    let friend = await ChatUser.findById(list[i].id);
    if (!friend) {
      console.log("no friend found");
      sanitizedList = [...sanitizedList];
    } else {
      let sanitizedFriend = {
        name: friend.username,
        proxyID: list[i].proxyID,
        key: friend.publickKey,
        avatar: friend.avatar,
        seen: list[i].seen,
        delivered: friend.wereMsgsDelivered,
        lastMes: list[i].lastMes,
        //isOnline: friend.isOnline,
        searchID: friend.searchID
      };
      sanitizedList = [...sanitizedList, sanitizedFriend];
    }
  }
  return sanitizedList;
};

const sortMessage = (sender, recipient, user) => {
  return sender === user ? recipient : sender;
};

const sortThem = (msgs, usr) => {
  const ugabuga = msgs.map(el => {
    let a = {
      ...el,
      room: sortMessage(el.sender, el.recipient, usr)
    };
    return a;
  });
  return ugabuga;
};

const messageWork = (msgs, userSearchID) => {
  if (!msgs.length) {
    return msgs;
  }
  const seenmsgs = msgs.map(ms => (ms = { ...ms, delivered: true }));
  const sorted = seenmsgs[seenmsgs.length - 1].room
    ? seenmsgs
    : sortThem(seenmsgs, userSearchID);
  return sorted;
};

const generateToken = user => {
  let payload = {
    id: user.id,
    name: user.username,
    searchID: user.searchID,
    avatar: user.avatar
  };
  let token = jwt.sign({ data: payload }, process.env.JWT_TOKEN, {
    expiresIn: 31556926
  });
  return token;
};

const filterOutNullValues = arr => {
  let lis = Array.from(new Set(arr));
  let arrList = lis.filter(el => el !== undefined);
  arrList = arrList.filter(el => el.id !== undefined);
  return arrList;
};

const removeDuplicates = arr => {
  let list = Array.from(new Set(arr.map(a => a.pmName))).map(pmName => {
    return arr.find(a => a.pmName === pmName);
  });
  return list;
};

const timePeriods = [5, 15, 30, 1, 2, 4, 8, 12, 1, 2];
const periodTypes = ["m", "m", "m", "h", "h", "h", "h", "h", "d", "d"];

const filterOutOld = msgs => {
  var arr = [];
  for (var i = 0; i < msgs.length; i++) {
    if (!msgs[i].fullDate || msgs[i].startCountdown === 0) {
      arr = [...arr, msgs[i]];
    } else if (msgs[i].startCountdown === 2) {
      if (
        moment(msgs[i].fullDate).isAfter(
          moment().subtract(
            timePeriods[msgs[i].countdownTime],
            periodTypes[msgs[i].countdownTime]
          )
        )
      ) {
        arr = [...arr, msgs[i]];
      }
    } else if (msgs[i].startCountdown === 1) {
      if (!msgs[i].seen) {
        arr = [...arr, msgs[i]];
      } else {
        if (
          moment(msgs[i].fullDate).isAfter(
            moment().subtract(
              timePeriods[msgs[i].countdownTime],
              periodTypes[msgs[i].countdownTime]
            )
          )
        ) {
          arr = [...arr, msgs[i]];
        }
      }
    }
  }
  return arr;
};

const generateNewAccount = async uSocket => {
  const newUser = await User.createNewAccount();
  await newUser.loadUserDocument();
  let token = generateToken(newUser.user);
  let tok = "Bearer " + token;
  uSocket.emit("token", tok);
  return newUser;
};

const utilNSP = io.of("/util");
utilNSP.on("connection", uSocket => {
  const helper = new SocketHelper(uSocket);
  uSocket.on("auth", async (authData, clb) => {
    console.log("Util socket has connected");
    console.log("Util socket token " + authData.token);
    //retrieve or create user
    let user;
    try {
      const id = await getUserDataFromJWT(authData.token);
      user = new User(id);
      await user.loadUserDocument();
    } catch (err) {
      user = await generateNewAccount(uSocket);
    }

    console.log(user.user.defaultSettings);
    console.log(user.user.id);
    console.log(user.user.friends.length);
    console.log(uSocket.room);
    helper.setUp(user.user.notificationRoomID);
    //join notification room
    // uSocket.room = user.notificationRoomID;
    //uSocket.join(user.notificationRoomID);
    console.log(`${uSocket.id} joined the notification room`);
    console.log(uSocket.room);

    uSocket.uid = user.user.id;
    user.updateUserField("isOnline", true);
    user.updateUserField("wereMsgsDelivered", true);

    const pach = messageWork(user.user.messages, user.user.searchID);
    const sorted = await filterOutOld(pach);
    user.updateUserField("messages", sorted);
    if (user.user.friends.length) {
      const friends = filterOutNullValues(removeDuplicates(user.user.friends));
      const friendlist = await sanitizeFriendList(friends);
      //user.updateUserField("friends", friends);
      const userData = {
        friendlist,
        notifs: [...user.user.invites, ...user.user.notifications],
        msgs: sorted,
        settings: user.user.defaultSettings,
        darkTheme: user.user.darkTheme || false,
        language: user.user.language || "en",
        hasPassword: !!user.user.password
      };
      uSocket.emit("userData", userData);
    } else {
      const userData = {
        notifs: [...user.user.invites, ...user.user.notifications],
        msgs: sorted,
        settings: user.user.defaultSettings,
        darkTheme: user.user.darkTheme || false,
        language: user.user.language || "en",
        hasPassword: !!user.user.password
      };
      uSocket.emit("userData", userData);
    }

    await user.saveUser();

    const data = [user.user.searchID, { isOnline: true, delivered: true }];
    helper.emitToEveryFriend("updateFriend", data, user.user.friends);

    clb('auth');
    console.log("User succesfuly connected and authorized");
  });

  uSocket.on("deliveredMsgs", async () => {
    /*const user = await ChatUser.findById(uSocket.uid);
    const list = user.friends;
    for (var i = 0; i < list.length; i++) {
      let friend = await ChatUser.findById(list[i].id);
      let updatedMsgs = friend.messages.map(msg =>
        msg.author !== user.username ? msg : { ...msg, delivered: true }
      );
      friend.messages = updatedMsgs;
      await friend.save();
    }*/
    const user = new ContactsManager(uSocket.uid);
    await user.loadUserDocument();
    await user.changeFriendMsgs();
    await user.saveUser();
  });

  uSocket.on("pingOnlineFriends", async _ => {
    const user = await ChatUser.findById(uSocket.uid);
    helper.emitToEveryFriend(
      "onlineStatusCheck",
      user.notificationRoomID,
      user.friends
    );
  });

  uSocket.on("confirmOnlineStatus", async friendChannel => {
    const user = await ChatUser.findById(uSocket.uid);
    const data = [user.searchID, { isOnline: true }];
    helper.emitToFriend("updateFriend", friendChannel, data);
  });

  uSocket.on("sendPublickKey", async (key, clb) => {
    console.log("PUblick key sent");
    const user = await ChatUser.findById(uSocket.uid);
    user.publickKey = key;
    await user.save();
    clb('key');
  });

  uSocket.on("generateInvitationURL", async () => {
    console.log("INVITATION GEN");
    const invite = await new Invite({
      url: uuidv4(),
      owner: uSocket.uid
    }).save();
    //const url = await SocialNetwork.genInvitationURL(uSocket.uid);
    helper.emit("invitationURL", invite.url);
    console.log("INVITATION SENT");
  });

  uSocket.on("acceptInvitationByURL", async (url, confirm) => {
    console.log("INVITATION ACCEPTED");
    console.log(uSocket.id);
    console.log(uSocket.uid);
    const contactsCreator = new FriendsFacade(uSocket, uSocket.uid);
    await contactsCreator.createFriendshipFromURL(url);
    confirm('accept');
  });

  uSocket.on("confirmedRequest", async request => {
    console.log(request);
    const contactsCreator = new FriendsFacade(uSocket, uSocket.uid);
    await contactsCreator.respondToFriendRequest(request);
  });

  uSocket.on("removeFriend", async proxyID => {
    //await sock.removeFriend(proxyID);
    const contactsFacade = new FriendsFacade(uSocket, uSocket.uid);
    await contactsFacade.removeFriendship(proxyID);
  });

  uSocket.on("sendFriendRequest", async invitedID => {
    const contactsFacade = new FriendsFacade(uSocket, uSocket.uid);
    await contactsFacade.sendFriendRequest(invitedID);
  });

  uSocket.on("changeUsername", async (username, oldName) => {
    const user = new User(uSocket.uid);
    await user.loadUserDocument();

    const friendsNotification = {
      text: `${oldName} changed his username to ${username}`,
      type: 2,
      id: uuidv4()
    };
    const userNotification = {
      ...friendsNotification,
      text: `You have  changed username from: ${oldName} to: ${username}`
    };
    helper.emitToEveryFriend(
      "newNotification",
      friendsNotification,
      user.user.friends
    );
    helper.emit("newNotification", userNotification);
    user.addToArrayField("notifications", userNotification);
    const data = [user.user.searchID, { name: username }];
    helper.emitT1oEveryFriend("updateFriend", data, user.user.friends);
    const friendIDs = user.user.friends.map(el => el.id);
    await user.saveUser();
    await Promise.allSettled(
      friendIDs.map(async id => {
        let friend = await ChatUser.findById(id);
        friend.notifications = [...friend.notifications, friendsNotification];
        await friend.save();
      })
    );
  });

  uSocket.on("disconnect", async () => {
    console.log(uSocket.uid);
    console.log("User disconnetcted xpkej");
    const user = new User(uSocket.uid);
    await user.loadUserDocument();
    const data = [user.user.searchID, { isOnline: false }];
    helper.emitToEveryFriend("updateFriend", data, user.user.friends);
    user.updateUserField("isOnline", false);
    await user.saveUser();
  });

  uSocket.on("newKeys", async () => {
    const user = await ChatUser.findById(uSocket.uid);
    const data = [user.user.searchID, { key: user.user.publickKey }];
    helper.emitToEveryFriend("updateFriend", data, user.user.friends);
  });

  uSocket.on("removeData", async (notSure, clb) => {
    const user = await ChatUser.findById(uSocket.uid);
    const data = user.searchID;
    helper.emitToEveryFriend("removeUser", data, user.friends);
    await user.remove();
    clb(true);
  });
  /*
  uSocket.on("typing", async data => {
    const user = await ChatUser.findById(uSocket.uid);
    const friend = user.friends.find(el => el.proxyID === data.recipient);
    uSocket.broadcast.to(friend.pmName).emit("showTyping", data.sender);
    console.log(friend.id);
  }); */

  uSocket.on("seenMessage", async proxyID => {
    console.log("seen msg conf");
    const user = await ChatUser.findById(uSocket.uid);
    const list = user.friends;
    const friend = list.find(el => el.proxyID === proxyID);
    console.log(friend.id);
    const friendUser = await ChatUser.findById(friend.id);
    const friendUserFriends = friendUser.friends.map(el =>
      el.id !== user.id
        ? el
        : { ...el, lastMes: false, seen: true, delivered: true }
    );
    friendUser.friends = friendUserFriends;
    const data = [
      user.searchID,
      { lastMes: true, seen: true, delivered: true }
    ];
    uSocket.broadcast
      .to(friendUser.notificationRoomID)
      .emit("updateFriend", data);

    const prox = friendUser.friends.find(
      el => el.pmName == user.notificationRoomID
    );
    console.log(prox);
    const newList = friendUser.messages.map(msg =>
      msg.room !== prox.proxyID ? msg : { ...msg, seen: true }
    );
    friendUser.messages = newList;
    await friendUser.save();
    const msgs = user.messages;
    const updated = msgs.map(msg =>
      msg.room !== proxyID ? msg : { ...msg, seen: true }
    );
    user.messages = updated;
    await user.save();
  });

  uSocket.on("message", async data => {
    const user = new User(uSocket.uid);
    await user.loadUserDocument();
    const MsgHelp = new MessagesHelper(
      uSocket,
      data,
      user.user.friends,
      user.user.defaultSettings[2],
      user.user.defaultSettings[3],
      user.user.notificationRoomID
    );
    await MsgHelp.prepareMsgForFriend();
  });
});

// regular rooms connect of standard namespace
io.on("connection", async socket => {
  console.log("NORM ROOM NSP");
  console.log(`a user ${socket.id} connected`);
  //io.to(`${socket.id}`).emit("hey", users);
  socket.emit("userlist", users);
  //users.socket.room = [];

  socket.on("test", data => {
    console.log(data);
  });

  socket.on("message", async msg => {
    msg.date = moment().format("DD/MM, HH:mm:ss");
    msg.key = uuidv4();
    msg.channel = socket.channel.id;
    console.log("MESSAGE NORM");
    console.log(msg.author);
    console.log(socket.channel.id);
    await new Message({
      text: cryptr.encrypt(msg.text),
      author: msg.author,
      channel: socket.channel.id,
      color: msg.color,
      key: msg.key
    }).save();
    socket.emit("message", msg);
    socket.broadcast.to(socket.room).emit("message", msg);
    msg = null;
  });

  socket.on("disconnect", () => {
    console.log(users);
    let newarr = users.filter(usr => usr.id != socket.id);
    console.log(newarr);
    users = newarr;
    let usersInThisRoom = users.filter(usr => usr.room === socket.room);
    console.log(usersInThisRoom);
    socket.emit("userconnected", usersInThisRoom);
    socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);

    let serverMsg = {
      type: "userLeft",
      date: moment().format("HH:mm:ss"),
      user: socket.name,
      order: false,
      author: "Server",
      room: socket.room,
      key: uuidv4()
    };
    socket.emit("serverNotification", serverMsg);
    socket.broadcast.to(socket.room).emit("serverNotification", serverMsg);
    console.log("NORM ROOM DISCONNECTION");
    console.log(`User ${socket.id} Disconnected`);
  });

  socket.on("leaveRoom", name => {
    socket.leave(name);
  });

  socket.on("switchRoom", async (newRoom, user, key) => {
    console.log("switch");
    try {
      console.log("SWITCH ROOM");
      console.log(users);
      let newarr = users.filter(usr => usr.id != socket.id);
      console.log(newarr);
      users = newarr;
      let usersInThisRoom = users.filter(usr => usr.room === socket.room);
      console.log(usersInThisRoom);
      socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);
      console.log(socket.room);
      socket.leave(socket.room);
      var channelModel = await Channel.findOne({ name: newRoom.id });
      if (channelModel.password) {
        let pwdCheck = await bcrypt.compare(newRoom.pwd, channelModel.password);
        var getIn = pwdCheck ? true : false;
      } else {
        getIn = true;
      }

      if (getIn) {
        socket.channel = channelModel;
        socket.room = newRoom.id;
        socket.join(newRoom.id);

        // sent message to OLD room
        // update socket session room title
        console.log(socket.room);
        user.room = socket.room;
        socket.name = user.name;
        users.push(user);

        let serverMsg = {
          type: "userJoined",
          date: moment().format("HH:mm:ss"),
          user: socket.name,
          order: false,
          author: "Server",
          room: newRoom.id,
          key: uuidv4()
        };
        socket.emit("serverNotification", serverMsg);
        socket.broadcast.to(socket.room).emit("serverNotification", serverMsg);

        let chatusr = await ChatUser.findOne({ username: user.name });
        if (chatusr) {
          if (!channelModel.users.includes(chatusr.id)) {
            channelModel.users.push(chatusr.id);
          }
        }
        if (channelModel.encrypt) {
          console.log("encrypted");
          if (!channelModel.publicKeys.includes(key)) {
            console.log("klucznik");
            let ks = channelModel.publicKeys;
            ks.push(key);
            ks = Array.from(new Set(ks));
            ks.filter(k => k);
            channelModel.publicKeys = ks;
          }
          socket.emit("keys", channelModel.publicKeys);
          socket.broadcast
            .to(socket.room)
            .emit("keys", channelModel.publicKeys);
        }
        channelModel.save();
        console.log(`${user.name} has connected to ${user.room}`);
        let usersInThisRoom = users.filter(usr => usr.room === socket.room);

        socket.emit("userconnected", usersInThisRoom);
        console.log(usersInThisRoom);
        socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);

        //send old messages
        var messages = await Message.find({
          channel: socket.channel.id
        }).sort("created");

        for (var inc = 0; inc < messages.length && inc < 10; inc++) {
          messages[inc].text = cryptr.decrypt(messages[inc].text);
          messages[inc].date = moment(messages[inc].created).format(
            "DD/MM, HH:mm:ss"
          );
          socket.emit("message", messages[inc]);
        }
      } else {
        let serverMsg = {
          type: "wrongPassword",
          date: moment().format("HH:mm:ss"),
          user: socket.name,
          order: false,
          author: "Server",
          room: newRoom.id,
          key: uuidv4()
        };
        socket.emit("serverNotification", serverMsg);
      }
    } catch (err) {
      console.log(err);
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

var port = process.env.PORT || "8000";
app.set("port", port);

module.exports = { app: app, server: server };

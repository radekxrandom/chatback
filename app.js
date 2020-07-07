var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var cors = require("cors");
var passport = require("passport");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("gsugrsogsgoisjgas123");
var bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(10);
var moment = require("moment");

var RSA = require("hybrid-crypto-js").RSA;
var Crypt = require("hybrid-crypto-js").Crypt;
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const utils = require("./utils.js");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
const supervillains = require("supervillains");

var rateLimit = require("express-rate-limit");

var limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  res.header("Authorization", "*");
  next();
});
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
var mongoose = require("mongoose");
var mongo =
  "mongodb+srv://random:pies@cluster0-8quu1.mongodb.net/test?retryWrites=true&w=majority";

var mongoDB = process.env.MONGODB_URI || mongo;

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
const Conversation = require("./models/Conversation");
const socketFunctions = require("./utils/socketFunctions");
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
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
//app.use("/api", limiter);
app.use("/api", apiRouter);

app.use(function(req, res, next) {
  req.io = io;
  next();
});

const getUserDataFromJWT = async token => {
  if (!token) {
    return false;
  }
  let bearer = token.split(" ");
  let ugh = bearer[1];
  let decodedUserToken = await jwt.verify(ugh, "secretkey");
  console.log(decodedUserToken);
  if (!decodedUserToken) {
    return false;
  }
  let user = await ChatUser.findById(decodedUserToken.data.id);
  return user;
};

var users = [];
var rooms = [];

const sleep = waitTimeInMs =>
  new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const createFriendObject = friend => ({
  id: friend._id,
  pmName: friend.notificationRoomID,
  proxyID: uuidv4(),
  seen: false,
  lastMes: false
});

const sanitizeFriendList = async list => {
  let sanitizedList = [];
  for (let i = 0; i < list.length; i++) {
    let friend = await ChatUser.findById(list[i].id);
    let sanitizedFriend = {
      name: friend.username,
      proxyID: list[i].proxyID ? list[i].proxyID : uuidv4(),
      key: friend.publickKey,
      avatar: friend.avatar,
      delivered: friend.wereMsgsDelivered ? friend.wereMsgsDelivered : false,
      lastMes: friend.lastMes ? friend.lastMes : true,
      isOnline: friend.isOnline ? friend.isOnline : false,
      searchID: friend.searchID
    };
    sanitizedList = [...sanitizedList, sanitizedFriend];
  }
  return sanitizedList;
};

// settings = [SOUND0, SOUND1, STARTCOUNTON, COUNTTIME]
const generateDefSettings = () => {
  const settings = [2, 2, 1, 0];
  return settings;
};

const createUser = async () => {
  const srch = uuidv4().slice(0, 4);
  const user = await new ChatUser({
    notificationRoomID: uuidv4(),
    searchID: srch,
    isAnon: false,
    username: supervillains.random(),
    defaultSettings: generateDefSettings()
  }).save();
  return user;
};

const generateToken = user => {
  let payload = {
    id: user.id,
    name: user.username,
    searchID: user.searchID,
    avatar: user.avatar
  };
  let token = jwt.sign({ data: payload }, "secretkey", {
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

const getUserFromInvitation = async url => {
  let invite = await Invite.findOne({ url: url });
  if (!invite) {
    console.log("Invalid invitation");
    return false;
  }
  let inviting = await ChatUser.findById(invite.owner);
  invite.remove((err, ok) => {
    if (err) {
      console.log("Error removing invitation!");
    }
  });
  return inviting;
};

const msgSeenStatusFactory = value => {
  return (list, person) => {
    /*  const filtered = list.filter(fr => fr.proxyID !== person.proxyID);
    const changePerson = {
      ...person,
      lastMes: falue
    };
    return [...filtered, changePerson];
    */

    const better = list.map(fr =>
      fr.proxyID !== person.proxyID ? fr : { ...fr, lastMes: value }
    );
    return better;
  };
};

const userSending = msgSeenStatusFactory(true);
const userReceiving = msgSeenStatusFactory(false);
//const userSeen = msgSeenStatusFactory(true)(false);

const utilNSP = io.of("/util");
utilNSP.on("connection", uSocket => {
  uSocket.on("auth", async (authData, clb) => {
    console.log("Util socket has connected");
    console.log("Util socket token " + authData.token);
    //retrieve or create user
    var user;
    if (!authData || !authData.token) {
      //let userid = await createUser();
      user = await createUser();
      let token = generateToken(user);
      let tok = "Bearer " + token;
      uSocket.emit("token", tok);
    } else {
      user = await getUserDataFromJWT(authData.token);
    }
    console.log(user.defaultSettings);
    console.log(user.id);
    //join notification room
    uSocket.room = user.notificationRoomID;
    uSocket.join(user.notificationRoomID);
    console.log(`${uSocket.id} joined the notification room`);
    /*
    console.log(user.friends.length);
    if (user.friends.length) {
      let friends = filterOutNullValues(removeDuplicates(user.friends));
      console.log(  friends.length);
      if (friends.length) {
        uSocket.emit("friendList", await sanitizeFriendList(friends));
        user.friends = friends;
      }
    }

    if (user.invites.length) {
      for (let i = 0; i < user.invites.length; i++) {
        uSocket.emit("friendRequest", user.invites[i]);
      }
    }

    if (user.messages.length) {
      for (let cn = 0; cn < user.messages.length; cn++) {
        uSocket.emit("message", user.messages[cn]);
      }
    }

     */

    uSocket.user = user;
    uSocket.uid = user.id;
    user.isOnline = true;
    user.wereMsgsDelivered = true;

    await user.save();
    //emit to socket his name, sanitized friendlist, notifications, and messages
    uSocket.emit("pmRoom", user.searchID);

    const ug = user.friends.map(fr => fr.pmName);
    const data = [true, user.searchID];
    ug.forEach(pmName => {
      uSocket.broadcast.to(pmName).emit("onoff", data);
    });

    clb(true);
    console.log("User succesfuly connected and authorized");
  });

  uSocket.on("deliveredMsgs", async () => {
    const user = await ChatUser.findById(uSocket.uid);
    const list = user.friends;
    for (var i = 0; i < list.length; i++) {
      let friend = await ChatUser.findById(list[i].id);
      let updatedMsgs = friend.messages.map(msg =>
        msg.author !== user.username ? msg : { ...msg, delivered: true }
      );
      friend.messages = updatedMsgs;
      await friend.save();
    }
  });

  uSocket.on("sendPublickKey", async (key, clb) => {
    console.log("PUblick key sent");
    let user = await ChatUser.findById(uSocket.uid);
    console.log(uSocket.uid);
    user.publickKey = key;
    await user.save();
    clb(true);
  });

  uSocket.on("generateInvitationURL", async () => {
    console.log("INVITATION GEN");
    console.log(uSocket.user.username);
    let invite = await new Invite({
      url: uuidv4(),
      owner: uSocket.uid
    }).save();
    uSocket.emit("invitationURL", invite.url);
    console.log("INVITATION SENT");
  });

  uSocket.on("acceptInvitationByURL", async (url, confirm) => {
    console.log("INVITATION ACCEPTED");
    console.log(uSocket.id);
    console.log(uSocket.uid);
    let user = await ChatUser.findById(uSocket.uid);
    let inviting = await getUserFromInvitation(url);
    if (!inviting) {
      console.log("Invalid invitation");
      return false;
    }
    inviting.friends.push(createFriendObject(user));
    user.friends.push(createFriendObject(inviting));
    //uSocket.user = user;

    uSocket.emit("friendList", await sanitizeFriendList(user.friends));
    uSocket.broadcast
      .to(inviting.notificationRoomID)
      .emit("friendList", await sanitizeFriendList(inviting.friends));

    let confirmation = {
      username: uSocket.user.username,
      text: "accepted your invitation",
      type: 1,
      inv_id: uuidv4()
    };
    inviting.notifications.push(confirmation);
    uSocket.broadcast
      .to(inviting.notificationRoomID)
      .emit("acceptedURL", confirmation);

    confirm(true);
    await inviting.save();
    await user.save();
  });

  uSocket.on("removeFriend", async proxyId => {
    let actingUser = await ChatUser.findById(uSocket.uid);

    //user being removed
    let fromList = actingUser.friends.filter(fr => fr.proxyID === proxyId);
    let removedUserData = Object.assign({}, ...fromList);
    let removedUser = await ChatUser.findById(removedUserData.id);
    let secUpdatedList = removedUser.friends.filter(
      fr => fr.id !== uSocket.uid
    );
    removedUser.friends = secUpdatedList;
    await removedUser.save();
    uSocket.broadcast
      .to(removedUser.notificationRoomID)
      .emit("friendList", await sanitizeFriendList(secUpdatedList));

    //acting user
    let updatedList = actingUser.friends.filter(fr => fr.proxyID !== proxyId);
    console.log(actingUser.friends);
    console.log(updatedList);
    actingUser.friends = updatedList;
    await actingUser.save();
    uSocket.user = actingUser;
    uSocket.emit("friendList", await sanitizeFriendList(updatedList));
  });

  uSocket.on("sendFriendRequest", async invitedID => {
    let invitation = {
      username: uSocket.user.username,
      user_id: uSocket.user.id,
      responded: false,
      inv_id: uuidv4(),
      text: "sent you a friend invitation",
      type: 0
    };
    console.log(invitation);
    let invited = await ChatUser.findOne({ searchID: invitedID });
    console.log(invited.username);
    invited.invites.push(invitation);

    uSocket.emit("confirmation", "invitation sent");
    uSocket.broadcast
      .to(invited.notificationRoomID)
      .emit("friendRequest", invitation);
    await invited.save();
  });

  uSocket.on("confirmedRequest", async request => {
    console.log(request);
    const userEhh = await ChatUser.findById(uSocket.user._id);
    let invit = userEhh.invites.filter(inv => inv.inv_id !== request.inv_id);
    userEhh.invites = invit;
    if (request.response === true) {
      let inviting = await ChatUser.findById(request.user_id);
      let newFriend = createFriendObject(inviting);
      let secNewFriend = createFriendObject(userEhh);
      inviting.friends.push(secNewFriend);
      let confirmation = {
        username: userEhh.username,
        text: "accepted your invitation",
        type: 1,
        inv_id: uuidv4()
      };
      inviting.notifications.push(confirmation);
      await inviting.save();

      userEhh.friends.push(newFriend);
      uSocket.broadcast
        .to(inviting.notificationRoomID)
        .emit("confirmation", confirmation);
      uSocket.emit("friendList", await sanitizeFriendList(userEhh.friends));
      uSocket.broadcast
        .to(inviting.notificationRoomID)
        .emit("friendList", await sanitizeFriendList(inviting.friends));
    } else {
      uSocket.emit("requestAnswer", false);
    }
    uSocket.user = userEhh;
    await userEhh.save();
  });

  uSocket.on("seenMes", async proxyID => {
    console.log("SEEN");
    const usr = await ChatUser.findById(uSocket.uid);
    const reduce = usr.friends.filter(fr => fr.proxyID === proxyID);
    const userObject = Object.assign({}, ...reduce);
    const secUsr = await ChatUser.findById(userObject.id);
    const secUsrObj = secUsr.friends.filter(fr => fr.id === uSocket.uid);
    secUsr.friends = userSeen(secUsr.friends, secUsrObj);
    console.log(secUsr.notificationRoomID);
    console.log(secUsrObj.proxyID);
    uSocket.broadcast
      .to(secUsr.notificationRoomID)
      .emit("seen", secUsrObj.proxyID);
  });

  uSocket.on("usernameChanged", async data => {
    const user = await ChatUser.findById(uSocket.uid);
    user.friends = user.friends.map(friend => {
      if (friend.id !== data[1]) {
        return friend;
      }
      if (friend.id === data[1]) {
        friend.name = data[0];
        return friend;
      }
    });
    await user.save();
    uSocket.emit("friendList", await sanitizeFriendList(user.friends));
  });

  uSocket.on("changeUsername", async username => {
    console.log(uSocket.uid);
    const user = await ChatUser.findById(uSocket.uid);
    const ug = user.friends.map(fr => fr.pmName);
    const data = [username, uSocket.uid];
    ug.forEach(pmName => {
      uSocket.broadcast.to(pmName).emit("usernameChange", data);
    });
  });

  uSocket.on("disconnect", async () => {
    console.log(uSocket.uid);
    console.log("User disconnetcted xpkej");
    const user = await ChatUser.findById(uSocket.uid);
    user.isOnline = false;
    const ug = user.friends.map(fr => fr.pmName);
    const data = [false, user.searchID];
    ug.forEach(pmName => {
      uSocket.broadcast.to(pmName).emit("onoff", data);
    });
    await user.save();
  });

  uSocket.on("newKeys", async () => {
    const user = await ChatUser.findById(uSocket.uid);
    console.log(user);
    const ug = user.friends.map(fr => fr.pmName);
    const data = [user.publickKey, user.searchID];
    ug.forEach(pmName => {
      console.log("keys sent");
      uSocket.broadcast.to(pmName).emit("setNewKey", data);
    });
  });

  uSocket.on("removeData", async (notSure, clb) => {
    const user = await ChatUser.findById(uSocket.uid);
    console.log(user);
    const ug = user.friends.map(fr => fr.pmName);
    const data = user.searchID;
    ug.forEach(pmName => {
      uSocket.broadcast.to(pmName).emit("removeUser", data);
    });
    await user.remove();
    clb(true);
  });

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
    uSocket.broadcast
      .to(friendUser.notificationRoomID)
      .emit("msgSeenConfirmation", user.searchID);

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

  uSocket.on("message", async (data, id) => {
    console.log("mes sent");
    console.log(data);
    data.key = uuidv4();
    data.fullDate = moment();
    data.room = data.recipient;
    console.log(uSocket.uid);
    let usockUser = await ChatUser.findById(uSocket.uid);
    let reduce = usockUser.friends.filter(fr => fr.proxyID === data.recipient);

    data.startCountdown = usockUser.defaultSettings[2];
    data.countdownTime = usockUser.defaultSettings[3];
    console.log(reduce);
    console.log(data.room);
    let userObject = Object.assign({}, ...reduce);
    usockUser.friends = userSending(usockUser.friends, userObject);
    console.log(userObject);
    usockUser.messages.push(data);
    await usockUser.save();
    let usr = await ChatUser.findById(userObject.id);
    data.delivered = usr.isOnline;
    uSocket.emit("message", data);
    let friend = usr.friends.filter(
      frd => frd.pmName === usockUser.notificationRoomID
    );
    console.log(usr.id);
    console.log(usockUser.id);
    let secf = Object.assign({}, ...friend);
    console.log(secf.proxyId);
    data.sender = secf.proxyID;
    data.room = secf.proxyID;
    usr.messages.push(data);
    usr.wereMsgsDelivered = usr.isOnline;
    console.log(data.room);
    usr.friends = userReceiving(usr.friends, secf);
    uSocket.broadcast.to(usr.notificationRoomID).emit("message", data);
    await usr.save();
  });
});

// temporary conversations connect of /conversation namespace
const nsp = io.of("/conversation");
nsp.on("connection", convSocket => {
  console.log("conv connected");
  convSocket.on("conversationAuth", async (convData, userData, key) => {
    try {
      console.log(convSocket.room);
      convSocket.leave(convSocket.room);
      var conversation = await Conversation.findOne({
        url: convData.url
      });
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
      await conversation.connectedUsersCount++;
      convSocket.emit("count", conversation.connectedUsersCount);
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
        author: "Server",
        key: uuidv4()
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
    if (!convSocket.conversation) {
      console.log("Conv disconnecting not conv socket");
      return false;
    }
    try {
      let serverMsg = {
        type: "userDisconnected",
        date: moment().format("HH:mm:ss"),
        user: convSocket.data,
        order: false,
        author: "Server",
        key: uuidv4()
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

  convSocket.on("confirmReception", rec => {
    convSocket.broadcast.to(convSocket.room).emit("confirmReception", true);
  });

  convSocket.on("message", async (msg, confirm) => {
    try {
      let conv = await Conversation.findById(convSocket.conversation.id);
      console.log(convSocket.room);
      msg.key = uuidv4();
      msg.date = moment().format("HH:mm:ss");
      conv.messages.push(msg);
      await conv.save();
      if (msg.sender === convSocket.data) {
        confirm(convSocket.data);
      }
      convSocket.emit("message", msg);

      convSocket.broadcast.to(convSocket.room).emit("message", msg);
    } catch (err) {
      let serverMsg = {
        type: "error",
        date: moment().format("HH:mm:ss"),
        order: false,
        author: "Server",
        text: "There was error with sending a message",
        key: uuidv4()
      };
      convSocket.emit("serverNotification", serverMsg);
      console.log(convSocket.data);
      console.log(err);
    }
  });

  convSocket.on("colorChange", color => {
    convSocket.broadcast.to(convSocket.room).emit("colorChange", color);
  });

  convSocket.on("delete", async (usrId, confirm) => {
    try {
      let conv = await Conversation.findById(convSocket.conversation.id);
      if (conv.owner === usrId) {
        // await conv.remove();
        conv.remove((err, ok) => {
          let notification = {
            type: "delete",
            success: true
          };
          if (err) {
            notification.success = false;
            confirm(notification);
            console.log(`Error while deleting conversation ${conv.id}`);
            return;
          }
          console.log(`Conversation ${conv.id} deleted ok`);
          console.log(notification);
          confirm(notification);
          convSocket.in(convSocket.room).disconnect(true);
        });
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
    let mes = await new Message({
      text: cryptr.encrypt(msg.text),
      author: msg.author,
      channel: socket.channel.id,
      color: msg.color,
      key: msg.key
    }).save();
    socket.emit("message", msg);
    socket.broadcast.to(socket.room).emit("message", msg);
    mes = null;
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
app.use(function(err, req, res, next) {
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

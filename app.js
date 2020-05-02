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

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

var mongoose = require("mongoose");
var mongo =
  "mongodb+srv://random:pies@cluster0-8quu1.mongodb.net/test?retryWrites=true&w=majority";

var mongoDB = process.env.MONGODB_URI || mongo;
mongoose.connect(mongoDB, {
  useNewUrlParser: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const ChatUser = require("./models/ChatUser");
const Channel = require("./models/Channel");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");
const socketFunctions = require("./utils/socketFunctions");

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
app.use("/api", limiter);
app.use("/api", apiRouter);

app.use(function(req, res, next) {
  res.io = io;
  next();
});

var users = [];
var rooms = [];

const sleep = waitTimeInMs =>
  new Promise(resolve => setTimeout(resolve, waitTimeInMs));

// regular rooms connect of standard namespace
io.on("connection", async socket => {
  console.log(`a user ${socket.id} connected`);
  console.log(socket.room);
  //io.to(`${socket.id}`).emit("hey", users);
  socket.emit("userlist", users);
  //users.socket.room = [];

  socket.on("message", async msg => {
    msg.type = "inmes";
    msg.date = moment().format("DD/MM, HH:mm:ss");
    let mes = await new Message({
      text: cryptr.encrypt(msg.text),
      author: msg.author,
      channel: socket.channel.id
    }).save();
    socket.emit("message", msg);
    socket.broadcast.to(socket.room).emit("message", msg);
    mes = null;
    msg = null;
  });

  socket.on("disconnect", () => {
    let newarr = users.filter(usr => usr.id != socket.id);
    users = newarr;
    let usersInThisRoom = users.filter(usr => usr.room === socket.room);
    socket.emit("userconnected", usersInThisRoom);
    socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);
    socket.broadcast
      .to(socket.room)
      .emit("updatechat", `${socket.name} has left this room`);
    console.log(`User ${socket.id} Disconnected`);
  });

  socket.on("switchRoom", async (newRoom, user, key) => {
    try {
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
        socket.emit("updatechat", "You have connected to room: " + newRoom.id);
        // sent message to OLD room
        // update socket session room title
        console.log(socket.room);
        user.room = socket.room;
        socket.name = user.name;
        users.push(user);
        socket.broadcast
          .to(socket.room)
          .emit("updatechat", `${socket.name} has joined this room`);
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
            console.log(channelModel.publicKeys);
            let ks = channelModel.publicKeys;
            ks.push(key);
            ks = Array.from(new Set(ks));
            ks.filter(k => k);
            console.log(ks);
            channelModel.publicKeys = ks;
            console.log(channelModel.publicKeys);
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
        socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);

        //send old messages
        var messages = await Message.find({ channel: socket.channel.id }).sort(
          "created"
        );

        for (inc = 0; inc < messages.length && inc < 10; inc++) {
          messages[inc].text = cryptr.decrypt(messages[inc].text);
          messages[inc].date = moment(messages[inc].created).format(
            "DD/MM, HH:mm:ss"
          );
          socket.emit("message", messages[inc]);
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
});

// temporary conversations connect of /conversation namespace
io.of("/conversation").on("connect", socket => {
  console.log("conv connected");
  socket.on("conversationAuth", async (convData, userData, key) => {
    try {
      console.log(socket.room);
      socket.leave(socket.room);
      var conversation = await Conversation.findOne({ url: convData.url });
      if (!conversation) {
        console.log("wrong conversation");
        socket.disconnect(true);
        return false;
      }
      console.log(conversation.connectedUsersCount);
      if (userData.id !== conversation.owner) {
        if (
          conversation.secondUser &&
          conversation.secondUser !== userData.id
        ) {
          console.log("WRONG ID");
          socket.emit("wrongID", false);
          socket.disconnect(true);
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

        socket.emit("secUserId", secUsrId);
      }
      if (conversation.publicKeys.length < 3) {
        console.log("add key");
        conversation.publicKeys.push(key);
      } else {
        console.log("THERE ARE KEYS ALREADY");
      }
      conversation.connectedUsersCount++;
      console.log(conversation.connectedUsersCount);
      socket.room = convData.url;
      socket.join(convData.url);
      console.log(socket.room);
      await conversation.save();
      socket.data = userData.id;
      socket.emit("currentUsrId", userData.id);
      let allUsers = [conversation.owner, conversation.secondUser];
      console.log(allUsers);
      socket.emit("allUsers", allUsers);
      socket.broadcast.to(socket.room).emit("allUsers", allUsers);

      socket.emit("keys", conversation.publicKeys);
      socket.broadcast.to(socket.room).emit("keys", conversation.publicKeys);

      if (conversation.messages.length > 0) {
        console.log("mesagess send");
        for (var ir = 0; ir < conversation.messages.length; ir++) {
          socket.emit("message", conversation.messages[ir]);
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

      socket.emit("serverNotification", serverMsg);
      socket.broadcast.to(socket.room).emit("serverNotification", serverMsg);

      socket.conversation = conversation;
    } catch (err) {
      console.log(err);
      socket.emit("error", err);
    }
  });

  socket.on("disconnect", async () => {
    let serverMsg = {
      type: "userDisconnected",
      date: moment().format("HH:mm:ss"),
      user: socket.data,
      order: false,
      author: "Server"
    };

    socket.emit("serverNotification", serverMsg);
    socket.broadcast.to(socket.room).emit("serverNotification", serverMsg);

    //delete conv if no users remain
    let conv = await Conversation.findById(socket.conversation.id);
    console.log(conv.connectedUsersCount);
    conv.connectedUsersCount--;
    console.log(conv.connectedUsersCount);

    await conv.save();
    if (conv.connectedUsersCount === 0) {
      //wait for 15 minutes and then delete if still empty
      sleep(1500000).then(async () => {
        console.log("spiulki");
        console.log(conv.url);
        let con = await Conversation.findById(socket.conversation.id);
        if (con.connectedUsersCount === 0) {
          await con.remove();
        }
      });
    }
  });

  socket.on("message", async msg => {
    console.log(msg);
    let conv = await Conversation.findById(socket.conversation.id);
    console.log(conv.url);
    console.log(socket.room);
    msg.date = moment().format("HH:mm:ss");
    conv.messages.push(msg);
    await conv.save();
    socket.emit("message", msg);
    socket.broadcast.to(socket.room).emit("message", msg);
  });

  socket.on("colorChange", async color => {
    socket.broadcast.to(socket.room).emit("colorChange", color);
  });

  socket.on("delete", async usrId => {
    let conv = await Conversation.findById(socket.conversation.id);
    if (conv.owner === usrId) {
      socket.in(socket.room).disconnect(true);
      await conv.remove();
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

module.exports = { app: app, server: server };

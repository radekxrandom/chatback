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
  max: 5
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
var messages = [];

io.on("connection", async socket => {
  console.log(`a user ${socket.id} connected`);
  //io.to(`${socket.id}`).emit("hey", users);
  socket.emit("userlist", users);
  //users.socket.room = [];

  socket.on("message", async msg => {
    msg.type = "inmes";
    let now = moment().format("DD/MM, HH:mm:ss");
    msg.date = now;
    if (socket.room === "public" || socket.channel.listOnMain === true) {
      if (socket.channel.password) {
        var encryptedText = cryptr.encrypt(msg.text);
      }
      let mes = await new Message({
        text: encryptedText ? encryptedText : msg.text,
        author: msg.author,
        channel: socket.channel.id
      }).save();
      console.log(socket.channel);
    }
    socket.emit("message", msg);
    socket.broadcast.to(socket.room).emit("message", msg);
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
        console.log("klucznik");
        console.log(key);
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
        if (!channelModel.users.includes(chatusr.id)) {
          channelModel.users.push(chatusr.id);
          channelModel.save();
        }
        if (channelModel.encrypt) {
          console.log("encrypted");
          if (!channelModel.publicKeys.includes(key)) {
            console.log("klucznik");
            console.log(key);
            console.log(channelModel.publicKeys);
            let ks = channelModel.publicKeys;
            ks.push(key);
            ks.filter(k => k);
            console.log(ks);
            channelModel.publicKeys = ks;
            channelModel.save();
            console.log(channelModel.publicKeys);
          }
          socket.emit("keys", channelModel.publicKeys);
          socket.broadcast
            .to(socket.room)
            .emit("keys", channelModel.publicKeys);
        }
        console.log(`${user.name} has connected to ${user.room}`);
        let usersInThisRoom = users.filter(usr => usr.room === socket.room);

        if (socket.room === "public") {
          for (let i = 0; i < messages.length; i++) {
            socket.emit("message", messages[i]);
          }
        }

        socket.emit("userconnected", usersInThisRoom);
        socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);

        //send old messages
        var messages = await Message.find({ channel: socket.channel.id }).sort(
          "created"
        );

        for (inc = 0; inc < messages.length; inc++) {
          if (socket.channel.password) {
            var decryptedText = cryptr.decrypt(messages[inc].text);
            messages[inc].text = decryptedText;
          }
          let formatedDate = moment(messages[inc].created).format(
            "DD/MM, HH:mm:ss"
          );
          console.log(formatedDate);
          messages[inc].date = formatedDate;
          socket.emit("message", messages[inc]);
          console.log(messages[inc].text);
        }
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

module.exports = { app: app, server: server };

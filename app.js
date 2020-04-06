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

var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

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
    console.log(msg);
    socket.emit("message", msg);
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
      console.log(mes);
      if (messages.length < 10) {
        messages.push(msg);
      } else {
        messages.shift;
        messages.push(msg);
      }
    }
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

  socket.on("switchRoom", async (newRoom, user) => {
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
        console.log(newRoom.id);
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

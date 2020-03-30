var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var cors = require("cors");
var passport = require("passport");

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
  "mongodb+srv://getpies:pervmoj123@cluster0-wdadp.mongodb.net/now?retryWrites=true&w=majority";

var mongoDB = process.env.MONGODB_URI || mongo;
mongoose.connect(mongoDB, {
  useNewUrlParser: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

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

io.on("connection", socket => {
  console.log(`a user ${socket.id} connected`);
  //io.to(`${socket.id}`).emit("hey", users);
  console.log(users);
  //users.socket.room = [];
  socket.on("username", user => {
    var this_user = user;
    user.room = socket.room;
    users.push(user);
    console.log(`${user.name} has connected`);
    let usersInThisRoom = users.filter(usr => usr.room === socket.room);
    if ((socket.room = "public")) {
      for (let i = 0; i < messages.length; i++) {
        socket.emit("message", messages[i]);
      }
    }
    socket.emit("userconnected", usersInThisRoom);
    socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);
  });

  socket.on("message", msg => {
    msg.type = "inmes";
    console.log(msg);
    socket.emit("message", msg);
    if (socket.room === "public") {
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
    console.log(`User ${socket.id} Disconnected`);
  });

  socket.on("switchRoom", newroom => {
    // leave the current room (stored in session)
    socket.leave(socket.room);
    // join new room, received as function parameter
    socket.join(newroom);

    socket.emit("updatechat", "You have connected to room: " + newroom);
    // sent message to OLD room
    socket.broadcast
      .to(socket.room)
      .emit("updatechat", `${socket.id} has left this room`);
    // update socket session room title
    socket.room = newroom;
    socket.broadcast
      .to(newroom)
      .emit("updatechat", `${socket.id} has joined this room`);
    //socket.emit("updaterooms", newroom);
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

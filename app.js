var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var cors = require("cors");

var apiRouter = require("./routes/api");

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

app.use("/api", apiRouter);

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
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.io = io;
  next();
});

var users = [];

io.on("connection", socket => {
  console.log("a user connected");
  io.to(`${socket.id}`).emit("hey", users);
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });

  socket.on("message", msg => {
    msg.type = "inmes";
    console.log(msg);
    socket.emit("message", msg);
    socket.broadcast.emit("message", msg);
  });

  socket.on("username", username => {
    users.push(username);
    console.log(`${username} has connected`);
    socket.emit("userconnected", username);
    socket.broadcast.emit("userconnected", username);
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

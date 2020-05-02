const ChatUser = require("../models/ChatUser");
const Channel = require("../models/Channel");
const Message = require("../models/Message");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("gsugrsogsgoisjgas123");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
var moment = require("moment");

var users = [];
var rooms = [];
var messages = [];

exports.message = async (msg, socket) => {
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
};

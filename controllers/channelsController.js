const ChatUser = require("../models/ChatUser");
const Channel = require("../models/Channel");
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(10);

exports.createChannel = async (req, res) => {
  let respons = await jwt.verify(req.token, "secretkey");
  if (!respons) {
    return res.status(400).json({ err: "Wrong token" });
  }
  let owner = await ChatUser.findById(respons.data.id);
  if (!owner) {
    return res.status(400).json({ err: "Wrong token" });
  }
  let chan = await new Channel({
    name: req.body.name,
    owner: owner,
    listOnMain: req.body.list
  });
  if (req.body.password) {
    let hashedPass = await bcrypt.hash(req.body.password, salt);
    chan.password = hashedPass;
  }
  chan.save();
  return res.status(200).json({ err: "All ok", ch: chan });
};

exports.listChannels = async (req, res) => {
  var ugh = await Channel.find({ listOnMain: true });
  if (!ugh) {
    return res.status(200).json({ mes: "no channels" });
  }
  //channels = JSON.stringify(ugh);
  return res.json({ channels: ugh });
};

exports.checkChannelPassword = async (req, res) => {
  var chan = await Channel.findOne({ name: req.params.id });
  if (!chan) {
    return res.status(400).json({ err: "No such channel" });
  }
  if (chan.password) {
    return res.status(200).json(true);
  }
  return res.status(200).json(false);
};

exports.checkIfPasswordIsCorrect = async (req, res) => {};

exports.messages = async (req, res) => {
  let chan = await Channel.findOne({ name: req.params.name });
  if (!chan) {
    return res.status(400).json({ err: "No such channel" });
  }
  return res.status(200).json({ mes: chan });
};

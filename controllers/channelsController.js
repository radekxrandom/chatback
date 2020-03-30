const ChatUser = require("../models/ChatUser");
const Channel = require("../models/Channel");
const message = require("../models/Message");
const jwt = require("jsonwebtoken");

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
    owner: owner
  });
  return res.status(200).json({ err: "All ok", ch: chan });
};

exports.listChannels = async (req, res) => {
  var ugh = await Channel.find().populate("owner");
  if (!ugh) {
    return res.status(200).json({ mes: "no channels" });
  }
  //channels = JSON.stringify(ugh);
  return res.json(ugh.name);
};

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
  await owner.updateOne({ $push: { channels: chan } });
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

exports.showChannelsOnUserProfile = async (req, res) => {
  let respons = await jwt.verify(req.token, "secretkey");
  if (!respons) {
    return res.status(400).json({ err: "Wrong token" });
  }

  var owner = await ChatUser.findById(respons.data.id);
  let chans = owner.channels;
  let channels = [];
  for (let i = 0; i < chans.length; i++) {
    let channel = await Channel.findById(chans[i]);
    channels.push(channel);
  }
  if (owner.globalRole === 3) {
    var allChannels = await Channel.find();
    return res
      .status(200)
      .json({ allChannels: allChannels, ownChannels: channels });
  }
  return res.status(200).json({ ownChannels: channels });
};

exports.deleteChannel = async (req, res) => {
  let respons = await jwt.verify(req.token, "secretkey");
  if (!respons) {
    return res.status(400).json({ err: "Wrong token" });
  }
  var owner = await ChatUser.findById(respons.data.id);
  let channel = await Channel.findById(req.body.channelId);
  if (channel.owner == respons.data.id || owner.globalRole === 3) {
    await channel.deleteOne();
    await Message.deleteMany({ channel: channel.id });
    console.log(req.body.channelId);
    return res
      .status(200)
      .json({ mes: "Succesfuly deleted channel and all related messages" });
  }
  return res.status(200).json({ mes: "Error" });
};

exports.channelOptions = async (req, res) => {
  let respons = await jwt.verify(req.token, "secretkey");
  if (!respons) {
    return res.status(400).json({ err: "Wrong token" });
  }
  try {
    let channel = await Channels.findByIdAndUpdate(
      req.body.channelId,
      req.body
    );
    return res.status(200).json({ mes: "all ok" });
  } catch (err) {
    return res.status(200).json({ err: "not ok" });
  }
};

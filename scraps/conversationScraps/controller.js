const ChatUser = require("../models/ChatUser");
const Channel = require("../models/Channel");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

exports.createNewConversation = async (req, res) => {
  if (req.user) {
    const owner = req.user.id;
  } else {
    owner = uuidv4();
    const anon = true;
  }

  let url = uuidv4();

  let newConversation = await new Conversation({
    owner,
    url
  });

  if (!newConversation) {
    console.log("smth wrong");
    return res.status(200).json({ mes: "smth wrong" });
  }

  if (anon) {
    newConversation.isOwnerAnon = true;
    return res.status(200).json({ url, owner });
  }
  await newConversation.save();
  return res.status(200).json({ url });
};

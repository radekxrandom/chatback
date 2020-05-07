var ChatUser = require("../models/ChatUser");
const jwt = require("jsonwebtoken");

const getUserDataFromJWT = async token => {
  let decodedUserToken = await jwt.verify(token, "secretkey");
  console.log(decodedUserToken);
  if (!decodedUserToken) {
    return false;
  }
  return decodedUserToken;
};

exports.getUserFriends = async (req, res) => {
  try {
    let userData = getUserDataFromJWT(req.token);
    let owner = await ChatUser.find({ id: userData.data.id });
    if (!owner) {
      return res.status(400).json({ err: "Wrong token" });
    }
    let friends = owner.friends;
    return res.status(200).json({ friends });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ err });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    let userData = getUserDataFromJWT(req.token);
    let owner = await ChatUser.find({ id: userData.data.id });
    if (!owner) {
      return res.status(400).json({ err: "Wrong token" });
    }
    let invitedUser = await ChatUser.find({ id: req.body.userId });
    if (!invitedUser) {
      return res.status(400).json({ err: "No user with given id" });
    }
    let invite = {
      username: owner.username,
      id: owner.id,
      responded: false
    };
    invitedUser.invites.push(invite);
    await invitedUser.save();
    return res.status(200).json({ mes: "Ok" });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ err });
  }
};

//make safer in the future
exports.findAll = async (req, res) => {
  try {
    let userData = getUserDataFromJWT(req.token);
    let owner = await ChatUser.find({ id: userData.data.id });
    if (!owner) {
      return res.status(400).json({ err: "Wrong token" });
    }
    let users = await ChatUser.find();
    return res.status(200).json({ users });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ err });
  }
};

exports.findUsername = async (req, res) => {
  try {
    let userData = getUserDataFromJWT(req.token);
    if (!userData) {
      return res.status(400).json({ err: "Wrong token" });
    }
  } catch (err) {
    console.log("pif paf");
    return res.status(400).json({ err: "Wrong token" });
  }
  try {
    let user = await ChatUser.findOne({ searchID: req.body.searchID });
    return res.status(200).json({ username: user.username, id: user._id });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ err });
  }
};

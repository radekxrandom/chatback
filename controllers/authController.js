var ChatUser = require("../models/ChatUser");
var bcrypt = require("bcryptjs");
var salt = bcrypt.genSaltSync(10);
const jwt = require("jsonwebtoken");
const validatorlog = require("./validatorlog");
const validatorreg = require("./validatorreg");

exports.register = async (req, res, next) => {
  try {
    const { errors, isValid } = validatorreg(req.body);
    if (!isValid) {
      return res.status(400).json({ err: errors });
    }

    let hashedPass = await bcrypt.hash(req.body.password, salt);
    await new ChatUser({
      username: req.body.username,
      password: hashedPass,
      email: req.body.email,
      globalRole: req.body.role
    }).save();
    console.log("suc");
    res.json("Succes");
  } catch (err) {
    console.log("you suck");
    res.json({ err: "Somethings wrong" });
  }
};

exports.login = async (req, res, next) => {
  const { errors, isValid } = validatorlog(req.body);
  if (!isValid) {
    return res.status(400).json({ err: errors });
  }
  let us = await ChatUser.findOne({ username: req.body.username });
  req.currentUser = us;
  if (!us) {
    return res.status(400).json({ err: "Wrong username" });
  }
  //res.json('User');
  let resp = await bcrypt.compare(req.body.password, us.password);
  //res.json('Pwd');
  if (!resp) {
    return res.status(400).json({ err: "Wrong password" });
  }
  const payload = {
    id: us.id,
    name: us.username
  };
  let token = jwt.sign({ data: payload }, "secretkey", {
    expiresIn: 31556926
  });
  return res.json({ success: true, token: "Bearer " + token });
};

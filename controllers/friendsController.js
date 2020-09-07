const ChatUser = require("../models/ChatUser");
const Invite = require("../models/Invite");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const { encrypt, decrypt } = require("./enc2");
const getUserDataFromJWT = async token => {
  let decodedUserToken = await jwt.verify(token, process.env.JWT_TOKEN);
  console.log(decodedUserToken);
  if (!decodedUserToken) {
    return false;
  }
  return decodedUserToken;
};

// api/user/password/setup
exports.setUpPassword = async (req, res) => {
  const userData = await getUserDataFromJWT(req.token);
  const user = await ChatUser.findById(userData.data.id);
  if (user.password) {
    return res
      .status(401)
      .json({ err: "Password already set up. Try changing it" });
  }
  /*
  const cryptoSalt = crypto.randomBytes(16).toString('hex');
  const hash = await crypto.pbkdf2(password, salt, 100000, 64, 'sha512').toString('hex');

  const algorithm = 'aes-192-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, hash, iv); */
  const encryptedKey = await encrypt(req.body.key, req.body.password);
  //const encryptedKey = await encrypt(req.body.password, req.body.key);
  const hashedPass = await bcrypt.hash(req.body.password, salt);
  user.password = hashedPass;
  user.isAnon = false;
  const date = moment()
    .utcOffset(2)
    .format("dddd, DD/MM, HH:mm:ss");
  const notification = {
    text: `Password added on ${date}`,
    type: 2,
    id: uuidv4()
  };
  const notifs = [...user.notifications, notification];
  user.notifications = notifs;
  user.exportProfile = encryptedKey;
  await user.save();
  const jsonNotif = JSON.stringify(notification);
  return res.status(200).json({ mes: "Changed password", notif: jsonNotif });
};

const timePeriods = [5, 15, 30, 1, 2, 4, 8, 12, 1, 2];
const periodTypes = ["m", "m", "m", "h", "h", "h", "h", "h", "d", "d"];

const filterOutOld = msgs => {
  var arr = [];
  for (var i = 0; i < msgs.length; i++) {
    if (!msgs[i].fullDate || msgs[i].startCountdown === 0) {
      arr = [...arr, msgs[i]];
    } else if (msgs[i].startCountdown === 2) {
      if (
        moment(msgs[i].fullDate).isAfter(
          moment().subtract(
            timePeriods[msgs[i].countdownTime],
            periodTypes[msgs[i].countdownTime]
          )
        )
      ) {
        arr = [...arr, msgs[i]];
      }
    } else if (msgs[i].startCountdown === 1) {
      if (!msgs[i].seen) {
        arr = [...arr, msgs[i]];
      } else {
        if (
          moment(msgs[i].fullDate).isAfter(
            moment().subtract(
              timePeriods[msgs[i].countdownTime],
              periodTypes[msgs[i].countdownTime]
            )
          )
        ) {
          arr = [...arr, msgs[i]];
        }
      }
    }
  }
  return arr;
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

exports.uploadAvatar = async (req, res) => {
  if (!req.body.avatarURL) {
    return res.status(400).json({ err: "Wrong image" });
  }
  let userData = await getUserDataFromJWT(req.token);

  console.log(userData);
  console.log(userData.data);
  let user = await ChatUser.findById(userData.data.id);
  user.avatar = req.body.avatarURL;
  let payload = {
    id: user.id,
    name: user.username,
    searchID: user.searchID,
    avatar: req.body.avatarURL
  };
  let token = jwt.sign({ data: payload }, process.env.JWT_TOKEN, {
    expiresIn: 31556926
  });
  await user.save();
  return res.status(200).json({ token: "Bearer " + token });
};

exports.changeUsername = async (req, res) => {
  if (!req.body.username) {
    return res.status(400).json({ err: "Wrong input data" });
  }
  let userData = await getUserDataFromJWT(req.token);

  console.log(userData);
  console.log(userData.data);
  let user = await ChatUser.findById(userData.data.id);
  user.username = req.body.username;
  let payload = {
    id: user.id,
    name: user.username,
    searchID: user.searchID,
    avatar: user.avatar
  };
  let token = jwt.sign({ data: payload }, process.env.JWT_TOKEN, {
    expiresIn: 31556926
  });
  await user.save();
  return res.status(200).json({ token: "Bearer " + token });
};

const filterOutNullValues = arr => {
  let lis = Array.from(new Set(arr));
  let arrList = lis.filter(el => el !== undefined);
  arrList = arrList.filter(el => el.id !== undefined);
  return arrList;
};

const removeDuplicates = arr => {
  let list = Array.from(new Set(arr.map(a => a.pmName))).map(pmName => {
    return arr.find(a => a.pmName === pmName);
  });
  return list;
};

const sanitizeFriendList = async list => {
  let sanitizedList = [];
  for (let i = 0; i < list.length; i++) {
    let friend = await ChatUser.findById(list[i].id);
    if (!friend) {
      console.log("no friend found");
      sanitizedList = [...sanitizedList];
    } else {
      let sanitizedFriend = {
        name: friend.username,
        proxyID: list[i].proxyID,
        key: friend.publickKey,
        avatar: friend.avatar,
        seen: list[i].seen,
        delivered: friend.wereMsgsDelivered,
        lastMes: list[i].lastMes,
        isOnline: friend.isOnline,
        searchID: friend.searchID
      };
      sanitizedList = [...sanitizedList, sanitizedFriend];
    }
  }
  return sanitizedList;
};

const sortMessage = (sender, recipient, user) => {
  return sender === user ? recipient : sender;
};

const sortThem = (msgs, usr) => {
  const ugabuga = msgs.map(el => {
    let a = {
      ...el,
      room: sortMessage(el.sender, el.recipient, usr)
    };
    return a;
  });
  return ugabuga;
};

const messageWork = (msgs, userSearchID) => {
  if (!msgs.length) {
    return msgs;
  }
  const seenmsgs = msgs.map(ms => (ms = { ...ms, delivered: true }));
  const sorted = seenmsgs[seenmsgs.length - 1].room
    ? seenmsgs
    : sortThem(seenmsgs, userSearchID);
  return sorted;
};

// /api/initial
exports.initialLoad = async (req, res) => {
  const userData = await getUserDataFromJWT(req.token);
  const user = await ChatUser.findById(userData.data.id);
  console.log(user.friends.length);
  const pach = messageWork(user.messages, user.searchID);
  const sorted = await filterOutOld(pach);
  user.messages = sorted;
  user.isOnline = true;
  if (!user.password && !user.isAnon) {
    user.isAnon = true;
  }
  if (!user.defaultSettings || user.defaultSettings.length < 2) {
    user.defaultSettings = generateDefSettings();
  }
  console.log(user.defaultSettings);
  if (user.friends.length) {
    const friends = filterOutNullValues(removeDuplicates(user.friends));
    const friendlist = await sanitizeFriendList(friends);
    user.friends = friends;
    await user.save();
    return res.json({
      friendlist,
      notifs: [...user.invites, ...user.notifications],
      msgs: sorted,
      settings: user.defaultSettings,
      darkTheme: user.darkTheme || false,
      language: user.language || "en",
      hasPassword: !!user.password
    });
  }
  await user.save();
  return res.json({
    notifs: [...user.invites, ...user.notifications],
    msgs: sorted,
    settings: [...user.defaultSettings],
    darkTheme: user.darkTheme || false,
    language: user.language || "en",
    hasPassword: !!user.password
  });
};

exports.notifRemove = async (req, res) => {
  const userData = await getUserDataFromJWT(req.token);
  const user = await ChatUser.findById(userData.data.id);
  const newNotifs = user.notifications.filter(
    el => el.id !== req.body.notificationID
  );
  user.notifications = newNotifs;
  await user.save();
  return res.json({ ok: "boomer" });
};
// settings = [SOUND0, SOUND1, STARTCOUNTON, COUNTTIME]
const generateDefSettings = () => {
  const settings = [2, 2, 1, 0];
  return settings;
};

// api/user/settings
exports.getUserSettings = async (req, res) => {
  const userData = await getUserDataFromJWT(req.token);
  const user = await ChatUser.findById(userData.data.id);
  if (!user.defaultSettings.length || user.defaultSettings.length < 2) {
    console.log("gen def settings");
    user.defaultSettings = generateDefSettings();
    await user.save();
    return res.json({ settings: generateDefSettings() });
  }
  user.defaultSettings = generateDefSettings();
  await user.save();
  console.log("dindu gen def settings");
  return res.json({ settings: user.defaultSettings });
};

const checkSettings = (setting, upperBound) => {
  if (setting < 0 || setting > upperBound) {
    return false;
  }
  return true;
};

// /api/user/settings
exports.setUserSettings = async (req, res) => {
  const userData = await getUserDataFromJWT(req.token);
  const user = await ChatUser.findById(userData.data.id);
  if (
    !checkSettings(req.body.sound0, 2) ||
    !checkSettings(req.body.sound1, 2) ||
    !checkSettings(req.body.startCountOn, 2) ||
    !checkSettings(req.body.countTime, 9)
  ) {
    return res.json({ err: "wrong value sent" });
  }

  user.defaultSettings = [
    req.body.sound0,
    req.body.sound1,
    req.body.startCountOn,
    req.body.countTime
  ];
  console.log([
    req.body.sound0,
    req.body.sound1,
    req.body.startCountOn,
    req.body.countTime
  ]);
  await user.save();
  return res.json({ settings: user.defaultSettings });
};

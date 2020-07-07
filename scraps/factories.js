const newFriend = {
  id: friend._id,
  pmName: friend.notificationRoomID,
  proxyID: uuidv4()
};

let sanitizedFriend = {
  name: friend.username,
  proxyID: list[i].proxyID ? list[i].proxyID : uuidv4(),
  key: friend.publickKey,
  avatar: friend.avatar
};

let payload = {
  id: user.id,
  name: user.username,
  searchID: user.searchID,
  avatar: user.avatar
};

const user = await new ChatUser({
  notificationRoomID: uuidv4(),
  searchID: srch,
  isAnon: true,
  username: `Anon #${srch}`
}).save();

let invite = await new Invite({
  url: uuidv4(),
  owner: uSocket.uid
}).save();

let invitation = {
  username: uSocket.user.username,
  user_id: uSocket.user.id,
  responded: false,
  inv_id: uuidv4(),
  text: "sent you a friend invitation",
  type: 0
};

let confirmation = {
  username: uSocket.user.username,
  text: "accepted your invitation",
  type: 1
};

const notifObject = (username, text, type) =>
  (notif = { username, text, type });

let inv = {
  ...notifObject(uSocket.user.username, "sent you a friend invitation", 0),
  user_id: uSocket.user.id,
  responded: false,
  inv_id: uuidv4()
};

let conf = notifObject(uSocket.user.username, "accepted your invitation", 1);

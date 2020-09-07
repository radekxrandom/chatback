const ChatUser = require("./models/ChatUser");
const Channel = require("./models/Channel");
const Message = require("./models/Message");
const Invite = require("./models/Invite");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const supervillains = require("supervillains");

const invitationGenerator = (username, id) => {
  const invitation = {
    username: username,
    user_id: id,
    responded: false,
    id: uuidv4(),
    text: "sent you a friend invitation",
    type: 0
  };
  return invitation;
};

const createFriendObject = (friend, tempName = false) => ({
  id: friend.id,
  pmName: friend.notificationRoomID,
  proxyID: uuidv4(),
  seen: false,
  lastMes: false,
  searchID: friend.searchID,
  tempName
});

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

/*
const sanitizeFriendList = async listFr => {
  let sanitizedList = [];
  const list = [...listFr];
  const friendss = list.map(el => ChatUser.findById(el.id));
  console.log(friendss);
  Promise.allSettled(friendss).then(friends => {
    console.log(friends);
    const sanitizedFriends = friends.map((el, i) => {
      const frnd = {
        name:
          list[i].tempName && list[i].tempName !== 1
            ? list[i].tempName
            : el.username,
        proxyID: list[i].proxyID,
        key: el.publickKey,
        avatar: el.avatar,
        delivered: el.wereMsgsDelivered ? el.wereMsgsDelivered : false,
        lastMes: el.lastMes ? el.lastMes : true,
        isOnline: el.isOnline ? el.isOnline : false,
        searchID: el.searchID
      };
      return frnd;
    });
    console.log(sanitizedFriends);
    return sanitizedFriends;
  });
};

  for (let i = 0; i < list.length; i++) {
    let friend = await ChatUser.findById(list[i].id);
    let sanitizedFriend = {
      name:
        list[i].tempName && list[i].tempName !== 1
          ? list[i].tempName
          : friend.username,
      proxyID: list[i].proxyID,
      key: friend.publickKey,
      avatar: friend.avatar,
      delivered: friend.wereMsgsDelivered ? friend.wereMsgsDelivered : false,
      lastMes: friend.lastMes ? friend.lastMes : true,
      isOnline: friend.isOnline ? friend.isOnline : false,
      searchID: friend.searchID
    };
    sanitizedList = [...sanitizedList, sanitizedFriend];
  }
  return sanitizedList;
  };
  */

class SocketHelper {
  constructor(socket) {
    this.socket = socket;
  }
  setUp(room) {
    this.socket.room = room;
    this.socket.join(room);
  }
  emit(eventName, data) {
    this.socket.emit(eventName, data);
  }
  emitToFriend(eventName, friendRoom, data) {
    this.socket.broadcast.to(friendRoom).emit(eventName, data);
  }
  emitToEveryFriend(eventName, data, friends) {
    const friendRooms = friends.map(el => el.pmName);
    friendRooms.forEach(pmName => {
      this.socket.broadcast.to(pmName).emit(eventName, data);
    });
  }
  async sendUpdatedFriendLists(friendList, friend = false) {
    try {
      this.emit("friendList", await sanitizeFriendList(friendList));
      if (friend) {
        this.emitToFriend(
          "friendList",
          friend.notificationRoomID,

          await sanitizeFriendList(friend.friends)
        );
      }
    } catch (err) {
      console.log(err.name);
      console.log(err.message);
      console.log(err.stack);
      const notif = {
        type: "error",
        text: "Uknown error"
      };
      this.emit("showAlert", notif);
    }
  }
}

class User {
  constructor(id) {
    this.id = id;
  }
  static async createNewAccount() {
    const uuid = uuidv4();
    const srch = uuid.slice(0, 4).concat(uuid.slice(14, 16));
    const user = await new ChatUser({
      notificationRoomID: uuidv4(),
      searchID: srch,
      username: supervillains.random(),
      defaultSettings: [2, 2, 1, 0]
    }).save();
    return new this(user.id);
  }
  async loadUserDocument() {
    this.user = await ChatUser.findById(this.id);
    //return this.user;
  }
  updateUserField(field, value) {
    this.user[field] = value;
  }
  throwIfNotArr(field) {
    if (!Array.isArray(this.user[field])) throw "Wrong field";
  }
  addToArrayField(field, newElement) {
    this.throwIfNotArr(field);
    const arr = this.user[field];
    this.user[field] = [...arr, newElement];
  }
  removeFromArrayField(field, idName, elID) {
    this.throwIfNotArr(field);
    const arr = this.user[field];
    this.user[field] = arr.filter(el => el[idName] !== elID);
  }
  contains(field, idName, elID) {
    return this.user[field].find(el => el[idName] === elID);
  }
  async saveUser() {
    await this.user.save();
  }
  returnUserField(fieldName) {
    return this.user[fieldName];
  }
  changeFriendProperty(searchID, propertyName, propertyValue) {
    const updatedFriendList = this.user.friends.map(el =>
      el.searchID !== searchID ? el : { ...el, [propertyName]: propertyValue }
    );
    this.updateUserField("friends", updatedFriendList);
  }
  updateMsgsDeliveredStatus(name) {
    const updated = this.user.messages.map(msg =>
      msg.author !== name ? msg : { ...msg, delivered: true }
    );
    this.user.messages = updated;
  }
}

class FriendsFacade extends SocketHelper {
  constructor(socket, actingUsrID) {
    super(socket);
    this.user = new ContactsManager(actingUsrID);
  }
  _updateContactLists() {
    this.user.addNewFriend(this.friend.user);
    this.friend.addNewFriend(this.user.user);
  }
  async _createFriendship(friendsID) {
    this.friend = new ContactsManager(friendsID);
    await Promise.all([
      this.user.loadUserDocument(),
      this.friend.loadUserDocument()
    ]);
    this._updateContactLists();
  }
  async _saveBoth() {
    await Promise.all([this.user.saveUser(), this.friend.saveUser()]);
  }
  async _manageFriendshipCreation(friendsID) {
    await this._createFriendship(friendsID);
    const conf = this.friend.invAcceptedNotification(this.user.user.username);
    super.emitToFriend(
      "newNotification",
      this.friend.user.notificationRoomID,

      conf
    );
    await super.sendUpdatedFriendLists(
      this.user.user.friends,
      this.friend.user
    );
  }
  async respondToFriendRequest(request) {
    if (request.response !== true) {
      super.emit("requestAnswer", false);
      await this.user.loadUserDocument();
      this.user.removeFromArrayField("invites", "id", request.id);
      await this.user.saveUser();
      return false;
    }
    await this._manageFriendshipCreation(request.user_id);
    this.user.removeFromArrayField("invites", "id", request.id);
    await this._saveBoth();
  }
  async _extractThenDestroyInvitation(url) {
    let invite = await Invite.findOne({ url: url });
    if (invite) {
      const owner = invite.owner;
      invite.remove((err, ok) => {
        if (err) {
          console.log("Error removing invitation!");
        }
      });
      return owner;
    }
    return false;
  }
  async createFriendshipFromURL(url) {
    const invite = await this._extractThenDestroyInvitation(url);
    console.log(invite);
    if (!invite) {
      console.log(invite);
      console.log("Invalid invitation");
      const notif = {
        type: "error",
        text: "Can't add contact from URL"
      };
      super.emit("showAlert", notif);
      return false;
    }
    await this._manageFriendshipCreation(invite);
    await this._saveBoth();
  }
  _removeBothFromContacts() {
    this.user.removeFromArrayField("friends", "id", this.friend.user.id);
    this.friend.removeFromArrayField("friends", "id", this.user.user.id);
  }
  async removeFriendship(proxyID) {
    await this.user.loadUserDocument();
    const friendID = this.user.getFriendID(proxyID);
    this.friend = new ContactsManager(friendID);
    await this.friend.loadUserDocument();
    this._removeBothFromContacts();
    await this._saveBoth();
    await super.sendUpdatedFriendLists(
      this.user.user.friends,
      this.friend.user
    );
    const notif = {
      type: "info",
      text: "Friend removed"
    };
    super.emit("showAlert", notif);
  }
  async sendFriendRequest(invitedID) {
    this.friend = new ContactsManager(invitedID);
    await Promise.all([
      this.friend.findBySearchID(invitedID),
      this.user.loadUserDocument()
    ]);
    const { username, id } = this.user.user;
    const invitation = this.friend.generateInvitation(username, id);
    const isFriend = this.user.contains("friends", "id", invitedID);
    if (invitation === false || isFriend) {
      const notif = {
        type: "error",
        text: "He's your friend already you dum dum"
      };
      super.emit("showAlert", notif);
      return;
    }
    super.emitToFriend(
      "newNotification",
      this.friend.user.notificationRoomID,

      invitation
    );
    const notif = {
      type: "success",
      text: "Invitation sent"
    };
    super.emit("showAlert", notif);
    await this.friend.saveUser();
  }
}

class ContactsManager extends User {
  constructor(id) {
    super(id);
  }
  async changeMsgsStatus(id, otherUsername) {
    const friend = new User(id);
    await friend.loadUserDocument();
    friend.updateMsgsDeliveredStatus(otherUsername);
    await friend.saveUser();
  }
  async changeFriendMsgs() {
    const friendsIDs = this.user.friends.map(el => el.id);
    await Promise.allSettled(
      friendsIDs.map(
        async el => await this.changeMsgsStatus(el, this.user.username)
      )
    );
  }
  async findBySearchID(searchID) {
    const user = await ChatUser.findOne({ searchID });
    this.user = user;
    this.id = user.id;
  }
  getFriendID(proxyID) {
    const friend = this.user.friends.find(el => el.proxyID === proxyID);
    if (!friend) throw "No friend with this proxy id";
    return friend.id;
  }
  static async genInvitationURL(id) {
    const invite = await new Invite({
      url: uuidv4(),
      owner: id
    }).save();
    return invite.url;
  }
  generateInvitation(name, id) {
    if (this.user.friends.find(el => el.id === id)) {
      return false;
    }
    const invitation = invitationGenerator(name, id);
    super.addToArrayField("invites", invitation);
    return invitation;
  }
  addNewFriend(friend) {
    console.log(friend.username);
    console.log(friend.id);
    if (super.contains("friends", "id", friend.id)) {
      throw "already friends";
    }
    super.addToArrayField("friends", createFriendObject(friend));
  }
  invAcceptedNotification(username) {
    const confirmation = {
      username: username,
      text: "accepted your invitation",
      type: 1,
      id: uuidv4()
    };
    super.addToArrayField("notifications", confirmation);
    return confirmation;
  }
}

module.exports = {
  SocketHelper,
  User,
  ContactsManager,
  FriendsFacade
};

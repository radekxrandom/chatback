const sanitized = list.map(friend => {
  friend = {
    name: friend.name,
    proxyID: friend.proxyID ? friend.proxyID : uuidv4(),
    key: friend.key,
    avatar: friend.avatar
  };
  return friend;
});
return sanitized;

socket2.on("message", data => {
  const { pmRoom, friend } = this.state;
  if (this.state.directMsgs) {
    const unseen = this.state.directMsgs.filter(
      msg => msg.room !== data.sender && msg.room !== data.recipient
    );
    this.setState({
      lastMessages: [
        ...unseen,
        personalizeMessage(
          data,
          this.props.auth.keys.privateKey,
          pmRoom,
          friend.proxyID
        )
      ]
    });
  }
  this.setState({
    directMsgs: [
      ...this.state.directMsgs,
      personalizeMessage(
        data,
        this.props.auth.keys.privateKey,
        pmRoom,
        friend.proxyID
      )
    ]
  });
});

const filterOutOld = msgs => {
  var arr = [];
  for (var i = 0; i < msgs.length; i++) {
    if (!msgs[i].fullDate || msgs[i].startCountdown === 0) {
      arr = [...arr, msgs[i]];
    } else if (msgs[i].startCountdown === 2) {
      switch (msgs[i].countdownTime) {
      case 0:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(5, "m"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 1:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(15, "m"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 2:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(30, "m"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 3:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(1, "h"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 4:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(2, "h"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 5:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(4, "h"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 6:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(8, "h"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 7:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(12, "h"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 8:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(1, "d"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      case 9:
        if (moment(msgs[i].fullDate).isAfter(moment().subtract(2, "d"))) {
          arr = [...arr, msgs[i]];
        } else {
          arr = [...arr];
        }
        break;
      default:
        arr = [...arr, msgs[i]];
      }
    }
  }
  return arr;
};

/*
console.log(user.friends.length);
if (user.friends.length) {
  let friends = filterOutNullValues(removeDuplicates(user.friends));
  console.log(  friends.length);
  if (friends.length) {
    uSocket.emit("friendList", await sanitizeFriendList(friends));
    user.friends = friends;
  }
}

if (user.invites.length) {
  for (let i = 0; i < user.invites.length; i++) {
    uSocket.emit("friendRequest", user.invites[i]);
  }
}

if (user.messages.length) {
  for (let cn = 0; cn < user.messages.length; cn++) {
    uSocket.emit("message", user.messages[cn]);
  }
}

 */

/*
 const filtrr = (time, date) => {
   switch (time) {
   case 0:
     if (moment(date).isAfter(moment().subtract(5, "m"))) {
       return true;
     }
     break;
   case 1:
     if (moment(date).isAfter(moment().subtract(15, "m"))) {
       return true;
     }
     break;
   case 2:
     if (moment(date).isAfter(moment().subtract(30, "m"))) {
       return true;
     }
     break;
   case 3:
     if (moment(date).isAfter(moment().subtract(1, "h"))) {
       return true;
     }
     break;
   case 4:
     if (moment(date).isAfter(moment().subtract(2, "h"))) {
       return true;
     }
     break;
   case 5:
     if (moment(date).isAfter(moment().subtract(4, "h"))) {
       return true;
     }
     break;
   case 6:
     if (moment(date).isAfter(moment().subtract(8, "h"))) {
       return true;
     }
     break;
   case 7:
     if (moment(date).isAfter(moment().subtract(12, "h"))) {
       return true;
     }
     break;
   case 8:
     if (moment(date).isAfter(moment().subtract(1, "d"))) {
       return true;
     }
     break;
   case 9:
     if (moment(date).isAfter(moment().subtract(2, "d"))) {
       return true;
     }
     break;
   default:
     return false;
   }
 };

 const timeEnumArr = [
   [5, "m"],
   [15, "m"],
   [30, "m"],
   [1, "h"],
   [2, "h"],
   [4, "h"],
   [8, "h"],
   [12, "h"],
   [1, "d"],
   [2, "d"]
 ]; */

// settings = [SOUND0, SOUND1, STARTCOUNTON, COUNTTIME]
const generateDefSettings = () => {
  const settings = [2, 2, 1, 0];
  return settings;
};

const createUser = async () => {
  const srch = uuidv4().slice(0, 4);
  const user = await new ChatUser({
    notificationRoomID: uuidv4(),
    searchID: srch,
    isAnon: false,
    username: supervillains.random(),
    defaultSettings: generateDefSettings()
  }).save();
  return user;
};

const removeOldUsers = async arr => {
  var newArr = [];
  for (let i = 0; i < arr.length; i++) {
    const friend = await ChatUser.findById(arr[i].id);
    if (!friend) {
      newArr = [...newArr];
    } else if (friend) {
      newArr = [...newArr, arr[i]];
    }
  }
  return newArr;
};

const getUserIDFromInvitation = async url => {
  let invite = await Invite.findOne({ url: url });
  if (!invite) {
    console.log("Invalid invitation");
    return false;
  }
  invite.remove((err, ok) => {
    if (err) {
      console.log("Error removing invitation!");
    }
  });
  return invite.owner;
};

const msgSeenStatusFactory = value => {
  return (list, person) => {
    /*  const filtered = list.filter(fr => fr.proxyID !== person.proxyID);
     const changePerson = {
       ...person,
       lastMes: falue
     };
     return [...filtered, changePerson];
     */

    const better = list.map(fr =>
      fr.proxyID !== person.proxyID ? fr : { ...fr, lastMes: value }
    );
    return better;
  };
};

const userSending = msgSeenStatusFactory(true);
const userReceiving = msgSeenStatusFactory(false);
//const userSeen = msgSeenStatusFactory(true)(false)

const checkAuth = async authData => {
  let user;
  try {
    if (!authData || !authData.token) throw "No token";
    const id = await getUserDataFromJWT(authData.token);
    user = new User(id);
    return user;
  } catch (err) {
    user = await generateAccount();
    return user;
  }
};
const generateAccount = async _ => {
  const user = await User.createNewAccount();
  await user.loadUserDocument();
  return user;
};

/*
var user;
if (!authData || !authData.token) {
  //let userid = await createUser();
  user = await generateNewAccount(uSocket);
} else {
  const id = await getUserDataFromJWT(authData.token);
  if (!id) {
    user = await generateNewAccount(uSocket);
  } else {
    user = new User(id);
    await user.loadUserDocument();
  }
}
*/

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

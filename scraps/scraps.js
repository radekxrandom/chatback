socket.on("switchRoom", async newroom => {
  // leave the current room (stored in session)
  socket.leave(socket.room);
  // join new room, received as function parameter
  socket.join(newroom.id);
  var channelOptions = await Channel.findOne({ name: newroom.id });
  if (channelOptions.password.length) {
    console.log(channelOptions.password);
    console.log(newroom.id);
    console.log(newroom.pwd);
    let pwdCheck = await bcrypt.compare(newroom.pwd, channelOptions.password);
    console.log(pwdCheck);
    if (!pwdCheck) {
      let msg = {
        text: "Wrong pwd!",
        author: msg.author
      };
      socket.emit("message", msg);
      return 0;
    }
  }
  console.log(channelOptions.logMessages);
  socket.channel = channelOptions;
  socket.emit("updatechat", "You have connected to room: " + newroom);
  // sent message to OLD room
  socket.broadcast
    .to(socket.room)
    .emit("updatechat", `${socket.name} has left this room`);
  // update socket session room title
  socket.room = newroom;
  console.log(socket.room);

  socket.broadcast
    .to(newroom)
    .emit("updatechat", `${socket.name} has joined this room`);
  //socket.emit("updaterooms", newroom);
});

socket.on("username", user => {
  var this_user = user;
  user.room = socket.room;
  socket.name = user.name;
  users.push(user);
  console.log(`${user.name} has connected`);
  let usersInThisRoom = users.filter(usr => usr.room === socket.room);
  if (socket.room === "public") {
    for (let i = 0; i < messages.length; i++) {
      socket.emit("message", messages[i]);
    }
  }
  socket.emit("userconnected", usersInThisRoom);
  socket.broadcast.to(socket.room).emit("userconnected", usersInThisRoom);
});

<div className="list">
  <a className="clickable looklikep" href="/room/public">
    - Public (Online:{" "}
    {this.state.userlist.filter(usr => usr.room === "public").length})
  </a>
  {this.state.channels
    .filter(chn => chn.name !== "public")
    .map((channel, index) => (
      <a
        key={index}
        className="clickable looklikep"
        href={`/room/${channel.name}`}
      >
        {" "}
        - {channel.name} (Online:{" "}
        {this.state.userlist.filter(usr => usr.room === channel.name).length})
      </a>
    ))}
</div>;

const form0 = document.getElementById("postform");
if ($(".fastform").length) {
  const form1 = document.getElementsByClassName("fastform")[0];
  form1.addEventListener("submit", incremenetCounter);
}
form0.addEventListener("submit", incremenetCounter);

//initialize and stuff

const isDisplayVisible = () => {
  if (!document.getElementById("counterDisplay")) {
    return false;
  }
  return true;
};

const elementExists = element => {
  if (!localStorage.getItem(element)) {
    return false;
  }
  return true;
};

const initializeElementInLocalStorage = (el, val) => {
  localStorage.setItem(el, val);
};

const initializeLocalStorage = () => {
  if (!elementExists("counter")) {
    initializeElementInLocalStorage("counter", 2000);
  }
  if (!elementExists("display")) {
    initializeElementInLocalStorage("display", "exists");
  }
};

const appendDisplay = () => {
  //don't add the same element twice
  if (!isDisplayVisible) {
    return;
  }

  var count = localStorage.getItem("counter");

  let newHElement = document.createElement("h1");
  newHElement.innerHTML = `Posts counter: ${count}`;
  newHElement.setAttribute("id", "counterDisplay");

  document.getElementsByClassName("boardBanner")[0].appendChild(newHElement);
};

const updateDisplayedValue = value => {
  let element = document.getElementById("counterDisplay");
  element.innerHTML = `Posts counter: ${value}`;
};

const incremenetCounter = () => {
  if (!elementExists("counter")) {
    initializeCounter(2000);
  }

  let currentCount = parseInt(localStorage.getItem("counter"));
  currentCount++;

  localStorage.setItem("counter", currentCount);
  updateDisplayedValue(currentCount);
};

const run = () => {
  initializeLocalStorage();
  appendDisplay();

  document.addEventListener("submit", incremenetCounter);
};

run();

/* let chns = channelsData.data.channels.filter(
  (v, i) => channelsData.data.channels.indexOf(v) === i
);
*/
//let arr = channelsData.data.channels.map(val => val.name);

<div className="navigation">
  <>
    {!this.props.auth.isAuthenticated && (
      <div className="hello1">
        {" "}
        <span
          className="clickable"
          onClick={this.showLoginForm}
          style={{ marginRight: "10%" }}
        >
          Login
        </span>
        <span className="clickable" onClick={this.showRegisterForm}>
          Register
        </span>{" "}
      </div>
    )}
    {this.props.auth.isAuthenticated && (
      <div className="hello1">
        <span style={{ marginRight: "5%" }}>
          Hello there {this.props.auth.user.data.name},
        </span>
        <span className="clickable" onClick={this.goToUserProfile}>
          Show profile
        </span>
      </div>
    )}
  </>

  if (!localStorage.getItem("privateKey")) {
    this.props.genKeys().then(async () => {
      /*  var publicKey = localStorage.getItem("publicKey");
      var privateKey = localStorage.getItem("privateKey"); */
      let publicKey = this.props.auth.keys.publicKey;
      let privateKey = this.props.auth.keys.privateKey;
      await this.setState({
        publicKey,
        privateKey
      });
      console.log(this.props.auth.keys);
      console.log(this.props.auth);
      console.log(this.props.auth.keys.publicKey);
      socket.emit("conversationAuth", convData, user, publicKey);
    });
  } else {
    console.log(this.props.auth.keys);
    console.log(this.props.auth);
    console.log(this.props.auth.keys.publicKey);
    var publicKey = this.props.auth.keys.publicKey;
    var privateKey = this.props.auth.keys.privateKey;
    await this.setState({
      publicKey,
      privateKey
    });

    socket.emit("conversationAuth", convData, user, this.state.publicKey);
  }


  export const genKeys = () =>  dispatch => {
    try {
      rsa.generateKeyPairAsync().then(async keyPair => {
        // Callback function receives new key pair as a first argument
        let publicKey = keyPair.publicKey;
        let privateKey = keyPair.privateKey;
        localStorage.setItem("privateKey", privateKey);
        localStorage.setItem("publicKey", publicKey);
        var keys = {
          publicKey,
          privateKey
        };

        dispatch(setUserKeys(keys));
      });
    } catch (err) {
      dispatch({
        type: GET_ERRORS,
        payload: err
      });
    }
  };


  import React, { useEffect, useState } from "react";
  import SettingsIcon from "@material-ui/icons/Settings";
  import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
  import FormControlLabel from "@material-ui/core/FormControlLabel";
  import Switch from "@material-ui/core/Switch";
  import Button from "@material-ui/core/Button";
  import axios from "axios";

  const RoomsTab = props => {
    const [userChannels, setUserChannels] = useState([]);
    /*  const [shownPanel, setShownPanel] = useState(0);
    const [roomEdited, setRoomEdited] = useState({});
    */
    const [state, setState] = React.useState({
      userChannels: [],
      shownPanel: 0,
      roomEdited: {},
      listed: false,
      name: "",
      password: "",
      logMessages: false
    });

    const fetchData = async () => {
      let channels = await axios.get(
        "http://localhost:8000/api/user/channels/list"
      );
      //console.log(channels.data.ownChannels);
      //setState({...state, userChannels: channels.data.ownChannels })
      setUserChannels(channels.data.ownChannels);
    };

    const handleChange = e => {
      setState({ ...state, [e.target.name]: e.target.checked });
    };

    const handleInputChange = e => {
      setState({ ...state, [e.target.name]: e.target.value });
    };

    useEffect(() => {
      fetchData();
    }, []);

    const deleteChannel = async id => {
      var frm = {
        id
      };
      console.log(frm);
      let post = await axios.post(
        "http://localhost:8000/api/channel/delete",
        frm
      );
      if (post) {
        console.log("del ok");
        await fetchData();
        setState({ ...state, roomEdited: {}, shownPanel: 0 });
        //setRoomEdited({});
        //setShownPanel(0);
        alert("Deleted ok");
      }
    };

    const editRoom = async id => {
      let frm = {
        id,
        name: state.name,
        pwd: state.password,
        log: state.logMessages,
        list: state.listed
      };
      console.log(frm);
    };

    const changePanel = (panel, room) => {
      setState({
        ...state,
        roomEdited: room,
        shownPanel: panel,
        name: room.name,
        password: room.password,
        logMessages: room.logMessages,
        listed: room.listOnMain
      });
      //setShownPanel(panel);
      //setRoomEdited(room);
    };

    const abortDelete = () => {
      setState({ ...state, roomEdited: {}, shownPanel: 0 });
    };

    if (state.shownPanel === 0) {
      return (
        <div className="roomsTabContent">
          <p>
            List of rooms you own. Here you may change their options, change
            permissions, or delete them.
          </p>
          <ul className="fields">
            {userChannels.map(room => (
              <li key={room._id} className="roomP">
                <span className="roomName">{room.name}</span>
                <DeleteForeverIcon
                  onClick={() => changePanel(1, room)}
                  className="deleteIcon"
                />
                <SettingsIcon
                  onClick={() => changePanel(2, room)}
                  className="settingsIcon"
                />
              </li>
            ))}
          </ul>
        </div>
      );
    } else if (state.shownPanel === 1) {
      return (
        <div className="askDelete">
          <p className="confirmDelete">
            Are you sure you want to delete {state.roomEdited.name}?
          </p>
          <div className="delButtons">
            <Button
              className="userProfileButton"
              onClick={abortDelete}
              style={{ margin: "0.5%", background: "#4D87A6" }}
              variant="contained"
              color="secondary"
            >
              GO BACK
            </Button>
            <Button
              onClick={() => deleteChannel(state.roomEdited._id)}
              style={{ margin: "0.5%" }}
              variant="contained"
              color="secondary"
            >
              DELETE
            </Button>
          </div>
        </div>
      );
    } else if (state.shownPanel === 2) {
      return (
        <div className="roomsTabContent">
          <div className="column Uleft">
            <p className="activeOpt opt clickable">OPTIONS</p>
            <p
              onClick={() => changePanel(3, state.roomEdited)}
              className="clickable opt"
              style={{ marginTop: "1.5rem" }}
            >
              USERS
            </p>
          </div>
          <div className="column Uright">
            <div className="optFields">
              <div className="editField">
                <span className="inpLbl">Change name</span>
                <input
                  name="name"
                  onChange={handleInputChange}
                  label={state.name}
                  value={state.name}
                  className="optField"
                />
              </div>
              <div className="editField">
                <span className="inpLbl">Change password</span>
                <input
                  onChange={handleInputChange}
                  name="password"
                  label="Password"
                  type="password"
                  className="optField"
                />
              </div>
              <div className="editField">
                <FormControlLabel
                  control={
                    <Switch
                      onChange={handleChange}
                      checked={state.listed}
                      name="listed"
                      color="primary"
                    />
                  }
                  label="List on main page?"
                />
              </div>
              <div className="editField">
                <FormControlLabel
                  control={
                    <Switch
                      onChange={handleChange}
                      checked={state.logMessages}
                      name="logMessages"
                      color="primary"
                    />
                  }
                  label="Save messages in db?"
                />
              </div>
            </div>
            <div className="editButtons">
              <Button
                className="userProfileButton"
                onClick={abortDelete}
                style={{ margin: "0.5%", background: "#4D87A6" }}
                variant="contained"
                color="secondary"
              >
                GO BACK
              </Button>
              <Button
                onClick={() => editRoom(state.roomEdited._id)}
                className="createRoomButton"
                style={{ margin: "0.5%", backgroundColor: "#2FB827" }}
                variant="contained"
                color="secondary"
              >
                SAVE
              </Button>
            </div>
          </div>
        </div>
      );
    } else if (state.shownPanel === 3) {
      return (
        <div className="roomsTabContent">
          <div className="column Uleft">
            <p
              onClick={() => changePanel(2, state.roomEdited)}
              className="opt clickable"
            >
              OPTIONS
            </p>
            <p
              className="activeOpt clickable opt"
              style={{ marginTop: "1.5rem" }}
            >
              USERS
            </p>
          </div>
          <div className="column Uright">
            <div className="optFields">
              <p className="usList">Users</p>
              <ul>
                <li>User 1</li>
                <li>User 2</li>
                <li>User 3</li>
              </ul>
            </div>
            <div className="editButtons">
              <Button
                className="userProfileButton"
                onClick={abortDelete}
                style={{ margin: "0.5%", background: "#4D87A6" }}
                variant="contained"
                color="secondary"
              >
                GO BACK
              </Button>
              <Button
                onClick={() => editRoom(state.roomEdited._id)}
                className="createRoomButton"
                style={{ margin: "0.5%", backgroundColor: "#2FB827" }}
                variant="contained"
                color="secondary"
              >
                SAVE
              </Button>
            </div>
          </div>
        </div>
      );
    }
  };

  export default RoomsTab;


  convSocket.on("delete", async (usrId, socketid, confirm) => {
    try {
      let ughid = socketid.slice(5);
      let ss = socketid.slice(6);
      let conv = await Conversation.findById(convSocket.conversation.id);
      if (conv.owner === usrId) {
        convSocket.in(convSocket.room).disconnect(true);
        // await conv.remove();
        conv.remove(async (err, ok) => {
          let notification = {
            type: "delete",
            success: true
          };
          if (err) {
            notification.success = false;
            convSocket.to(ughid).emit("delete", notification);
            utilNSP.to(ughid).emit("delete", notification);
            confirm(notification);
            console.log(`Error while deleting conversation ${conv.id}`);
            return;
          }
          console.log(socketid);
          io.of("/util")
          .to(ughid)
          .emit("delete", notification);
          io.of("/util")
          .to(socketid)
          .emit("delete", notification);
          io.of("/util")
          .to(ss)
          .emit("delete", notification);
          console.log(`Conversation ${conv.id} deleted ok`);
          console.log(notification);
          convSocket.to(ughid).emit("delete", notification);
          io.to(ughid).emit("delete", notification);
          utilNSP.to(ughid).emit("delete", notification);
          confirm(notification);
        });
      }
    } catch (err) {
      let serverMsg = {
        type: "error",
        date: moment().format("HH:mm:ss"),
        order: false,
        author: "Server",
        text: "Unable to delete. Try again."
      };
      convSocket.emit("serverNotification", serverMsg);
      console.log(err);
    }
  });
  });


  decimalBs = binary => {
  	var result = 0;
  	let binaryString = '' + binary;
  	for (let i = 1; i <= binaryString.length; i++){
  		console.log(binaryString);
  		console.log(binaryString[binaryString.length - i]);
  		if (binaryString[binaryString.length - i] == '1'){
  			result = result + Math.pow(2, i-1);
  			console.log(result);
      }
  	}
  	return result;
  }


  const receiveMessage = (list, person) => {
    const filtered = list.filter(fr => fr.proxyID !== person.proxyID);
    const changePerson = {
      ...person,
      seen: false,
      lastMes: false
    };
    return [...filtered, changePerson];
  }

  const sendMessage = (list, person) => {
    const filtered = list.filter(fr => fr.proxyID !== person.proxyID);
    const changePerson = {
      ...person,
      seen: false,
      lastMes: false
    };
    return [...filtered, changePerson];
  }


  const msgSeenStatusFactory = seen => {
    return lastMes => {
      return (list, person) => {
        const filtered = list.filter(fr => fr.proxyID !== person.proxyID);
        const changePerson = {
            ...person,
            seen,
            lastMes
        };
          return [...filtered, changePerson];
      }
    }
  }

  const userSending = msgSeenStatusFactory(false)(false);


  @-webkit-keyframes bounce-out-top{0%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}5%{-webkit-transform:translateY(-30px);transform:translateY(-30px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}15%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}25%{-webkit-transform:translateY(-38px);transform:translateY(-38px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}38%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}52%{-webkit-transform:translateY(-75px);transform:translateY(-75px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}70%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}85%{opacity:1}100%{-webkit-transform:translateY(-800px);transform:translateY(-800px);opacity:0}}@keyframes bounce-out-top{0%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}5%{-webkit-transform:translateY(-30px);transform:translateY(-30px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}15%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}25%{-webkit-transform:translateY(-38px);transform:translateY(-38px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}38%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}52%{-webkit-transform:translateY(-75px);transform:translateY(-75px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}70%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}85%{opacity:1}100%{-webkit-transform:translateY(-800px);transform:translateY(-800px);opacity:0}} .bounce-out-top{-webkit-animation:bounce-out-top 3s both;animation:bounce-out-top 3s both} @-webkit-keyframes bounce-in-top{0%{-webkit-transform:translateY(-500px);transform:translateY(-500px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}38%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;opacity:1}55%{-webkit-transform:translateY(-65px);transform:translateY(-65px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}72%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}81%{-webkit-transform:translateY(-28px);transform:translateY(-28px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}90%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}95%{-webkit-transform:translateY(-8px);transform:translateY(-8px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}100%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}}@keyframes bounce-in-top{0%{-webkit-transform:translateY(-500px);transform:translateY(-500px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in;opacity:0}38%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out;opacity:1}55%{-webkit-transform:translateY(-65px);transform:translateY(-65px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}72%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}81%{-webkit-transform:translateY(-28px);transform:translateY(-28px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}90%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}95%{-webkit-transform:translateY(-8px);transform:translateY(-8px);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}100%{-webkit-transform:translateY(0);transform:translateY(0);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}} .bounce-in-top{-webkit-animation:bounce-in-top 1.5s both;animation:bounce-in-top 1.5s both}
    const generateButton = (id, text, classNames) => {
      const btn = document.createElement("button");
      btn.id = id;
      btn.innerHTML = text;

      const classes = classNames.split(" ");
      classes.map(el => btn.classList.add(el));
      return btn;
    }

    const insertAfter = (nodeID, element) => {
      const node = document.getElementById(nodeID);
      node.after(element);
    }

    if(!document.getElementById("bonba")){
      const przycisk = generateButton("bonba", "atomuwka", "btn btn-sm btn-default");
      insertAfter("freeBeer", przycisk);
    }

    document.getElementById('bonba').onclick = () => {
      const vid = document.getElementById("videowrap");
      vid.classList.add("bounce-out-top");
      setTimeout(() => {
        vid.classList.remove("bounce-out-top");
        vid.classList.add("bounce-in-top");
        setTimeout(() => vid.classList.remove("bounce-in-top"), 1500);
      }, 6000);
    };



    class SocialNetwork extends SocketHelper {
      constructor(socket) {
        super(socket);
      }
      static async genInvitationURL(id) {
        console.log(id);
        const invite = await new Invite({
          url: uuidv4(),
          owner: id
        }).save();
        return invite.url;
        //super.emit("invitationURL", invite.url);
      }
      generateFriendRequest(sendingUser, invitedUserID) {
        if (sendingUser.friends.find(el => el.searchID === invitedUserID)) {
          const notif = {
            type: "error",
            text: "He's your friend already you dum dum"
          };
          super.emit("newNotif", notif);
          return;
        }
        return invitationGenerator(sendingUser, sendingUser);
      }
      sendFriendRequest(isOnline, notifRoom, invitation) {
        if (isOnline) {
          super.emitToFriend(notifRoom, "friendRequest", invitation);
        }
        const notif = {
          type: "success",
          text: "Invitation sent"
        };
        super.emit("newNotif", notif);
      }
      genNewFriendList(addedUser, friendList) {
        console.log(addedUser.username);
        console.log(friendList.length);
        if (friendList.find(el => el.id === addedUser.id)) {
          return [...friendList];
        }
        const newFriend = createFriendObject(addedUser);
        const newList = [...friendList, newFriend];
        return newList;
      }
      removeInvitation(invitations, invID) {
        const updated = invitations.filter(el => el.id !== invID);
        return updated;
      }
      sendAndUpdateNotifs(username, pmName, notifs) {
        const confirmation = {
          username: username,
          text: "accepted your invitation",
          type: 1,
          id: uuidv4()
        };
        super.emitToFriend(pmName, "confirmation", confirmation);
        const newNotifs = [...notifs, confirmation];
        return newNotifs;
      }

      async getBothUsers(currUsrID, friendID) {
        [this.user, this.friend] = await Promise.all([
          ChatUser.findById(currUsrID),
          ChatUser.findById(friendID)
        ]);
      }
    }

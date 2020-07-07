import React, { Component } from "react";
import {
  handleInputChange,
  showCreateRoomModal,
  switchListChannelOption,
  switchEncryptChannelOption,
  createRoom,
  showRegisterForm,
  closeModals,
  showLoginForm,
  handleRegistration,
  handleLogin,
  logOut,
  createConversation,
  copyURL,
  openOptionsModal,
  sortMessage,
  preventDef,
  cl,
  alert,
  notif
} from "./Util.js";
import Options from "./Options";
import FriendChat from "./FriendChat";
import NewRoom from "./NewRoom";
import UserProfile from "./components/UserProfile";
import ModalsComponent from "./components/ModalsComponent";
import AddFriend from "./components/AddFriend";
import NewConversation from "./NewConversation";
import Side from "./components/Side";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  genKeys,
  loginUser,
  registerUser,
  logoutUser,
  switchLang,
  addConversation,
  switchShownFriend,
  updateUserData
} from "./actions/authActions";
import { mainAxios } from "./utils/setAuthToken";
import { pl, en } from "./language/HomepageLang";
import { Grid, Col, Row } from "rsuite";
import { socket2, socket } from "./socket";
import { Crypt } from "hybrid-crypto-js";
const entropy = "Random string, integer or float";
const crypt = new Crypt({ entropy: entropy });

const decryptMessage = (privKey, text) => {
  try {
    let decrypted = crypt.decrypt(privKey, text);
    return decrypted.message;
  } catch (err) {
    return "couldnt decrypt the message";
  }
};

const decryptNeeded = (mes, key) => {
  const msg = {
    ...mes,
    text: decryptMessage(key, mes.text)
  };
  return msg;
};

const personalizeMessage = (
  incomingMessage,
  privateKey,
  pmRoom,
  friendProxyID = undefined
) => {
  const message = {
    ...incomingMessage,
    room: sortMessage(
      incomingMessage.sender,
      incomingMessage.recipient,
      pmRoom
    ),
    text: decryptMessage(privateKey, incomingMessage.text)
  };
  return message;
};

//personolize messages d0opiero when you need to show them to speed up loading time
//add await to initial socke handshaek

class NewMain extends Component {
  constructor(props) {
    super(props);
    this.outsideMenu = React.createRef();
    this.state = {
      showCreateRoomModal: false,
      showRegisterModal: false,
      showLoginModal: false,
      channels: [],
      userlist: [],
      showInvitationModal: false,
      list: true,
      encrypt: false,
      showConvConfirmationModal: false,
      optionsModal: false,
      lin: {},
      shown: "def",
      convShown: "",
      friend: {},
      errors: {},
      username: "",
      password: "",
      email: "",
      notifCount: 0,
      notifications: [],
      directMsgs: [],
      friendList: [],
      pmRoom: " ",
      language: "en",
      conversations: [],
      width: 0,
      height: 0,
      expand: false,
      lastMessages: []
    };
  }

  getChannelsList = async () => {
    //get a list of channels
    let channelsData = await mainAxios.get("channels/list");
    //filter out repeating channel names and deleted ones
    var channelList = Array.from(
      new Set(channelsData.data.channels.map(a => a.name))
    ).map(name => {
      return channelsData.data.channels.find(a => a.name === name);
    });
    console.log(channelList);
    return channelList;
  };

  setChannelsList = list => {
    console.log(list);
    this.setState({
      channels: [...list]
    });
  };

  // pl, en - imported files with text in both languages
  setLanguage = ln => {
    this.setState({
      lin: ln === "pl" ? pl : en
    });
    this.props.switchLang(ln);
  };

  sleep = waitTimeInMs =>
    new Promise(resolve => setTimeout(resolve, waitTimeInMs));

  changeExpand = () => {
    cl(this.state.expand);
    this.setState({
      expand: !this.state.expand
    });
    cl(this.state.expand);
  };

  componentDidMount = async () => {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    cl(this.state.width);
    cl("test");
    console.log(this.props.match.params.invitation);
    if (!localStorage.getItem("privateKey")) {
      cl("NEW PRIVATE KEY");
      await this.props.genKeys();
    }
    //connect and auth
    const token = localStorage.jwtToken ? localStorage.jwtToken : false;
    let authD = {
      token
    };
    await socket2.emit("auth", authD, clb => {
      const publickKey = this.props.auth.keys.publicKey;
      socket2.emit("sendPublickKey", publickKey, async clb => {
        if (this.props.match.params.invitation) {
          const invID = this.props.match.params.invitation;
          socket2.emit("acceptInvitationByURL", invID, confirm => {
            window.history.pushState("data", "Title", "/");
            alert("success", "Succesfuly added new contact");
          });
        }
        if (!authD.token) {
          this.setState({
            pmRoom: this.props.auth.user.data.searchID
          });
        }
        var initialData = await mainAxios.get("/initial");
        cl(initialData);
        var personalizedMsgs = [];
        var cut = initialData.data.msgs.slice(-50);

        /*
        const addConstants = (key, pmRoom) =>{
          return (mes) => {
            return personalizeMessage(mes, key, pmRoom)
          }
        }
        */
        var res = [];
        if (cut) {
          const mes = cut.map(async (el, index) => {
            let msg = await personalizeMessage(
              el,
              this.props.auth.keys.privateKey,
              this.props.auth.user.data.searchID
            );
            return msg;
          });
          res = await Promise.all(mes);
        }

        cl(initialData.data.friendlist);
        cl(res);

        /*
                const ugh = personalizedMsgs.map(a => a.room).reverse();
                const newest = personalizedMsgs
                  ? personalizedMsgs
                      .map(a => a)
                      .reverse()
                      .find(a => ugh.includes(a.room))
                  : false;  */

        const newest = res
          ? Array.from(
              new Set(
                res
                  .map(a => a)
                  .reverse()
                  .map(a => a.room)
              )
            ).map(room => {
              return res
                .map(a => a)
                .reverse()
                .find(a => a.room === room);
            })
          : false;

        const msgs = res ? res : false;
        const flist = initialData.data.friendlist
          ? initialData.data.friendlist
          : false;
        const notifs = initialData.data.notifs
          ? initialData.data.notifs
          : false;

        var sortedFriends = [];
        if (flist.length && newest.length) {
          for (let i = 0; i < newest.length; i++) {
            let friend = flist.filter(
              f =>
                f.proxyID === newest[i].recipient ||
                f.proxyID === newest[i].sender
            );
            cl(friend);
            cl(newest[i].author);
            sortedFriends = [...friend, ...sortedFriends];
            cl(sortedFriends);
          }

          let rest = flist.filter(el => !sortedFriends.includes(el));
          cl(rest);
          sortedFriends = [...rest, ...sortedFriends];
          cl(sortedFriends);
        }

        cl(newest);
        cl(flist);
        cl(sortedFriends);
        this.setState({
          lastMessages: newest,
          directMsgs: msgs,
          friendList: sortedFriends ? sortedFriends : flist,
          notifications: notifs,
          notifCount: notifs.length
        });
      });
    });

    //default language in redux store is english
    //but it can be changed and change is persisted in localStorage
    let langPref = this.props.auth.language;
    this.setLanguage(langPref);
    console.log(socket2.id);
    socket2.on("invitationURL", url => {
      console.log(url);
      this.setState({
        showInvitationModal: true,
        invURL: url
      });
    });

    socket2.on("seen", proxyID => {
      const list = this.state.friendList;
      for (let i = 0; i < list.length; i++) {
        if (list[i].proxyID === proxyID) {
          list[i].seen = true;
          cl(list[i]);
        }
      }

      const pach = {
        ...this.state.friend,
        seen: true
      };

      this.setState({
        friend: pach,
        friendList: list
      });
    });

    socket2.on("usernameChange", data => {
      cl("username changed event");
      socket2.emit("usernameChanged", data);
    });

    socket2.on("confirmation", mes => {
      this.setState({
        notifications: [...this.state.notifications, mes],
        notifCount: this.state.notifCount + 1
      });
    });

    socket2.on("friendRequest", req => {
      this.setState({
        notifications: [...this.state.notifications, req],
        notifCount: this.state.notifCount + 1
      });
    });

    socket2.on("token", token => {
      /*
      const decoded = jwt_decode(token);
      localStorage.setItem("username", decoded.data.name);
      localStorage.setItem("jwtToken", token);
      setToken(token); */
      this.props.updateUserData(token);
    });
    socket2.on("pmRoom", name => {
      this.setState({
        pmRoom: name
      });
    });
    socket2.on("friendList", list => {
      this.setState({
        friendList: list
      });
    });

    socket2.on("message", data => {
      const { pmRoom, friend, friendList } = this.state;
      const newMessage = personalizeMessage(
        data,
        this.props.auth.keys.privateKey,
        pmRoom,
        friend.proxyID
      );

      var unseen;
      if (this.state.lastMessages.length > 1) {
        unseen = [
          ...this.state.lastMessages.filter(
            msg => msg.room !== newMessage.room
          ),
          newMessage
        ];
        cl("i run");
        cl(unseen);
      } else {
        cl(this.state.lastMessages.length);
        unseen = this.state.lastMessages.length
          ? [...this.state.lastMessages, newMessage]
          : [newMessage];
      }
      cl(unseen);

      let filet = friendList
        .filter(el => el.proxyID !== newMessage.room)
        .concat(friendList.filter(el => el.proxyID === newMessage.room));

      filet[filet.length - 1].seen = false;
      filet[filet.length - 1].lastMes =
        newMessage.sender === pmRoom ? false : true;

      cl(filet);

      this.setState({
        directMsgs: [...this.state.directMsgs, newMessage],
        lastMessages: unseen,
        friendList: filet
      });

      if (document.hasFocus() && newMessage.sender === friend.proxyID) {
        cl("seen");
        socket2.emit("seenMes", friend.proxyID);
      }
    });

    /*

    let messages = Array.from(
      new Set(this.state.directMsgs.map(a => a.author).reverse())
    ).map(author => {
      return this.state.directMsgs.find(a => a.author === author);
    });
    cl(messages);
    this.setState({});
    socket2.on("loadMessages", ar => {
      cl("pach pach");
      const { pmRoom } = this.state;
      var ap = [...ar];
      var msgs = [];
      for (let inc = 0; inc < ap.length; inc++) {
        msgs = [
          ...msgs,
          personalizeMessage(ap[inc], this.props.auth.keys.privateKey, pmRoom)
        ];
      }
      this.setState({
        directMsgs: [...this.state.directMsgs, ...msgs]
      });
      let ug = Array.from(
        new Set(this.state.directMsgs.map(a => a.author).reverse())
      ).map(author => {
        return this.state.directMsgs.find(a => a.author === author);
      });
      cl(ug);
      cl(ug);
    });
*/
    //get a list of user objects (they are associated with rooms they're in atm)
    socket.on("connect", async () => {
      socket.on("userlist", data => {
        this.setState({
          userlist: data,
          friend: {}
        });
      });
    });
    document.addEventListener("mousedown", this.handleClickOutside);
    this.setChannelsList(await this.getChannelsList());
    /*
    if (!localStorage.getItem("privateKey")) {
      await this.props.genKeys();
    }
    let publicKey = this.props.auth.keys.publicKey;
    this.sleep(2000).then(() => {
      socket2.emit("sendPublickKey", publicKey);
    });
    */
  };

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  handleClickOutside = e => {
    if (this.outsideMenu.current.contains(e.target)) {
      console.log("ff");
      return;
    }
    this.setState({
      expand: false
    });
  };

  updateWindowDimensions = () => {
    this.setState(prevstate => ({
      width: window.innerWidth,
      height: window.innerHeight,
      expand:
        prevstate.width < 700 && window.innerWidth > 700
          ? false
          : prevstate.expand
    }));
    if (this.state.width < 700) {
    }
  };

  generateURL = () => {
    socket2.emit("generateInvitationURL");
    console.log("generate url");
  };

  //import utility functions used for navbar and other often used features
  //in the future I plan to recompose components in order to solve this problem
  //in more elegant way
  handleInputChange = handleInputChange.bind(this);
  showCreateRoomModal = showCreateRoomModal.bind(this);
  switchListChannelOption = switchListChannelOption.bind(this);
  switchEncryptChannelOption = switchEncryptChannelOption.bind(this);
  createRoom = createRoom.bind(this);
  showRegisterForm = showRegisterForm.bind(this);
  closeModals = closeModals.bind(this);
  showLoginForm = showLoginForm.bind(this);
  handleRegistration = handleRegistration.bind(this);
  handleLogin = handleLogin.bind(this);
  logOut = logOut.bind(this);
  createConversation = createConversation.bind(this);
  copyURL = copyURL.bind(this);
  openOptionsModal = openOptionsModal.bind(this);
  preventDef = preventDef;
  showRoom = name => {
    this.setState({
      shown: "room",
      roomShown: name
    });
  };

  showProfile = () => {
    this.setState({
      shown: "profile",
      roomShown: ""
    });
  };

  showConversation = conv => {
    this.setState({
      shown: "conv",
      convShown: conv
    });
  };

  showChatFriend = friend => {
    this.setState({
      shown: "friendChat",
      friend: friend
    });
  };

  removeFriend = proxyID => {
    socket2.emit("removeFriend", proxyID);
  };

  showAddFriend = () => {
    this.setState({
      shown: "addFriend"
    });
  };

  showOptions = () => {
    this.setState({
      shown: "options"
    });
  };

  showOrg = e => {
    cl(e.target);
    cl(e.target.value);
  };

  removeNotification = notificationID => {
    const { notifications } = this.state;
    const filteredNotifications = notifications.filter(
      el => el.inv_id !== notificationID
    );
    this.setState({
      notifications: filteredNotifications
    });
  };

  render() {
    const regUsr = {
      avatar:
        "https://avatars0.githubusercontent.com/u/12987981?s=460&u=52d1b342fba01504ec1ca24a0d0bd418651d39d6&v=4",
      name: "radek",
      searchID: "1234"
    };

    let comp = null;
    if (this.state.shown === "room") {
      comp = <NewRoom name={this.state.roomShown} key={this.state.roomShown} />;
    } else if (this.state.shown === "profile") {
      comp = (
        <UserProfile
          removeNotification={this.removeNotification}
          notifications={this.state.notifications}
          user={this.props.auth.user.data ? this.props.auth.user.data : regUsr}
        />
      );
    } else if (this.state.shown === "friendChat") {
      comp = (
        <FriendChat
          friend={this.state.friend}
          messages={this.state.directMsgs}
        />
      );
    } else if (this.state.shown === "conv") {
      comp = (
        <NewConversation
          conv={this.state.convShown}
          url={this.state.convShown.url}
          usrId={this.state.convShown.usr}
          key={this.state.convShown.url}
        />
      );
    } else if (this.state.shown === "addFriend") {
      comp = <AddFriend />;
    } else if (this.state.shown === "options") {
      comp = <Options />;
    } else {
      comp = (
        <UserProfile
          removeNotification={this.removeNotification}
          notifications={this.state.notifications}
          user={this.props.auth.user.data ? this.props.auth.user.data : regUsr}
        />
      );
    }
    //<Col xs={24} sm={24} md={8} lg={6}>
    return (
      <>
        <Grid fluid>
          <Row gutter={0}>
            <div ref={this.outsideMenu}>
              <Col
                lg={6}
                md={8}
                sm={8}
                xs={10}
                className={
                  this.state.expand ? "showMenuOnMobile" : "hideOnMobile"
                }
              >
                <Side
                  lastMsgs={this.state.lastMessages}
                  expand={this.state.expand}
                  handleToggle={this.changeExpand}
                  width={this.state.width}
                  height={this.state.height}
                  openOptionsModal={this.openOptionsModal}
                  showCreateRoomModal={this.showCreateRoomModal}
                  showOptions={this.showOptions}
                  handleInputChange={this.handleInputChange}
                  generateURL={this.generateURL}
                  friendRemove={this.removeFriend}
                  showAddFriend={this.showAddFriend}
                  showChatFriend={this.showChatFriend}
                  friendList={this.state.friendList}
                  showConv={this.showConversation}
                  showProfile={this.showProfile}
                  logOut={this.logOut}
                  showLogin={this.showLoginForm}
                  showRegister={this.showRegisterForm}
                  showRoom={this.showRoom}
                  channels={this.state.channels}
                  userlist={this.state.userlist}
                  conversations={this.props.auth.conversations}
                />
              </Col>
            </div>
            <Col
              lg={18}
              md={16}
              sm={16}
              xs={14}
              className={this.state.expand ? "hideUnderMenu" : "moveRight"}
              onClick={this.showOrg}
            >
              {comp}
            </Col>
          </Row>
        </Grid>
        <ModalsComponent
          closeModals={this.closeModals}
          showCreateRoom={this.state.showCreateRoomModal}
          switchList={this.switchListChannelOption}
          list={this.state.list}
          switchEncrypt={this.switchEncryptChannelOption}
          encrypt={this.state.encrypt}
          auth={this.props.auth}
          errors={this.state.errors}
          createRoom={() => preventDef(this.createRoom)}
          handleInputChange={this.handleInputChange}
          showLoginModal={this.state.showLoginModal}
          openRegisterModal={this.state.showRegisterModal}
          handleRegistration={this.handleRegistration}
          handleLogin={this.handleLogin}
          showConvConfModal={this.state.showConvConfirmationModal}
          convURL={this.state.convURL}
          showOptionsModal={this.state.optionsModal}
          showInvitationModal={this.state.showInvitationModal}
          invURL={this.state.invURL}
        />
      </>
    );
  }
}
NewMain.propTypes = {
  auth: PropTypes.object.isRequired,
  registerUser: PropTypes.func.isRequired,
  loginUser: PropTypes.func.isRequired,
  logoutUser: PropTypes.func.isRequired,
  switchLang: PropTypes.func.isRequired,
  switchShownFriend: PropTypes.func.isRequired,
  addConversation: PropTypes.func.isRequired,
  updateUserData: PropTypes.func.isRequired,
  genKeys: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired
};
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
});
export default connect(mapStateToProps, {
  registerUser,
  loginUser,
  logoutUser,
  switchLang,
  addConversation,
  switchShownFriend,
  genKeys,
  updateUserData
})(NewMain);

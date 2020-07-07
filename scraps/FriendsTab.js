import React, { useState, useEffect } from "react";
//import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import { UserPlus } from "tabler-icons-react";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import SettingsIcon from "@material-ui/icons/Settings";
import { UserX } from "tabler-icons-react";
import { Search } from "tabler-icons-react";
import Button from "@material-ui/core/Button";
//import LibraryAddCheckIcon from "@material-ui/icons/LibraryAddCheck";
import ContactsIcon from "@material-ui/icons/Contacts";
import { mainAxios } from "../utils/setAuthToken";
import ConversationPiece from "./conversationPiece";
import { UserCheck } from "tabler-icons-react";
import { socket2 } from "../socket";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import moment from "moment";

const FriendsTab = props => {
  const [state, setState] = React.useState({
    shownPanel: 0,
    searchID: "",
    foundUserName: "",
    foundUserId: "",
    friendRequests: props.auth.notifications,
    friendList: props.auth.friendList,
    mes: props.auth.directMsgs,
    message: "",
    shownFriend: props.auth.friendList.length
      ? props.auth.friendList[0]
      : "lonely"
  });

  const [panel, setPanel] = useState(0);

  const respondInvitation = async (response, inv_id, user_id) => {
    let resp = {
      response,
      inv_id,
      user_id
    };
    await socket2.emit("confirmedRequest", resp);
  };

  const changePanel = panel => {
    setPanel(panel);
  };

  const handleInputChange = e => {
    setState({ ...state, [e.target.name]: e.target.value });
  };

  const switchChatFriend = friend => {
    setState({ ...state, shownFriend: friend });
  };

  const searchUser = async () => {
    let frm = {
      searchID: state.searchID
    };
    console.log(frm);
    let post = await mainAxios.post("user/search", frm);
    if (!post) {
      alert("Something wrong!");
      return false;
    }
    setState({
      ...state,
      foundUserName: post.data.username
    });
  };

  const sendFriendReq = async () => {
    await socket2.emit("sendFriendRequest", state.searchID);

    alert("Invitation sent");
    setPanel(0);
    setState({
      ...state,
      foundUserName: "",
      foundUserId: "",
      searchUsername: ""
    });
  };

  const sendMessage = e => {
    console.log(state.message);
    if (state.message.length < 1) {
      return false;
    }
    let message = {
      text: state.message,
      recipient: state.shownFriend.pmName,
      sender: props.auth.pmRoom,
      date: moment().format("HH:mm:ss"),
      author: props.auth.user.data.name
    };
    let packedData = {
      mes: message,
      recipient: state.shownFriend.pmName
    };

    setState({
      ...state,
      message: ""
    });

    console.log(packedData);
    socket2.emit("message", packedData, state.shownFriend.id);
  };

  const onEnterPress = e => {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (panel === 0) {
    return (
      <div className="roomsTabContent" style={{ margin: "0" }}>
        <div className="column frLeft">
          <p className="activeOpt opt clickable">FRIENDS</p>
          <p
            onClick={() => changePanel(1)}
            className="clickable opt"
            style={{ marginTop: "1.5rem" }}
          >
            INVITE
          </p>
          <p
            onClick={() => changePanel(2)}
            className="opt clickable"
            style={{ marginTop: "1.5rem" }}
          >
            NOTIFICATIONS
          </p>
        </div>
        <div className="column frMid">
          <div className="friendFields">
            <div className="notifications">
              {props.auth.friendList.map(friend => (
                <p
                  className={
                    friend.name === state.shownFriend.name
                      ? "activeFriend friend"
                      : "friend"
                  }
                  key={friend.searchID}
                  onClick={() => switchChatFriend(friend)}
                >
                  {friend.name} <SettingsIcon className="friendSettIcon" />
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="column frRight">
          <div className="chatBuf">
            <div className="chatLabel">
              <p style={{ margin: "0" }}>{state.shownFriend.name}</p>
            </div>
            <div className="mBuff">
              {props.auth.directMsgs
                .filter(ms => ms.room === state.shownFriend.pmName)
                .map((mes, index, arr) => {
                  if (arr[index - 1] && mes.sender === arr[index - 1].sender) {
                    mes.order = true;
                  } else {
                    mes.order = false;
                  }
                  return mes;
                })
                .map(m => (
                  <ConversationPiece
                    key={m.key}
                    text={m.text}
                    date={m.date}
                    order={m.order}
                    author={m.author}
                  />
                ))
                .reverse()}
            </div>
            <div className="mChat">
              <textarea
                onChange={handleInputChange}
                value={state.message}
                onKeyDown={onEnterPress}
                className="uOpt convInput"
                name="message"
                placeholder="Remember that direct messages are not encrypted"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (panel === 1) {
    return (
      <div className="roomsTabContent" style={{ margin: "0" }}>
        <div className="column fLeft">
          <p onClick={() => changePanel(0)} className="clickable opt">
            FRIENDS
          </p>
          <p
            className="opt activeOpt clickable"
            style={{ marginTop: "1.5rem" }}
          >
            INVITE
          </p>
          <p
            onClick={() => changePanel(2)}
            className="opt clickable"
            style={{ marginTop: "1.5rem" }}
          >
            NOTIFICATIONS
          </p>
        </div>
        <div className="column Uright">
          <div className="optFields">
            <p className="usList">
              Search users (you need to know their ID first)
            </p>
            <div className="searchInput">
              <input
                name="searchID"
                label="User ID"
                onChange={handleInputChange}
                className="unField"
              />
              <Button
                onClick={searchUser}
                variant="contained"
                color="primary"
                className="searchButton"
                startIcon={<Search />}
              >
                Search
              </Button>
            </div>
            {state.foundUserName.length > 1 && (
              <div className="srchResult">
                <p>
                  {state.foundUserName}{" "}
                  <UserPlus className="contactIcon" onClick={sendFriendReq} />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (panel === 2) {
    return (
      <div className="roomsTabContent" style={{ margin: "0" }}>
        <div className="column fLeft">
          <p className="opt clickable" onClick={() => changePanel(0)}>
            FRIENDS
          </p>
          <p
            onClick={() => changePanel(1)}
            className="clickable opt"
            style={{ marginTop: "1.5rem" }}
          >
            INVITE
          </p>
          <p
            className="activeOpt opt clickable"
            style={{ marginTop: "1.5rem" }}
          >
            NOTIFICATIONS
          </p>
        </div>
        <div className="column Uright">
          <div className="optFields">
            <p className="usList">Notifications</p>
            <div className="notifications">
              {props.auth.notifications
                .map(innn => {
                  return innn.type === 0 ? (
                    <p className="notif" key={innn.inv_id}>
                      {innn.username} sent you a friend invitation
                      <UserCheck
                        onClick={() =>
                          respondInvitation(true, innn.inv_id, innn.user_id)
                        }
                        title="Confirm friend request"
                        className="addIc"
                      />
                      <UserX
                        onClick={() =>
                          respondInvitation(false, innn.inv_id, innn.user_id)
                        }
                        title="Remove friend request"
                        className="remIc"
                      />
                    </p>
                  ) : (
                    <p className="notif" key={innn.inv_id}>
                      {innn.username} accepted your invitation
                    </p>
                  );
                })
                .reverse()}
            </div>
          </div>
        </div>
      </div>
    );
  }
};
FriendsTab.propTypes = {
  auth: PropTypes.object.isRequired
};
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.erros
});

export default connect(mapStateToProps)(FriendsTab);

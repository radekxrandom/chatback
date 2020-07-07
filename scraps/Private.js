import React, { Component } from "react";
import Message from "./components/message";
import Popup from "reactjs-popup";
import axios from "axios";
import AskPwdOrName from "./components/AskPwdOrName";
import UIfx from "uifx";
import io from "socket.io-client";
import bleepAudio from "./audio/bleep.mp3";

var socket = io.connect("https://obiadekchatback.herokuapp.com/");
//var socket = io.connect("http://localhost:8000/");
const bleep = new UIfx(bleepAudio);

class Private extends Component {
  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.state = {
      user: "",
      users: [],
      messages: [],
      showModal: false,
      socketId: "",
      showPasswordModal: false,
      password: ""
    };
  }

  connect = async bool => {
    var socketId = socket.id;
    if (!localStorage.getItem("username")) {
      this.setState({
        showModal: true
      });
      return 0;
    } else {
      let name = localStorage.getItem("username");
      var user = {
        name: name,
        id: socketId
      };
      console.log(user);
    }

    //add the current user to a list of online users
    //socket.emit("username", user);
    this.setState({
      user: user.name
    });

    console.log("testtt");
    const roomId = this.props.match.params.id;
    //subscribe to a given room
    if (bool === true) {
      bleep.play();
      var room = {
        id: roomId,
        pwd: this.state.password
      };
      console.log(this.state.password);
    } else {
      room = {
        id: roomId
      };
    }
    socket.emit("switchRoom", room, user);
    let conmes = {
      type: "outmes",
      text: "Connected",
      author: "server"
    };

    this.setState({
      messages: [...this.state.messages, conmes],
      socketId: socketId
    });

    socket.on("updatechat", data => {
      let mes = {
        text: data,
        type: "outmes",
        author: "server"
      };
      bleep.play();
      this.setState({ messages: [...this.state.messages, mes] });
    });

    socket.on("message", data => {
      if (data.author === this.state.user) {
        data.type = "outmes";
      }
      bleep.play();
      this.setState({ messages: [...this.state.messages, data] });
    });

    //when new users comes in, send the updated user list to all of them
    socket.on("userconnected", users => {
      bleep.play();
      this.setState({
        users: users
      });
    });
  };

  componentDidMount = async () => {
    await socket.on("connect", async () => {
      let channelPasswordGet = await axios.get(
        `https://obiadekchatback.herokuapp.com/api/pwd/${this.props.match.params.id}`
      );
      if (channelPasswordGet.data === true) {
        this.setState({
          showPasswordModal: true
        });
      } else {
        this.connect(false);
      }
    });
  };

  set_username = e => {
    e.preventDefault();
    this.setState({
      showModal: false
    });
    localStorage.setItem("username", this.state.user);
    this.connect(false);
  };

  sendPwd = e => {
    e.preventDefault();
    this.setState({
      showPasswordModal: false
    });
    this.connect(true);
  };

  handleInputChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  sendMessage = async e => {
    var mes = {
      text: this.state.message,
      type: "outmes",
      author: this.state.user
    };
    await this.setState({
      message: ""
    });
    socket.emit("message", mes);
    this.textInput.current.focus();
  };

  onEnterPress = e => {
    if (e.keyCode === 13 && e.shiftKey === false) {
      e.preventDefault();
      this.sendMessage();
    } else if (e.keyCode === "Enter" && e.shiftKey === false) {
      e.preventDefault();
      this.sendMessage();
    }
  };

  goHome = () => {
    this.props.history.push("/");
  };

  render() {
    return (
      <div>
        <div className="grid-container">
          <div className="header">
            <p className="banner" onClick={this.goHome}>
              OBIADEKCHAT XPKEJ
            </p>
          </div>
          <div className="userlist">
            <div className="count">
              <p>USER COUNT: {this.state.users.length}</p>
              <p className="roomname">
                {" "}
                ROOM NAME: {this.props.match.params.id}
              </p>
            </div>
            <div className="users">
              {this.state.users.map(usr => (
                <p>{usr.name}</p>
              ))}
            </div>
          </div>
          <div className="chatline">
            <textarea
              ref={this.textInput}
              onChange={this.handleInputChange}
              className="message"
              name="message"
              value={this.state.message}
              onKeyDown={this.onEnterPress}
              placeholder="Pamietaj - nie wolno piesować!"
            ></textarea>
          </div>
          <div className="messagebuffer">
            {this.state.messages
              .map(mes => (
                <Message
                  message_type={mes.type}
                  message_text={mes.text}
                  message_author={mes.author}
                  message_date={mes.date}
                />
              ))
              .reverse()}
          </div>
          <div className="button" onClick={this.sendMessage}>
            <p className="send">SEND</p>
          </div>
        </div>
        <Popup style={{ width: "30%" }} open={this.state.showNameModal}>
          <AskPwdOrName
            set_username={this.set_username}
            handleInputChange={this.handleInputChange}
            name="user"
            label="USERNAME"
          />
        </Popup>
        <Popup style={{ width: "30%" }} open={this.state.showPasswordModal}>
          <AskPwdOrName
            set_username={this.sendPwd}
            handleInputChange={this.handleInputChange}
            name="password"
            label="PASSWORD"
          />
        </Popup>
      </div>
    );
  }
}

export default Private;

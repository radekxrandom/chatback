import React, { Component } from "react";
import Message from "./components/message";
import Popup from "reactjs-popup";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";

import io from "socket.io-client";
var socket = io.connect("http://localhost:8000/");

class Public extends Component {
  constructor(props) {
    super(props);
    this.textInput = React.createRef();
    this.state = {
      messages: [{ type: "inmes", text: "Pif paf pif paf", author: "dog" }],
      users: [],
      user_count: 0,
      message: "",
      user: "",
      showModal: false,
      socketId: ""
    };
  }

  componentDidMount = async () => {
    await socket.on("connect", async () => {
      socket.emit("switchRoom", "public");
      let conmes = {
        type: "outmes",
        text: "Connected",
        author: "server"
      };
      var socketId = socket.id;
      await this.setState({
        messages: [...this.state.messages, conmes],
        socketId: socketId
      });

      if (!localStorage.getItem("username")) {
        this.setState({
          showModal: true
        });
      } else {
        let name = localStorage.getItem("username");
        let user = {
          name: name,
          id: socketId
        };
        console.log(user);
        socket.emit("username", user);
        this.setState({
          user: user.name
        });
      }
    });

    socket.on("updatechat", data => {
      let mes = {
        text: data,
        type: "outmes",
        author: "server"
      };
      this.setState({ messages: [...this.state.messages, mes] });
    });

    socket.on("message", data => {
      if (data.author === this.state.user) {
        data.type = "outmes";
      }
      this.setState({ messages: [...this.state.messages, data] });
    });

    socket.on("userconnected", users => {
      this.setState({
        users: users
      });
    });
  };

  set_username = e => {
    e.preventDefault();
    this.setState({
      showModal: false
    });
    let user = {
      name: this.state.user,
      id: this.state.socketId
    };
    socket.emit("username", user);
    localStorage.setItem("username", user.name);
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
                />
              ))
              .reverse()}
          </div>
          <div className="button" onClick={this.sendMessage}>
            <p className="send">SEND</p>
          </div>
        </div>
        <Popup style={{ width: "30%" }} open={this.state.showModal}>
          <div className="modal lodal">
            <form method="submit" onSubmit={this.set_username}>
              <TextField
                style={{
                  width: "45%",
                  display: "block",
                  margin: "auto",
                  marginTop: "5%",
                  marginBottom: "1%"
                }}
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="user"
                label="USERNAME"
                name="user"
                onChange={this.handleInputChange}
                autoComplete="user"
                autoFocus
              />
              <br />
              <Button
                style={{
                  margin: "2%",
                  marginLeft: "38%",
                  backgroundColor: "#609F51"
                }}
                type="submit"
                variant="contained"
                color="primary"
                className="ber"
              >
                Set username
              </Button>
            </form>
          </div>
        </Popup>
      </div>
    );
  }
}

export default Public;

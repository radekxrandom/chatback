import React, { Component } from "react";
import Popup from "reactjs-popup";
import CreateRoomModal from "./components/CreateRoomModal";
import RegisterModal from "./components/RegisterModal";
import LoginModal from "./components/LoginModal";
import Nav from "./components/Nav";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { loginUser, registerUser, logoutUser } from "./actions/authActions";
import axios from "axios";
import io from "socket.io-client";

const socket = io.connect("http://localhost:8000/");

class Homepage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomName: "",
      showCreateRoomModal: false,
      showRegisterModal: false,
      username: "",
      password: "",
      email: "",
      showLoginModal: false,
      channels: [],
      userlist: [],
      list: true,
      encrypt: false
    };
  }

  componentDidMount = async () => {
    //get a list of user objects (they are associated with rooms they're in atm)
    await socket.on("connect", async () => {
      socket.on("userlist", data => {
        console.log(data);
        this.setState({
          userlist: data
        });
      });
    });
    //get a list of channels
    let channelsData = await axios.get(
      "http://localhost:8000/api/channels/list"
    );
    //filter out repeating channel names and deleted ones
    var channelList = Array.from(
      new Set(channelsData.data.channels.map(a => a.name))
    ).map(name => {
      return channelsData.data.channels.find(a => a.name === name);
    });
    this.setState({
      channels: channelList
    });
    console.log(channelList);
  };

  handleInputChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  showCreateRoomModal = e => {
    e.preventDefault();
    this.setState({
      showCreateRoomModal: true
    });
  };

  //list channel on homepage option
  switchListChannelOption = e => {
    this.setState({
      list: !this.state.list
    });
  };

  switchEncryptChannelOption = e => {
    this.setState({
      encrypt: !this.state.encrypt
    });
  };

  createRoom = async e => {
    e.preventDefault();
    this.setState({
      showCreateRoomModal: false
    });
    //no need to set the owner, as this field will be decoded from jwt token
    let newChannel = {
      name: this.state.roomName,
      list: this.state.list,
      encrypt: this.state.encrypt
    };
    if (this.state.password.length > 1) {
      newChannel.password = this.state.password;
    }
    let create = await axios.post(
      "http://localhost:8000/api/channel/create",
      newChannel
    );
    console.log(create);
    //this.props.history.push(`/private/${this.state.roomName}`);
  };

  showRegisterForm = () => {
    this.setState({
      showRegisterModal: true
    });
  };

  closeModals = () => {
    this.setState({
      showCreateRoomModal: false,
      showRegisterModal: false,
      showLoginModal: false
    });
  };

  showLoginForm = () => {
    this.setState({
      showLoginModal: true
    });
  };

  removeUserDataFromState = () => {
    this.setState({
      username: "",
      email: "",
      password: ""
    });
  };

  handleRegistration = async e => {
    e.preventDefault();
    const { username, email, password } = this.state;

    const newUser = {
      username,
      email,
      password
    };
    await this.props.registerUser(newUser);
    this.props.loginUser(newUser);
    this.removeUserDataFromState();
    this.closeModals();
  };

  handleLogin = async e => {
    e.preventDefault();
    const { username, password } = this.state;
    const userAuthData = {
      username,
      password
    };
    this.props.loginUser(userAuthData);
    this.removeUserDataFromState();
    this.closeModals();
  };

  goToUserProfile = () => {
    this.props.history.push(`/userprofile`);
  };

  goToChannel = name => {
    this.props.history.push(name);
  };

  render() {
    return (
      <div>
        <div className="navigation">
          <Nav
            logOut={this.props.logoutUser}
            showLogin={this.showLoginForm}
            showRegister={this.showRegisterForm}
          />
          <div className="links">
            <p className="adminMes">
              Wiadomosci sa automatycznie szyfrowane w pokojach z haslem.
            </p>

            <a
              onClick={this.showCreateRoomModal}
              className="link"
              href="/private"
            >
              Create room
            </a>
          </div>
          <div className="tbl">
            <div className="title">
              <p>Public channels (click on a name to join)</p>
            </div>
            <div className="channelsList">
              <div className="box">
                <div className="chanList">
                  <table>
                    <thead>
                      <tr>
                        <th>Channel</th>
                        <th># people connected</th>
                        <th>Encrypted?</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <a
                            className="clickable looklikep"
                            href="/room/public"
                          >
                            Public channel
                          </a>
                        </td>
                        <td>
                          {
                            this.state.userlist.filter(
                              usr => usr.room === "public"
                            ).length
                          }
                        </td>
                        <td>It's public channel</td>
                      </tr>
                      {this.state.channels
                        .filter(chn => chn.name !== "public")
                        .map((channel, index) => (
                          <tr key={index}>
                            <td>
                              <a
                                className="clickable looklikep"
                                href={`/room/${channel.name}`}
                              >
                                {channel.name}
                              </a>
                            </td>
                            <td>
                              {
                                this.state.userlist.filter(
                                  usr => usr.room === channel.name
                                ).length
                              }
                            </td>
                            <td>Encrypted</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="blankSpace"></div>
        </div>
        <Popup
          style={{ width: "30%" }}
          open={this.state.showCreateRoomModal}
          closeOnDocumentClick
          onClose={this.closeModals}
        >
          <CreateRoomModal
            switchList={this.switchListChannelOption}
            list={this.state.list}
            switchEncrypt={this.switchEncryptChannelOption}
            encrypt={this.state.encrypt}
            auth={this.props.auth}
            createRoom={this.createRoom}
            handleInputChange={this.handleInputChange}
          />
        </Popup>
        <Popup
          style={{ width: "30%" }}
          open={this.state.showRegisterModal}
          closeOnDocumentClick
          onClose={this.closeModals}
        >
          <RegisterModal
            handleInputChange={this.handleInputChange}
            handleSubmit={this.handleRegistration}
          />
        </Popup>

        <Popup
          style={{ width: "30%" }}
          open={this.state.showLoginModal}
          closeOnDocumentClick
          onClose={this.closeModals}
        >
          <LoginModal
            handleInputChange={this.handleInputChange}
            handleSubmit={this.handleLogin}
          />
        </Popup>
      </div>
    );
  }
}
Homepage.propTypes = {
  auth: PropTypes.object.isRequired,
  registerUser: PropTypes.func.isRequired,
  loginUser: PropTypes.func.isRequired,

  errors: PropTypes.object.isRequired
};
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
});
export default connect(
  mapStateToProps,
  { registerUser, loginUser }
)(Homepage);

{
  userChannels.map(room => (
    <p className="roomP">
      <span className="roomName">{room.name}</span>
      <SettingsIcon className="settingsIcon" />
      <DeleteForeverIcon className="deleteIcon" />
    </p>
  ));
}


{
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    "no-console": "off"
  }
}











import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route } from "react-router-dom";
import NewMain from "./NewMain.js";
import { Provider } from "react-redux";
import store from "./store";
import jwt_decode from "jwt-decode";
import { setToken } from "./utils/setAuthToken";
import { setCurrentUser, logoutUser, setUserKeys } from "./actions/authActions";
import "rsuite/dist/styles/rsuite-default.css";

/*
if (localStorage.lang !== undefined) {
  store.dispatch(setLanguage(localStorage.lang));
}
if (localStorage.conversations && localStorage.conversations.length) {
  let conv = JSON.parse(localStorage.conversations);
  store.dispatch(addConversation(conv));
}
*/
if (localStorage.jwtToken !== undefined) {
  // Set auth token header auth
  const token = localStorage.jwtToken;
  setToken(token);
  // Decode token and get user info and exp
  const decoded = jwt_decode(token);
  // Set user and isAuthenticated
  store.dispatch(setCurrentUser(decoded));
  // Check for expired token
  const currentTime = Date.now() / 1000; // to get in milliseconds
  if (decoded.exp < currentTime) {
    // Logout user
    store.dispatch(logoutUser());
  }
}

if (localStorage.privateKey !== undefined) {
  const publicKey = localStorage.getItem("publicKey");
  const privateKey = localStorage.getItem("privateKey");
  const keys = {
    publicKey,
    privateKey
  };
  store.dispatch(setUserKeys(keys));
}

const App = () => {
  return (
    <div>
      <Provider store={store}>
        <Router>
          <Route exact path="/:invitation?" component={NewMain} />
        </Router>
      </Provider>
    </div>
  );
};

export default App;

import React, { useEffect, useState } from "react";
import SettingsIcon from "@material-ui/icons/Settings";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Button from "@material-ui/core/Button";
import { mainAxios } from "../utils/setAuthToken";

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
    logMessages: false
  });

  const fetchData = async () => {
    let channels = await mainAxios.get("user/channels/list");
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
    let post = await mainAxios.post("channel/delete", frm);
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
      logMessages: state.logMessages,
      listOnMain: state.listed
    };
    console.log(frm);
    let post = await mainAxios.post("channel/edit", frm);
    if (post) {
      console.log("edit ok");
      await fetchData();
      setState({ ...state, roomEdited: {}, shownPanel: 0 });
      alert("Edited ok");
    }
  };

  const changePanel = (panel, room) => {
    setState({
      ...state,
      roomEdited: room,
      shownPanel: panel,
      name: room.name,
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
      <div className="roomsTabContent" style={{ minHeight: "initial" }}>
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
              <span className="inpLbl">
                Change password (currently not working)
              </span>
              <input
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

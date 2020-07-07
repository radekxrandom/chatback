import React, { useState } from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import { Link } from "react-router-dom";
import LocalizedStrings from "react-localization";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  }
}));

//localization
let strings = new LocalizedStrings({
  en: {
    convButton: "TEMPORARY CONVERSATION ",
    roomButton: "CREATE NEW ROOM",
    options: "USER OPTIONS",
    logout: "LOG OUT",
    register: "REGISTER",
    login: "LOGIN"
  },
  pl: {
    convButton: "JEDNORAZOWA ROZMOWA",
    roomButton: "STWÓRZ NOWY POKÓJ",
    options: "TWOJE OPCJE",
    logout: "WYLOGUJ",
    register: "ZAREJESTRUJ SIE",
    login: "ZALOGUJ SIE"
  }
});

const Nav = props => {
  const [show, setShow] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [clicked, setClicked] = useState("");
  const [ulcl, setUlcl] = useState("dropUl");

  const [language, setLanguage] = useState("en");
  const dropdown = () => {
    setShow(!show);
    if (!rotate) {
      setRotate(!rotate);
      setClicked("icon selected");
      setUlcl("dropU");
    } else {
      setRotate(!rotate);
      setClicked("icon deselected");
      setUlcl("dropUl");
    }
  };
  const classes = useStyles();

  const changeLanguage = ln => {
    localStorage.setItem("lang", ln);
    strings.setLanguage(ln);
    setLanguage(ln);
  };

  if (!props.auth.isAuthenticated) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              <Link style={{ textDecoration: "none", color: "white" }} to="/">
                OBIADEKCHAT {props.chatType}
              </Link>
            </Typography>

            <Button
              className="tempRoomButton"
              onClick={props.createConversation}
              style={{ margin: "0.5%", backgroundColor: "#31ABFF" }}
              variant="contained"
              color="secondary"
            >
              {strings.convButton}
            </Button>

            <Button
              className="registerButton"
              onClick={props.showRegister}
              style={{ margin: "0.5%" }}
              variant="contained"
            >
              {strings.register}
            </Button>
            <Button
              onClick={props.showLogin}
              style={{ margin: "0.5%" }}
              variant="contained"
              color="secondary"
            >
              {strings.login}
            </Button>
          </Toolbar>
        </AppBar>
      </>
    );
  } else {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" href="/" className={classes.title}>
              <Link
                to="/"
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontSize: "2rem !important"
                }}
              >
                OBIADEKCHAT {props.chatType}
              </Link>
            </Typography>

            <Button
              className="tempRoomButton"
              onClick={props.createConversation}
              style={{ margin: "0.5%", backgroundColor: "#31ABFF" }}
              variant="contained"
              color="secondary"
            >
              {strings.convButton}
            </Button>

            <Button
              className="createRoomButton"
              onClick={props.createRoom}
              style={{ margin: "0.5%", backgroundColor: "#2FB827" }}
              variant="contained"
              color="secondary"
            >
              {strings.roomButton}
            </Button>
            <ArrowDropDownIcon
              className={clicked}
              id="dropIcon"
              color="action"
              style={{
                fontSize: "60",
                marginLeft: "4.2%",
                marginRight: "2.75%"
              }}
              onClick={dropdown}
            />
            <span className="lang">
              <span className="en" onClick={() => changeLanguage("en")}>
                EN
              </span>
              <span className="langDivider"> / </span>
              <span className="pl" onClick={() => changeLanguage("pl")}>
                PL
              </span>
            </span>
          </Toolbar>
        </AppBar>
        {show && (
          <div
            className="dropDiv"
            style={{
              position: "absolute",
              color: "white",
              textAlign: "center",
              right: "7.5%"
            }}
          >
            <ul
              className={ulcl}
              style={{
                listStyleType: "none",

                borderBottomRightRadius: "5px",
                borderBottomLeftRadius: "5px",
                paddingInlineStart: "0 ",
                width: "130%",

                backgroundColor: " #3f51b5",
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                paddingBottom: "10.5%",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem"
              }}
            >
              <Button
                onClick={props.userOptions}
                className="userProfileButton"
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  background: "#4D87A6"
                }}
                variant="contained"
                color="secondary"
              >
                {strings.options}
              </Button>
              <Button
                className="logOutButton"
                component={Link}
                to={"/"}
                onClick={props.logOut}
                style={{
                  display: "block",
                  height: "50%",
                  background: "#FF5733"
                }}
                variant="contained"
                color="secondary"
              >
                {strings.logout}
              </Button>
            </ul>
          </div>
        )}
      </>
    );
  }
};

Nav.propTypes = {
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
};
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
});

export default connect(mapStateToProps)(Nav);

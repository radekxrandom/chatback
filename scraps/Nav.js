import React, { useState, useEffect, useRef } from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import { Link } from "react-router-dom";
import { en, pl } from "../language/NavLang";
//import { Notification } from "tabler-icons-react";

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

const Nav = props => {
  const [lang, setLang] = useState({});
  const [show, setShow] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [clicked, setClicked] = useState("");
  const [ulcl, setUlcl] = useState("dropUl");

  const pref = useRef(null);
  const secref = useRef(null);

  const dropdown = event => {
    let iconClassNaem = rotate ? "icon deselected" : "icon selected";
    let dropClassNaem = rotate ? "dropUl" : "dropU";

    setShow(prev => !prev);
    setRotate(prev => !prev);
    setClicked(iconClassNaem);
    setUlcl(dropClassNaem);
  };

  useEffect(() => {
    if (props.auth.language === "pl") {
      setLang(pl);
    } else {
      setLang(en);
    }
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (
        pref.current &&
        !pref.current.contains(event.target) &&
        !secref.current.contains(event.target)
      ) {
        setShow(false);
        if (!rotate) {
          setRotate(!rotate);
          setClicked("icon selected");
          setUlcl("dropU");
        } else {
          setRotate(!rotate);
          setClicked("icon deselected");
          setUlcl("dropUl");
        }
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line no-console
  }, [props.auth.language, rotate]);

  const classes = useStyles();

  if (!props.auth.isAuthenticated) {
    return (
      <>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              <Link style={{ textDecoration: "none", color: "white" }} to="/">
                OBIADEKCHAT{" "}
              </Link>
            </Typography>

            <Button
              className="showOnBigScreen outlinedButton"
              style={{ margin: "0.5%", color: "white", borderColor: "white" }}
              onClick={props.createConversation}
              variant="outlined"
              color="secondary"
            >
              {lang.tempBtn}
            </Button>

            <Button
              className="showOnBigScreen outlinedButton"
              style={{ margin: "0.5%", color: "white", borderColor: "white" }}
              onClick={props.showRegister}
              variant="outlined"
            >
              {lang.reg}
            </Button>
            <Button
              onClick={props.showLogin}
              className="showOnBigScreen outlinedButton"
              style={{ margin: "0.5%", color: "white", borderColor: "white" }}
              variant="outlined"
              color="secondary"
            >
              {lang.login}
            </Button>
            <ArrowDropDownIcon
              className={`showOnMobile ${clicked}`}
              ref={secref}
              id="dropIcon"
              color="action"
              style={{
                fontSize: "60",
                marginLeft: "4.2%"
              }}
              onClick={dropdown}
            />
          </Toolbar>
        </AppBar>
        {show && (
          <div
            className="showOnMobile dropDiv"
            style={{
              textAlign: "center",
              display: "inlineBlock",
              color: "white",
              marginLeft: "85vw"
            }}
          >
            <ul
              ref={pref}
              className={`showOnMobile ${ulcl}`}
              style={{
                listStyleType: "none",

                borderBottomRightRadius: "5px",
                borderBottomLeftRadius: "5px",
                paddingInlineStart: "0 ",
                width: "130%",
                marginTop: "0.3rem",
                backgroundColor: " #3f51b5",
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                paddingBottom: "10.5%",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem"
              }}
            >
              <Button
                className="showOnMobile outlinedButton"
                onClick={props.createConversation}
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.conv}
              </Button>

              <Button
                className="showOnMobile outlinedButton"
                onClick={props.showLogin}
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.login}
              </Button>

              <Button
                className="showOnMobile outlinedButton"
                onClick={props.showRegister}
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.reg}
              </Button>
            </ul>
          </div>
        )}
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
                OBIADEKCHAT{" "}
              </Link>
            </Typography>

            <Button
              className="showOnBigScreen outlinedButton"
              onClick={props.createConversation}
              style={{ margin: "0.5%", color: "white", borderColor: "white" }}
              variant="outlined"
              color="secondary"
            >
              {lang.tempBtn}
            </Button>

            <Button
              className="showOnBigScreen outlinedButton"
              style={{ margin: "0.5%", color: "white", borderColor: "white" }}
              onClick={props.createRoom}
              variant="outlined"
              color="secondary"
            >
              {lang.createBtn}
            </Button>
            <ArrowDropDownIcon
              className={clicked}
              ref={secref}
              id="dropIcon"
              color="action"
              style={{
                fontSize: "60",
                marginLeft: "4.2%"
              }}
              onClick={dropdown}
            />
            {/*<Notification  />; */}
            <span className="notifCount">
              {props.auth.notifCount + props.auth.msgCount}
            </span>
          </Toolbar>
        </AppBar>
        {show && (
          <div
            className="dropDiv"
            style={{
              textAlign: "center",
              display: "inlineBlock",
              color: "white",
              marginLeft: "85vw",
              width: "fitConent"
            }}
          >
            <ul
              ref={pref}
              className={ulcl}
              style={{
                listStyleType: "none",

                borderBottomRightRadius: "5px",
                borderBottomLeftRadius: "5px",
                paddingInlineStart: "0 ",
                width: "130%",
                marginTop: "0.3rem",
                backgroundColor: " #3f51b5",
                fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                paddingBottom: "10.5%",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem"
              }}
            >
              <Button
                className="showOnMobile outlinedButton"
                onClick={props.createConversation}
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.conv}
              </Button>

              <Button
                className="showOnMobile outlinedButton"
                onClick={props.createRoom}
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.newR}
              </Button>

              <Button
                onClick={props.userOptions}
                className="outlinedButton"
                style={{
                  width: "100%",
                  display: "block",
                  height: "50%",
                  marginBottom: "3%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.uOpts}
              </Button>
              <Button
                className="outlinedButton"
                component={Link}
                to={"/"}
                onClick={props.logOut}
                style={{
                  display: "block",
                  height: "50%",
                  color: "white",
                  borderColor: "white",
                  background: "#435982"
                }}
                variant="outlined"
                color="secondary"
              >
                {lang.logout}
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

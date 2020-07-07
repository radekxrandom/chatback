import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";

const ProfileTab = props => {
  const copyId = () => {
    var textField = document.createElement("textarea");
    textField.innerText = props.auth.user.data.searchID;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
  };

  return (
    <div
      className="profileModalContent"
      style={{ display: "flex", textAlign: "left" }}
    >
      <div className="profileImg">
        <img
          src="https://avatars0.githubusercontent.com/u/12987981?s=460&u=52d1b342fba01504ec1ca24a0d0bd418651d39d6&v=4"
          alt="Profile"
        />
      </div>
      <div className="fields">
        <p>Hello there {props.auth.user.data.name}</p>
        <p>
          Your ID:{" "}
          <span className="idField">{props.auth.user.data.searchID}</span>{" "}
          <FileCopyOutlinedIcon onClick={copyId} className="copyIcon" />
        </p>
        <p>
          Share your ID with someone if you want him to be able to send you
          friend request.
        </p>
      </div>
    </div>
  );
};

ProfileTab.propTypes = {
  auth: PropTypes.object.isRequired
};
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.erros
});

export default connect(mapStateToProps)(ProfileTab);

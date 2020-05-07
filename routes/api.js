module.exports = function(app, express, passport) {
  var router = express.Router();
  var auth = require("../controllers/authController");
  var channels = require("../controllers/channelsController");
  var conversation = require("../controllers/conversationController");
  var friends = require("../controllers/friendsController");

  const checkToken = (req, res, next) => {
    const header = req.headers["authorization"];

    if (typeof header !== "undefined") {
      const bearer = header.split(" ");
      const token = bearer[1];

      req.token = token;
      next();
    } else {
      //If header is undefined return Forbidden (403)
      res.sendStatus(403);
    }
  };

  router.post("/register", auth.register);
  router.post("/login", auth.login);
  router.get("/channels/list", channels.listAllChannels);
  router.post("/channel/create", checkToken, channels.createNewChannel);
  router.get("/channel/options/:id", channels.getChannelOptions);
  router.get(
    "/user/channels/list",
    checkToken,
    channels.listChannelsOnUserProfile
  );
  router.post("/user/search", checkToken, friends.findUsername);
  router.post("/channel/delete", checkToken, channels.deleteChannel);
  router.get("/check", checkToken, channels.showUser);
  router.post("/conversation/create", conversation.createNewConversation);
  router.post("/channel/edit", checkToken, channels.editChannelOptions);
  return router;
};

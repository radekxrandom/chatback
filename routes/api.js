module.exports = function(app, express, passport) {
  var router = express.Router();
  var auth = require("../controllers/authController");
  var channels = require("../controllers/channelsController");

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
  router.get("/channels", channels.listChannels);
  router.post("/create", checkToken, channels.createChannel);
  router.get("/pwd/:id", channels.checkChannelPassword);
  router.get("/chan/:name", channels.messages);
  router.get("/list", checkToken, channels.showChannelsOnUserProfile);
  return router;
};

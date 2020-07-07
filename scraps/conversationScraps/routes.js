const checkIfUserIsValid = async (req, res, next) => {
  if (!req.body.username || typeof header === "undefined") {
    req.user = false;
    next();
  }
  try {
    const header = req.headers["authorization"];
    const bearer = header.split(" ");
    const token = bearer[1];
    let decodedUserData = await jwt.verify(token, "secretkey");
    let user = await ChatUser.findById(decodedUserData.data.id);
    if (user.name === req.body.username) {
      req.user = user;
      next();
    } else {
      req.user = false;
      next();
    }
  } catch (err) {
    req.user = false;
    next();
  }
};

const retrieveToken = header => {
  const splitHeader = header.split(" ");
  return splitHeader[1];
};

exports.getUserFromJWT = async header => {
  if (!header) {
    return false;
  }
  const token = retrieveToken(header);
  const user = await ChatUser.findById(token.data.id);
  if (!user) {
    return false;
  }
  return user;
};

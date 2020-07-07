var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var InviteSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Invite", InviteSchema);

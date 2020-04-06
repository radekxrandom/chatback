var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ChatUserSchema = new Schema({
  username: {
    type: String,
    reuired: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    reuired: false
  },
  reset: {
    type: String,
    required: false
  },
  // 0 - regular user, 1 - moderator, 2 - administrator, 3 - owner
  globalRole: {
    type: Number,
    required: true,
    default: 0
  },
  channels: [
    {
      type: Schema.Types.ObjectId,
      ref: "Channels"
    }
  ]
});

module.exports = mongoose.model("ChatUser", ChatUserSchema);

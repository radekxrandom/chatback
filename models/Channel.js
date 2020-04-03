var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ChannelSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  listOnMain: {
    type: Boolean,
    required: false
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: false
    }
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "Owner",
    required: true
  },
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "Messages",
      required: false
    }
  ]
});

module.exports = mongoose.model("Channel", ChannelSchema);

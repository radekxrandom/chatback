var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  author: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: false
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: "Channel",
    required: true
  },
  date: {
    type: String,
    required: false
  },
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);

var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ConversationSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  isOwnerAnon: {
    type: Boolean,
    required: true
  },
  owner: {
    type: String,
    required: true,
    default: false
  },
  secondUser: {
    type: String,
    required: false
  },
  publicKeys: [
    {
      type: String,
      required: false
    }
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "ConveMessage",
      required: false
    }
  ],
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Conversation", ConversationSchema);

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
    },
    phoneNumber: {
      type: String,
      default : null 
    },
    message: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      required: [true, "Please provide the notification type"],
    },
    userType: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readTime: {
      type: Date,
      default: null,
    },
    subject : {
      type: String,
      default: "",
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;

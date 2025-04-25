const mongoose = require('mongoose');

const siblingGroupSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
      },
    ],
  },
  { timestamps: true }
);

const SiblingGroup = mongoose.model('SiblingGroup', siblingGroupSchema);

module.exports = SiblingGroup;
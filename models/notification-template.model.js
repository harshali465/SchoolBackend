const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const templateSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      enum: ['behaviour', 'proxy', 'attendance', 'homework'],
      default: 'student',
    },
    condition: {
      type: String,
    },
    remark:{
      type: String,
    }
  },
  { timestamps: true },
);

templateSchema.plugin(paginate);

const notificationTemplate = mongoose.model('notificationTemplate', templateSchema);

module.exports = notificationTemplate;

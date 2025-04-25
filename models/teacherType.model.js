const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const TeacherTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Please provide a Type!'],
    },
    active: {
      type: Boolean,
      default: true,
      // select: false,
    },
  },
  { timestamps: true },
);

TeacherTypeSchema.plugin(paginate);

const TeacherTypeModel = mongoose.model('TeacherType', TeacherTypeSchema);

module.exports = TeacherTypeModel;

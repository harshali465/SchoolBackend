const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

// Define the schema for the grade sections, which includes stages and grades
const GradeSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Add pagination plugin
GradeSchema.plugin(paginate);

// Create the model
const Grade = mongoose.model('Grade', GradeSchema);

module.exports = Grade;
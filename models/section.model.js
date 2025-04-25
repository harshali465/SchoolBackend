const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

// Define the schema for the grade sections, which includes stages and grades
const SectionSchema = new mongoose.Schema(
  {
    section: {
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
SectionSchema.plugin(paginate);

// Create the model
const Section = mongoose.model('Section', SectionSchema);

module.exports = Section;
const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

// Define the schema for the grade sections, which includes stages and grades
const StageGradeSectionTimeSchema = new mongoose.Schema(
  {
    stage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Stage',
      required: [true, 'Please provide Stage'],
    },
    grade: {
      type: mongoose.Schema.ObjectId,
      ref: 'Grade',
      required: [true, 'Please provide grade'],
    },
    section: {
      type: mongoose.Schema.ObjectId,
      ref: 'Section',
      required: [true, 'Please provide section'],
    },
    start_time: {
      type: String,
      required: [true, 'Please provide start time'],
    },
    end_time: {
      type: String,
      required: [true, 'Please provide end time'],
    },
    class_teachers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
      },
    ], 
    status: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Add pagination plugin
StageGradeSectionTimeSchema.plugin(paginate);

// Create the model
const StageGradeSectionTime = mongoose.model('StageGradeSectionTime', StageGradeSectionTimeSchema);

module.exports = StageGradeSectionTime;
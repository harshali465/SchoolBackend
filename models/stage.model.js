const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

// Define the schema for the grade sections, which includes stages and grades
const StageSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true,
    },
    status : {
      type : Boolean,
      default : true
    }
  },
  { timestamps: true }
);

// Add pagination plugin
StageSchema.plugin(paginate);

// Create the model
const Stage = mongoose.model('Stage', StageSchema);

module.exports = Stage;

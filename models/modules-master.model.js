const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');
const moduleSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: [true, 'Please enter the school name'],
    },
    description: {
      type: String,
      default: '',  // Optional logo field, defaulting to an empty string
    },
    status : {
      type : Boolean,
      default : true
    }
  },
  { timestamps: true },
);

moduleSchema.plugin(paginate);

const Module = mongoose.model('Module', moduleSchema);


module.exports = Module;

const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const AllergiesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a Type!'],
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

AllergiesSchema.plugin(paginate);

const Category = mongoose.model('Allergy', AllergiesSchema);

module.exports = Category;

const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const HouseSchema = new mongoose.Schema(
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

HouseSchema.plugin(paginate);

const Category = mongoose.model('House', HouseSchema);

module.exports = Category;

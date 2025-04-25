const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name!'],
    },
    assignedAadatCount: {
      type: Number,
      default: 0,
    },
    orderValue: {
      type: Number,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
      // select: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true },
);

categorySchema.plugin(paginate);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;

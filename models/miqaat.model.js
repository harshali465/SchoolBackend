const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const MiqaatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide miqaat name!'],
    },

    description: {
      type: String,
    },

    repeat: {
      type: String,
      enum: ['everyweek', 'everymonth', 'everyyear'],
    },

    active: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true },
);

MiqaatSchema.plugin(paginate);

const Miqaat = mongoose.model('Miqaat', MiqaatSchema);

module.exports = Miqaat;

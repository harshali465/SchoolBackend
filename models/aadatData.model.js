// const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const aadatDataSchema = new Schema({
  aadatId: {
    type: Schema.Types.ObjectId,
    ref: 'Aadat',
  },
  miqaatId: {
    type: Schema.Types.ObjectId,
    ref: 'Miqaat',
  },
  suratId: {
    type: Schema.Types.ObjectId,
    ref: 'Surat',
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  remarkBoxes: {
    type: Map,
    of: Schema.Types.Mixed, // Allows any structure
  },
  customField: {
    type: [Schema.Types.Mixed], // Allows any structure
  },
  yesno: {
    type: String,
    enum: ['yes', 'no'],
  },
  customType: {
    type: [String]
  },
  miqaatyesno: {
    type: String,
    enum: ['yes', 'no'],
  },
  responsetypeCustomField: {
    type: String,
  },
  images: {
    type: [String],
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
},
  { timestamps: true },
);

aadatDataSchema.plugin(paginate);

const AadatData = mongoose.model('AadatData', aadatDataSchema);


module.exports = AadatData;

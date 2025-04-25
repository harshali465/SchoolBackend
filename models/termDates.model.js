const mongoose = require("mongoose");
const paginate = require("mongoose-paginate-v2");

// Define the schema for the grade sections, which includes stages and grades
const TermDatesSchema = new mongoose.Schema(
  {
    academic_year_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      required: true,
    },
    term: [
      {
        term: String,
        startDate: Date,
        endDate: Date,
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
    active : {
        type : Boolean,
        default : true
      }
  },
  
  { timestamps: true ,
    versionKey: false
  }
);

TermDatesSchema.plugin(paginate);
// Create the model
const TermDates = mongoose.model("TermDates", TermDatesSchema);

module.exports = TermDates;

const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const aadatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide aadat name!'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide Category'],
    },
    responseType: {
      type: Array,
      // enum: ['yesno', 'remarkbox', 'custom', 'image'],
    },
    customType: {
        values: [
          {
            value : {
              type : String
            },
            customFor : {
              type: String,
              enum: ['male', 'female', 'both'],
            }  
          }
        ],
    },
    responsetypeCustomField: [
      {
        cusresTitle : {
          type : String
        },
        cusresType : {
          type: String,
          enum: ['male', 'female', 'both'],
        },
        cusresValue : [String]
      }
    ],
    customField: [
      {
        fieldTitle: {
          type: String,
        },
        fieldType: {
          type: String,
          enum: ['checkbox', 'dropdown', ''],
        },
        options: [String],
      },
    ],
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StageGradeSectionTime',  // Referencing the 'Class' schema
    }],
    isImageUpload: {
      type: Number,
      default: 0,
    },
    applicableTo: {
      type: String,
      enum: ['male', 'female', 'both'],
    },
    isCompulsory: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    repeatDateForYear: {
      type: Date,
    },
    customDate : {
      type: Date
    },
    repetation: {
      type: String,
      enum: [
        'norepeat',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'everyweekday',
        'custom'
      ],
    },
    repeatDays: [
      {
        type: String,
        enum: [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      },
    ],
    repeatMonths: {
      type:[String],
      enum: [
        'january', 
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december'
      ]
    },
    active: {
      type: Boolean,
      default: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    },
    orderValue: {
      type: Number,
      default: null,
    }
  },
  { timestamps: true },
);

aadatSchema.plugin(paginate);

const Aadat = mongoose.model('Aadat', aadatSchema);

module.exports = Aadat;

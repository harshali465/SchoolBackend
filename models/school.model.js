const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: [true, 'Please enter the school name'],
    },
    schoolLogo: {
      type: String,
      default: '',  // Optional logo field, defaulting to an empty string
    },
    addressLine1: {
      type: String,
      required: [true, 'Please provide the address line 1'],
    },
    addressLine2: {
      type: String,
      default: '',  // Optional second address line
    },
    country: {
      type: String,
      required: [true, 'Please provide the country'],
    },
    state: {
      type: String,
      required: [true, 'Please provide the state'],
    },
    city: {
      type: String,
      required: [true, 'Please provide the city'],
    },
    pincode: {
      type: String,
      required: [true, 'Please provide the pincode'],
    },
    contactPersonName: {
      type: String,
      required: [true, 'Please provide the contact person name'],
    },
    contactPersonMobile: {
      type: Number,
      required: [true, 'Please provide the contact person mobile number'],
    },
    contactPersonEmail: {
      type: String,
      required: [true, 'Please provide the contact person email'],
      lowercase: true,
    },
    schoolAdminUsername: {
      type: String,
      required: [true, 'Please provide the school admin username (email)'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
    },
    numberOfStudents: {
      type: Number,
      default: 0,  // Default value for student count
    },
    subscriptionStart: {
      type: Date,
      required: [true, 'Please provide the subscription start date'],
    },
    validityOfSubscription: {
      type: Date,
      required: [true, 'Please provide the validity of subscription'],
    },
    modulesActivated: [{
      moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module', // Reference to the Module schema
      },
      status: {
        type: Boolean,
        default: true, // Default status to true, or set it manually
      },
    }],
    isDeleted : {
      type : Boolean,
      default : false
    },
    status : {
      type : Boolean,
      default : true
    }
  },
  { timestamps: true },
);

const School = mongoose.model('School', schoolSchema);


module.exports = School;

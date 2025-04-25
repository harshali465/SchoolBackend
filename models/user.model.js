const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const paginate = require('mongoose-paginate-v2');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide your first name!'],
    },
    middleName : {
      type:String
    },
    lastName: {
      type: String,
    },
    HMRNumber: {
      type: String,
      default: '',  // Optional logo field, defaulting to an empty string
    },
    itsNo: {
      type: String,
      required: function () {
        // `itsNo` is required if the role is 'student' or 'teacher'
        return this.role === 'student';
      },
      validate: {
        validator: function (value) {
          if (this.role === 'student') {
            return value != null && value.trim() !== '';
          }
          return true;
        },
        message: 'Please provide your ITS number',
      },
    },
    email: {
      type: String,
      required: function () {
        // `email` is required if the role is 'school-admin'
        return this.role === 'school-admin' || this.role === 'teacher';
      },
      validate: {
        validator: function (value) {
          if (this.role === 'school-admin' || this.role === 'teacher') {
            return value != null && value.trim() !== '';
          }
          return true;
        },
        message: 'Please provide your email',
      },
      lowercase: true,
    },
    photo: String,
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [false, 'Please provide Gender'],
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'school-admin'],
      default: 'student',
    },
    bloodGroup: {
      type: String,
      required: false
    },
    notificationPreference: {
      type: String,
      enum: ['whatsapp', 'email', 'both'],
    },
    // student specific fields ///////////////////////////////////////////////////// student below\/

    /// NONE OF THESE WILL BE REQUIRED
    // VALIDATION TO BE DONE IN FRONTEND
    studentId: {
      type: String,
    },
    class: {
      type: String,
    },
    house: {
      type: String,
    },

    division: {
      type: String,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
    },
    stageGradeSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StageGradeSectionTime', // Reference to the User model
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School', // Reference to the School model
    },
    loginStats: [
      {
        loginDate: Date,
        loginTime: Date,
        logoutTime: Date,
      },
    ],
    siblings: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiblingGroup', // Reference to the SiblingGroup model
    },
    fees: {
      total: {
        type: String,
      },
      paid: {
        type: String,
      },
    },
    familyDetails: {
      fatherFirstName: String,
      fatherLastName: String,
      fatherEmail: String,
      fatherPhone: String,
      motherFirstName: String,
      motherLastName: String,
      motherEmail: String,
      motherPhone: String,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TermDates',
      required: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    behaviousPoints: {
      positivePoints: String,
      negativePoints: String,
    },
    admissionDate: {
      type : String,
    },
    // ///////////////////////////////////////////////////////////////////////////// Student above /\

    // ///////////////////////////////////////////////////////////////////////////// Teachers Below \/
    teacherType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherType', 
    },
    isProxyTeacher: {
      type: Boolean,
      default: false
    },
    section: {
      type: String,
    },
    dob : {
      type: Date,
      // required: [true, 'Please provide your date of birth'],
    },
    HomeNumber : {
      type: String,  
    },
    WhatsAppNumber:{
      type: String,  
    },
    // ///////////////////////////////////////////////////////////////////////////// Teachers above /\
    address : {
      addressLine1 : String,
      addressLine2 : String,
      city : String,
      state : String,
      country : String,
      pincode : String
    },
    // school specific fields ///////////////////////////////////////////////////// school below\/
    contactPersonEmail: {
      type: String,  // Specific to school admins
      lowercase: true,
    },
    contactPersonMobile: {
      type: String,  // Specific to school admins
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    },
    
    // ///////////////////////////////////////////////////////////////////////////// school above /\

    password: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

userSchema.plugin(paginate);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// userSchema.pre(/^find/, function (next) {
//   // this points to the current query
//   this.find({ active: { $ne: false } });
//   next();
// });

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

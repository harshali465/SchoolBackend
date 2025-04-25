const mongoose = require('mongoose');
const { Schema } = mongoose;
const paginate = require('mongoose-paginate-v2');

const dayTypeSchema = new Schema({
  type: {
    type: String,
  },
},
  { timestamps: true });

const tagSchema = new Schema({
  tag: {
    type: String,
  },
},
  { timestamps: true },);

const dayAttendanceTagSchema = new Schema({
  day_type: {
    type: Schema.Types.ObjectId,
    ref: 'DayType',
  },
  applicable_to: {
    type: String,
    enum: ['teacher', 'student'],
  },
  scan_source: {
    type: String,
    enum: ['card', 'manual'],
  },
  tag: {
    type: Schema.Types.ObjectId,
    ref: 'Tag',
  },
  parent_accompaning_needed: {
    type: Boolean,
    default: false,
    // select: false,
  },
  active: {
    type: Boolean,
    default: true,
    // select: false,
  },
  // start_time: {
  //   type: String,
  // },
  // end_time: {
  //   type: String,
  // },
  ref_time: {
    type: String,
    enum: ['startTime', 'endTime']
  },
  less_than: {
    type: String,
  },
  more_than: {
    type: String,
  },
  scenario: {
    type: String,
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
},
  { timestamps: true },);

const classAttendanceTagSchema = new Schema({
  day_type: {
    type: Schema.Types.ObjectId,
    ref: 'DayType',
  },
  applicable_to: {
    type: String,
    enum: ['teacher', 'student'],
  },
  scan_source: {
    type: String,
  },
  tag: {
    type: Schema.Types.ObjectId,
    ref: 'Tag',
  },
  active: {
    type: Boolean,
    default: true,
    // select: false,
  },
  // start_time: {
  //   type: String,
  // },
  // end_time: {
  //   type: String,
  // },
  parent_accompaning_needed: {
    type: Boolean,
    default: false,
    // select: false,
  },
  ref_time: {
    type: String,
    enum: ['startTime', 'endTime']
  },
  less_than: {
    type: String,
  },
  more_than: {
    type: String,
  },
  scenario: {
    type: String,
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYears',
    // required: true,
  }
},
  { timestamps: true },);

const dayAttendanceSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    user_type: {
      type: String,
      enum: ['teacher', 'student'],
    },
    day_type: {
      type: Schema.Types.ObjectId,
      ref: 'DayType',
    },
    tag: {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    },
    scan_source: {
      type: String,
      enum: ['card', 'manual'],
    },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    is_parent_accompaning: {
      type: Boolean,
      default: false
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true },
);

const attendanceCertificateSchema = new Schema(
  {
    certificate_image: {
      type: String,
    },
    certificate_name: {
      type: String,
    },
    tag: {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    },
    description: {
      type: String,
    },
    start_day: {
      type: Number,
    },
    end_day: {
      type: Number,
    },
    active: {
      type: Boolean,
      default: true,
      // select: false,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true },
);

const leaveSchema = new Schema(
  {
    requested_by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    leave_type: {
      type: String,
      enum: ['half-day', 'full-day', 'early-release'],
    },
    event_type: {
      type: String,
      // enum: ['half-day', 'full-day', 'early-release'],
    },
    start_date: {
      type: String,
    },
    end_date: {
      type: String,
    },
    early_leave_time : {
      type: String,
    },
    lecture_id: {
      type: [String],
    },
    reason: {
      type: String,
    },
    is_withdrawn: {
      type: Boolean,
      default: false,
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    remark: {
      type: String,
    },
    is_rejected: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      // select: false,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true },
)

const classAttendanceSchema = new Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacherTag: {
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    assistantTeachers: [
      {
        asstTeacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        tag: {
          type: Schema.Types.ObjectId,
          ref: 'Tag',
        },
      },
    ],
    students: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        tag: {
          type: Schema.Types.ObjectId,
          ref: 'Tag',
        },
      },
    ],
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true }
);

leaveSchema.plugin(paginate);
dayTypeSchema.plugin(paginate);
tagSchema.plugin(paginate);
dayAttendanceTagSchema.plugin(paginate);
classAttendanceTagSchema.plugin(paginate);
dayAttendanceSchema.plugin(paginate);
attendanceCertificateSchema.plugin(paginate);
classAttendanceSchema.plugin(paginate);

module.exports = {
  dayAttendance: mongoose.model('dayAttendance', dayAttendanceSchema),
  tag: mongoose.model('Tag', tagSchema),
  dayType: mongoose.model('DayType', dayTypeSchema),
  dayAttendanceTag: mongoose.model('DayAttendanceTag', dayAttendanceTagSchema),
  classAttendanceTag: mongoose.model('ClassAttendanceTag', classAttendanceTagSchema),
  attendanceCertificate: mongoose.model('attendanceCertificate', attendanceCertificateSchema),
  leave: mongoose.model('leave', leaveSchema),
  classAttendance: mongoose.model('classAttendance', classAttendanceSchema),
};
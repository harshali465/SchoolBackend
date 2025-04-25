const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const TimeTable = new mongoose.Schema(
  {
    schoolTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SchoolType',
    },
    workingDaysId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingDays',
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    },
    date: {
      type: Date, // Changed to Date type
    },
    additionals: {
      type: [
        {
          title: { type: String, required: true },
          start_time: { type: String, required: true },
          end_time: { type: String, required: true },
        }
      ],
      default: [] // Ensures an empty array if no additionals are provided
    },
    timeTable: [
      {
        gradeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Grade',
        },
        sectionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Section',
        },
        classTeacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        slots: [
          {
            startTime: {
              type: String, // Consider a more structured time format
            },
            endTime: {
              type: String,
            },
            subjectId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Subject',
            },
            other: {
              type: String
            },
            mainTeacherId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            asstTeacherId1: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            asstTeacherId2: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          },
        ],
      },
    ],
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true },
);

const ProxyTeacher = new mongoose.Schema(
  {
    mainTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // The teacher who is on leave
      required: true,
    },
    proxyTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // The proxy teacher
      required: true,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',  // Academic year
      required: true,
    },
    workingDaysId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingDays',
    },
    stageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stage',
    },
    startDate: {
      type: Date,  // Start date of proxy assignment
      required: true,
    },
    endDate: {
      type: Date,  // End date of proxy assignment (can be left null for single-day leave)
      required: false,
    },
    proxyAssignments: [
      {
        gradeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Grade',  // The grade being taught
          required: true,
        },
        sectionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Section',  // The section being taught
          required: true,
        },
        classTeacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        proxyClassTeacherId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        slots: [
          {
            startTime: {
              type: String,  // Start time of the lesson
              required: true,
            },
            endTime: {
              type: String,  // End time of the lesson
              required: true,
            },
            subjectId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Subject',  // The subject being taught
              required: true,
            },
            mainTeacherId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',  // The original teacher (main teacher)
              required: true,
            },
            proxyMainTeacherId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',  // Proxy teacher who will teach the class
              required: false,
            },
            asstTeacherId1: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',  // Assistant Teacher 1
              required: false,
            },
            proxyAsstTeacherId1: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',  // Proxy Assistant Teacher 1
              required: false,
            },
            asstTeacherId2: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',  // Assistant Teacher 2
              required: false,
            },
            proxyAsstTeacherId2: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',  // Proxy Assistant Teacher 2
              required: false,
            },
            status: {
              type: String,
              enum: ['assigned', 'completed'],  // Track the status of proxy assignment
              default: 'assigned',
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

TimeTable.plugin(paginate);
ProxyTeacher.plugin(paginate);

module.exports = {
  TimeTable: mongoose.model('TimeTable', TimeTable),
  ProxyTeacher: mongoose.model('ProxyTeacher', ProxyTeacher),
};
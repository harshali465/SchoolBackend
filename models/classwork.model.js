const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const classWorkStudent = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    points: {
      type: Number,
      default: 0,
    },
  },
  { _id: false } // Prevents Mongoose from auto-creating _id for subdocuments
);

const classworkSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    attendanceId: {
      type: mongoose.Schema.ObjectId,
      ref: 'classAttendance',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    gradeId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Grade',
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Section',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Subject',
      required: true,
    },
    students: [classWorkStudent], // Corrected: Making it an array
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    teachingAids: {
      type: String,
      required: false,
    },
    maximumPoint: {
      type: Number,
      required: false,
    },
    links: {
      type: [String], // Ensuring it's an array of strings
      required: false,
    },
    images: {
      type: [String], // Ensuring it's an array of strings
      required: false,
    },
    isMarked: {
      type: Boolean,
      default: false,
    },
    markedAt: {
      type: Date,
      default: null,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYears',
      // required: true,
    }
  },
  { timestamps: true }
);

classworkSchema.plugin(paginate);

const Classwork = mongoose.model('Classwork', classworkSchema);

module.exports = Classwork;

const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const ReportCard = new mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        marks: {
            type: Number,
            required: true,
        }
    },
    { timestamps: true },
);

const SchoolType = new mongoose.Schema(
    {
        type: {
            type: String,
            // enum: ['Public', 'Private', 'Charitable'],
        },
        active: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true },
)

const Subject = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
        }
    },
    { timestamps: true },
)

const GradeWiseSubjects = new mongoose.Schema(
    {
        stage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stage',
            required: true,
        },
        grade: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Grade',
            required: true,
        },
        subjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject',
                required: true,
            }
        ],
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYears',
            // required: true,
        }
    },
    { timestamps: true },
)

const Event = new mongoose.Schema(
    {
        name: {
            type: String,
            // required: true,
        },
        date: {
            type: Date,
            // required: true,
        },
        stage_grade_section_time: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StageGradeSectionTime',
        },
        school_type: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolType',
        },
        start_time: {
            type: String,
            // required: true
        },
        end_time: {
            type: String,
            // required: true
        },
        active: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true },
)

const WorkingDays = new mongoose.Schema(
    {
        academicYearId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AcademicYears',
            // required: true,
        },
        school_type_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SchoolType',
            required: true,
        },
        stageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stage',
            required: true,
        },
        start_date: {
            type: Date,
        },
        end_date: {
            type: Date,
        },
        weekdays: {
            type: [
                {
                    day: { type: String, required: true },
                    start_time: { type: String, required: true },
                    end_time: { type: String, required: true },
                    additionals: {
                        type: [
                            {
                                title: { type: String, required: true },
                                start_time: { type: String, required: true },
                                end_time: { type: String, required: true },
                            }
                        ],
                        default: [] // Ensures an empty array if no additionals are provided
                    }
                }
            ],
            default: [] // Ensures an empty array if no weekdays are provided
        },
        active: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true },
)

const AcademicYears = new mongoose.Schema(
    {
        start_year: {
            type: String,
        },
        end_year: {
            type: String,
        },
        is_current_year: {
            type: Boolean,
            default: false,
        },
        is_next_year: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true },
)

const AssignedSubjectToTeacher = new mongoose.Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        teacherTypeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TeacherType',
            required: true,
        },
        grade: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Grade',
            required: true,
        },
        section: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Section',
                required: true,
            }
        ],
        subjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Subject',
                required: true,
            }
        ]
    },
    { timestamps: true },
)

ReportCard.plugin(paginate);
SchoolType.plugin(paginate);
GradeWiseSubjects.plugin(paginate);
AssignedSubjectToTeacher.plugin(paginate);
Event.plugin(paginate);
WorkingDays.plugin(paginate);
AcademicYears.plugin(paginate);

module.exports = {
    ReportCard: mongoose.model('ReportCard', ReportCard),
    SchoolType: mongoose.model('SchoolType', SchoolType),
    Subject: mongoose.model('Subject', Subject),
    GradeWiseSubjects: mongoose.model('GradeWiseSubjects', GradeWiseSubjects),
    AssignedSubjectToTeacher: mongoose.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher),
    Event: mongoose.model('Event', Event),
    WorkingDays: mongoose.model('WorkingDays', WorkingDays),
    AcademicYears: mongoose.model('AcademicYears', AcademicYears),
} 
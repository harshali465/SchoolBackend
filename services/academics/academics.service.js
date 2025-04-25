const { ReportCard, SchoolType, GradeWiseSubjects, Subject, Event, WorkingDays, AcademicYears, AssignedSubjectToTeacher } = require("../../models/academics.model");
const {
    BehaviorPointCondition,
    BehaviorPointCategory,
    BehaviorPointCoupon,
    BehaviorPointCouponApproval,
    BehaviorPointAssignPoint,
    BehaviorPointPoint,
} = require("../../models/behaviourPoint.model");
const { dayAttendanceTag, classAttendanceTag, dayAttendance, attendanceCertificate, leave } = require("../../models/attendance.model");
const Category = require('../../models/category.model');
const Aadat = require('../../models/aadat.model');
const AadatData = require('../../models/aadatData.model');
const Miqaat = require('../../models/miqaat.model');
const User = require('../../models/user.model');
const TermDates = require('../../models/termDates.model');
const { TimeTable, ProxyTimeTable } = require('../../models/timeTable.model');
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const Stage = require("../../models/stage.model");
const TeacherType = require("../../models/teacherType.model");
const { default: mongoose, connection } = require("mongoose");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const ObjectId = mongoose.Types.ObjectId;
// -------------------------------- Academic Year -----------------------------------

module.exports.createAcademicYear = async (body, connection) => {
    try {
        const AcademicYearModel = connection.model('AcademicYears', AcademicYears.schema);
        console.log(body.is_current_year, typeof (body.is_current_year))
        console.log(body.is_next_year, typeof (body.is_next_year))
        // Check for overlapping current or next academic year
        if (body.is_current_year == true) {
            const existingYear = await AcademicYearModel.findOne({ is_current_year: true });
            if (existingYear) {
                let errorType = 'CURRENT_ACADEMIC_YEAR_SET'
                throw new Error(errorType);
            }
        }
        if (body.is_next_year == true) {
            const existingYear = await AcademicYearModel.findOne({ is_next_year: true });
            if (existingYear) {
                let errorType = 'NEXT_ACADEMIC_YEAR_SET'
                throw new Error(errorType);
            }
        }

        // Check for duplicate academic year by start and end year
        const duplicateYear = await AcademicYearModel.findOne({
            start_year: body.start_year,
            end_year: body.end_year
        });
        if (duplicateYear) {
            throw new Error('ACADEMIC_YEAR_ALREADY_EXISTS');
        }

        // Validation for start and end year
        if (!body.start_year || !body.end_year || body.end_year <= body.start_year) {
            throw new Error('INVALID_ACADEMIC_YEAR_RANGE');
        }

        // Create the new academic year
        const academicYearData = await AcademicYearModel.create(body);
        return academicYearData;

    } catch (error) {
        console.error('Error creating Academic Year:', error.message);
        throw error;
    }
};

module.exports.getAllAcademicYears = async (query, connection) => {
    try {
        const AcademicYearModel = connection.model('AcademicYears', AcademicYears.schema);
        const AcademicYears2 = await AcademicYearModel.find();
        return AcademicYears2;
    } catch (error) {
        console.error('Error getting all Academic years:', error);
        throw new Error('There was a problem getting all the Academic years.');
    }
}

module.exports.getAcademicYear = async (id, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }

        const AcademicYearModel = connection.model('AcademicYears', AcademicYears.schema);
        const AcademicYear = await AcademicYearModel.find({ _id: new ObjectId(id) });
        if (!AcademicYear || AcademicYear.length === 0) {
            throw new Error("Academic year not found.");
        }

        return AcademicYear[0]; // Return the first result since this is a get-by-ID operation
    } catch (error) {
        console.error('Error getting Academic year:', error);
        throw new Error('There was a problem getting the Academic year.');
    }
};

module.exports.updateAcademicYear = async (id, body, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }
        const AcademicYearModel = connection.model('AcademicYears', AcademicYears.schema);
        console.log(body.is_current_year, typeof (body.is_current_year))
        console.log(body.is_next_year, typeof (body.is_next_year))
        // Check for overlapping current or next academic year
        if (body.is_current_year == true) {
            const conflictingYear = await AcademicYearModel.findOne({
                is_current_year: body.is_current_year,
                _id: { $ne: id }
            });
            if (conflictingYear) {
                let errorType = 'CURRENT_ACADEMIC_YEAR_SET'
                throw new Error(errorType);
            }
        }

        // Check for overlapping current or next academic year
        if (body.is_next_year == true) {
            const conflictingYear = await AcademicYearModel.findOne({
                is_next_year: body.is_next_year,
                _id: { $ne: id }
            });
            if (conflictingYear) {
                errorType = 'NEXT_ACADEMIC_YEAR_SET'
                throw new Error(errorType);
            }
        }

        // Check if the academic year with the same start and end years exists
        const duplicateYear = await AcademicYearModel.findOne({
            start_year: body.start_year,
            end_year: body.end_year,
            _id: { $ne: id }
        });
        if (duplicateYear) {
            throw new Error('ACADEMIC_YEAR_ALREADY_EXISTS');
        }

        // Validation for start and end year
        if (!body.start_year || !body.end_year || body.end_year <= body.start_year) {
            throw new Error('INVALID_ACADEMIC_YEAR_RANGE');
        }

        // Update the academic year
        const academicYear = await AcademicYearModel.findByIdAndUpdate(id, body, { new: true });

        if (!academicYear) {
            throw new Error("Academic Year not found.");
        }
        return academicYear;

    } catch (error) {
        console.error('Error updating Academic Year:', error.message);
        throw error;
    }
};

module.exports.deleteAcademicYears = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        // Register models with the connection
        const AcademicYearModel = connection.model('AcademicYears', AcademicYears.schema);
        const models = {
            Aadat: connection.model('Aadat', Aadat.schema),
            AadatData: connection.model('AadatData', AadatData.schema),
            Miqaat: connection.model('Miqaat', Miqaat.schema),
            User: connection.model('User', User.schema),
            GradeWiseSubjects: connection.model('GradeWiseSubjects', GradeWiseSubjects.schema),
            WorkingDays: connection.model('WorkingDays', WorkingDays.schema),
            dayAttendance: connection.model('dayAttendance', dayAttendance.schema),
            DayAttendanceTag: connection.model('DayAttendanceTag', dayAttendanceTag.schema),
            ClassAttendanceTag: connection.model('ClassAttendanceTag', classAttendanceTag.schema),
            attendanceCertificate: connection.model('attendanceCertificate', attendanceCertificate.schema),
            leave: connection.model('leave', leave.schema),
            BehaviorPointCondition: connection.model('BehaviorPointCondition', BehaviorPointCondition.schema),
            BehaviorPointCategory: connection.model('BehaviorPointCategory', BehaviorPointCategory.schema),
            BehaviorPointCoupon: connection.model('BehaviorPointCoupon', BehaviorPointCoupon.schema),
            BehaviorPointCouponApproval: connection.model('BehaviorPointCouponApproval', BehaviorPointCouponApproval.schema),
            BehaviorPointAssignPoint: connection.model('BehaviorPointAssignPoint', BehaviorPointAssignPoint.schema),
            BehaviorPointPoint: connection.model('BehaviorPointPoint', BehaviorPointPoint.schema),
            Category: connection.model('Category', Category.schema),
            Grade: connection.model('Grade', Grade.schema),
            TermDates: connection.model('TermDates', TermDates.schema),
            TimeTable: connection.model('TimeTable', TimeTable.schema),
            // ProxyTimeTable: connection.model('ProxyTimeTable', ProxyTimeTable.schema)
        };

        let deletableIds = [];
        let inUseIds = [];

        for (let id of ids) {
            let isUsed = false;

            for (let modelName in models) {
                const exists = await models[modelName].exists({ academicYearId: id });

                if (exists) {
                    inUseIds.push(id);
                    isUsed = true;
                    break; // Stop checking once found
                }
            }

            if (!isUsed) {
                deletableIds.push(id);
            }
        }

        // Delete only the IDs that are not being used
        if (deletableIds.length > 0) {
            await AcademicYearModel.deleteMany({ _id: { $in: deletableIds } });
        }

        return {
            deletedCount: deletableIds.length,
            skippedIds: inUseIds,
            message: inUseIds.length > 0
                ? `Academic Year(s) are being used and cannot be deleted.`
                : "All requested academic years have been deleted successfully."
        };
    } catch (error) {
        console.error('Error deleting Academic year:', error);
        throw new Error(error.message || 'There was a problem deleting the Academic year.');
    }
};

// -------------------------------- Report Card -----------------------------------

module.exports.createReportCard = async (body, connection) => {
    try {
        const ReportCardModel = connection.model('ReportCard', ReportCard.schema);
        const reportCardData = await ReportCardModel.create(body);
        return reportCardData;
    } catch (error) {
        console.error('Error creating Report Card:', error);
        throw new Error('There was a problem creating the Report Card.');
    }
};

module.exports.getAllReportCards = async (query, connection) => {
    try {
        const { grade, section, studentId, search } = query;
        const ReportCardModel = connection.model('ReportCard', ReportCard.schema);
        const pipeline = [];
        const matchStage = {};
        if (grade) {
            matchStage['userDetails.stageGradeSection.grade._id'] = new ObjectId(grade);
        }
        if (section) {
            matchStage['userDetails.stageGradeSection.section._id'] = new ObjectId(section);
        }
        if (studentId) {
            matchStage['userDetails._id'] = new ObjectId(studentId);
        }

        if (search) {
            if (search.includes(' ')) {
                const [firstNameTerm, ...lastNameTerms] = search.split(' ');
                const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, 'i');
                const lastNameRegex = new RegExp(`.*${lastNameTerms.join(' ')}.*`, 'i');
                matchStage.$or = [
                    { 'userDetails.firstName': firstNameRegex, 'userDetails.lastName': lastNameRegex },
                    { 'userDetails.lastName': lastNameRegex }
                ];
            } else {
                const searchRegex = new RegExp(`.*${search}.*`, 'i');
                matchStage.$or = [
                    { 'userDetails.firstName': searchRegex },
                    { 'userDetails.lastName': searchRegex }
                ];
            }
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "student_id",
                    foreignField: "_id",
                    pipeline: [
                        { $project: { _id: 1, firstName: 1, middleName: 1, lastName: 1, role: 1, photo: 1, itsNo: 1, stageGradeSection: 1 } }
                    ],
                    as: "userDetails",
                },
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

            // Lookup user stage, grade, and section
            {
                $lookup: {
                    from: "stagegradesectiontimes",
                    localField: "userDetails.stageGradeSection",
                    foreignField: "_id",
                    as: "userDetails.stageGradeSection",
                },
            },
            { $unwind: { path: "$userDetails.stageGradeSection", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "grades",
                    localField: "userDetails.stageGradeSection.grade",
                    foreignField: "_id",
                    as: "userDetails.stageGradeSection.grade",
                },
            },
            { $unwind: { path: "$userDetails.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "sections",
                    localField: "userDetails.stageGradeSection.section",
                    foreignField: "_id",
                    as: "userDetails.stageGradeSection.section",
                },
            },
            { $unwind: { path: "$userDetails.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            {
                $project: {
                    _id: 1,
                    studentId: "$userDetails._id",
                    itsNo: "$userDetails.itsNo",
                    photo: "$userDetails.photo",
                    role: "$userDetails.role",
                    firstName: "$userDetails.firstName",
                    lastName: "$userDetails.lastName",
                    grade: "$userDetails.stageGradeSection.grade.grade",
                    section: "$userDetails.stageGradeSection.section.section",
                    createdAt: 1,
                    updatedAt: 1,
                    marks: 1,
                },
            }

        );

        const reportCards = await ReportCardModel.aggregate(pipeline);

        return reportCards;
    } catch (error) {
        console.error('Error getting all Report Cards:', error);
        throw new Error('There was a problem getting all the Report Cards.');
    }

}

module.exports.getReportCard = async (id, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }

        const ReportCardModel = connection.model('ReportCard', ReportCard.schema);
        const pipeline = [
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "student_id",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                itsNo: 1,
                                photo: 1,
                                role: 1,
                                firstName: 1,
                                lastName: 1,
                                stageGradeSection: 1,
                            },
                        },
                    ],
                    as: "userDetails",
                },
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "stagegradesectiontimes",
                    localField: "userDetails.stageGradeSection",
                    foreignField: "_id",
                    as: "userDetails.stageGradeSection",
                },
            },
            { $unwind: { path: "$userDetails.stageGradeSection", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "grades",
                    localField: "userDetails.stageGradeSection.grade",
                    foreignField: "_id",
                    as: "userDetails.stageGradeSection.grade",
                },
            },
            { $unwind: { path: "$userDetails.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "sections",
                    localField: "userDetails.stageGradeSection.section",
                    foreignField: "_id",
                    as: "userDetails.stageGradeSection.section",
                },
            },
            { $unwind: { path: "$userDetails.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    studentId: "$userDetails._id",
                    itsNo: "$userDetails.itsNo",
                    photo: "$userDetails.photo",
                    role: "$userDetails.role",
                    firstName: "$userDetails.firstName",
                    lastName: "$userDetails.lastName",
                    grade: "$userDetails.stageGradeSection.grade.grade",
                    section: "$userDetails.stageGradeSection.section.section",
                    createdAt: 1,
                    updatedAt: 1,
                    marks: 1,
                },
            },
        ];

        const reportCard = await ReportCardModel.aggregate(pipeline);
        if (!reportCard || reportCard.length === 0) {
            throw new Error("Report Card not found.");
        }

        return reportCard[0]; // Return the first result since this is a get-by-ID operation
    } catch (error) {
        console.error('Error getting Report Card:', error);
        throw new Error('There was a problem getting the Report Card.');
    }
};

module.exports.updateReportCard = async (id, body, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }
        const ReportCardModel = connection.model('ReportCard', ReportCard.schema);
        const reportCard = await ReportCardModel.findByIdAndUpdate(id, body);

        if (!reportCard) {
            throw new Error("Report Card not found.");
        }
        return reportCard;
    } catch (error) {
        console.error('Error updating Report Card:', error);
        throw new Error('There was a problem updating the Report Card.');
    }
}

module.exports.deleteReportCards = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        const ReportCardModel = connection.model('ReportCard', ReportCard.schema);
        const result = await ReportCardModel.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            throw new Error("Report Cards not found.");
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting Report Cards:', error);
        throw new Error('There was a problem deleting the Report Cards.');
    }
}

// ------------------------------------ School Type ---------------------------------

module.exports.createSchoolType = async (body, connection) => {
    try {
        const SchoolTypeModel = connection.model("SchoolType", SchoolType.schema);

        // Check if a type with the same name already exists
        const existingType = await SchoolTypeModel.findOne({ type: body.type.trim() });
        if (existingType) {
            throw new Error("Type already exists.");
        }

        const schoolType = new SchoolTypeModel(body);
        await schoolType.save();
        return schoolType;
    } catch (error) {
        console.error("Error creating School Type:", error);

        // Handle duplicate error specifically
        if (error.message === "Type already exists.") {
            throw new Error(error.message); // Send duplicate error as-is
        }

        throw new Error("There was a problem creating the School Type.");
    }
};

module.exports.getAllSchoolTypes = async (id, connection) => {
    try {
        const SchoolTypeModel = connection.model('SchoolType', SchoolType.schema);
        const schoolTypes = await SchoolTypeModel.find({});
        return schoolTypes;
    } catch (error) {
        console.error('Error getting all School Types:', error);
        throw new Error('There was a problem getting all the School Types.');
    }
}

module.exports.getSchoolType = async (id, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }
        const SchoolTypeModel = connection.model('SchoolType', SchoolType.schema);
        const schoolType = await SchoolTypeModel.findById(id);

        if (!schoolType) {
            throw new Error("School Type not found.");
        }
        return schoolType;
    } catch (error) {
        console.error('Error getting School Type:', error);
        throw new Error('There was a problem getting the School Type.');
    }
}

module.exports.updateSchoolType = async (id, body, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }

        const SchoolTypeModel = connection.model("SchoolType", SchoolType.schema);

        // Check if the updated type already exists (excluding the current school type being updated)
        if (body.type) {
            const existingType = await SchoolTypeModel.findOne({ type: body.type.trim(), _id: { $ne: id } });
            if (existingType) {
                throw new Error("Type already exists.");
            }
        }

        // Proceed with the update if no duplicates are found
        const schoolType = await SchoolTypeModel.findByIdAndUpdate(id, body, {
            new: true, // Returns the updated document
            runValidators: true, // Ensure validation runs
        });

        if (!schoolType) {
            throw new Error("School Type not found.");
        }
        return schoolType;
    } catch (error) {
        console.error("Error updating School Type:", error);
        throw new Error("There was a problem updating the School Type.");
    }
};

module.exports.deleteSchoolTypes = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        const SchoolTypeModel = connection.model('SchoolType', SchoolType.schema);
        const result = await SchoolTypeModel.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            throw new Error("School Types not found.");
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting School Types:', error);
        throw new Error('There was a problem deleting the School Types.');
    }
}

// --------------------------------------- Grade Wise Subjects --------------------------------

module.exports.getAllSubjects = async (query, connection) => {
    try {
        const { search, id } = query;
        const filter = {};
        if (search) filter.subject = new RegExp(search, 'i');
        if (id) filter._id = id;
        const SubjectModel = connection.model('Subject', Subject.schema);
        const subjects = await SubjectModel.find(filter);
        return subjects;
    } catch (error) {
        console.error('Error getting subjects:', error);
        throw new Error('There was a problem getting the subjects.');
    }
}

module.exports.createGradeWiseSubjects = async (body, connection) => {
    try {
        const GradeWiseSubjectModel = connection.model('GradeWiseSubjects', GradeWiseSubjects.schema);
        const SubjectModel = connection.model('Subject', Subject.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        const savedGradeWiseSubject = []
        for (let subjectData of body.data) {        // To store the final subjects (existing or newly created)
            const subjectIds = [];

            for (let subject of subjectData.subjects) {
                if (subject.id) {
                    const existingSubject = await SubjectModel.findById(subject.id);
                    if (existingSubject) {
                        subjectIds.push(existingSubject._id);
                    } else {
                        throw new Error(`Subject with id ${subject.id} not found.`);
                    }
                } else if (subject.name) {
                    const existingSubject = await SubjectModel.findOne({ subject: subject.name })
                    console.log(existingSubject, "existingSubject")
                    if (!existingSubject) {
                        const newSubject = new SubjectModel({ subject: subject.name });
                        const savedSubject = await newSubject.save();
                        subjectIds.push(savedSubject._id);
                    } else {
                        subjectIds.push(existingSubject._id);
                    }
                } else {
                    throw new Error('Either subject id or name must be provided.');
                }
            }

            let existingData = await GradeWiseSubjectModel.findOne({
                stage: subjectData.stage,
                grade: subjectData.grade,
                academicYearId: body.academicYearId,
                subjects: { $in: subjectIds } // Ensure existing subjects contain requested ones
            });
            if (existingData) {
                // Convert ObjectIds to strings for comparison
                let existingSubjectsStr = existingData.subjects.map(sub => sub.toString());
                let newSubjectsStr = subjectIds.map(sub => sub.toString());

                // Merge and remove duplicates
                let updatedSubjects = [...new Set([...existingSubjectsStr, ...newSubjectsStr])];

                // Convert back to ObjectId format
                existingData.subjects = updatedSubjects.map(sub => new mongoose.Types.ObjectId(sub));

                // Update the existing document
                existingData.subjects = updatedSubjects;
                await existingData.save();

                // Push updated data into savedGradeWiseSubject array
                savedGradeWiseSubject.push(existingData);
            } else {
                // Create a new document if no match is found
                const gradeWiseSubject = new GradeWiseSubjectModel({
                    stage: subjectData.stage,
                    grade: subjectData.grade,
                    subjects: subjectIds,
                    academicYearId: body.academicYearId
                });
                const data = await gradeWiseSubject.save();

                // Push new data into savedGradeWiseSubject array
                savedGradeWiseSubject.push(data);
            }
        }
        return savedGradeWiseSubject;
    } catch (error) {
        console.error('Error creating Grade Wise Subject:', error);
        throw new Error('There was a problem creating the Grade Wise Subject.');
    }
};

module.exports.getAllGradeWiseSubjects = async (query, connection) => {
    try {
        const { search, stage, grade, academicYearId } = query;
        const GradeWiseSubjectModel = connection.model('GradeWiseSubjects', GradeWiseSubjects.schema);
        connection.model("Stage", Stage.schema)
        connection.model("Grade", Grade.schema)
        connection.model('AcademicYears', AcademicYears.schema);
        const SubjectModel = connection.model("Subject", Subject.schema)
        const filter = {};
        if (search) {
            // Search in the Subject collection using regex
            const subjectIds = await SubjectModel.find(
                { subject: { $regex: search, $options: 'i' } },
                { _id: 1 }
            );
            if (subjectIds.length > 0) {
                filter.subjects = { $in: subjectIds.map(subject => subject._id) };
            } else {
                // If no subjects match, ensure the filter results in no matches
                filter.subjects = { $in: [] };
            }
        }

        if (grade) {
            filter.grade = grade;
        }
        if (stage) {
            filter.stage = stage;
        }
        if (academicYearId) {
            filter.academicYearId = academicYearId;
        }
        const gradeWiseSubjects = await GradeWiseSubjectModel.find(filter)
            .populate('stage', 'stage')
            .populate('grade', 'grade')
            .populate('subjects', 'subject')
            .populate('academicYearId');

        return gradeWiseSubjects;
    } catch (error) {
        console.error('Error getting all Grade Wise Subjects:', error);
        throw new Error('There was a problem getting all the Grade Wise Subjects.');
    }
}

module.exports.getGradeWiseSubjects = async (id, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }
        const GradeWiseSubjectModel = connection.model('GradeWiseSubjects', GradeWiseSubjects.schema);
        connection.model("Stage", Stage.schema)
        connection.model("Grade", Grade.schema)
        connection.model("Subject", Subject.schema)
        connection.model('AcademicYears', AcademicYears.schema);
        const gradeWiseSubject = await GradeWiseSubjectModel.findById(id)
            .populate('stage', 'stage')
            .populate('grade', 'grade')
            .populate('subjects', 'subject')
            .populate('academicYearId');

        if (!gradeWiseSubject) {
            throw new Error("Grade Wise Subject not found.");
        }
        return gradeWiseSubject;
    } catch (error) {
        console.error('Error getting Grade Wise Subject:', error);
        throw new Error('There was a problem getting the Grade Wise Subject.');
    }
}

module.exports.updateGradeWiseSubjects = async (id, body, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }

        const GradeWiseSubjectModel = connection.model('GradeWiseSubjects', GradeWiseSubjects.schema);
        const SubjectModel = connection.model('Subject', Subject.schema);
        connection.model("Stage", Stage.schema);
        connection.model("Grade", Grade.schema);
        connection.model("Subject", Subject.schema);

        // Find the GradeWiseSubject document to update
        const gradeWiseSubject = await GradeWiseSubjectModel.findById(id);
        if (!gradeWiseSubject) {
            throw new Error("Grade Wise Subject not found.");
        }

        const subjectIds = new Set();
        for (let subject of body.subjects) {
            if (subject.id) {
                const existingSubject = await SubjectModel.findById(subject.id);
                if (existingSubject) {
                    subjectIds.add(existingSubject._id.toString()); // Add existing subject
                } else {
                    throw new Error(`Subject with id ${subject.id} not found.`);
                }
            } else if (subject.name) {
                let existingSubject = await SubjectModel.findOne({ subject: subject.name });
                if (!existingSubject) {
                    const newSubject = new SubjectModel({ subject: subject.name });
                    existingSubject = await newSubject.save();
                }
                subjectIds.add(existingSubject._id.toString());
            } else {
                throw new Error('Either subject id or name must be provided.');
            }
        }

        // Convert Set back to array of ObjectIds
        const updatedSubjects = [...subjectIds].map(sub => new ObjectId(sub));

        // Check if another document already contains the same subjects
        const existingData = await GradeWiseSubjectModel.findOne({
            stage: body.stage,
            grade: body.grade,
            academicYearId: body.academicYearId,
            subjects: { $all: updatedSubjects },
            _id: { $ne: id } // Exclude the current document
        });

        if (existingData) {
            throw new Error("Grade Wise Subject with these subjects already exists.");
        }

        // Update and save the document
        gradeWiseSubject.subjects = updatedSubjects;
        const updatedGradeWiseSubject = await gradeWiseSubject.save();

        // Populate fields and return the updated document
        const populatedGradeWiseSubject = await GradeWiseSubjectModel.findById(updatedGradeWiseSubject._id)
            .populate('stage', 'stage')
            .populate('grade', 'grade')
            .populate('subjects', 'subject');

        return populatedGradeWiseSubject;
    } catch (error) {
        console.error('Error updating Grade Wise Subject:', error);
        // throw new Error('There was a problem updating the Grade Wise Subject.');
        throw new Error(error.message);
    }
};

module.exports.deleteGradeWiseSubjects = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        const GradeWiseSubjectModel = connection.model('GradeWiseSubjects', GradeWiseSubjects.schema);
        const result = await GradeWiseSubjectModel.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            throw new Error("Grade Wise Subjects not found.");
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting Grade Wise Subjects:', error);
        throw new Error('There was a problem deleting the Grade Wise Subjects.');
    }
}

// --------------------------------------- Events --------------------------------------


module.exports.createEvent = async (body, connection) => {
    try {
        const EventModel = connection.model('Event', Event.schema);
        const StageGradeSectionTimeModel = connection.model('StageGradeSectionTime', StageGradeSectionTime.schema);

        const { dates, classes, name, schoolType, startTime, endTime } = body;

        const createdEvents = []; // Array to store all created events

        for (const date of dates) {
            for (const classItem of classes) {
                // Find stageGradeSectionId based on stage, grade, and section
                const stageGradeSectionId = await StageGradeSectionTimeModel.findOne(
                    { stage: classItem.stage, grade: classItem.grade, section: classItem.section },
                    { _id: 1 }
                );

                if (stageGradeSectionId.length === 0) {
                    throw new Error(
                        `No StageGradeSectionTime found for stage: ${classItem.stage}, grade: ${classItem.grade}, section: ${classItem.section}`
                    );
                }

                // Create a new event
                const event = new EventModel({
                    name: name,
                    school_type: schoolType,
                    date: date,
                    stage_grade_section_time: stageGradeSectionId,
                    start_time: startTime,
                    end_time: endTime,
                });

                // Save the event and add it to the array
                const savedEvent = await event.save();
                createdEvents.push(savedEvent);
            }
        }

        return createdEvents; // Return all created events
    } catch (error) {
        console.error('Error creating Event:', error.message);
        throw new Error('There was a problem creating the Event.');
    }
};

module.exports.getAllEvents = async (query, connection) => {
    try {
        const { search, stage, grade, section } = query;
        const EventModel = connection.model('Event', Event.schema);

        // Build match stage for the pipeline
        const matchStage = {};

        // Add search filter if provided
        if (search) {
            matchStage.name = { $regex: search, $options: 'i' };
        }

        if (stage) {
            matchStage['class.stage._id'] = new ObjectId(stage); // Match stage by ID
        }
        if (grade) {
            matchStage['class.grade._id'] = new ObjectId(grade); // Match grade by ID
        }
        if (section) {
            matchStage['class.section._id'] = new ObjectId(section); // Match section by ID
        }

        // Build the aggregation pipeline
        const pipeline = [
            // Lookup to fetch details from the SchoolType collection
            {
                $lookup: {
                    from: 'schooltypes', // Replace with your actual SchoolType collection name
                    localField: 'school_type',
                    foreignField: '_id',
                    as: 'SchoolTypeDetails'
                }
            },
            { $unwind: { path: '$SchoolTypeDetails', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch details from the StageGradeSectionTime collection
            {
                $lookup: {
                    from: 'stagegradesectiontimes', // Replace with your actual collection name
                    localField: 'stage_grade_section_time',
                    foreignField: '_id',
                    as: 'class'
                }
            },
            { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch stage details
            {
                $lookup: {
                    from: 'stages', // Replace with your actual stages collection name
                    localField: 'class.stage',
                    foreignField: '_id',
                    as: 'class.stage'
                }
            },
            { $unwind: { path: '$class.stage', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch grade details
            {
                $lookup: {
                    from: 'grades', // Replace with your actual grades collection name
                    localField: 'class.grade',
                    foreignField: '_id',
                    as: 'class.grade'
                }
            },
            { $unwind: { path: '$class.grade', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch section details
            {
                $lookup: {
                    from: 'sections', // Replace with your actual sections collection name
                    localField: 'class.section',
                    foreignField: '_id',
                    as: 'class.section'
                }
            },
            { $unwind: { path: '$class.section', preserveNullAndEmptyArrays: true } },

            // Apply filters from the match stage
            { $match: matchStage },

            // Project only the required fields
            {
                $project: {
                    name: 1,
                    date: 1,
                    start_time: 1,
                    end_time: 1,
                    school_type: 1,
                    'SchoolTypeDetails.type': 1,
                    'class.stage.stage': 1,
                    'class.grade.grade': 1,
                    'class.section.section': 1,
                    active: 1
                }
            },
        ];

        // Execute the aggregation pipeline
        const events = await EventModel.aggregate(pipeline);

        return events;
    } catch (error) {
        console.error('Error getting all Events:', error);
        throw new Error('There was a problem getting all the Events.');
    }
};

module.exports.getEvent = async (id, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }
        const EventModel = connection.model('Event', Event.schema);


        // Build the aggregation pipeline
        const pipeline = [

            // Lookup to fetch details from the SchoolType collection
            {
                $lookup: {
                    from: 'schooltypes', // Replace with your actual SchoolType collection name
                    localField: 'school_type',
                    foreignField: '_id',
                    as: 'SchoolTypeDetails'
                }
            },
            { $unwind: { path: '$SchoolTypeDetails', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch details from the StageGradeSectionTime collection
            {
                $lookup: {
                    from: 'stagegradesectiontimes', // Replace with your actual collection name
                    localField: 'stage_grade_section_time',
                    foreignField: '_id',
                    as: 'class'
                }
            },
            { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch stage details
            {
                $lookup: {
                    from: 'stages', // Replace with your actual collection name
                    localField: 'class.stage',
                    foreignField: '_id',
                    as: 'class.stage'
                }
            },
            { $unwind: { path: '$class.stage', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch grade details
            {
                $lookup: {
                    from: 'grades', // Replace with your actual collection name
                    localField: 'class.grade',
                    foreignField: '_id',
                    as: 'class.grade'
                }
            },
            { $unwind: { path: '$class.grade', preserveNullAndEmptyArrays: true } },

            // Lookup to fetch section details
            {
                $lookup: {
                    from: 'sections', // Replace with your actual collection name
                    localField: 'class.section',
                    foreignField: '_id',
                    as: 'class.section'
                }
            },
            { $unwind: { path: '$class.section', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: 1,
                    date: 1,
                    start_time: 1,
                    end_time: 1,
                    school_type: 1,
                    'SchoolTypeDetails.type': 1,
                    'class.stage.stage': 1,
                    'class.grade.grade': 1,
                    'class.section.section': 1,
                    active: 1
                }
            },
        ];

        // Execute the aggregation pipeline
        const event = await EventModel.aggregate(pipeline);

        // If event is not found, return an error
        if (!event || event.length === 0) {
            throw new Error("Event not found.");
        }

        // Return the event data
        return event[0]; // Since the aggregate pipeline returns an array
    } catch (error) {
        console.error('Error getting Event:', error);
        throw new Error('There was a problem getting the Event.');
    }
};

module.exports.updateEvent = async (id, body, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }

        const EventModel = connection.model('Event', Event.schema);
        const StageGradeSectionTimeModel = connection.model('StageGradeSectionTime', StageGradeSectionTime.schema);

        // Find the Event document to update
        const event = await EventModel.findById(id);

        if (!event) {
            throw new Error("Event not found.");
        }

        const { stage, grade, section, date, startTime, endTime, name } = body;

        // Check if the stage, grade, and section are provided and valid
        if (stage && grade && section) {
            // Find the StageGradeSectionTime document that matches the provided stage, grade, and section
            const stageGradeSection = await StageGradeSectionTimeModel.findOne(
                { stage: stage, grade: grade, section: section },
                { _id: 1 }
            );

            if (stageGradeSection) {
                // If found, update the event with the found stageGradeSectionId
                event.stage_grade_section_time = stageGradeSection._id;
            } else {
                throw new Error("Stage, grade, and section combination not found.");
            }
        }

        // Update event fields only if new data is provided
        if (date) event.date = date;
        if (startTime) event.start_time = startTime;
        if (endTime) event.end_time = endTime;
        if (name) event.name = name;

        // Save the updated event
        const updatedEvent = await event.save();

        return updatedEvent;
    } catch (error) {
        console.error('Error updating Event:', error);
        throw new Error('There was a problem updating the Event.');
    }
};

module.exports.deleteEvents = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        const EventModel = connection.model('Event', Event.schema);
        const result = await EventModel.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            throw new Error("Events not found.");
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting Events:', error);
        throw new Error('There was a problem deleting the Events.');
    }
}

module.exports.updateEventStatus = async (body, connection) => {
    const { ids, active } = body;
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }
        const EventModel = connection.model('Event', Event.schema);
        const result = await EventModel.updateMany({ _id: { $in: ids } }, { $set: { active } });
        return {
            message: `Successfully updated ${result.modifiedCount} records.`,
            updatedCount: result.modifiedCount,
        };
    } catch (error) {
        console.error('Error updating Event Status:', error);
        throw new Error('There was a problem updating the Event Status.');
    }
}

// -------------------------------- Working Days -----------------------------------

module.exports.createWorkingDays = async (body, connection) => {
    try {
        const WorkingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
        let exists = await WorkingDaysModel.exists({
            start_date: new Date(body.start_date),
            end_date: new Date(body.end_date),
            school_type_id: new ObjectId(body.school_type_id),
            stageId: new ObjectId(body.stageId)
        })
        if (exists) {
            return 'ALREADY_EXISTS'
        }
        const WorkingDaysData = await WorkingDaysModel.create(body);
        return WorkingDaysData;
    } catch (error) {
        console.error('Error creating Working day:', error);
        throw new Error('There was a problem creating the Working day.');
    }
};

module.exports.getAllWorkingDays = async (query, connection) => {
    try {
        const { startDate, endDate, academicYearId, search, stageId } = query;
        const WorkingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('AcademicYears', AcademicYears.schema);
        connection.model('Stage', Stage.schema);

        const matchStage = {};

        // Match academicYearId if provided
        if (academicYearId) {
            matchStage.academicYearId = new ObjectId(academicYearId);
        }
        if (startDate) {
            const startDateUTC = new Date(`${startDate}T00:00:00Z`);
            matchStage.start_date = { $lte: startDateUTC };
        }

        if (endDate) {
            const endDateUTC = new Date(`${endDate}T23:59:59.999Z`);
            matchStage.end_date = { $gte: endDateUTC };
        }
        if(stageId){
            matchStage.stageId = new ObjectId(stageId);
        }
        // Query the WorkingDaysModel first
        let workingDays = await WorkingDaysModel.find(matchStage)
            .populate('school_type_id') // Populate school type
            .populate('academicYearId') // Populate academicYearId field
            .populate('stageId');

        // **Filter after population** to match school type name
        if (search && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), 'i');
            workingDays = workingDays.filter((wd) => wd.school_type_id && searchRegex.test(wd.school_type_id.type));
        }

        return workingDays;
    } catch (error) {
        console.error('Error getting all Working days:', error);
        throw new Error('There was a problem getting all the Working days.');
    }
};

module.exports.getWorkingDay = async (id, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }
        connection.model("SchoolType", SchoolType.schema)
        const WorkingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
        connection.model('AcademicYears', AcademicYears.schema);
        connection.model('Stage', Stage.schema);
        const workingDay = await WorkingDaysModel.findById(new ObjectId(id)).populate('school_type_id').populate('academicYearId').populate('stageId');
        if (!workingDay || workingDay.length === 0) {
            throw new Error("Working day not found.");
        }
        return workingDay; // Return the first result since this is a get-by-ID operation
    } catch (error) {
        console.error('Error getting Working day:', error);
        throw new Error('There was a problem getting the Working day.');
    }
};

module.exports.updateWorkingDay = async (id, body, connection) => {
    try {
        if (!id) {
            throw new Error("ID parameter is required.");
        }

        const WorkingDaysModel = connection.model('WorkingDays', WorkingDays.schema);

        // Check if a working day with the same details already exists (excluding the current ID)
        let existingWorkingDay = await WorkingDaysModel.exists({
            start_date: new Date(body.start_date),
            end_date: new Date(body.end_date),
            school_type_id: new ObjectId(body.school_type_id),
            stageId: new ObjectId(body.stageId),
            _id: { $ne: id } // Exclude the current document from the check
        });

        if (existingWorkingDay) {
            return 'ALREADY_EXISTS';
        }

        // Update the working day
        const updatedWorkingDay = await WorkingDaysModel.findByIdAndUpdate(id, body, { new: true });

        if (!updatedWorkingDay) {
            throw new Error("Working Day not found.");
        }

        return updatedWorkingDay;
    } catch (error) {
        console.error('Error updating Working Day:', error);
        throw new Error('There was a problem updating the Working Day.');
    }
};

module.exports.deleteWorkingDays = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        const WorkingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
        const result = await WorkingDaysModel.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            throw new Error("Working day not found.");
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting Working day:', error);
        throw new Error('There was a problem deleting the Working day.');
    }
}

// -------------------------------- Assign subject to teacher -----------------------------------

module.exports.assignSubjectToteacher = async (body, connection) => {
    try {
        const { teacherId, data } = body;
        // Ensure the model is registered
        const AssignedSubjectToTeacherModel = connection.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher.schema);

        // Prepare data for bulk insertion
        const rowsToInsert = data.map(item => ({
            teacherId,
            grade: item.grade,
            section: item.section,
            teacherTypeId: item.teacherTypeId,
            subjects: item.subjects,
        }));

        // Insert the rows into the collection
        const AssignedSubjectToTeacherData = await AssignedSubjectToTeacherModel.insertMany(rowsToInsert);

        return AssignedSubjectToTeacherData;
    } catch (error) {
        console.error('Error creating Assign subject:', error);
        throw new Error('There was a problem creating the Assign subject.');
    }
};

module.exports.getAllassignSubjectToteacher = async (query, connection) => {
    try {
        // Ensure the model is registered
        const AssignedSubjectToTeacherModel = connection.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher.schema);
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('TeacherType', TeacherType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);


        // Fetch data with populated fields
        const assignedSubjects = await AssignedSubjectToTeacherModel
            .find()
            .populate('grade', 'grade') // Populate grade field with the grade name
            .populate('section', 'section') // Populate section field with the section name
            .populate('teacherTypeId', 'type') // Populate teacherTypeId with type
            .populate('subjects', 'subject') // Populate subjects with subject names
            .populate('teacherId', 'firstName lastName itsNo photo role ') // Populate teacher
            .lean(); // Use lean() for better performance if you don't need Mongoose documents

        return assignedSubjects;
    } catch (error) {
        console.error('Error getting all Assign subjects:', error);
        throw new Error('There was a problem getting all the Assign subjects.');
    }
};

module.exports.getAssignSubjectToteacher = async (id, connection) => {
    try {
        // Ensure the model is registered
        const AssignedSubjectToTeacherModel = connection.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher.schema);
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('TeacherType', TeacherType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);

        // Fetch the assigned subject by ID with populated fields
        const assignedSubject = await AssignedSubjectToTeacherModel
            .findById(id)
            .populate('grade', 'grade') // Populate grade field with the grade name
            .populate('section', 'section') // Populate section field with the section name
            .populate('teacherTypeId', 'type') // Populate teacherTypeId with type
            .populate('subjects', 'subject') // Populate subjects with subject names
            .populate('teacherId', 'firstName lastName itsNo photo role ') // Populate teacher
            .lean(); // Use lean() for better performance if you don't need Mongoose documents

        // Check if the record exists
        if (!assignedSubject) {
            throw new Error('Assigned subject not found');
        }

        return assignedSubject;
    } catch (error) {
        console.error('Error getting assigned subject by ID:', error);
        throw new Error('There was a problem retrieving the assigned subject.');
    }
};

module.exports.updateAssignSubjectToteacher = async (id, body, connection) => {
    try {
        // Ensure the model is registered
        const AssignedSubjectToTeacherModel = connection.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher.schema);

        // Find the record by ID and update it with the provided data
        const updatedAssignedSubject = await AssignedSubjectToTeacherModel.findByIdAndUpdate(
            id,            // The ID of the record to update
            body,          // The new data to update
            {
                new: true, // Return the updated document
                runValidators: true // Ensure validation rules are applied
            }
        );

        // Check if the record was found and updated
        if (!updatedAssignedSubject) {
            throw new Error('Assigned subject not found or update failed');
        }

        return updatedAssignedSubject;
    } catch (error) {
        console.error('Error updating assigned subject:', error);
        throw new Error('There was a problem updating the assigned subject.');
    }
};

module.exports.deleteAssignSubjectToteachers = async (ids, connection) => {
    try {
        // Ensure the model is registered
        const AssignedSubjectToTeacherModel = connection.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher.schema);

        // Validate input
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Invalid input: IDs must be a non-empty array');
        }

        // Delete the records
        const result = await AssignedSubjectToTeacherModel.deleteMany({ _id: { $in: ids } });

        // Check if any documents were deleted
        if (result.deletedCount === 0) {
            throw new Error('No assigned subjects found to delete');
        }

        return {
            message: 'Successfully deleted assigned subjects',
            deletedCount: result.deletedCount,
        };
    } catch (error) {
        console.error('Error deleting assigned subjects:', error);
        throw new Error('There was a problem deleting the assigned subjects.');
    }
};

const { TimeTable, ProxyTeacher } = require("../../models/timeTable.model");
const School = require("../../commonDbModels/school.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const Stage = require("../../models/stage.model");
const TeacherType = require("../../models/teacherType.model");
const User = require("../../models/user.model");
const { default: mongoose, connection } = require("mongoose");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const { generatePassword } = require("../../utils/midnightConverter")
const transporter = require("../../utils/sendMail");
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require('bcrypt')
const { ReportCard, SchoolType, GradeWiseSubjects, Subject, Event, WorkingDays, AcademicYears, AssignedSubjectToTeacher } = require("../../models/academics.model");
// -------------------------------- Time Table -----------------------------------

module.exports.createTimeTable = async (body, connection) => {
    try {
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const timetableData = await timetableModel.create(body);
        return timetableData;
    } catch (error) {
        console.error('Error creating Time Table:', error);
        throw new Error('There was a problem creating the Time Table.');
    }
};

module.exports.editTimeTable = async (id, body, connection) => {
    try {
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const timetableData = await timetableModel.findByIdAndUpdate(id, body, { new: true });
        return timetableData;
    } catch (error) {
        console.error('Error updating Time Table:', error);
        throw new Error('There was a problem updating the Time Table.');
    }
};

module.exports.deleteTimeTable = async (ids, connection) => {
    try {
        if (!ids || ids.length === 0) {
            throw new Error("IDs parameter is required.");
        }

        const TimeTableModel = connection.model('TimeTable', TimeTable.schema);
        const result = await TimeTableModel.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            throw new Error("Time table not found.");
        }
        return result.deletedCount;
    } catch (error) {
        console.error('Error deleting Time table:', error);
        throw new Error('There was a problem deleting the Time table.');
    }
}

// module.exports.getClassWiseTimeTable = async (query, connection) => {
//     try {
//         const { gradeId, sectionId, stageId, startDate, endDate, academicYearId } = query;
//         const timetableModel = connection.model('TimeTable', TimeTable.schema);
//         const proxyTimetableModel = connection.model('ProxyTimeTable', ProxyTimeTable.schema);
//         connection.model('Section', Section.schema);
//         connection.model('Grade', Grade.schema);
//         connection.model('Stage', Stage.schema);
//         connection.model('SchoolType', SchoolType.schema);
//         connection.model('Subject', Subject.schema);
//         connection.model('User', User.schema);
//         connection.model('WorkingDays', WorkingDays.schema);
//         connection.model('AcademicYears', AcademicYears.schema)

//         let filter = {}
//         if (gradeId) {
//             filter['timeTable.gradeId'] = gradeId
//         }

//         if (sectionId) {
//             filter['timeTable.sectionId'] = sectionId
//         }

//         if (stageId) {
//             filter['stageId'] = stageId
//         }
//         if (academicYearId) {
//             filter['academicYearId'] = academicYearId
//         }

//         const timetable = await timetableModel.find(filter)
//             .populate('workingDaysId', 'start_date end_date weekdays')
//             .populate('schoolTypeId', 'type')
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('academicYearId')

//         if (startDate && endDate) {
//             filter.startDate = { $gte: startDate }
//             filter.endDate = { $lte: endDate }
//         }
//         const proxyTimetable = await proxyTimetableModel.find(filter)
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.proxyClassTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;

//         return { timetable, proxyTimetable };
//     } catch (error) {
//         console.error('Error fetching class-wise timetable:', error);
//         throw new Error('Error fetching class-wise timetable.');
//     }
// };

module.exports.getClassWiseTimeTable = async (query, connection) => {
    try {
        const { gradeId, sectionId, stageId, startDate, endDate, academicYearId } = query;
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema); // Updated proxy model
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('Stage', Stage.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);
        connection.model('WorkingDays', WorkingDays.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        let filter = {};
        if (gradeId) {
            filter['timeTable.gradeId'] = gradeId;
        }

        if (sectionId) {
            filter['timeTable.sectionId'] = sectionId;
        }

        if (stageId) {
            filter['stageId'] = stageId;
        }

        if (academicYearId) {
            filter['academicYearId'] = academicYearId;
        }

        // Fetch the regular timetable
        const timetable = await timetableModel.find(filter)
            .populate('workingDaysId', 'start_date end_date weekdays')
            .populate('schoolTypeId', 'type')
            .populate('stageId', 'stage')
            .populate('timeTable.gradeId', 'grade')
            .populate('timeTable.sectionId', 'section')
            .populate('timeTable.slots.subjectId', 'subject')
            .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role')
            .populate('academicYearId');

        const startQueryDate = startDate ? new Date(startDate) : new Date();
        const endQueryDate = endDate ? new Date(endDate) : new Date();

        // Fetch the proxy timetable based on the new schema
        const proxyTimetable = await proxyTimetableModel.find({
            startDate: { $lte: endQueryDate }, // Use endQueryDate if endDate not provided
            endDate: { $gte: startQueryDate }, // Use startQueryDate if startDate not provided
            academicYearId: academicYearId,  // Ensure we're working with the correct academic year
            stageId: stageId,  // Ensure we're working with the correct stage
        })
            .populate('proxyAssignments.gradeId', 'grade')
            .populate('proxyAssignments.sectionId', 'section')
            .populate('proxyAssignments.slots.subjectId', 'subject')
            .populate('proxyAssignments.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.proxyClassTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyMainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role');

        // Replace main teachers with proxy teachers where applicable
        timetable.forEach((entry) => {
            entry.timeTable.forEach((slot) => {
                // Find matching proxy assignments for the grade, section, and subject
                const matchingAssignments = proxyTimetable
                    .map((assignment) => assignment.proxyAssignments)
                    .flat()
                    .filter((proxyAssignment) => {
                        return (
                            proxyAssignment.gradeId.toString() === entry.gradeId.toString() &&
                            proxyAssignment.sectionId.toString() === entry.sectionId.toString() &&
                            proxyAssignment.subjectId.toString() === slot.subjectId.toString() &&
                            proxyAssignment.slots.some((proxySlot) =>
                                proxySlot.subjectId.toString() === slot.subjectId.toString()
                            )
                        );
                    });

                matchingAssignments.forEach((proxyAssignment) => {
                    // Check if there are matching slots
                    proxyAssignment.slots.forEach((proxySlot) => {
                        if (
                            proxySlot.startTime === slot.startTime &&
                            proxySlot.endTime === slot.endTime
                        ) {
                            // Replace the teacher in the slot with the proxy teacher
                            if (proxySlot.proxyTeacherId) {
                                slot.mainTeacherId = proxySlot.proxyTeacherId;
                            }

                            // Replace assistant teachers if needed
                            slot.asstTeacherId1 = proxySlot.proxyAsstTeacherId1 || slot.asstTeacherId1;
                            slot.asstTeacherId2 = proxySlot.proxyAsstTeacherId2 || slot.asstTeacherId2;
                        }
                    });

                    // Update classTeacherId if proxyClassTeacherId is available
                    if (proxyAssignment.proxyClassTeacherId) {
                        entry.classTeacherId = proxyAssignment.proxyClassTeacherId;
                    }
                });
            });
        });


        return { timetable };
    } catch (error) {
        console.error('Error fetching class-wise timetable:', error);
        throw new Error('Error fetching class-wise timetable.');
    }
};

// module.exports.getTeacherWiseTimeTable = async (query, connection) => {
//     try {
//         const { teacherId, stageId, subjectId, startDate, endDate, academicYearId } = query;
//         const timetableModel = connection.model('TimeTable', TimeTable.schema);
//         const proxyTimetableModel = connection.model('ProxyTimeTable', ProxyTimeTable.schema);
//         connection.model('Section', Section.schema);
//         connection.model('Grade', Grade.schema);
//         connection.model('Stage', Stage.schema);
//         connection.model('SchoolType', SchoolType.schema);
//         connection.model('Subject', Subject.schema);
//         connection.model('User', User.schema);
//         connection.model('WorkingDays', WorkingDays.schema);
//         connection.model('AcademicYears', AcademicYears.schema)

//         let filter = {};
//         if (teacherId) {
//             filter = {
//                 $or: [
//                     { 'timeTable.classTeacherId': teacherId },
//                     { 'timeTable.slots.asstTeacherId1': teacherId },
//                     { 'timeTable.slots.asstTeacherId2': teacherId },
//                 ],
//             }
//         }
//         if (stageId) {
//             filter['stageId'] = stageId
//         }

//         if (subjectId) {
//             filter['timeTable.slots.subjectId'] = subjectId
//         }
//         if (academicYearId) {
//             filter['academicYearId'] = academicYearId
//         }

//         const timetable = await timetableModel.find(filter)
//             .populate('workingDaysId', 'start_date end_date weekdays')
//             .populate('schoolTypeId', 'type')
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('academicYearId')

//         if (startDate && endDate) {
//             filter.startDate = { $gte: startDate }
//             filter.endDate = { $lte: endDate }
//         }
//         if (teacherId) {
//             filter = {
//                 $or: [
//                     { 'timeTable.classTeacherId': teacherId },
//                     { 'timeTable.slots.asstTeacherId1': teacherId },
//                     { 'timeTable.slots.asstTeacherId2': teacherId },
//                     { 'timeTable.proxyClassTeacherId': teacherId },
//                     { 'timeTable.slots.proxyAsstTeacherId1': teacherId },
//                     { 'timeTable.slots.proxyAsstTeacherId2': teacherId },
//                 ],
//             }
//         }
//         const proxyTimetable = await proxyTimetableModel.find(filter)
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.proxyClassTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;

//         return { timetable, proxyTimetable };
//     } catch (error) {
//         console.error('Error fetching teacher-wise timetable:', error);
//         throw new Error('Error fetching teacher-wise timetable.');
//     }
// };

module.exports.getTeacherWiseTimeTable = async (query, connection) => {
    try {
        const { teacherId, stageId, subjectId, startDate, endDate, academicYearId } = query;
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema); // Updated proxy model
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('Stage', Stage.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);
        connection.model('WorkingDays', WorkingDays.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        let filter = {};
        if (teacherId) {
            filter = {
                $or: [
                    { 'timeTable.classTeacherId': teacherId },
                    { 'timeTable.slots.asstTeacherId1': teacherId },
                    { 'timeTable.slots.asstTeacherId2': teacherId },
                ],
            };
        }
        if (stageId) {
            filter['stageId'] = stageId;
        }

        if (subjectId) {
            filter['timeTable.slots.subjectId'] = subjectId;
        }
        if (academicYearId) {
            filter['academicYearId'] = academicYearId;
        }

        // Fetch the regular timetable
        const timetable = await timetableModel.find(filter)
            .populate('workingDaysId', 'start_date end_date weekdays')
            .populate('schoolTypeId', 'type')
            .populate('stageId', 'stage')
            .populate('timeTable.gradeId', 'grade')
            .populate('timeTable.sectionId', 'section')
            .populate('timeTable.slots.subjectId', 'subject')
            .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role')
            .populate('academicYearId');

        // Ensure that startDate and endDate fall back to current date if not provided
        const startQueryDate = startDate ? new Date(startDate) : new Date();
        const endQueryDate = endDate ? new Date(endDate) : new Date();

        // Apply date filter if given (or use current date by default)
        let filter1 = {};
        filter1.startDate = { $gte: startQueryDate };
        filter1.endDate = { $lte: endQueryDate };
        if (subjectId) {
            filter1['proxyAssignments.slots.subjectId'] = subjectId;
        }
        if (academicYearId) {
            filter1['academicYearId'] = academicYearId;
        }
        if (stageId) {
            filter1['stageId'] = stageId;
        }

        // If teacherId is provided, filter by teacher roles
        if (teacherId) {
            filter1 = {
                $or: [
                    { 'proxyAssignments.classTeacherId': teacherId },
                    { 'proxyAssignments.proxyClassTeacherId': teacherId },
                    { 'proxyAssignments.slots.mainTeacherId': teacherId },
                    { 'proxyAssignments.slots.asstTeacherId1': teacherId },
                    { 'proxyAssignments.slots.asstTeacherId2': teacherId },
                    { 'proxyAssignments.proxyMainTeacherId': teacherId },
                    { 'proxyAssignments.slots.proxyAsstTeacherId1': teacherId },
                    { 'proxyAssignments.slots.proxyAsstTeacherId2': teacherId },
                ],
            };
        }

        // Fetch proxy timetable
        const proxyTimetable = await proxyTimetableModel.find(filter1)
            .populate('proxyAssignments.gradeId', 'grade')
            .populate('proxyAssignments.sectionId', 'section')
            .populate('proxyAssignments.slots.subjectId', 'subject')
            .populate('proxyAssignments.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.proxyClassTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyMainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role');

        // Replace main teachers and assistant teachers in the slots with proxy teachers where applicable
        timetable.forEach((entry) => {
            entry.timeTable.forEach((slot) => {
                // Find matching proxy assignments for the grade, section, and subject
                const matchingAssignments = proxyTimetable
                    .map((assignment) => assignment.proxyAssignments)
                    .flat()
                    .filter((proxyAssignment) => {
                        return (
                            proxyAssignment.gradeId.toString() === entry.gradeId.toString() &&
                            proxyAssignment.sectionId.toString() === entry.sectionId.toString() &&
                            proxyAssignment.subjectId.toString() === slot.subjectId.toString() &&
                            proxyAssignment.slots.some((proxySlot) =>
                                proxySlot.subjectId.toString() === slot.subjectId.toString()
                            )
                        );
                    });

                matchingAssignments.forEach((proxyAssignment) => {
                    // Check if there are matching slots
                    proxyAssignment.slots.forEach((proxySlot) => {
                        if (
                            proxySlot.startTime === slot.startTime &&
                            proxySlot.endTime === slot.endTime
                        ) {
                            // Replace the teacher in the slot with the proxy teacher
                            if (proxySlot.proxyTeacherId) {
                                slot.mainTeacherId = proxySlot.proxyTeacherId;
                            }

                            // Replace assistant teachers if needed
                            slot.asstTeacherId1 = proxySlot.proxyAsstTeacherId1 || slot.asstTeacherId1;
                            slot.asstTeacherId2 = proxySlot.proxyAsstTeacherId2 || slot.asstTeacherId2;
                        }
                    });

                    // Update classTeacherId if proxyClassTeacherId is available
                    if (proxyAssignment.proxyClassTeacherId) {
                        entry.classTeacherId = proxyAssignment.proxyClassTeacherId;
                    }
                });
            });
        });

        return { timetable };
    } catch (error) {
        console.error('Error fetching teacher-wise timetable:', error);
        throw new Error('Error fetching teacher-wise timetable.');
    }
};

// module.exports.getDayWiseTimeTable = async (query, connection) => {
//     try {
//         const { SchoolTypeId, day, startDate, endDate, academicYearId } = query;
//         const timetableModel = connection.model('TimeTable', TimeTable.schema);
//         const proxyTimetableModel = connection.model('ProxyTimeTable', ProxyTimeTable.schema);
//         connection.model('Section', Section.schema);
//         connection.model('Grade', Grade.schema);
//         connection.model('Stage', Stage.schema);
//         connection.model('SchoolType', SchoolType.schema);
//         connection.model('Subject', Subject.schema);
//         connection.model('User', User.schema);
//         connection.model('WorkingDays', WorkingDays.schema);
//         connection.model('AcademicYears', AcademicYears.schema);

//         let filter = {};
//         if (day) {
//             filter['day'] = day
//         }

//         if (SchoolTypeId) {
//             filter['SchoolTypeId'] = SchoolTypeId
//         }
//         if (academicYearId) {
//             filter['academicYearId'] = academicYearId
//         }

//         const timetable = await timetableModel.find(filter)
//             .populate('workingDaysId', 'start_date end_date weekdays')
//             .populate('schoolTypeId', 'type')
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('academicYearId')

//         filter = {}
//         if (startDate && endDate) {
//             filter.startDate = { $gte: startDate }
//             filter.endDate = { $lte: endDate }
//         }
//         const proxyTimetable = await proxyTimetableModel.find(filter)
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.proxyClassTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;

//         return { timetable, proxyTimetable };
//     } catch (error) {
//         console.error('Error fetching day-wise timetable:', error);
//         throw new Error('Error fetching day-wise timetable.');
//     }
// };

module.exports.getDayWiseTimeTable = async (query, connection) => {
    try {
        const { SchoolTypeId, day, startDate, endDate, academicYearId, workingDaysId, stageId } = query;
        console.log(query, "query")
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema); // Updated model
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('Stage', Stage.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);
        connection.model('WorkingDays', WorkingDays.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        let filter = {};
        if (day) {
            filter['day'] = day;
        }

        if (SchoolTypeId) {
            filter['schoolTypeId'] = new ObjectId(SchoolTypeId);
        }
        if (academicYearId) {
            filter['academicYearId'] = new ObjectId(academicYearId);
        }
        if (workingDaysId) {
            filter['workingDaysId'] = new ObjectId(workingDaysId);
        }
        if (stageId) {
            filter['stageId'] = new ObjectId(stageId);
        }

        console.log(filter, "filter")
        // Fetch the regular timetable
        const timetable = await timetableModel.find(filter)
            .populate('workingDaysId', 'start_date end_date weekdays')
            .populate('schoolTypeId', 'type')
            .populate('stageId', 'stage')
            .populate('timeTable.gradeId', 'grade')
            .populate('timeTable.sectionId', 'section')
            .populate('timeTable.slots.subjectId', 'subject')
            .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role')
            .populate('academicYearId');

        // Ensure that startDate and endDate fall back to current date if not provided
        const startQueryDate = startDate ? new Date(startDate) : new Date();
        const endQueryDate = endDate ? new Date(endDate) : new Date();

        // Apply date filter if given (or use current date by default)
        let filter1 = {};
        filter1.startDate = { $gte: startQueryDate };
        filter1.endDate = { $lte: endQueryDate };
        if (academicYearId) {
            filter1['academicYearId'] = academicYearId;
        }
        if (stageId) {
            filter1['stageId'] = stageId;
        }
        // Fetch proxy timetable
        const proxyTimetable = await proxyTimetableModel.find(filter1)
            .populate('proxyAssignments.gradeId', 'grade')
            .populate('proxyAssignments.sectionId', 'section')
            .populate('proxyAssignments.slots.subjectId', 'subject')
            .populate('proxyAssignments.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.proxyClassTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyMainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role');

        // Substitute proxy teachers for the slots in the regular timetable
        timetable.forEach((entry) => {
            entry.timeTable.forEach((slot) => {
                // Find matching proxy assignments for the given day, grade, section, and subject
                const matchingAssignments = proxyTimetable
                    .map((assignment) => assignment.proxyAssignments)
                    .flat()
                    .filter((proxyAssignment) => {
                        return (
                            proxyAssignment.gradeId.toString() === entry.gradeId.toString() &&
                            proxyAssignment.sectionId.toString() === entry.sectionId.toString() &&
                            proxyAssignment.slots.some(
                                (proxySlot) =>
                                    proxySlot.startTime === slot.startTime && proxySlot.endTime === slot.endTime &&
                                    proxySlot.subjectId.toString() === slot.subjectId.toString()
                            )
                        );
                    });

                matchingAssignments.forEach((proxyAssignment) => {
                    // Substitute the main teacher with the proxy teacher if applicable
                    proxyAssignment.slots.forEach((proxySlot) => {
                        if (
                            proxySlot.startTime === slot.startTime &&
                            proxySlot.endTime === slot.endTime
                        ) {
                            if (proxySlot.proxyTeacherId) {
                                slot.mainTeacherId = proxySlot.proxyTeacherId;
                            }

                            // Substitute assistant teachers with proxy assistant teachers if applicable
                            slot.asstTeacherId1 = proxySlot.proxyAsstTeacherId1 || slot.asstTeacherId1;
                            slot.asstTeacherId2 = proxySlot.proxyAsstTeacherId2 || slot.asstTeacherId2;
                        }
                    });

                    // Update classTeacherId if proxyClassTeacherId is available
                    if (proxyAssignment.proxyClassTeacherId) {
                        entry.classTeacherId = proxyAssignment.proxyClassTeacherId;
                    }
                });
            });
        });

        return { timetable };
    } catch (error) {
        console.error('Error fetching day-wise timetable:', error);
        throw new Error('Error fetching day-wise timetable.');
    }
};

module.exports.assignProxyTeacher = async (req, connection) => {
    const { startDate, endDate, email, firstName, lastName, proxyTeacherId, academicYearId, stageId, originalTeacherId } = req.body;
    try {
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema);
        const UserModel = connection.model('User', User.schema);
        const WorkingDayModel = connection.model('WorkingDays', WorkingDays.schema);
        const TimeTableModel = connection.model('TimeTable', TimeTable.schema);

        // Fetch the WorkingDays entry based on academicYearId and stageId
        const workingDays = await WorkingDayModel.findOne({
            academicYearId: new ObjectId(academicYearId),
            stageId: new ObjectId(stageId),
        });

        // Check if we found the WorkingDays entry
        if (!workingDays) {
            throw new Error('Working days not found for this academic year and stage.');
        }
        // Validate that the provided dates fall within the working day range
        const startQueryDate = new Date(startDate);
        const endQueryDate = new Date(endDate);
        console.log(startQueryDate, startQueryDate)
        if (startQueryDate.getTime() < new Date(workingDays.start_date).getTime() || endQueryDate.getTime() > new Date(workingDays.end_date).getTime()) {
            throw new Error('The provided dates are outside the working days range.');
        }

        // Fetch the relevant time table data based on workingDayId, academicYearId, and stageId
        const timeTableData = await TimeTableModel.findOne({
            academicYearId: new ObjectId(academicYearId),
            stageId: new ObjectId(stageId),
            workingDaysId: workingDays._id,
        });

        // Check if the timeTableData exists
        if (!timeTableData) {
            throw new Error('No time table found for the specified working days.');
        }
        const ptId = new ObjectId(proxyTeacherId)
        const password = await generatePassword();
        const hashedPassword = await bcrypt.hash(password, 12);
        // Update proxy teacher details
        const updateUser = await UserModel.findByIdAndUpdate(
            ptId,
            { firstName, lastName, password: hashedPassword },
            { new: true, runValidators: true }
        );
        const userr = await UserModel.findById(ptId)
        let school = await School.findById(userr.schoolId);
        const uniqueIdPadded = school.uniqueId.toString().padStart(4, '0');
        let sName = school.schoolName.trim().replace(/\s+/g, "_");
        // Send email to proxy teacher with login credentials
        if (updateUser) {
            console.log(email, "email")
            let url = `${process.env.STUDENT_TEACHER_BASE_URL}/teacher/login/${sName}/${uniqueIdPadded}`;
            await transporter.sendMail({
                from: process.env.USERMAILSENDER,
                to: email,
                subject: 'Proxy Teacher Account Details',
                text: `Dear Teacher,\n\nHere are your login credentials:\n\nURL: ${url}\nEmail: ${email}\nPassword: ${password}`,
            });
        }
        console.log(timeTableData, "timeTableData")
        // Map the timeTable to proxyAssignments format
        const proxyAssignments = timeTableData.timeTable.map((entry) => {
            if (entry.classTeacherId && entry.classTeacherId.equals(originalTeacherId)) {
                entry.proxyClassTeacherId = new ObjectId(proxyTeacherId);
            }
            return {
                gradeId: entry.gradeId,
                sectionId: entry.sectionId,
                classTeacherId: entry.classTeacherId,
                proxyClassTeacherId: entry.proxyClassTeacherId,
                slots: entry.slots.map((slot) => {
                    // Assign the proxy teacher for the original teacher (main, assistant)
                    if (slot.mainTeacherId && slot.mainTeacherId.equals(originalTeacherId)) {
                        // If the main teacher is on leave, assign proxy for the main teacher
                        slot.proxyMainTeacherId = new ObjectId(proxyTeacherId);  // Assign the proxy teacher for the main teacher
                    } else if (slot.asstTeacherId1 && slot.asstTeacherId1.equals(originalTeacherId)) {
                        // If assistant teacher 1 is on leave, assign proxy for assistant teacher 1
                        slot.proxyAsstTeacherId1 = new ObjectId(proxyTeacherId);  // Assign the proxy for assistant teacher 1
                    } else if (slot.asstTeacherId2 && slot.asstTeacherId2.equals(originalTeacherId)) {
                        // If assistant teacher 2 is on leave, assign proxy for assistant teacher 2
                        slot.proxyAsstTeacherId2 = new ObjectId(proxyTeacherId);  // Assign the proxy for assistant teacher 2
                    }
                    return {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        mainTeacherId: slot.mainTeacherId, // The original teacher who was supposed to teach
                        proxyMainTeacherId: slot.proxyMainTeacherId, // The proxy teacher covering the main teacher slot
                        asstTeacherId1: slot.asstTeacherId1,
                        proxyAsstTeacherId1: slot.proxyAsstTeacherId1,
                        asstTeacherId2: slot.asstTeacherId2,
                        proxyAsstTeacherId2: slot.proxyAsstTeacherId2,
                        status: slot.status || 'assigned', // Set default status as 'assigned' if not provided      
                        subjectId: slot.subjectId,
                    };
                }),
            };
        });

        // Create the proxy teacher assignment in the database
        const proxyTableData = await proxyTimetableModel.create({
            mainTeacherId: new ObjectId(originalTeacherId), // The original teacher who is on leave
            proxyTeacherId: new ObjectId(proxyTeacherId), // The proxy teacher
            academicYearId: new ObjectId(academicYearId), // Academic Year
            startDate: startQueryDate, // Use the calculated start date
            endDate: endQueryDate,     // Use the calculated end date
            stageId,
            workingDaysId: workingDays?._id,
            proxyAssignments,
            email,
            firstName,
            lastName,
        });

        return proxyTableData;
    } catch (error) {
        console.error('Error assigning proxy teacher:', error);
        throw new Error('There was a problem assigning the proxy teacher.');
    }
};

// module.exports.getTimeTableById = async (query, connection) => {
//     try {
//         const { id } = query;
//         const timetableModel = connection.model('TimeTable', TimeTable.schema);
//         const proxyTimetableModel = connection.model('ProxyTimeTable', ProxyTimeTable.schema);
//         connection.model('Section', Section.schema);
//         connection.model('Grade', Grade.schema);
//         connection.model('Stage', Stage.schema);
//         connection.model('SchoolType', SchoolType.schema);
//         connection.model('Subject', Subject.schema);
//         connection.model('User', User.schema);
//         connection.model('WorkingDays', WorkingDays.schema);
//         connection.model('AcademicYears', AcademicYears.schema);

//         const timetable = await timetableModel.findById(id)
//             .populate('workingDaysId', 'start_date end_date weekdays')
//             .populate('schoolTypeId', 'type')
//             .populate('stageId', 'stage') // Populate grade field with the grade name
//             .populate('timeTable.gradeId', 'grade') // Populate grade field with the grade name
//             .populate('timeTable.sectionId', 'section') // Populate section field with the section name
//             .populate('timeTable.slots.subjectId', 'subject') // Populate subjects with subject names
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('academicYearId')
//         return timetable;
//     } catch (error) {
//         console.error('Error fetching  timetable:', error);
//         throw new Error('Error fetching timetable.');
//     }
// };

module.exports.getTimeTableById = async (query, connection) => {
    try {
        const { id } = query;
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema); // Updated model for proxy teacher
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('Stage', Stage.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);
        connection.model('WorkingDays', WorkingDays.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        // Fetch the original timetable
        const timetable = await timetableModel.findById(id)
            .populate('workingDaysId', 'start_date end_date weekdays')
            .populate('schoolTypeId', 'type')
            .populate('stageId', 'stage')
            .populate('timeTable.gradeId', 'grade')
            .populate('timeTable.sectionId', 'section')
            .populate('timeTable.slots.subjectId', 'subject')
            .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role')
            .populate('academicYearId');
        // Fetch the proxy teacher assignments for the same academic year
        const proxyTimetable = await proxyTimetableModel.find({
            stageId: new ObjectId(timetable.stageId._id),
            workingDaysId: new ObjectId(timetable.workingDaysId._id),
            academicYearId: new ObjectId(timetable.academicYearId._id),
            startDate: { $lte: timetable.workingDaysId.end_date },
            endDate: { $gte: timetable.workingDaysId.start_date },
        })
            .populate('proxyAssignments.gradeId', 'grade')
            .populate('proxyAssignments.sectionId', 'section')
            .populate('proxyAssignments.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.proxyClassTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.subjectId', 'subject')
            .populate('proxyAssignments.slots.proxyMainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role');

        // Loop through the timetable to check if any proxy teacher needs to be applied
        timetable.timeTable.forEach((entry) => {
            entry.slots.forEach((slot) => {
                const matchingAssignments = proxyTimetable
                    .flatMap((assignment) => assignment.proxyAssignments)
                    .filter((proxyAssignment) =>
                        proxyAssignment.gradeId.toString() === entry.gradeId.toString() &&
                        proxyAssignment.sectionId.toString() === entry.sectionId.toString() &&
                        proxyAssignment.slots.some((proxySlot) =>
                            proxySlot.subjectId.toString() === slot.subjectId.toString()
                        )
                    );

                matchingAssignments.forEach((proxyAssignment) => {
                    proxyAssignment.slots.forEach((proxySlot) => {
                        if (proxySlot.startTime === slot.startTime && proxySlot.endTime === slot.endTime) {
                            slot.mainTeacherId = proxySlot.proxyTeacherId || slot.mainTeacherId;
                            slot.asstTeacherId1 = proxySlot.proxyAsstTeacherId1 || slot.asstTeacherId1;
                            slot.asstTeacherId2 = proxySlot.proxyAsstTeacherId2 || slot.asstTeacherId2;
                        }
                    });

                    // Directly update classTeacherId if available
                    if (proxyAssignment.proxyClassTeacherId) {
                        entry.classTeacherId = proxyAssignment.proxyClassTeacherId;
                    }
                });
            });
        });


        return timetable;
    } catch (error) {
        console.error('Error fetching timetable:', error);
        throw new Error('Error fetching timetable.');
    }
};

// module.exports.getTimeTableByTeacherId = async (param, query, connection) => {
//     try {
//         const { teacherId } = param;
//         const { startDate, endDate, day, gradeId, sectionId, academicYearId, workingDaysId } = query;
//         const timetableModel = connection.model('TimeTable', TimeTable.schema);
//         const workingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
//         connection.model('Section', Section.schema);
//         connection.model('Grade', Grade.schema);
//         connection.model('Stage', Stage.schema);
//         connection.model('SchoolType', SchoolType.schema);
//         connection.model('Subject', Subject.schema);
//         connection.model('User', User.schema);
//         connection.model('AcademicYears', AcademicYears.schema);

//         let filter = {};

//         if (startDate && endDate) {
//             if (workingDaysId) {
//                 filter.workingDaysId = new ObjectId(workingDaysId);
//             } else {
//                 // Fetch workingDays document that matches the date condition
//                 const workingDays = await workingDaysModel.findOne({
//                     start_date: { $lte: new Date(startDate) },
//                     end_date: { $gte: new Date(endDate) }
//                 });
//                 if (workingDays) {
//                     filter.workingDaysId = new ObjectId(workingDays._id);
//                 } else {
//                     return []; // No matching workingDays, return empty result
//                 }
//             }
//         }
//         if (day) {
//             filter.day = day;
//         }
//         if (academicYearId) {
//             filter.academicYearId = new ObjectId(academicYearId);
//         }

//         let timetables = await timetableModel.find(filter)
//             .populate('workingDaysId', 'start_date end_date weekdays')
//             .populate('schoolTypeId', 'type')
//             .populate('stageId', 'stage')
//             .populate('timeTable.gradeId', 'grade')
//             .populate('timeTable.sectionId', 'section')
//             .populate('timeTable.slots.subjectId', 'subject')
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
//             .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role')
//             .populate('academicYearId');

//         if ((gradeId && sectionId) || teacherId) {
//             const gradeObjectId = gradeId ? new ObjectId(gradeId) : null;
//             const sectionObjectId = sectionId ? new ObjectId(sectionId) : null;

//             timetables = timetables.map(tt => {
//                 // Filter by grade & section if both are provided
//                 let filteredTimeTable = tt.timeTable;

//                 if (gradeObjectId && sectionObjectId) {
//                     filteredTimeTable = filteredTimeTable.filter(entry =>
//                         entry.gradeId && entry.gradeId.equals(gradeObjectId) &&
//                         entry.sectionId && entry.sectionId.equals(sectionObjectId)
//                     );
//                 }

//                 // If teacherId is provided, filter slots
//                 if (teacherId) {
//                     filteredTimeTable = filteredTimeTable
//                         .map(entry => ({
//                             ...entry.toObject(),
//                             slots: entry.slots.filter(slot =>
//                                 (slot.mainTeacherId && slot.mainTeacherId.equals(teacherId)) ||
//                                 (slot.asstTeacherId1 && slot.asstTeacherId1.equals(teacherId)) ||
//                                 (slot.asstTeacherId2 && slot.asstTeacherId2.equals(teacherId))
//                             )
//                         }))
//                         .filter(entry => entry.slots.length > 0); // Ensure entry has slots after filtering
//                 }

//                 return {
//                     ...tt.toObject(),
//                     timeTable: filteredTimeTable
//                 };
//             });

//             // Remove timetables where `timeTable` is empty
//             timetables = timetables.filter(tt => tt.timeTable.length > 0);
//         }


//         return timetables;
//     } catch (error) {
//         console.error('Error fetching timetable by teacher ID:', error);
//         throw new Error('Error fetching timetable.');
//     }
// };

module.exports.getTimeTableByTeacherId = async (param, query, connection) => {
    try {
        const { teacherId } = param;
        const { startDate, endDate, day, gradeId, sectionId, academicYearId, workingDaysId } = query;
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const workingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema); // Proxy teacher model
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('Stage', Stage.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        let filter = {};

        if (startDate && endDate) {
            if (workingDaysId) {
                filter.workingDaysId = new ObjectId(workingDaysId);
            } else {
                // Fetch workingDays document that matches the date condition
                const workingDays = await workingDaysModel.findOne({
                    start_date: { $lte: new Date(startDate) },
                    end_date: { $gte: new Date(endDate) }
                });
                if (workingDays) {
                    filter.workingDaysId = new ObjectId(workingDays._id);
                } else {
                    return []; // No matching workingDays, return empty result
                }
            }
        }
        if (day) {
            filter.day = day;
        }
        if (academicYearId) {
            filter.academicYearId = new ObjectId(academicYearId);
        }

        let timetables = await timetableModel.find(filter)
            .populate('workingDaysId', 'start_date end_date weekdays')
            .populate('schoolTypeId', 'type')
            .populate('stageId', 'stage')
            .populate('timeTable.gradeId', 'grade')
            .populate('timeTable.sectionId', 'section')
            .populate('timeTable.slots.subjectId', 'subject')
            .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role') // Populate main teacher;
            .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role')
            .populate('academicYearId');

        if ((gradeId && sectionId) || teacherId) {
            const gradeObjectId = gradeId ? new ObjectId(gradeId) : null;
            const sectionObjectId = sectionId ? new ObjectId(sectionId) : null;

            timetables = timetables.map(tt => {
                // Filter by grade & section if both are provided
                let filteredTimeTable = tt.timeTable;

                if (gradeObjectId && sectionObjectId) {
                    filteredTimeTable = filteredTimeTable.filter(entry =>
                        entry.gradeId && entry.gradeId.equals(gradeObjectId) &&
                        entry.sectionId && entry.sectionId.equals(sectionObjectId)
                    );
                }

                // If teacherId is provided, filter slots
                if (teacherId) {
                    filteredTimeTable = filteredTimeTable
                        .map(entry => ({
                            ...entry.toObject(),
                            slots: entry.slots.filter(slot =>
                                (slot.mainTeacherId && slot.mainTeacherId.equals(teacherId)) ||
                                (slot.asstTeacherId1 && slot.asstTeacherId1.equals(teacherId)) ||
                                (slot.asstTeacherId2 && slot.asstTeacherId2.equals(teacherId))
                            )
                        }))
                        .filter(entry => entry.slots.length > 0); // Ensure entry has slots after filtering
                }

                return {
                    ...tt.toObject(),
                    timeTable: filteredTimeTable
                };
            });

            // Remove timetables where `timeTable` is empty
            timetables = timetables.filter(tt => tt.timeTable.length > 0);
        }

        // Check if `startDate` and `endDate` are provided, else use the current date
        const startQueryDate = startDate ? new Date(startDate) : new Date();
        const endQueryDate = endDate ? new Date(endDate) : new Date();

        // Fetch the proxy timetable and apply the proxy teacher logic
        const proxyTimetable = await proxyTimetableModel.find({
            startDate: { $lte: endQueryDate },
            endDate: { $gte: startQueryDate },
            academicYearId: academicYearId,  // Ensure we're working with the correct academic year
        })
            .populate('proxyAssignments.gradeId', 'grade')
            .populate('proxyAssignments.sectionId', 'section')
            .populate('proxyAssignments.subjectId', 'subject')
            .populate('proxyAssignments.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.proxyClassTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyMainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role');

        // Loop through the timetable and replace the main teachers and assistant teachers with proxy teachers where necessary
        timetables.forEach((tt) => {
            tt.timeTable.forEach((entry) => {
                entry.slots.forEach((slot) => {
                    // Find matching proxy assignment for the grade, section, and subject
                    const proxyAssignment = proxyTimetable
                        .map(assignment => assignment.proxyAssignments)
                        .flat()
                        .find(assignment =>
                            assignment.gradeId.equals(entry.gradeId) &&
                            assignment.sectionId.equals(entry.sectionId) &&
                            assignment.subjectId.equals(slot.subjectId)
                        );

                    if (proxyAssignment) {
                        // Replace the main teacher with the proxy teacher
                        const proxySlot = proxyAssignment.slots.find(proxySlot =>
                            proxySlot.startTime === slot.startTime && proxySlot.endTime === slot.endTime
                        );

                        if (proxySlot) {
                            if (proxySlot.proxyTeacherId) {
                                slot.mainTeacherId = proxySlot.proxyTeacherId;
                            }
                            // Replace assistant teachers if necessary
                            slot.asstTeacherId1 = proxySlot.proxyAsstTeacherId1 || slot.asstTeacherId1;
                            slot.asstTeacherId2 = proxySlot.proxyAsstTeacherId2 || slot.asstTeacherId2;
                        }

                        // Update classTeacherId if proxyClassTeacherId is available
                        if (proxyAssignment.proxyClassTeacherId) {
                            entry.classTeacherId = proxyAssignment.proxyClassTeacherId;
                        }
                    }
                });
            });
        });

        return timetables;
    } catch (error) {
        console.error('Error fetching timetable by teacher ID:', error);
        throw new Error('Error fetching timetable.');
    }
};

// module.exports.getTimeTableByGradeAndSection = async (param, query, connection) => {
//     try {
//         const { gradeId, sectionId } = param;
//         const { day, date, academicYearId } = query;
//         const timetableModel = connection.model('TimeTable', TimeTable.schema);
//         const workingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
//         connection.model('Section', Section.schema);
//         connection.model('Grade', Grade.schema);
//         connection.model('Stage', Stage.schema);
//         connection.model('SchoolType', SchoolType.schema);
//         connection.model('Subject', Subject.schema);
//         connection.model('User', User.schema);
//         connection.model('AcademicYears', AcademicYears.schema)
//         // Convert IDs to ObjectId
//         const gradeObjectId = new ObjectId(gradeId);
//         const sectionObjectId = new ObjectId(sectionId);
//         let filter = {}
//         if (date) {
//             // Fetch workingDays document that matches the date condition
//             const workingDays = await workingDaysModel.findOne({
//                 start_date: { $lte: new Date(date) },
//                 end_date: { $gte: new Date(date) }
//             });

//             if (workingDays) {
//                 filter.workingDaysId = new ObjectId(workingDays._id);
//             } else {
//                 return []; // No matching workingDays, return empty result
//             }
//         }

//         if (day) {
//             filter.day = day;
//         }
//         if (academicYearId) {
//             filter.academicYearId = new ObjectId(academicYearId);
//         }
//         // Fetch all timetables
//         let timetables = await timetableModel.find(filter)
//             .populate('workingDaysId', 'start_date end_date')
//             .populate('schoolTypeId', 'type')
//             .populate('stageId', 'stage')
//             .populate('academicYearId')
//             .populate('timeTable.gradeId', 'grade') // Nested Population
//             .populate('timeTable.sectionId', 'section')
//             .populate('timeTable.slots.subjectId', 'subject')
//             .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
//             .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role ') // Populate teacher;
//             .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
//             .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role');

//         // Filter timetables to only include matching grade & section in timeTable array
//         timetables = timetables.map(tt => {
//             const filteredTimeTable = tt.timeTable.filter(entry =>
//                 entry.gradeId && entry.gradeId.equals(gradeObjectId) &&
//                 entry.sectionId && entry.sectionId.equals(sectionObjectId)
//             );

//             // Return the document with only the filtered timeTable
//             return {
//                 ...tt.toObject(),
//                 timeTable: filteredTimeTable
//             };
//         });

//         // Remove documents where timeTable is empty after filtering
//         timetables = timetables.filter(tt => tt.timeTable.length > 0);

//         return timetables;
//     } catch (error) {
//         console.error('Error fetching timetable by grade and section ID:', error);
//         throw new Error('Error fetching timetable.');
//     }
// };

module.exports.getTimeTableByGradeAndSection = async (param, query, connection) => {
    try {
        const { gradeId, sectionId } = param;
        const { day, date, academicYearId } = query;
        const timetableModel = connection.model('TimeTable', TimeTable.schema);
        const workingDaysModel = connection.model('WorkingDays', WorkingDays.schema);
        const proxyTimetableModel = connection.model('ProxyTeacher', ProxyTeacher.schema); // Proxy teacher model
        connection.model('Section', Section.schema);
        connection.model('Grade', Grade.schema);
        connection.model('Stage', Stage.schema);
        connection.model('SchoolType', SchoolType.schema);
        connection.model('Subject', Subject.schema);
        connection.model('User', User.schema);
        connection.model('AcademicYears', AcademicYears.schema);

        // Convert IDs to ObjectId
        const gradeObjectId = new ObjectId(gradeId);
        const sectionObjectId = new ObjectId(sectionId);

        let filter = {};

        if (date) {
            // Fetch workingDays document that matches the date condition
            const workingDays = await workingDaysModel.findOne({
                start_date: { $lte: new Date(date) },
                end_date: { $gte: new Date(date) }
            });

            if (workingDays) {
                filter.workingDaysId = new ObjectId(workingDays._id);
            } else {
                return []; // No matching workingDays, return empty result
            }
        }

        if (day) {
            filter.day = day;
        }
        if (academicYearId) {
            filter.academicYearId = new ObjectId(academicYearId);
        }

        // Fetch all timetables
        let timetables = await timetableModel.find(filter)
            .populate('workingDaysId', 'start_date end_date')
            .populate('schoolTypeId', 'type')
            .populate('stageId', 'stage')
            .populate('academicYearId')
            .populate('timeTable.gradeId', 'grade') // Nested Population
            .populate('timeTable.sectionId', 'section')
            .populate('timeTable.slots.subjectId', 'subject')
            .populate('timeTable.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.mainTeacherId', 'firstName lastName itsNo photo role ') // Populate main teacher;
            .populate('timeTable.slots.asstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('timeTable.slots.asstTeacherId2', 'firstName lastName itsNo photo role');

        // Check if `date` is provided, else use the current date
        const currentDate = date ? new Date(date) : new Date();

        const proxyTimetable = await proxyTimetableModel.find({
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
            academicYearId: academicYearId,  // Ensure we're working with the correct academic year
        })
            .populate('proxyAssignments.gradeId', 'grade')
            .populate('proxyAssignments.sectionId', 'section')
            .populate('proxyAssignments.subjectId', 'subject')
            .populate('proxyAssignments.classTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.proxyClassTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.mainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyMainTeacherId', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId1', 'firstName lastName itsNo photo role')
            .populate('proxyAssignments.slots.proxyAsstTeacherId2', 'firstName lastName itsNo photo role');

        // Loop through the timetable and replace the main teachers and assistant teachers with proxy teachers where necessary
        timetables.forEach((tt) => {
            tt.timeTable.forEach((entry) => {
                entry.slots.forEach((slot) => {
                    // Find matching proxy assignment for the grade, section, and subject
                    const proxyAssignment = proxyTimetable
                        .map(assignment => assignment.proxyAssignments)
                        .flat()
                        .find(assignment =>
                            assignment.gradeId.equals(entry.gradeId) &&
                            assignment.sectionId.equals(entry.sectionId) &&
                            assignment.subjectId.equals(slot.subjectId)
                        );

                    if (proxyAssignment) {
                        // Replace the main teacher with the proxy teacher
                        const proxySlot = proxyAssignment.slots.find(proxySlot =>
                            proxySlot.startTime === slot.startTime && proxySlot.endTime === slot.endTime
                        );

                        if (proxySlot) {
                            if (proxySlot.proxyTeacherId) {
                                slot.mainTeacherId = proxySlot.proxyTeacherId;
                            }
                            // Replace assistant teachers if necessary
                            slot.asstTeacherId1 = proxySlot.proxyAsstTeacherId1 || slot.asstTeacherId1;
                            slot.asstTeacherId2 = proxySlot.proxyAsstTeacherId2 || slot.asstTeacherId2;
                        }

                        // Update classTeacherId if proxyClassTeacherId is available
                        if (proxyAssignment.proxyClassTeacherId) {
                            entry.classTeacherId = proxyAssignment.proxyClassTeacherId;
                        }
                    }
                });
            });
        });

        // Filter timetables to only include matching grade & section in timeTable array
        timetables = timetables.map(tt => {
            const filteredTimeTable = tt.timeTable.filter(entry =>
                entry.gradeId && entry.gradeId.equals(gradeObjectId) &&
                entry.sectionId && entry.sectionId.equals(sectionObjectId)
            );

            // Return the document with only the filtered timeTable
            return {
                ...tt.toObject(),
                timeTable: filteredTimeTable
            };
        });

        // Remove documents where timeTable is empty after filtering
        timetables = timetables.filter(tt => tt.timeTable.length > 0);

        return timetables;
    } catch (error) {
        console.error('Error fetching timetable by grade and section ID:', error);
        throw new Error('Error fetching timetable.');
    }
};
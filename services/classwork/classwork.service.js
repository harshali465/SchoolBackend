const Classwork = require("../../models/classwork.model");
const School = require("../../commonDbModels/school.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const Stage = require("../../models/stage.model");
const User = require("../../models/user.model");
const { default: mongoose, connection } = require("mongoose");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const ObjectId = mongoose.Types.ObjectId;
const { SchoolType, Subject, WorkingDays, AcademicYears } = require("../../models/academics.model");
const { classAttendance, tag } = require("../../models/attendance.model")
const { TimeTable, ProxyTimeTable } = require("../../models/timeTable.model");
const { BehaviorPointPoint, BehaviorPointCondition } = require("../../models/behaviourPoint.model");
const Module = require('../../commonDbModels/modules-master.model');
const getStudentsByGradeAndSection = async (gradeId, sectionId, schoolConnection) => {
  try {
    const StageGradeSectionTimeModel = schoolConnection.model('StageGradeSectionTime', StageGradeSectionTime.schema);
    const UserModel = schoolConnection.model('User', User.schema);
    schoolConnection.model("Stage", Stage.schema);
    schoolConnection.model("Grade", Grade.schema);
    schoolConnection.model("Section", Section.schema);

    const filter = {};
    if (gradeId) filter.grade = gradeId;
    if (sectionId) filter.section = sectionId;

    // Fetch matching StageGradeSectionTime entries
    const stageGradeSectionEntries = await StageGradeSectionTimeModel.find(filter)
      .populate("stage")
      .populate("grade")
      .populate("section")
      .lean();

    if (!stageGradeSectionEntries.length) {
      return []; // Return empty array if no matching grade/section
    }

    // Extract _id values from StageGradeSectionTime
    const stageGradeSectionIds = stageGradeSectionEntries.map(entry => entry._id);

    // Fetch students who belong to these StageGradeSectionTime entries
    const students = await UserModel.find({
      role: 'student',
      stageGradeSection: { $in: stageGradeSectionIds },
    })
      .lean();

    return students;
  } catch (error) {
    console.error("Error fetching students by grade & section:", error);
    throw new Error("Failed to fetch students.");
  }
};

async function getDayLongFromDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

const getAttendanceWithStatus = async (reqQuery, connection) => {
  try {
    const { teacherId, assistantTeachers, students, academicYearId, gradeId, sectionId, workingDayId, date, studentId } = reqQuery;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    const workingDaysModel = connection.model("WorkingDays", WorkingDays.schema);
    const userModel = connection.model("User", User.schema);
    const StageGradeSectionTimeModel = connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    const TimeTableModel = connection.model("TimeTable", TimeTable.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    connection.model("Tag", tag.schema);

    let start_date, end_date, weekdays, validDays = new Set();
    const filter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let day = await getDayLongFromDate(today)
    let matchFilter = {};
    let matchFilter1 = {};
    matchFilter.day = day

    if (workingDayId) {
      const workingDay = await workingDaysModel.findById(workingDayId);
      if (workingDay) {
        start_date = workingDay.start_date;
        end_date = workingDay.end_date;
        weekdays = workingDay.weekdays;
        validDays = new Set(weekdays.map(day => day.day.toLowerCase()));
        filter.date = { $gte: start_date, $lte: end_date };
      }
      matchFilter.workingDaysId = new ObjectId(workingDayId);
    }

    if (teacherId) filter.teacherId = teacherId;
    if (assistantTeachers) {
      filter['assistantTeachers.asstTeacherId'] = {
        $in: assistantTeachers.split(',').map(id => new mongoose.Types.ObjectId(id.trim()))
      };
    }
    if (students) {
      filter['students.studentId'] = {
        $in: students.split(',').map(id => new ObjectId(id.trim()))
      };
    }
    if (studentId) {
      filter['students.studentId'] = studentId
    }
    if (academicYearId) {
      filter.academicYearId = new ObjectId(academicYearId);
      matchFilter.academicYearId = new ObjectId(academicYearId);
    }
    if (gradeId) {
      filter.gradeId = new ObjectId(gradeId);
      matchFilter1['timeTable.gradeId'] = new ObjectId(gradeId);
    }
    if (sectionId) {
      filter.sectionId = new ObjectId(sectionId);
      matchFilter1['timeTable.sectionId'] = new ObjectId(sectionId);
    }

    // Fetch attendance records
    const attendanceRecords = await classAttendanceModel.find(filter)
      .populate('teacherId', 'id firstName lastName itsNo photo email')
      .populate('teacherTag', 'id tag')
      .populate('assistantTeachers.asstTeacherId', 'id firstName lastName itsNo photo email')
      .populate('assistantTeachers.tag', 'id tag')
      .populate('students.studentId', 'id firstName lastName itsNo photo email')
      .populate('students.tag', 'id tag')
      .populate('gradeId', 'id grade')
      .populate('subjectId', 'id subject')
      .populate('sectionId', 'id section');
    let allDates = [];
    if (date) {
      // Convert date to the required format
      let formattedDate = new Date(date).toISOString().split('T')[0];

      // If workingDayId is also provided, ensure the date falls within range and is a valid weekday
      if (workingDayId) {
        let givenDate = new Date(date);
        let givenWeekday = givenDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        console.log(start_date, end_date, weekdays, validDays)
        if (givenDate >= new Date(start_date) && givenDate <= new Date(end_date) && validDays.has(givenWeekday)) {
          allDates = [formattedDate];
        }
      } else {
        allDates = [formattedDate];
      }
    } else {
      // Generate all valid dates within the workingDay range
      let currentDate = new Date(start_date);
      const end = new Date(end_date);
      while (currentDate <= end) {
        if (validDays.has(currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())) {
          allDates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    // **Fetch timetable data**
    const allGradeSectionSubjects = await TimeTableModel.aggregate([
      { $match: matchFilter }, // Apply filtering based on query params
      { $unwind: "$timeTable" },
      { $match: matchFilter1 },
      { $unwind: "$timeTable.slots" }, // Extract each slot separately
      {
        $match: { "timeTable.slots.subjectId": { $exists: true, $ne: null } } // Ensure subjectId exists and is not null
      },
      {
        $project: {
          gradeId: "$timeTable.gradeId",
          sectionId: "$timeTable.sectionId",
          subjectId: "$timeTable.slots.subjectId",
          startTime: "$timeTable.slots.startTime",
          endTime: "$timeTable.slots.endTime",
          mainTeacherId: "$timeTable.slots.mainTeacherId",
          asstTeacherId1: "$timeTable.slots.asstTeacherId1",
          asstTeacherId2: "$timeTable.slots.asstTeacherId2",
        }
      },
      {
        $lookup: {
          from: "grades",
          localField: "gradeId",
          foreignField: "_id",
          as: "gradeInfo"
        }
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionInfo"
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subjectInfo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "mainTeacherId",
          foreignField: "_id",
          as: "mainTeacher"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "asstTeacherId1",
          foreignField: "_id",
          as: "asstTeacher1"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "asstTeacherId2",
          foreignField: "_id",
          as: "asstTeacher2"
        }
      },
      {
        $project: {
          gradeId: 1,
          sectionId: 1,
          subjectId: 1,
          grade: { $arrayElemAt: ["$gradeInfo.grade", 0] },
          section: { $arrayElemAt: ["$sectionInfo.section", 0] },
          subject: { $arrayElemAt: ["$subjectInfo.subject", 0] },
          startTime: 1,
          endTime: 1,
          mainTeacher: {
            _id: { $arrayElemAt: ["$mainTeacher._id", 0] },
            firstName: { $arrayElemAt: ["$mainTeacher.firstName", 0] },
            lastName: { $arrayElemAt: ["$mainTeacher.lastName", 0] },
            itsNo: { $arrayElemAt: ["$mainTeacher.itsNo", 0] },
            email: { $arrayElemAt: ["$mainTeacher.email", 0] },
            photo: { $arrayElemAt: ["$mainTeacher.photo", 0] }
          },
          asstTeacher1: {
            _id: { $arrayElemAt: ["$asstTeacher1._id", 0] },
            firstName: { $arrayElemAt: ["$asstTeacher1.firstName", 0] },
            lastName: { $arrayElemAt: ["$asstTeacher1.lastName", 0] },
            itsNo: { $arrayElemAt: ["$asstTeacher1.itsNo", 0] },
            email: { $arrayElemAt: ["$asstTeacher1.email", 0] },
            photo: { $arrayElemAt: ["$asstTeacher1.photo", 0] }
          },
          asstTeacher2: {
            _id: { $arrayElemAt: ["$asstTeacher2._id", 0] },
            firstName: { $arrayElemAt: ["$asstTeacher2.firstName", 0] },
            lastName: { $arrayElemAt: ["$asstTeacher2.lastName", 0] },
            itsNo: { $arrayElemAt: ["$asstTeacher2.itsNo", 0] },
            email: { $arrayElemAt: ["$asstTeacher2.email", 0] },
            photo: { $arrayElemAt: ["$asstTeacher2.photo", 0] }
          },
          mainTeacherId: 1,
          asstTeacherId1: 1,
          asstTeacherId2: 1,
        }
      }
    ]);

    const formattedRecords = [];

    for (const date of allDates) {
      for (let tdata of allGradeSectionSubjects) {
        const { gradeId, sectionId, subjectId, grade, section, subject, startTime, endTime, mainTeacher, asstTeacher1, asstTeacher2 } = tdata;
        const recordDate = new Date(date);

        // Get grade-section mapping
        const stageGradeSection = await StageGradeSectionTimeModel.findOne({
          grade: new ObjectId(gradeId),
          section: new ObjectId(sectionId)
        });

        // Get total number of students in this grade-section
        const totalStrength = await userModel.countDocuments({
          role: "student",
          stageGradeSection: stageGradeSection?._id
        });

        // **Fetch Attendance Record for this Date, Grade, Section, and Subject**
        const records = attendanceRecords.filter(
          record =>
            record.date.toISOString().split('T')[0] === date &&
            record.gradeId._id.toString() === gradeId.toString() &&
            record.sectionId._id.toString() === sectionId.toString() &&
            record.subjectId._id.toString() === subjectId.toString() &&
            record.startTime === startTime &&
            record.endTime === endTime
        );

        // **Only push records where a valid attendance record exists with an `_id`**
        if (records.length > 0 && records[0]._id) {
          formattedRecords.push({
            _id: records[0]._id,
            date,
            grade,
            section,
            subject,
            totalStrength,
            presentCount: records.reduce((count, record) => count + record.students.length, 0),
            absentCount: totalStrength - records.reduce((count, record) => count + record.students.length, 0),
            status: "submitted",
            startTime,
            endTime,
            subjectId: records[0].subjectId?._id,
            gradeId: records[0].gradeId?._id,
            sectionId: records[0].sectionId?._id,
            students: records[0].students,
            teacher: records[0].teacherId,
            teacherTag: records[0].teacherTag,
            assistantTeachers: records[0].assistantTeachers.length > 0 ? records[0].assistantTeachers : [...asstTeacher1, ...asstTeacher2],
          });
        }
      }
    }

    return formattedRecords;
  } catch (error) {
    console.error('Error fetching attendance with status:', error);
    throw new Error('There was a problem retrieving attendance records.');
  }
};

module.exports.createClasswork = async (req, connection) => {
  const { attendanceId, date, teacherId, gradeId, sectionId, subjectId, description, dueDate, teachingAids, maximumPoint, academicYearId, links } = req.body;

  // Extract file paths from Multer
  const uploadedFiles = req.files || [];
  const filePaths = uploadedFiles.map(file => file.path); // Save file paths

  // Determine whether files should be stored in links or images
  const isImage = (filename) => /\.(jpg|jpeg|png|gif)$/i.test(filename);
  const images = filePaths.filter(isImage);

  // Get students based on grade & section
  const students = await getStudentsByGradeAndSection(gradeId, sectionId, connection);
  const studentEntries = students.map(student => ({
    studentId: student._id,
    isRead: false,
    isSubmitted: false,
    submittedAt: null,
  }));

  // Classwork Model
  const ClassworkModel = connection.model('Classwork', Classwork.schema);
  const BehaviorPointConditionModel = await schoolConnection.model('BehaviorPointCondition', BehaviorPointCondition.schema);
  const BehaviorPointPointModel = await schoolConnection.model('BehaviorPointPoint', BehaviorPointPoint.schema);
  const classAttendanceModel = await schoolConnection.model('classAttendance', classAttendance.schema);
  const incrementBehaviorPoints = async (teacherId) => {
    let pointsIncremented = false;
    const module = await Module.findOne({ moduleName: "Classwork" }).select("_id status");
    const currentTime = new Date();
    if (!module || !module.status) return;

    const currentDate = new Date(Date.UTC(
      currentTime.getUTCFullYear(),
      currentTime.getUTCMonth(),
      currentTime.getUTCDate()
    ));
    console.log({ teacherId, gradeId, sectionId, subjectId, date: currentDate })
    const [condition, attendance] = await Promise.all([
      BehaviorPointConditionModel.findOne({ module_id: module._id }),
      classAttendanceModel.findOne({ teacherId, gradeId, sectionId, subjectId, date: currentDate }),
    ]);
    if (!condition || !attendance || pointsIncremented) return;

    const point = condition.point || 0;
    const percentage = condition.percentage || 0;
    const deadlineHours = condition.deadline || 0;
    const attendanceTime = new Date(attendance.createdAt);
    const deadlineTime = new Date(attendanceTime.getTime() + deadlineHours * 60 * 60 * 1000);
    const isOnTime = deadlineTime >= currentTime;
    const finalPoints = isOnTime ? point : point * (percentage / 100);
    await BehaviorPointPointModel.findOneAndUpdate(
      {
        user_id: teacherId,
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
      },
      {
        $inc: {
          totalPoints: finalPoints,
          RemainingPoints: finalPoints,
        },
        $setOnInsert: {
          academicYearId: new mongoose.Types.ObjectId(academicYearId),
          user_id: teacherId,
          user_type: "teacher",
        },
      },
      { new: true, upsert: true }
    );

    pointsIncremented = true;
  };

  const classworkData = await ClassworkModel.create({
    date: new Date(date),
    attendanceId,
    teacherId,
    gradeId,
    sectionId,
    subjectId,
    students: studentEntries,
    description,
    dueDate,
    teachingAids,
    maximumPoint,
    images,
    links,
    academicYearId,
  });
  // Increment behavior points for new data
  await incrementBehaviorPoints(teacherId);
  return classworkData;
};

module.exports.getClassworkById = async (id, connection) => {
  try {
    if (!id) {
      throw new Error("Teacher ID is required.");
    }

    const ClassworkModel = connection.model("Classwork", Classwork.schema);

    // Fetch classwork assigned to the given teacher
    const classworkList = await ClassworkModel.findById( id )
      .populate({
        path: "gradeId",
        select: "grade", // Fetch grade details
      })
      .populate({
        path: "sectionId",
        select: "section", // Fetch section details
      })
      .populate({
        path: "subjectId",
        select: "name", // Fetch subject name
      })
      .populate({
        path: "students.studentId",
        select: "firstName lastName photo", // Fetch student names
      })
      .sort({ date: -1 }) // Sort by latest date first
      .lean();

    return classworkList;
  } catch (error) {
    console.error("Error fetching classwork:", error);
    throw new Error("Failed to retrieve classwork.");
  }
};

module.exports.updateClasswork = async (id, req, connection) => {
  if (!id) {
    throw new Error("Classwork ID is required.");
  }

  const { attendanceId, date, teacherId, gradeId, sectionId, subjectId, description, dueDate, teachingAids, maximumPoint, academicYearId, links } = req.body;
  // Extract file paths from Multer
  const uploadedFiles = req.files || [];
  const filePaths = uploadedFiles.map(file => file.path); // Save file paths

  // Determine whether files should be stored in links or images
  const isImage = (filename) => /\.(jpg|jpeg|png|gif)$/i.test(filename);
  const newImages = filePaths.filter(isImage);
  let images = [];

  if (req.body.images) {
    try {
      images = JSON.parse(req.body.images);
    } catch (error) {
      console.error("Error parsing images:", error);
      images = [];
    }
  }

  const existingImagesSet = new Set(images);

  // If images array is empty, add all new images
  if (images.length === 0) {
    images = [...newImages];
  } else {
    // Add only new images that are not already in images
    newImages.forEach(img => {
      if (!existingImagesSet.has(img)) {
        images.push(img);
        existingImagesSet.add(img); // Update the Set as well
      }
    });
  }
  // Classwork Model
  const ClassworkModel = connection.model('Classwork', Classwork.schema);

  // Find existing classwork
  const existingClasswork = await ClassworkModel.findById(id);
  if (!existingClasswork) {
    throw new Error("Classwork not found.");
  }

  let updatedStudents = existingClasswork.students; // Default to existing students

  // If grade or section changed, fetch new students
  if (existingClasswork.gradeId.toString() !== gradeId || existingClasswork.sectionId.toString() !== sectionId) {
    const students = await getStudentsByGradeAndSection(gradeId, sectionId, connection);
    updatedStudents = students.map(student => ({
      studentId: student._id,
      isRead: false,
      isSubmitted: false,
      submittedAt: null,
    }));
  }

  // Update classwork document
  const updatedClasswork = await ClassworkModel.findByIdAndUpdate(
    id,
    {
      date: new Date(date),
      attendanceId,
      teacherId,
      gradeId,
      sectionId,
      subjectId,
      students: updatedStudents,
      description,
      dueDate,
      teachingAids,
      maximumPoint,
      images,
      links,
      academicYearId,
    },
    { new: true } // Return the updated document
  );

  return updatedClasswork;
};

module.exports.getClassworkByTeacher = async (teacherId, reqQuery, connection) => {
  try {
    if (!teacherId) {
      throw new Error("Teacher ID is required.");
    }

    const page = parseInt(reqQuery.page) || 1; // Default page 1
    const limit = parseInt(reqQuery.limit) || 10; // Default limit 10
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    reqQuery.teacherId = teacherId;
    const getDateWiseTimeTable = await getAttendanceWithStatus(reqQuery, connection);
    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    let filter = {}
    filter.teacherId = teacherId
    if (reqQuery.date) {
      filter.date = new Date(reqQuery.date)
    }
    if (reqQuery.dueDate){
      filter.dueDate = new Date(reqQuery.dueDate)
    }
    // Fetch classwork assigned to the given teacher
    const classworkList = await ClassworkModel.find(filter)
      .populate({ path: "gradeId", select: "grade" })
      .populate({ path: "sectionId", select: "section" })
      .populate({ path: "subjectId", select: "subject" })
      .populate({ path: "students.studentId", select: "firstName lastName photo" })
      .sort({ date: -1 })
      .lean();

    // **Create a lookup map for classwork based on attendanceId**
    const classworkMap = {};
    classworkList.forEach(cw => {
      if (cw.attendanceId) {
        classworkMap[cw.attendanceId.toString()] = cw; // Ensure ID is stored as a string for consistency
      }
    });

    // **Attach classwork to matching attendance entries**
    const updatedAttendance = getDateWiseTimeTable.map(entry => {
      return {
        ...entry,
        classwork: classworkMap[entry._id.toString()] || [], // Match classwork where _id === attendanceId
      };
    });

    // Apply pagination
    const paginatedResult = updatedAttendance.slice(startIndex, endIndex);

    return {
      totalRecords: updatedAttendance.length,
      totalPages: Math.ceil(updatedAttendance.length / limit),
      currentPage: page,
      data: paginatedResult,
    };
  } catch (error) {
    console.error("Error fetching classwork:", error);
    throw new Error("Failed to retrieve classwork.");
  }
};

module.exports.submitClasswork = async (classworkId, studentIds, connection) => {
  try {
    if (!classworkId || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new Error("Classwork ID and student IDs are required.");
    }

    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    const behaviorPointModel = connection.model("BehaviorPointPoint", BehaviorPointPoint.schema)
    // Find the classwork
    const classwork = await ClassworkModel.findById(classworkId);
    if (!classwork) {
      throw new Error("Classwork not found.");
    }

    // Update each student's submission status
    // classwork.students.forEach((student) => {
    //   if (studentIds.includes(student.studentId.toString())) {
    //     student.isSubmitted = true;
    //     student.submittedAt = new Date();
    //   }
    // });

    // Update each student's submission status
    classwork.students.forEach(async (student) => {
      if (studentIds.includes(student.studentId.toString())) {
        student.isSubmitted = true;
        student.submittedAt = new Date();

        let awardedPoints = 0;
        const now = new Date();
        const dueDate = new Date(classwork.dueDate);
        if (classwork.maximumPoint){
          if (now <= dueDate) {
            // Submitted on or before due date → Full points
            awardedPoints = classwork.maximumPoint;
          } else {
            // Submitted after due date → 50% points
            awardedPoints = Math.floor(classwork.maximumPoint / 2);
          }
        }
        let behaviorPointData = await behaviorPointModel.findOne({ user_id: student.studentId, user_type: "student", academicYearId: classwork.academicYearId });

        if (!behaviorPointData) {
          behaviorPointData = await behaviorPointModel.create({
            user_id: student.studentId,
            totalPoints: awardedPoints,
            reedemedPoints: 0,
            RemainingPoints: awardedPoints,
            user_type: "student",
            academicYearId: classwork.academicYearId,
          });
        } else {
          behaviorPointData.RemainingPoints += awardedPoints;
          behaviorPointData.totalPoints += awardedPoints;
          await behaviorPointData.save();
        }
        student.points = awardedPoints; // Add points to the student object
      }
    });

    // Save the updated classwork
    await classwork.save();

    return { success: true, message: "Classwork submitted successfully." };
  } catch (error) {
    console.error("Error submitting classwork:", error);
    throw new Error("Failed to submit classwork.");
  }
};

module.exports.getAllClassworkByStudentId = async (studentId, reqQuery, connection) => {
  try {
    if (!studentId) {
      throw new Error("Student ID is required.");
    }
    let {date, subjectId, isRead, search} = reqQuery
    let filter = { "students.studentId": studentId }
    if(date){
      filter.date = new Date(date)
    }
    if(subjectId){
      filter.subjectId = subjectId
    }
    if(isRead){
      filter["students.isRead"] = isRead
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { "gradeId.grade": { $regex: search, $options: "i" } },
        { "sectionId.section": { $regex: search, $options: "i" } },
        { "subjectId.subject": { $regex: search, $options: "i" } },
        { "students.studentId.firstName": { $regex: search, $options: "i" } },
        { "students.studentId.lastName": { $regex: search, $options: "i" } }
      ];
    }
    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);
    connection.model("User", User.schema);

    // Fetch classwork where studentId exists in students array
    const classworks = await ClassworkModel.find(filter)
      .populate("teacherId", "firstName lastName email") // Populate teacher info
      .populate("gradeId", "grade") // Populate grade info
      .populate("sectionId", "section") // Populate section info
      .populate("subjectId", "subject") // Populate subject info
      .lean();

    return classworks;
  } catch (error) {
    console.error("Error fetching classwork for student:", error);
    throw new Error("Failed to fetch classwork.");
  }
};

module.exports.getClassworkByStudentId = async (classworkId, studentId, connection) => {
  try {
    if (!classworkId || !studentId) {
      throw new Error("Classwork ID and Student ID are required.");
    }

    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);
    connection.model("User", User.schema);

    // Find and update isRead to true for the student
    const classwork = await ClassworkModel.findOneAndUpdate(
      {
        _id: classworkId,
        "students.studentId": studentId, // Ensure student is part of the classwork
      },
      {
        $set: { "students.$.isRead": true }, // Update only the matching student’s isRead field
      },
      { new: true } // Return the updated document
    )
      .populate("teacherId", "firstName lastName email") // Populate teacher info
      .populate("gradeId", "grade") // Populate grade info
      .populate("sectionId", "section") // Populate section info
      .populate("subjectId", "subject") // Populate subject info
      .lean();

    if (!classwork) {
      throw new Error("No classwork found for the given ID and Student ID.");
    }

    return classwork;
  } catch (error) {
    console.error("Error fetching and updating classwork:", error);
    throw new Error("Failed to retrieve classwork.");
  }
};

module.exports.markClassWork = async (classworkId, connection) => {
  try {
    const ClassworkModel = connection.model("Classwork", Classwork.schema);

    // Find the classwork
    const classwork = await ClassworkModel.findById(classworkId);
    if (!classwork) {
      throw new Error("Classwork not found.");
    }

    classwork.isMarked = true;
    classwork.markedAt = new Date();

    // Save the updated classwork
    await classwork.save();

    return { success: true, message: "Classwork marked successfully." };
  } catch (error) {
    console.error("Error marking classwork:", error);
    throw new Error("Failed to mark classwork.");
  }
}

module.exports.classworkCounts = async (reqQuery, connection) => {
  try {
    const { teacherId } = reqQuery;
    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);

    let filter = {};
    if (teacherId) filter.teacherId = teacherId;

    // Fetch counts
    const attendanceCounts = await classAttendanceModel.countDocuments(filter) || 0;
    const classworkCounts = await ClassworkModel.countDocuments(filter) || 0;

    // Get marked classwork count
    const markedClassWorkCounts = await ClassworkModel.countDocuments({ ...filter, isMarked: true }) || 0;

    // Correct calculations
    const notSubmitted = Math.max(attendanceCounts - classworkCounts, 0);
    const notMarked = Math.max(classworkCounts - markedClassWorkCounts, 0);

    return {
      totalClasses: attendanceCounts,
      totalSubmitted: classworkCounts,
      notSubmitted,
      totalMarked: markedClassWorkCounts,
      notMarked
    };

  } catch (error) {
    console.error("Error fetching classwork counts:", error);
    throw new Error("Failed to retrieve classwork counts.");
  }
};

module.exports.getTeacherWiseClasswork = async (reqQuery, connection) => {
  try {
    const { teacherId } = reqQuery;
    const page = parseInt(reqQuery.page) || 1; // Default page 1
    const limit = parseInt(reqQuery.limit) || 10; // Default limit 10
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    reqQuery.teacherId = teacherId;
    const getDateWiseTimeTable = await getAttendanceWithStatus(reqQuery, connection);
    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    let filter = {}
    filter.teacherId = teacherId
    if (reqQuery.date) {
      filter.date = new Date(reqQuery.date)
    }
    // Fetch classwork assigned to the given teacher
    const classworkList = await ClassworkModel.find(filter)
      .populate({ path: "gradeId", select: "grade" })
      .populate({ path: "sectionId", select: "section" })
      .populate({ path: "subjectId", select: "subject" })
      .populate({ path: "students.studentId", select: "firstName lastName photo" })
      .sort({ date: -1 })
      .lean();

    // **Create a lookup map for classwork based on attendanceId**
    const classworkMap = {};
    classworkList.forEach(cw => {
      if (cw.attendanceId) {
        classworkMap[cw.attendanceId.toString()] = cw; // Ensure ID is stored as a string for consistency
      }
    });

    // **Attach classwork to matching attendance entries**
    const updatedAttendance = getDateWiseTimeTable.map(entry => ({
      ...entry,
      classwork: classworkMap[entry._id.toString()] || [], // Attach matching classwork
    }));

    const teacherMap = {};

    updatedAttendance.forEach(entry => {
      const teacherId = entry.teacher?._id;
      if (!teacherId) return; // Skip if no teacher assigned

      // Initialize teacher if not exists
      if (!teacherMap[teacherId]) {
        teacherMap[teacherId] = {
          teacher: {
            _id: teacherId,
            firstName: entry.teacher.firstName,
            lastName: entry.teacher.lastName,
            email: entry.teacher.email,
          },
          assignedSubjects: new Set(),
          classworkSet: new Set(), // Track unique classwork per grade-section-subject
          dates: new Set(),
        };
      }

      // Add unique subject
      teacherMap[teacherId].assignedSubjects.add(entry.subject);
      teacherMap[teacherId].dates.add(entry.date); // Add date when classwork exists
      // Unique key for classwork (grade-section-subject)
      const classworkKey = `${entry.grade}-${entry.section}-${entry.subject}`;
      if (entry.classwork.length > 0) {
        teacherMap[teacherId].classworkSet.add(classworkKey);
      }
    });

    // Convert Sets to arrays and compute final counts
    const teacherGroupedData = Object.values(teacherMap).map(teacher => ({
      ...teacher,
      assignedSubjectsCount: teacher.assignedSubjects.size, // Unique assigned subjects count
      assignedSubjects: Array.from(teacher.assignedSubjects), // List of assigned subjects
      classworkCount: teacher.classworkSet.size, // Unique classwork count
      dates: Array.from(teacher.dates), // Convert date Set to an array
    }));

    // **Apply pagination for teacher-wise grouped data**
    const paginatedResult = teacherGroupedData.slice(startIndex, endIndex);

    return {
      totalRecords: teacherGroupedData.length,
      totalPages: Math.ceil(teacherGroupedData.length / limit),
      currentPage: page,
      data: paginatedResult,
    };
  } catch (error) {
    console.error("Error fetching classwork:", error);
    throw new Error("Failed to retrieve classwork.");
  }
};

module.exports.allClassworkCounts = async (reqQuery, connection) => {
  try {
    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    const { academicYearId } = reqQuery;
    const filter = {}
    if (academicYearId) filter.academicYearId = academicYearId

    // Fetch counts
    const attendanceCounts = await classAttendanceModel.countDocuments(filter) || 0;
    const classworkCounts = await ClassworkModel.countDocuments(filter) || 0;

    // Correct calculations
    const notSubmitted = Math.max(attendanceCounts - classworkCounts, 0);

    return {
      totalClasses: attendanceCounts,
      totalSubmitted: classworkCounts,
      notSubmitted,
    };

  } catch (error) {
    console.error("Error fetching classwork counts:", error);
    throw new Error("Failed to retrieve classwork counts.");
  }
};

module.exports.allClassworkOfStudents = async (reqQuery, connection) => {
  try {
    const { studentId, academicYearId, date, gradeId, sectionId } = reqQuery;
    const page = parseInt(reqQuery.page) || 1; // Default page 1
    const limit = parseInt(reqQuery.limit) || 10; // Default limit 10
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const UserModel = connection.model("User", User.schema);
    const ClassworkModel = connection.model("Classwork", Classwork.schema);
    const StageGradeSection = connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);

    // Step 1: Fetch students from the User table with grade and section details
    let studentFilter = { role: "student" };
    if (studentId) studentFilter._id = studentId;
    let stageGradeSectionFilter = {};

    if (gradeId) {
      stageGradeSectionFilter.grade = gradeId;
    }
    if (sectionId) {
      stageGradeSectionFilter.section = sectionId;
    }

    // Fetch stage grade sections
    if (gradeId || sectionId) {
      const stageGradeSections = await StageGradeSection.find(
        stageGradeSectionFilter
      ).exec();

      if (stageGradeSections.length > 0) {
        const stageGradeSectionIds = stageGradeSections.map((sgs) => sgs._id);
        studentFilter.stageGradeSection = { $in: stageGradeSectionIds };
      } else {
        console.warn("No stage grade sections found for the given filter.");
      }
    }
    const students = await UserModel.find(studentFilter)
      .select("_id firstName lastName photo ")
      .populate({
        path: 'stageGradeSection',
        populate: [
          {
            path: 'grade',
            model: 'Grade',
            select: 'grade'
          },
          {
            path: 'section',
            model: 'Section',
            select: 'section'
          },
        ],
      })
      .lean();

    if (!students.length) {
      return {
        totalRecords: 0,
        totalPages: 0,
        currentPage: page,
        data: [],
      };
    }

    // Step 2: Fetch classwork for each student and process statistics
    let groupedClasswork = {};
    for (const student of students) {
      let classworkFilter = {
        "students.studentId": student._id,
      };
      if (date) classworkFilter.date = new Date(date);
      if (academicYearId) classworkFilter.academicYearId = academicYearId;

      const classworkList = await ClassworkModel.find(classworkFilter)
        .populate({ path: "gradeId", select: "grade" })
        .populate({ path: "sectionId", select: "section" })
        .populate({ path: "subjectId", select: "subject" })
        .lean();

      const grade = student.stageGradeSection?.grade?.grade || "Unknown Grade";
      const section = student.stageGradeSection?.section?.section || "Unknown Section";
      const gradeSectionKey = `${grade}-${section}`;


      if (!groupedClasswork[gradeSectionKey]) {
        groupedClasswork[gradeSectionKey] = {
          grade,
          section,
          students: [],
        };
      }

      let assignedClasswork = classworkList.length;
      let viewedClasswork = 0;
      let markedClasswork = 0;
      let totalPoints = 0;
      let studentClasswork = [];

      classworkList.forEach((classwork) => {
        let studentData = classwork.students.find((s) => s.studentId.toString() === student._id.toString());
        if (studentData) {
          if (studentData.isRead) viewedClasswork++;
          if (studentData.isSubmitted) markedClasswork++;
          if (studentData.points) totalPoints += studentData.points;

          studentClasswork.push({
            _id: classwork._id,
            date: classwork.date,
            subject: classwork.subjectId?.subject,
            title: classwork.title,
            description: classwork.description,
            isRead: studentData.isRead || false,
            isSubmitted: studentData.isSubmitted || false,
            points: studentData.points || 0,
          });
        }
      });

      groupedClasswork[gradeSectionKey].students.push({
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          photo: student.photo,
        },
        assignedClasswork,
        viewedClasswork,
        markedClasswork,
        points: totalPoints,
        classwork: studentClasswork,
      });
    }

    // Step 3: Convert grouped results into an array and apply pagination
    const groupedResults = Object.values(groupedClasswork);
    const paginatedResult = groupedResults.slice(startIndex, endIndex);

    return {
      totalRecords: groupedResults.length,
      totalPages: Math.ceil(groupedResults.length / limit),
      currentPage: page,
      data: paginatedResult,
    };
  } catch (error) {
    console.error("Error fetching classwork:", error);
    throw new Error("Failed to retrieve classwork.");
  }
};
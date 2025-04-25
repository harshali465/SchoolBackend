const UserModel = require("../../models/user.model");
const AppError = require("../../utils/appError");
const path = require("path");
const fs = require("fs");
const SiblingGroup = require("../../models/siblings.model");
const StageGradeSectionTime = require('../../models/stageGradeSectionTime.model');
const mongoose = require("mongoose");

module.exports.createStudent = async (req, schoolDbConnection, totalStudent) => {
  let {
    firstName,
    lastName,
    itsNo,
    email,
    role,
    password,
    gender,
    studentId,
    class: studentClass,
    house,
    division,
    mentor,
    siblings,
    fees,
    familyDetails,
    // year,
    termId,
    selected,
    behaviousPoints,
    schoolId,
    grade,
    section,
    stage,
    HMRNumber,
    notificationPreference,
    academicYearId,
    admissionDate
  } = req.body;
  let photo = "";
  const StageGradeSectionTimeModel = await schoolDbConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);

  const stageGradeSection = await StageGradeSectionTimeModel.findOne({ stage, section, grade });
  if (!stageGradeSection) {
    throw new AppError("Please provide the valid stage, grade, and section.", 400);
  }

  // Handle photo if uploaded
  if (req.file) {
    const extension = path.extname(req.file.originalname);
    const newFilename = `${req.file.filename}${extension}`;
    const newPath = path.join(req.file.destination, newFilename);
    fs.renameSync(req.file.path, newPath); // Rename the file to include the correct extension
    photo = newFilename;
  }

  // Define the User model for this new connection
  const SchoolUser = schoolDbConnection.model("User", UserModel.schema);

  const studentsCount = await SchoolUser.countDocuments({ role: 'student' });  // Correct method name
  if (studentsCount >= totalStudent) {
    throw new AppError("Number of students has exceeded the limit", 400);  // Better error message
  }

  const query = [];
  if (email) query.push({ email: email });
  if (itsNo) query.push({ itsNo: itsNo });
  if (HMRNumber) query.push({ HMRNumber: HMRNumber })
  const existingStudent = await SchoolUser.findOne({
    $or: query
  });

  if (existingStudent) {
    if (email && existingStudent.email === email) {
      throw new AppError("Email is already registered.", 400);
    }
    if (itsNo && existingStudent.itsNo === itsNo) {
      throw new AppError("ITS number is already registered.", 400);
    }
    if (HMRNumber && existingStudent.HMRNumber === HMRNumber) {
      throw new AppError("HMR number is already registered.", 400);
    }
  }

  // Create the new student (student B)
  const student = new SchoolUser({
    firstName,
    lastName,
    itsNo,
    email,
    photo,
    role,
    password,
    gender,
    studentId,
    class: studentClass,
    house,
    division,
    mentor,
    fees,
    familyDetails: JSON.parse(familyDetails),
    // year,
    termId,
    selected,
    behaviousPoints,
    schoolId,
    stageGradeSection: stageGradeSection._id,
    HMRNumber,
    notificationPreference,
    academicYearId,
    admissionDate
  });

  let studentData = await student.save(); // Save student B
  siblings = JSON.parse(siblings)
  // Check if siblings array is passed (to handle sibling relationship)
  if (siblings && siblings.length > 0) {
    const SiblingGroupData = schoolDbConnection.model("SiblingGroup", SiblingGroup.schema);

    // Convert string IDs to ObjectIds for querying and storage
    const userIdObj = new mongoose.Types.ObjectId(studentData._id); // userId is a string
    const siblingIdsObj = siblings.map(id => new mongoose.Types.ObjectId(id)); // siblings is an array of strings
    const updatedSiblingsObj = Array.from(new Set([userIdObj.toString(), ...siblingIdsObj.map(id => id.toString())])).map(
      id => new mongoose.Types.ObjectId(id)
    ); // Deduplicate as strings, then convert back to ObjectIds

    // Find any existing sibling group where at least one of the selected siblings is present
    let siblingGroup = await SiblingGroupData.findOne({
      members: { $in: siblingIdsObj } // Use ObjectIds for the query
    });

    if (siblingGroup) {
      // Merge existing members with new ones, ensuring no duplicates
      const currentMembers = siblingGroup.members.map(id => id.toString());
      const mergedMembers = Array.from(new Set([...currentMembers, ...updatedSiblingsObj.map(id => id.toString())])).map(
        id => new mongoose.Types.ObjectId(id)
      );
      siblingGroup.members = mergedMembers;
      await siblingGroup.save();
    } else {
      // No existing group found, create a new one
      siblingGroup = new SiblingGroupData({ members: updatedSiblingsObj });
      await siblingGroup.save();
    }

    // Remove old sibling references from students being reassigned
    await SchoolUser.updateMany(
      { siblings: { $ne: siblingGroup._id }, _id: { $in: updatedSiblingsObj } },
      { $unset: { siblings: "" } }
    );

    // Update all students in the group to point to the siblingGroup._id
    await SchoolUser.updateMany(
      { _id: { $in: siblingGroup.members } },
      { $set: { siblings: siblingGroup._id } }
    );
  }
  return studentData;
};

module.exports.findStudentByEmail = async (itsNo, schoolConnection) => {
  try {
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    const user = await SchoolUser.findOne({ itsNo });
    return user;
  } catch (error) {
    console.error("Error finding user by ITS number:", error);
    throw new Error("There was a problem finding the user by ITS number");
  }
};

module.exports.deletestudent = async (body, schoolConnection) => {
  try {
    const { ids } = body;
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    await SchoolUser.deleteMany({ _id: { $in: ids } });
    return "Users deleted successfully";
  } catch (error) {
    return "There was a problem deleting the users";
  }
};

module.exports.updateActive = async (body, schoolConnection) => {
  const { ids, active } = body;
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  const updatedresult = await SchoolUser.updateMany(
    { _id: { $in: ids } },
    { $set: { active: active } }
  );
  if (!updatedresult) {
    throw new AppError("could not update", 404);
  }
  return updatedresult;
};

module.exports.getStudents = async (studentid, schoolConnection) => {
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  schoolConnection.model("SiblingGroup", SiblingGroup.schema);
  schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  const usersData = await SchoolUser.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(studentid) },
    },
    {
      $lookup: {
        from: "siblinggroups", // Lookup for the siblings field which refers to SiblingGroup
        localField: "siblings",
        foreignField: "_id", // Match against SiblingGroup's _id
        as: "siblings", // Keep the same key name as in the original query
      },
    },
    {
      $unwind: { path: "$siblings", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
    },
    {
      $lookup: {
        from: "users", // Lookup for the members array inside SiblingGroup
        localField: "siblings.members",
        foreignField: "_id", // Match against User model _id
        as: "siblings.members", // Keep the same key name as in the original query
      },
    },
    // {
    //   $unwind: { path: "$siblings.members", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
    // },
    {
      $lookup: {
        from: "stagegradesectiontimes", // Populate the stage field with Stage model
        localField: "stageGradeSection",
        foreignField: "_id", // Match against Stage's _id
        as: "stageGradeSection", // Keep the same key name as in the original query
      },
    },
    {
      $unwind: { path: "$stageGradeSection", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
    },
    {
      $lookup: {
        from: "stages", // Populate the stage field with Stage model
        localField: "stageGradeSection.stage",
        foreignField: "_id", // Match against Stage's _id
        as: "stageGradeSection.stage", // Keep the same key name as in the original query
      },
    },
    {
      $unwind: { path: "$stageGradeSection.stage", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
    },
    {
      $lookup: {
        from: "grades", // Populate the grade field with Grade model
        localField: "stageGradeSection.grade",
        foreignField: "_id", // Match against Grade's _id
        as: "stageGradeSection.grade", // Keep the same key name as in the original query
      },
    },
    {
      $unwind: { path: "$stageGradeSection.grade", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
    },
    {
      $lookup: {
        from: "sections", // Populate the section field with Section model
        localField: "stageGradeSection.section",
        foreignField: "_id", // Match against Section's _id
        as: "stageGradeSection.section", // Keep the same key name as in the original query
      },
    },
    {
      $unwind: { path: "$stageGradeSection.section", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
    },
    {
      $lookup: {
        from: "termdates", // Lookup for the termData from TermDates collection
        localField: "termId",
        foreignField: "term._id", // Match against the term array's _id
        as: "termDetails",
      },
    },
    {
      $unwind: { path: "$termDetails", preserveNullAndEmptyArrays: true }, // Unwind the termId array
    },
    {
      $lookup: {
        from: "academicyears", // Lookup for the academic_year_id from AcademicYears collection
        localField: "termDetails.academic_year_id", // Assuming termDetails contains academic_year_id
        foreignField: "_id", // Match against AcademicYears' _id
        as: "termDetails.academic_year_id",
      },
    },
    {
      $unwind: { path: "$termDetails.academic_year_id", preserveNullAndEmptyArrays: true }, // Unwind the academic_year_id array
    },
    {
      $lookup: {
        from: "academicyears", // Lookup for the academic_year_id from AcademicYears collection
        localField: "academicYearId", // Assuming termData contains academic_year_id
        foreignField: "_id", // Match against AcademicYears' _id
        as: "academicYearId",
      },
    },
    {
      $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true }, // Unwind the academic_year_id array
    },
    {
      $project: {
        loginStats: 0,
        "siblings.members.loginStats": 0
      },
    },

  ])
  usersData.loginStats = undefined;
  return usersData;
};
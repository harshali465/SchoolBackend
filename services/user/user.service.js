const UserModel = require("../../models/user.model");
const SiblingGroup = require("../../models/siblings.model");
const AppError = require("../../utils/appError");
const APIFeatures = require("../../utils/apiFeatures");
const Surat = require("../../commonDbModels/surat.model");
const AadatData = require("../../models/aadatData.model");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const Stage = require("../../models/stage.model");
const TermDates = require("../../models/termDates.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const TeacherTypeModel = require("../../models/teacherType.model");
const { WorkingDays, AcademicYears, AssignedSubjectToTeacher } = require("../../models/academics.model");
const {
    BehaviorPointCondition,
    BehaviorPointCategory,
    BehaviorPointCoupon,
    BehaviorPointCouponApproval,
    BehaviorPointAssignPoint,
    BehaviorPointPoint,
} = require("../../models/behaviourPoint.model");
const { dayAttendanceTag, classAttendanceTag, dayAttendance, attendanceCertificate, leave } = require("../../models/attendance.model");
const { TimeTable } = require('../../models/timeTable.model');

const islamicMonthMapping = {
  Muharram: "Muharram-ul-Haram",
  Safar: "Safar-ul-Muzaffar",
  "Rabiʻ I": "Rabi-ul-Awwal",
  "Rabiʻ II": "Rabi-ul-Akhar",
  "Jumada I": "Jamadil Awwal",
  "Jumada II": "Jamadil Ukhra",
  Rajab: "Rajab-ul-Asab",
  Shaʻban: "Shabaan-ul-Karim",
  Ramadan: "Ramazan-ul-Moazzam",
  Shawwal: "Shawwal-ul-Mukarram",
  "Dhuʻl-Qiʻdah": "Zilqadal Haram",
  "Dhuʻl-Hijjah": "Zilhajjil Haram",
};

module.exports.updateMe = async (userId, req, schoolConnection) => {
  // User cannot update these fields
  delete req.body.role;
  delete req.body.active;

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 12);
  }
  // 3) Handle profile picture update
  if (req.file) {
    const extension = path.extname(req.file.originalname);
    const newFilename = `${req.file.filename}${extension}`;
    const newPath = path.join(req.file.destination, newFilename);

    // Rename the file to include the correct extension
    fs.renameSync(req.file.path, newPath);

    req.body.photo = newFilename; // Save the new filename to the database
  }
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  // 4) Update user document
  const updatedUser = await SchoolUser.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};

module.exports.deleteMe = async (userId, schoolConnection) => {
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  const deletedUser = await SchoolUser.findByIdAndUpdate(userId, {
    active: false,
  });
  return deletedUser;
};

module.exports.createUser = (req, res) => {
  throw new AppError(
    "This route is not defined! Please use /signup instead",
    400
  );
};

module.exports.getUser = async (userId, islamicDay, schoolConnection) => {

  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  schoolConnection.model("TeacherType", TeacherTypeModel.schema)
  schoolConnection.model("SiblingGroup", SiblingGroup.schema)
  schoolConnection.model("Stage", Stage.schema)
  schoolConnection.model("Grade", Grade.schema)
  schoolConnection.model("Section", Section.schema)
  schoolConnection.model("AcademicYears", AcademicYears.schema)
  schoolConnection.model("TermDates", TermDates.schema)
  const AadatData1 = schoolConnection.model("AadatData", AadatData.schema);

  const currentDate = new Date();
  islamicDay = islamicDay ? islamicDay : 1
  let daysPassedInIslamicMonth = parseInt(islamicDay, 10) - 1;
  const startEnglishDate = new Date(currentDate);
  startEnglishDate.setDate(currentDate.getDate() - daysPassedInIslamicMonth);

  let [userData, surats, aadatDataRecords] =
    await Promise.all([
      SchoolUser.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(userId) },
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
            from: "teachertypes", // Populate the stage field with Stage model
            localField: "teacherType",
            foreignField: "_id", // Match against Stage's _id
            as: "teacherType", // Keep the same key name as in the original query
          },
        },
        {
          $unwind: { path: "$teacherType", preserveNullAndEmptyArrays: true }, // Unwind the siblings array
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
            as: "termId",
          },
        },
        {
          $unwind: { path: "$termId", preserveNullAndEmptyArrays: true }, // Unwind the termId array
        },
        {
          $lookup: {
            from: "academicyears", // Lookup for the academic_year_id from AcademicYears collection
            localField: "termId.academic_year_id", // Assuming termId contains academic_year_id
            foreignField: "_id", // Match against AcademicYears' _id
            as: "termId.academic_year_id",
          },
        },
        {
          $unwind: { path: "$termId.academic_year_id", preserveNullAndEmptyArrays: true }, // Unwind the academic_year_id array
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
      ]),
      Surat.find({}),
      AadatData1.find({
        studentId: new mongoose.Types.ObjectId(userId),
        suratId: { $ne: null },
      }).exec(),
    ]);

  if (!userData) {
    throw new AppError("Invalid user id", 400);
  }
  userData = userData[0]
  if (userData && userData.stageGradeSection) {
    let stageGradeSectionData = userData.stageGradeSection;
    userData["stageGradeSectionData"] = stageGradeSectionData
    userData.stageGradeSection = userData.stageGradeSection._id
  }
  if (userData && userData.address) {
    userData.address = JSON.parse(JSON.stringify(userData.address))
  }

  let startOfDay = new Date(startEnglishDate);
  startOfDay.setUTCHours(0, 0, 0, 0);


  let pipeline = [
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startOfDay, $lte: new Date() },
        aadatId: { $ne: null }
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      },
    },
    { $count: "count" }
  ];

  let formSubmittedCountResult = await AadatData1.aggregate(pipeline);

  // Log userData to confirm changes
  let formSubmittedCount = formSubmittedCountResult.length > 0 ? formSubmittedCountResult[0].count : 0;
  let formNotSubmittedCount = islamicDay - formSubmittedCount > 0 ? islamicDay - formSubmittedCount : 0;

  let readPercentage = 0;
  let suratDetails = { suratName: "", ayatNo: "" };
  if (aadatDataRecords.length > 0) {
    // Create a unique list of ayats based on surat orderName, ayatNo, and pageNumber
    const uniqueAyats = new Set(surats.map((surat) => `${surat.orderName}-${surat.ayatNo}-${surat.pageNumber}`));

    // Convert the uniqueAyats set into an array of objects and sort by ayatNo and pageNumber
    const sortedUniqueAyats = Array.from(uniqueAyats).map((ayat) => {
      const [orderName, ayatNo, pageNumber] = ayat.split("-").map(Number);
      return { orderName, ayatNo, pageNumber };
    }).sort((a, b) => {
      // Sort first by orderName, then by pageNumber, and finally by ayatNo
      if (a.orderName !== b.orderName) {
        return a.orderName - b.orderName;
      }
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      return a.ayatNo - b.ayatNo;
    });

    // Define totalPositions based on the number of sortedUniqueAyats
    const totalPositions = sortedUniqueAyats.length; // Total number of ayat positions

    // Map ayatKey (orderName-ayatNo) to its position in the sorted list
    const ayatPositions = {};
    sortedUniqueAyats.forEach((ayat, index) => {
      const ayatKey = `${ayat.orderName}-${ayat.ayatNo}`;
      ayatPositions[ayatKey] = index + 1; // Positions are 1-based
    });

    const suratMap = surats.reduce((map, surat) => {
      map[surat._id.toString()] = surat;
      return map;
    }, {});
    // Find the highest position based on the user's read data
    const highestReadPosition = aadatDataRecords.reduce(
      (maxPosition, record) => {
        const surat = suratMap[record.suratId.toString()];
        const ayatKey = `${surat.orderName}-${surat.ayatNo}`;
        const ayatPosition = ayatPositions[ayatKey];
        return ayatPosition > maxPosition ? ayatPosition : maxPosition;
      },
      0
    );

    // Calculate read percentage
    readPercentage = ((highestReadPosition / totalPositions) * 100).toFixed(2);

    // Find the surat and ayat corresponding to the highestReadPosition
    const highestAyat = sortedUniqueAyats[highestReadPosition - 1]; // -1 because positions are 1-based
    suratDetails = surats.find(
      (surat) =>
        surat.orderName === highestAyat.orderName &&
        surat.ayatNo === highestAyat.ayatNo
    );
  }

  const formattedDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(currentDate);
  return {
    ...userData,
    currentDate: formattedDate,
    formSubmittedCount,
    formNotSubmittedCount,
    suratDetails,
    suratPercentage: readPercentage,
    suratName: suratDetails.suratName,
    ayatNumber: suratDetails.ayatNo,
  };
};

module.exports.getSchoolAdmin = async (userId, schoolConnection) => {
  const SchoolUser = schoolConnection.model("User", UserModel.schema);

  let userData = await SchoolUser.findOne({ _id: new mongoose.Types.ObjectId(userId) })

  if (!userData) {
    throw new AppError("Invalid user id", 400);
  }
  if (userData && userData.address) {
    userData.address = JSON.parse(JSON.stringify(userData.address))
  }
  return userData;
}

module.exports.getAllUsers = async (query, schoolConnection) => {
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  schoolConnection.model("SiblingGroup", SiblingGroup.schema);
  const StageGradeSection = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  schoolConnection.model("Grade", Grade.schema)
  schoolConnection.model("Section", Section.schema)
  schoolConnection.model("AcademicYears", AcademicYears.schema)
  // schoolConnection.model("TermDates", TermDates.schema)
  const TermDatesModel = schoolConnection.model("TermDates", TermDates.schema);

  const { stage, grade, section, academicYearId } = query;

  let stageGradeSectionFilter = {};
  if (stage) {
    stageGradeSectionFilter.stage = stage;
  }
  if (grade) {
    stageGradeSectionFilter.grade = grade;
  }
  if (section) {
    stageGradeSectionFilter.section = section;
  }

  // Fetch stage grade sections
  if (stage || grade || section) {
    const stageGradeSections = await StageGradeSection.find(
      stageGradeSectionFilter
    ).exec();

    if (stageGradeSections.length > 0) {
      const stageGradeSectionIds = stageGradeSections.map((sgs) => sgs._id);
      query.stageGradeSection = { $in: stageGradeSectionIds };
      delete query.section;
      delete query.grade;
      delete query.stage;
    } else {
      console.warn("No stage grade sections found for the given filter.");
    }
  }
  if (academicYearId) {
    query.academicYearId = academicYearId
  }
  // Execute the search
  let usersData = await new APIFeatures(query)
    .search()
    .sort()
    .limitFields()
    .paginate()
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
    .populate("academicYearId")
    .exec(SchoolUser);

  for (let i = 0; i < usersData.data.docs.length; i++) {
    let user = usersData.data.docs[i].toObject(); // Convert to plain object

    if (user.termId && mongoose.Types.ObjectId.isValid(user.termId)) {
      let termIdObj = new mongoose.Types.ObjectId(user.termId);

      const termObj = await TermDatesModel.find({ "term._id": termIdObj }).lean();

      if (termObj.length > 0 && termObj[0].term) {
        let matchedTerm = termObj[0].term.find(t => t._id.equals(termIdObj));
        user.termDetails = matchedTerm || null;
      }
    }

    // Reassign the updated object back to the array
    usersData.data.docs[i] = user;
  }



  // Return the updated usersData
  return usersData.data;
};

module.exports.updateUser = async (userId, reqBody, file, schoolConnection) => {
  // Check if the email is being updated
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  const Sibling = schoolConnection.model("SiblingGroup", SiblingGroup.schema);
  const { email, photo: existingPhoto, familyDetails, itsNo, siblings, academicYearId, HMRNumber, deleteSiblings } = reqBody;
  if (email) {
    // Check if the new email already exists for another user
    const existingUser = await SchoolUser.findOne({ email });
    if (existingUser && existingUser._id.toString() !== userId) {
      throw new AppError("Email already exists", 400);
    }
  }

  if (itsNo) {
    const studentwithIts = await SchoolUser.findOne({ itsNo: itsNo });

    if (studentwithIts && studentwithIts._id.toString() !== userId) {
      throw new AppError("ITS number is already registered.", 400);
    }
  }

  if (HMRNumber) {
    const studentwithHMRNumber = await SchoolUser.findOne({ HMRNumber: HMRNumber });

    if (studentwithHMRNumber && studentwithHMRNumber._id.toString() !== userId) {
      throw new AppError("HMR number is already registered.", 400);
    }
  }

  let photo = existingPhoto;
  if (file) {
    const extension = path.extname(file.originalname);
    const newFilename = `${file.filename}${extension}`;
    const newPath = path.join(file.destination, newFilename);

    // Rename the file to include the correct extension
    fs.renameSync(file.path, newPath);

    photo = newFilename;

    // Optionally, delete the old photo if it's not the same
    if (existingPhoto && existingPhoto !== newFilename) {
      const oldPath = path.join("uploads/", existingPhoto);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
  }

  let existingUser = await SchoolUser.findById(userId).select("+password");
  if (reqBody.password && reqBody.password.trim()) {
    // Check if the provided password matches the existing user's password
    let checkPassword = await existingUser.correctPassword(
      reqBody.password,
      existingUser.password
    );
    // If the password doesn't match, hash the new password
    if (!checkPassword) {
      reqBody.password = await bcrypt.hash(reqBody.password, 12);
    } else {
      delete reqBody.password;
    }
  } else {
    delete reqBody.password;
  }

  const updatedData = {
    ...reqBody,
    photo,
    familyDetails: familyDetails,
    address: reqBody.address ? JSON.parse(reqBody.address) : {}
  };

  console.log(siblings, "siblings");

  if ((siblings && siblings.length > 0) || (deleteSiblings && deleteSiblings.length > 0)) {
    const SiblingGroupData = schoolConnection.model("SiblingGroup", SiblingGroup.schema);

    // Convert string IDs to ObjectIds
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const siblingIdsObj = siblings?.length > 0
      ? siblings.map(id => new mongoose.Types.ObjectId(id))
      : [];
    const deleteSiblingIdsObj = deleteSiblings?.length > 0
      ? deleteSiblings.map(id => new mongoose.Types.ObjectId(id))
      : [];

    // Find the existing sibling group for this user or any selected sibling
    let siblingGroup = await SiblingGroupData.findOne({
      $or: [
        { _id: updatedData.siblings }, // Current group of the user
        { members: { $in: siblingIdsObj } } // Any group with new siblings
      ]
    });

    if (siblingGroup) {
      const currentMembers = siblingGroup.members.map(id => id.toString());

      // Add new siblings (including userId), remove duplicates
      const membersWithAdditions = Array.from(
        new Set([...currentMembers, userIdObj.toString(), ...siblingIdsObj.map(id => id.toString())])
      );

      // Remove siblings from deleteSiblings
      const updatedMembers = membersWithAdditions.filter(
        memberId => !deleteSiblingIdsObj.some(delId => delId.toString() === memberId)
      );

      siblingGroup.members = updatedMembers.map(id => new mongoose.Types.ObjectId(id));

      if (siblingGroup.members.length === 0) {
        await siblingGroup.deleteOne();
        updatedData.siblings = undefined;
      } else {
        await siblingGroup.save();
        updatedData.siblings = siblingGroup._id;
      }
    } else if (siblingIdsObj.length > 0) {
      // Only create a new group if there are siblings to add
      const updatedSiblingsObj = Array.from(
        new Set([userIdObj.toString(), ...siblingIdsObj.map(id => id.toString())])
      ).filter(memberId => !deleteSiblingIdsObj.some(delId => delId.toString() === memberId))
        .map(id => new mongoose.Types.ObjectId(id));

      if (updatedSiblingsObj.length > 0) {
        siblingGroup = new SiblingGroupData({ members: updatedSiblingsObj });
        await siblingGroup.save();
        updatedData.siblings = siblingGroup._id;
      } else {
        updatedData.siblings = undefined;
      }
    }

    // Clean up old sibling references for removed students
    if (deleteSiblingIdsObj.length > 0) {
      await SchoolUser.updateMany(
        { _id: { $in: deleteSiblingIdsObj }, siblings: siblingGroup?._id },
        { $unset: { siblings: "" } }
      );
    }

    // Update remaining students in the group
    if (siblingGroup && siblingGroup.members.length > 0) {
      await SchoolUser.updateMany(
        { _id: { $in: siblingGroup.members } },
        { $set: { siblings: siblingGroup._id } }
      );
    }
  } else if (updatedData.siblings && deleteSiblings?.length > 0) {
    // Handle case where siblings is empty/undefined but deleteSiblings needs to clear the group
    const SiblingGroupData = schoolConnection.model("SiblingGroup", SiblingGroup.schema);
    const deleteSiblingIdsObj = deleteSiblings.map(id => new mongoose.Types.ObjectId(id));
    const siblingGroup = await SiblingGroupData.findOne({ _id: updatedData.siblings });

    if (siblingGroup) {
      const currentMembers = siblingGroup.members.map(id => id.toString());
      const updatedMembers = currentMembers.filter(
        memberId => !deleteSiblingIdsObj.some(delId => delId.toString() === memberId)
      );

      siblingGroup.members = updatedMembers.map(id => new mongoose.Types.ObjectId(id));
      if (siblingGroup.members.length === 0) {
        await siblingGroup.deleteOne();
        updatedData.siblings = undefined;
      } else {
        await siblingGroup.save();
        updatedData.siblings = siblingGroup._id;
      }

      await SchoolUser.updateMany(
        { _id: { $in: deleteSiblingIdsObj }, siblings: siblingGroup._id },
        { $unset: { siblings: "" } }
      );

      if (siblingGroup.members.length > 0) {
        await SchoolUser.updateMany(
          { _id: { $in: siblingGroup.members } },
          { $set: { siblings: siblingGroup._id } }
        );
      }
    }
  }

  if (Array.isArray(updatedData?.siblings)) {
    delete updatedData.siblings
  }

  // Update the user data
  const userData = await SchoolUser.findByIdAndUpdate(userId, updatedData, {
    new: true,
    runValidators: true,
  });

  if (!userData) {
    throw new AppError("No document found with that ID", 404);
  }

  return userData;
};

module.exports.deleteUser = async (userId, schoolConnection) => {
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  const userData = await SchoolUser.findByIdAndDelete(userId);

  if (!userData) {
    throw new AppError("No document found with that ID", 404);
  }

  return userData;
};

module.exports.deleteTeacher = async (reqBody, connection) => {
  const SchoolUser = connection.model("User", UserModel.schema);
  const { ids } = reqBody; // Corrected body to reqBody
  // Register models with the connection
  const models = {
    User: connection.model('User', UserModel.schema),
    AssignedSubjectToTeacher: connection.model('AssignedSubjectToTeacher', AssignedSubjectToTeacher.schema),
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
    stageGradeSection: connection.model('StageGradeSectionTime', StageGradeSectionTime.schema),
    TimeTable: connection.model('TimeTable', TimeTable.schema),
    // ProxyTimeTable: connection.model('ProxyTimeTable', ProxyTimeTable.schema)
  };

  let deletableIds = [];
  let inUseIds = [];

  for (let id of ids) {
    let isUsed = false;

    for (let modelName in models) {
      const exists = await models[modelName].exists({
        $or: [
          { teacher_id: id },
          { user_id: id },
          { classTeacherId: id },
          { mainTeacherId: id },
          { asstTeacherId1: id },
          { asstTeacherId2: id },
          { class_teachers: { $in: [id] } }, // Checks if id exists in an array
          { created_by: id },
          { requested_by: id },
          { issued_by: id },
          { assigned_to: id },
          { assigned_by: id },
          { teacherId: id },
          { asstTeacherId: id } // Keeping only one instance
        ]
      });

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
    await SchoolUser.deleteMany({ _id: { $in: deletableIds } });
  }
  return {
    deletedCount: deletableIds.length,
    skippedIds: inUseIds,
    message: inUseIds.length > 0
      ? `Some teacher(s) are being used and cannot be deleted.`
      : "All requested teacher(s) have been deleted successfully."
  };
};

module.exports.getAllSurat = async () => {
  const surat = await Surat.aggregate([
    {
      $sort: { orderName: 1 }, // Sort by orderName in ascending order
    },
    {
      $group: {
        _id: {
          suratName: "$suratName",
          orderName: "$orderName",
        },
        ayatDetails: {
          $push: {
            _id: "$_id",
            ayatNo: {
              $convert: {
                input: "$ayatNo",
                to: "int",
                onError: null,
                onNull: null,
              },
            },
            pageNumber: "$pageNumber",
          },
        },
      },
    },
    {
      $unwind: "$ayatDetails", // Unwind the ayatDetails array for sorting
    },
    {
      $sort: {
        "ayatDetails.ayatNo": 1,
        "ayatDetails.pageNumber": 1,
      },
    },
    {
      $group: {
        _id: {
          suratName: "$_id.suratName",
          orderName: "$_id.orderName",
        },
        ayatDetails: {
          $push: "$ayatDetails", // Recreate the ayatDetails array after sorting
        },
      },
    },
    {
      $project: {
        _id: 0,
        suratName: "$_id.suratName",
        orderName: "$_id.orderName",
        ayatDetails: 1,
      },
    },
    {
      $sort: { orderName: 1 }, // Sort the final documents by orderName
    },
  ]);

  return surat.length > 0 ? surat : [];
};

module.exports.addSibling = async (req, schoolConnection) => {
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  const Sibling = schoolConnection.model("SiblingGroup", SiblingGroup.schema);
  const { itsNo, password } = req.body;
  const studentId = req.user._id; // The logged-in student

  // Find the user to be added to the sibling group based on itsNo
  const user = await SchoolUser.findOne({ itsNo }).select("+password");

  if (!user) {
    throw new AppError("No student found with that ITS number", 404);
  }

  // Check the password for the user being added
  if (!(await user.correctPassword(password, user.password))) {
    throw new AppError("Wrong Password", 401);
  }

  // Create an array with both user IDs (the logged-in user and the one being added)
  const siblingArray = [studentId, user._id];

  // Check if a SiblingGroup already exists for either of these users
  let siblingGroup = await Sibling.findOne({
    members: { $in: siblingArray },
  });

  if (!siblingGroup) {
    // If no sibling group exists, create a new one with both users
    siblingGroup = new Sibling({
      members: siblingArray,
    });
    await siblingGroup.save();
  } else {
    // Check if both users are already in the group
    const bothMembersExist = siblingArray.every((id) =>
      siblingGroup.members.some((member) => member.toString() === id.toString())
    );

    if (bothMembersExist) {
      // Return early if both members already exist in the sibling group
      throw new AppError("Sibling already exists", 400);
    }

    // Add both users to the group if they aren't already members
    siblingArray.forEach((id) => {
      if (
        !siblingGroup.members.some(
          (member) => member.toString() === id.toString()
        )
      ) {
        siblingGroup.members.push(id); // Only add if not already present
      }
    });
    await siblingGroup.save();
  }

  // Update the sibling group reference for both users
  await SchoolUser.updateMany(
    { _id: { $in: siblingArray } },
    { siblings: siblingGroup._id }
  );

  return siblingGroup; // Return the updated sibling group
};

module.exports.getSiblings = async (req, schoolConnection) => {
  try {
    const studentId = req.user._id;
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    const Sibling = schoolConnection.model("SiblingGroup", SiblingGroup.schema);

    // Find the user by student ID
    const user = await SchoolUser.findById(studentId);
    if (!user) {
      throw new AppError("No student found with that ID", 404);
    }

    // Fetch the sibling group
    const siblingGroup = await Sibling.findById(user.siblings).populate(
      "members"
    );

    if (!siblingGroup || siblingGroup.members.length === 0) {
      throw new AppError("No siblings found for this student", 404);
    }

    // Filter out the current user from the siblings list
    const siblings = siblingGroup.members.filter(
      (member) => !member._id.equals(user._id)
    );

    return siblings;
  } catch (error) {
    throw error;
  }
};

module.exports.removeSibling = async (req, schoolConnection) => {
  const { siblingId } = req.body;
  const studentId = req.user._id;
  const SchoolUser = schoolConnection.model("User", UserModel.schema);
  const Sibling = schoolConnection.model("SiblingGroup", SiblingGroup.schema);
  // Find the user and sibling by ITS number
  const user = await SchoolUser.findOne({ _id: studentId });
  let siblingToRemove = await SchoolUser.findOne({ _id: siblingId });
  if (!user) {
    throw new AppError("User or sibling not found", 404);
  }

  // Fetch the sibling group
  const siblingGroup = await Sibling.findOne({ _id: user.siblings });
  if (!siblingGroup) {
    throw new AppError("No sibling found for this user", 404);
  }

  // Check if the sibling is part of the group
  if (!siblingGroup.members.includes(siblingId)) {
    throw new AppError("The specified sibling is not part of the group", 400);
  }

  // Remove the sibling from the group
  siblingGroup.members = siblingGroup.members.filter(
    (member) => !member.equals(siblingId)
  );

  // Save or delete the group based on the remaining members
  if (siblingGroup.members.length > 1) {
    await siblingGroup.save();
  } else {
    // If only one member remains, delete the sibling group
    await Sibling.findByIdAndDelete(siblingGroup._id);
  }

  // Update the sibling's reference in the User model
  siblingToRemove.siblings = null;
  await siblingToRemove.save();

  return siblingToRemove;
};

module.exports.findTeacherByEmailAndItsNo = async (itsNo, email, schoolConnection) => {
  try {
    const SchoolUser = schoolConnection.model("User", UserModel.schema);

    // Check for ITS number only if provided
    const itsNoExists = itsNo ? await SchoolUser.findOne({ itsNo }) : null;
    if (itsNoExists) {
      return { exists: true, field: "itsNo" };
    }

    // Check for email
    const emailExists = await SchoolUser.findOne({ email });
    if (emailExists) {
      return { exists: true, field: "email" };
    }

    // If neither exists
    return { exists: false };
  } catch (error) {
    console.error("Error finding user by ITS number or email:", error);
    throw new Error("There was a problem finding the user by ITS number or email");
  }
};
const userService = require("../../services/user");
const XLSX = require("xlsx");
const fs = require("fs");
const UserModel = require("../../models/user.model");
const mongoose = require("mongoose");
const moment = require("moment");
const AadatDataModel = require("../../models/aadatData.model");
const Surat = require("../../commonDbModels/surat.model");
const AadatModel = require("../../models/aadat.model");
const School = require("../../commonDbModels/school.model");
const Categories = require("../../models/category.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const Stage = require("../../models/stage.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const transporter = require("../../utils/sendMail");
const AppError = require("../../utils/appError");
const TeacherTypeModel = require("../../models/teacherType.model");
const { AcademicYears } = require("../../models/academics.model");
const TermDates = require("../../models/termDates.model");
const ObjectId = mongoose.Types.ObjectId;
module.exports.getMe = (req, res, next) => {
  const userData = req.user;
  res.status(200).json({
    status: "success",
    data: userData,
  });
};

module.exports.updateMe = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const updatedUser = await userService.updateMe(
      req.user.id,
      req,
      schoolConnection
    );

    res.status(200).json({ status: "success", data: updatedUser, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteMe = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userData = await userService.deleteMe(
      req.params.id,
      schoolConnection
    );
    res.status(204).json({
      status: "success",
      data: userData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.createUser = (req, res, next) => {
  res.status(400).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

module.exports.getUser = async (req, res, next) => {
  let schoolConnection;
  try {
    // Find school by ID and populate module information
    const school = await School.findById(req.user.schoolId)
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userData = await userService.getUser(req.user._id, req.query.islamicDay, schoolConnection);
    const data = {
      ...userData,
      schoolName: school.schoolName,
      schoolLogo: school.schoolLogo
    }
    res.status(200).json({
      status: "success",
      data: data,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    let userData = await userService.getAllUsers(req.query, schoolConnection);

    // Modify userData to remove the loginStats field
    userData.docs = userData.docs.map((item) => {
      const { loginStats, ...rest } = item;
      return rest; // Return the new object without loginStats
    });
    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      data: userData,
      query: req.query,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateUser = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    let { stage, section, grade } = req.body;
    if (stage && section && section) {
      const StageGradeSectionTimeModel = await schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
      const stageGradeSection = await StageGradeSectionTimeModel.findOne({
        stage,
        section,
        grade,
      });
      if (!stageGradeSection) {
        throw new Error("Invalid Stage, Grade, or Section.");
      } else {
        req.body.stageGradeSection = stageGradeSection._id;
      }
    }
    const userData = await userService.updateUser(
      req.params.id,
      req.body,
      req.file,
      schoolConnection
    );

    res.status(200).json({ status: "Data successfully updated", userData, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteUser = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    await userService.deleteUser(req.params.id, schoolConnection);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.createStudent = async (req, res, next) => {
  try {
    const { itsNo } = req.body;
    let school = await School.findById(req.body.schoolId);
    const uniqueIdPadded = school.uniqueId.toString().padStart(4, '0');
    let sName = school.schoolName.trim().replace(/\s+/g, "_");
    let totalStudent = school.numberOfStudents;
    let schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const checkStudent = await userService.findStudentByEmail(
      itsNo,
      schoolConnection
    );
    if (checkStudent) {
      return res.status(400).json({
        status: "fail",
        message: "ITS Number already exists",
      });
    }

    const studentData = await userService.createStudent(
      req,
      schoolConnection,
      totalStudent
    );

    if (studentData) {
      let fatherEmail = studentData.familyDetails.fatherEmail;
      let motherEmail = studentData.familyDetails.motherEmail;

      let url = `${process.env.STUDENT_TEACHER_BASE_URL}student/login/${sName}/${uniqueIdPadded}`
      const info = await transporter.sendMail({
        from: process.env.USERMAILSENDER, // Sender address
        to: [fatherEmail, motherEmail], // Contact person's email
        subject: "Student Account Details", // Email subject
        html: ` 
          <p>Dear Parent,</p>

          <p>Please find the login credentials for <strong>${studentData.firstName} ${studentData.lastName}</strong></p>

          <p><strong>URL:</strong> ${url}</p>
          <p><strong>ITS Number:</strong> ${req.body.itsNo}</p>
          <p><strong>Password:</strong> ${req.body.password}</p>
          
          <p>Thank you,</p>
          <p><strong>${school.schoolName}</strong></p>`, // Email body with credentials
      });
      await schoolConnection.close();
      res.status(201).json({ status: true, message: "Student Added Successfully", data: studentData, });
    } else {
      res.status(400).json({ status: false, message: "Something Went Wrong", data: studentData, });
    }

  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.dummyRoute = async (req, res, next) => {
  const query = req.query;

  res.status(201).json({ status: "success", data: { query, msg: "dummyroute is working well" }, });
};

module.exports.deletestudent = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await userService.deletestudent(req.body, schoolConnection);
    res.status(201).json({ status: "success", result, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateActive = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await userService.updateActive(req.body, schoolConnection);
    res.status(201).json({ status: "success", result, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getStudents = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await userService.getStudents(
      req.params.id,
      schoolConnection
    );
    res.status(201).json({ status: "success", data: result, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getLoginHistory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userId = req.params.id;
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    const user = await SchoolUser.findById(userId).select("loginStats");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const loginStats = user.loginStats.slice(-7).reverse();

    const formatTime = (date) => {
      const options = { hour: "numeric", minute: "numeric", hour12: true };
      return date.toLocaleString("en-US", options);
    };

    const formattedStats = loginStats.map((stat, index) => {
      const loginTime = new Date(stat.loginTime);
      const logoutTime = stat.logoutTime ? new Date(stat.logoutTime) : null;

      const totalTimeInMinutes =
        logoutTime ? Math.abs(logoutTime - loginTime) / 1000 / 60 : null;

      // Calculate hours and minutes
      const hours =
        totalTimeInMinutes ? Math.floor(totalTimeInMinutes / 60) : 0;
      const minutes =
        totalTimeInMinutes ? Math.floor(totalTimeInMinutes % 60) : 0;

      return {
        srNo: index + 1,
        date: new Date(stat.loginDate).toLocaleDateString(),
        loginTime: formatTime(loginTime),
        logoutTime: logoutTime ? formatTime(logoutTime) : "Still Logged In",
        totalTime:
          totalTimeInMinutes !== null ?
            `${hours} hours, ${minutes} minutes`
            : "N/A",
      };
    });
    res.status(200).json({
      status: "success",
      data: {
        loginHistory: formattedStats,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllSurats = async (req, res, next) => {
  try {
    const result = await userService.getAllSurat(); //await Surat.distinct('suratName');
    res.status(200).json({ status: "success", data: result, });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.ImportStudents = async (req, res, next) => {
  let schoolConnection;
  try {
    // Fetch the school and the total number of students allowed
    let school = await School.findById(req.user.schoolId);
    const uniqueIdPadded = school.uniqueId.toString().padStart(4, '0');
    let sName = school.schoolName.trim().replace(/\s+/g, "_");
    let totalStudent = school.numberOfStudents;
    // let { academicYearId } = req.query
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const duplicateEntries = [];
    let successfullyImported = 0;
    let failedToImport = 0;

    for (const data of jsonData) {
      let User = schoolConnection.model("User", UserModel.schema);
      const studentsCount = await User.countDocuments({ role: 'student' });

      if (studentsCount >= totalStudent) {
        throw new AppError(`Number of students has exceeded the limit of ${totalStudent}`, 400);
      }

      // Check for duplicate ITS number
      const existingUser = await User.findOne({ itsNo: data.itsNo });
      if (existingUser) {
        await addDuplicateEntry(duplicateEntries, data, "Duplicate ITS number");
        failedToImport++;
        continue;
      }

      if (data.HMRNumber) {
        const existingUserWithHMR = await User.findOne({ HMRNumber: data.HMRNumber });
        if (existingUserWithHMR) {
          await addDuplicateEntry(duplicateEntries, data, "Duplicate HMR number");
          failedToImport++;
          continue;
        }
      }


      const StageModel = schoolConnection.model("Stage", Stage.schema);
      const TermDatesModel = schoolConnection.model("TermDates", TermDates.schema);
      const GradeModel = schoolConnection.model("Grade", Grade.schema);
      const SectionModel = schoolConnection.model("Section", Section.schema);
      const StageGradeSectionTimeModel = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
      const AcademicYearsModel = schoolConnection.model("AcademicYears", AcademicYears.schema);
      const stage = await StageModel.findOne({ stage: data.stage }).select("_id");
      const grade = await GradeModel.findOne({ grade: data.grade }).select("_id");
      const section = await SectionModel.findOne({ section: data.section }).select("_id");

      if (!stage || !grade || !section) {
        const missingField = !stage ? "Stage" : !grade ? "Grade" : "Section";
        await addDuplicateEntry(duplicateEntries, data, `${missingField} not found`);
        failedToImport++;
        continue;
      }

      const stageGradeSection = await StageGradeSectionTimeModel.findOne({ stage: stage._id, grade: grade._id, section: section._id });
      if (!stageGradeSection) {
        await addDuplicateEntry(duplicateEntries, data, "Invalid stage, grade, and section combination");
        failedToImport++;
        continue;
      }
      let academicYearId;
      let termId;
      if (data.academicYear.includes("-")) {
        let [startYear, endYear] = data.academicYear.split("-").map(year => year.trim());
        let findAcademicYear = await AcademicYearsModel.findOne({
          start_year: String(startYear),  // Ensure it's a string
          end_year: String(endYear)       // Ensure it's a string
        });
        if (findAcademicYear) {
          academicYearId = findAcademicYear._id
          let findTerm = await TermDatesModel.findOne({
            academic_year_id: findAcademicYear._id,
            "term.term": data.term // Match the term inside the array
          });
          if (findTerm) {
            // Find the specific term object inside the array
            let matchedTerm = findTerm.term.find(t => t.term === data.term);

            if (matchedTerm) {
              termId = matchedTerm._id; // Get the _id of the matching term
              console.log("Matching Term ID:", termId);
            } else {
              await addDuplicateEntry(duplicateEntries, data, "Term not found");
              failedToImport++;
              continue;
            }
          } else {
            await addDuplicateEntry(duplicateEntries, data, "Term not found");
            failedToImport++;
            continue;
          }
        } else {
          await addDuplicateEntry(duplicateEntries, data, "Academic year not found");
          failedToImport++;
          continue;
        }
        console.log(startYear, endYear);
      } else {
        await addDuplicateEntry(duplicateEntries, data, "Invalid academic year format");
        failedToImport++;
        continue;
      }

      const student = new User({
        firstName: data.firstName,
        lastName: data.lastName,
        itsNo: data.itsNo,
        HMRNumber: data.HMRNumber,
        email: data.email,
        gender: data.gender,
        role: "student",
        class: data.class,
        academicYearId: academicYearId,
        fees: {
          total: data.totalFees,
          paid: data.paidFees,
        },
        familyDetails: {
          fatherFirstName: data.fatherFirstName,
          fatherLastName: data.fatherLastName,
          fatherEmail: data.fatherEmail,
          fatherPhone: data.fatherPhone,
          motherFirstName: data.motherFirstName,
          motherLastName: data.motherLastName,
          motherEmail: data.motherEmail,
          motherPhone: data.motherPhone,
        },
        behaviorPoints: {
          positivePoints: data.positivePoints,
          negativePoints: data.negativePoints,
        },
        password: data.password,
        schoolId: req.user.schoolId,
        stageGradeSection: stageGradeSection._id,
        house: data.house,
        year: data.year,
        termId: termId
      });

      await student.save();

      const fatherEmail = data.fatherEmail;
      const motherEmail = data.motherEmail;
      let url = `${process.env.STUDENT_TEACHER_BASE_URL}student/login/${sName}/${uniqueIdPadded}`
      const info = await transporter.sendMail({
        from: process.env.USERMAILSENDER, // Sender address
        to: [fatherEmail, motherEmail], // Contact person's email
        subject: "Student Account Details", // Email subject
        html: ` 
          <p>Dear Parent,</p>

          <p>Please find the login credentials for <strong>${data.firstName} ${data.lastName}</strong></p>

          <p><strong>URL:</strong> ${url}</p>
          <p><strong>ITS Number:</strong> ${data.itsNo}</p>
          <p><strong>Password:</strong> ${data.password}</p>
          
          <p>Thank you,</p>
          <p><strong>${school.schoolName}</strong></p>`, // Email body with credentials
      });

      successfullyImported++;
    }

    res.status(201).json({ success: true, message: "Students imported successfully", duplicateEntries, successfullyImported, failedToImport, });

  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) await schoolConnection.close();
    if (req.file) fs.unlink(req.file.path, (err) => { if (err) console.error("Failed to delete the file", err); });
  }

  async function addDuplicateEntry(array, data, reason) {
    array.push({ ...data, reason });
  }
};

module.exports.getStudentReport = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    let AadatData = schoolConnection.model("AadatData", AadatDataModel.schema);
    schoolConnection.model("Aadat", AadatModel.schema);
    schoolConnection.model("Category", Categories.schema);

    const { studentId, startDate, endDate } = req.query;
    // Validate studentId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid studentId" });
    }

    const start = moment(startDate, "DD-MM-YYYY").startOf("day").toDate();
    const end = moment(endDate, "DD-MM-YYYY").endOf("day").toDate();
    // Fetch AadatData records
    const data = await AadatData.find({
      studentId: new mongoose.Types.ObjectId(studentId),
      createdAt: { $gte: start, $lte: end },
      aadatId: { $ne: null }
    }).populate({
      path: "aadatId",
      select: "name category responseType customField responsetypeCustomField",
      populate: {
        path: "category",
        select: "name",
      },
    });
    // Calculate formSubmittedCount using aggregation
    const formSubmittedCount = await AadatData.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          createdAt: { $gte: start, $lte: end },
          aadatId: { $ne: null }
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $count: "uniqueDates",
      },
    ]);
    const totalDaysInRange = moment(end).diff(moment(start), "days") + 1;
    const formSubmittedCountValue = formSubmittedCount.length > 0 ? formSubmittedCount[0].uniqueDates : 0;
    const formNotSubmittedCount = totalDaysInRange - formSubmittedCountValue;
    const formSubmissionPercentage = ((formSubmittedCountValue / totalDaysInRange) * 100).toFixed(2);

    const suratData = await AadatData.findOne(
      { studentId: studentId, suratId: { $ne: null } },
      {},
      { sort: { createdAt: -1 } }
    );
    let surat = {};
    if (suratData && suratData.suratId) {
      surat = await Surat.findById(suratData.suratId);
    }

    // Group data by categories using Map
    const categoriesMap = new Map();
    data.forEach((item) => {
      if (item.aadatId) {
        const { aadatId, customField, customType, yesno } = item;
        const { name: aadatName, category, responseType } = aadatId;
        const categoryName = category?.name || "";

        if (!categoriesMap.has(category._id.toString())) {
          categoriesMap.set(category._id.toString(), {
            _id: category._id.toString(),
            categoryName,
            aadats: [],
          });
        }

        const categoryObj = categoriesMap.get(category._id.toString());
        let aadat = categoryObj.aadats.find((a) => a.aadatName === aadatName);

        if (!aadat) {
          aadat = {
            aadatName,
            submissions: [],
          };
          categoryObj.aadats.push(aadat);
        }

        const customFieldCount = customField?.reduce((acc, field) => {
          const fieldName = field.fieldTitle || "custom";
          if (!acc[fieldName]) acc[fieldName] = 0;
          acc[fieldName] += 1;
          return acc;
        }, {});
        const customTypeCount = customType?.reduce((acc, field) => {
          const fieldName = field.fieldTitle || "custom type";
          if (!acc[fieldName]) acc[fieldName] = 0;
          acc[fieldName] += 1;
          return acc;
        }, {});
        const yesnoCount = {
          yes: yesno === "yes" ? 1 : 0,
          no: yesno === "no" ? 1 : 0,
        };
        Object.keys(customFieldCount || {}).forEach((fieldName) => {
          let submission = aadat.submissions.find(
            (sub) => sub.fieldName === fieldName && sub.fieldType === "custom"
          );
          if (!submission) {
            submission = { fieldName, fieldType: "custom", count: 0 };
            aadat.submissions.push(submission);
          }
          submission.count += customFieldCount[fieldName];
        });

        Object.keys(customTypeCount || {}).forEach((fieldName) => {
          let submission = aadat.submissions.find(
            (sub) => sub.fieldName === fieldName && sub.fieldType === "custom"
          );
          if (!submission) {
            submission = { fieldName, fieldType: "custom", count: 0 };
            aadat.submissions.push(submission);
          }
          submission.count += customTypeCount[fieldName];
        });

        Object.keys(yesnoCount).forEach((fieldName) => {
          let submission = aadat.submissions.find(
            (sub) => sub.fieldName === fieldName && sub.fieldType === "yesno"
          );
          if (!submission) {
            submission = { fieldName, fieldType: "yesno", count: 0 };
            aadat.submissions.push(submission);
          }
          submission.count += yesnoCount[fieldName];
        });
      }
    });

    let data1 = Array.from(categoriesMap.values());

    res.status(200).json({ status: "success", data: data1, formSubmittedCount: formSubmittedCountValue, formNotSubmittedCount, formSubmissionPercentage, totalDays: totalDaysInRange, surat, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getSchoolAdmin = async (req, res, next) => {
  let schoolConnection;
  try {
    const school = await School.findById(req.user.schoolId).populate({
      path: "modulesActivated.moduleId", // Populate the moduleId with the Module schema data
    });
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userData = await userService.getSchoolAdmin(req.user._id, schoolConnection);
    res.status(200).json({
      status: "success",
      data: { userData, school },
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getRoleWiseUser = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const user = schoolConnection.model("User", UserModel.schema);

    // Fetch user data based on the role query parameter
    const userData = await user.find({ role: req.query.role });

    // Send the success response
    res.status(200).json({ status: "success", data: userData, });
  } catch (error) {
    console.error(error);

    // Pass the error to the error-handling middleware
    if (!res.headersSent) {
      next(error);
    }
  } finally {
    // Close the school connection safely
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getUserBirthday = async (req, res, next) => {
  let schoolConnection;
  try {
    const { startDate, endDate, search, grade, section,userType } = req.query;

    // Validate and parse dates
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ status: false, message: "Invalid date format." });
      }

      if (start > end) {
        return res.status(400).json({ status: false, message: "Start date cannot be after end date." });
      }
    } else {
      start = new Date();
      end = new Date();
      end.setDate(start.getDate() + 7); // Default to 7-day range
    }

    // Set start and end to the beginning and end of the day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Extract only the month and day for comparison
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();

    // Establish a connection to the school database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Define models
    const User = schoolConnection.model("User", UserModel.schema);
    schoolConnection.model("TeacherType", TeacherTypeModel.schema);
    const StageGradeSectionTimeModel = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    schoolConnection.model("Stage", Stage.schema);
    schoolConnection.model("Grade", Grade.schema);
    schoolConnection.model("Section", Section.schema);

    // Build the query filter object
    const filter = { role: { $in: ["teacher", "student"] } };

    // Add search conditions if search query exists
    if (search) {
      const searchRegex = new RegExp(`.*${search}.*`, "i");
      const nameConditions = search.includes(" ")
        ? (() => {
            const [firstNameTerm, ...lastNameTerms] = search.split(" ");
            const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, "i");
            const lastNameRegex = new RegExp(`.*${lastNameTerms.join(" ")}.*`, "i");
            return {
              $or: [
                { firstName: firstNameRegex },
                { lastName: lastNameRegex },
              ],
            };
          })()
        : {
            $or: [{ firstName: searchRegex }, { lastName: searchRegex }],
          };

      filter.$or = [nameConditions];
    }

    if (grade || section) {
      const stageGradeFilter = {};

      if (grade) {
        stageGradeFilter.grade = ObjectId.isValid(grade) ? new ObjectId(grade) : grade;
      }
      if (section) {
        stageGradeFilter.section = ObjectId.isValid(section) ? new ObjectId(section) : section;
      }

      // Fetch stage-grade-section IDs
      const stageGradeSection = await StageGradeSectionTimeModel.find(stageGradeFilter).select("_id");
      const sectionIds = stageGradeSection.map((item) => item._id);
      filter.stageGradeSection = { $in: sectionIds };
    }

    if(userType){
      filter.role = userType;
    }

    // Fetch users with filter
    const users = await User.find(filter)
      .select("itsNo firstName lastName role photo stageGradeSection teacherType dob")
      .populate({
        path: "stageGradeSection",
        select: "grade section",
        populate: [
          { path: "stage", select: "stage" },
          { path: "grade", select: "grade" },
          { path: "section", select: "section" },
        ],
      })
      .populate({
        path: "teacherType",
        select: "type",
      })
      .lean();

    // Filter users based on date and month
    const filteredUsers = users.filter((user) => {
      const dob = new Date(user.dob);
      const dobMonth = dob.getMonth() + 1;
      const dobDay = dob.getDate();

      // Check if dob falls within the range (considering month and day only)
      return (
        (dobMonth > startMonth || (dobMonth === startMonth && dobDay >= startDay)) &&
        (dobMonth < endMonth || (dobMonth === endMonth && dobDay <= endDay))
      );
    });

    // Return the response
    return res.status(200).json({
      status: true,
      data: filteredUsers,
    });
  } catch (error) {
    console.error("Error fetching user birthdays:", error.message);
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching user birthdays.",
    });
  } finally {
    // Close database connection
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
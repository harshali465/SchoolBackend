const UserModel = require("../../models/user.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");
const userService = require("../../services/user");
const XLSX = require("xlsx");
const fs = require("fs");
const TeacherTypeModel = require("../../models/teacherType.model");
const path = require("path");
const APIFeatures = require("../../utils/apiFeatures");
const transporter = require("../../utils/sendMail");
const School = require("../../commonDbModels/school.model");
const { AcademicYears } = require("../../models/academics.model");
const { leave } = require("../../models/attendance.model")
const { BehaviorPointCategory, BehaviorPointAssignPoint,} = require("../../models/behaviourPoint.model");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

module.exports.createTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    const { email, firstName, middleName, lastName, dob, itsNo, role, password, contactPersonMobile, WhatsAppNumber, HomeNumber,
      schoolId, address, teacherType, bloodGroup, notificationPreference, isProxyTeacher } = req.body;
    const school = await School.findById(schoolId)
    let sName = school.schoolName.trim().replace(/\s+/g, "_");
    const uniqueIdPadded = school.uniqueId.toString().padStart(4, '0');
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    const checkTeacher = await userService.findTeacherByEmailAndItsNo(
      itsNo,
      email,
      schoolConnection
    );
    if (checkTeacher.exists) {
      const message = checkTeacher.field === "itsNo" ? "ITS number already exists" : "Email already exists";

      return res.status(400).json({
        status: "fail",
        message,
      });
    }

    let photo = "";
    // Handle photo if uploaded
    if (req.file) {
      const extension = path.extname(req.file.originalname);
      const newFilename = `${req.file.filename}${extension}`;
      const newPath = path.join(req.file.destination, newFilename);
      fs.renameSync(req.file.path, newPath); // Rename the file to include the correct extension
      photo = newFilename;
    }

    // Define the User model for this new connection
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    // Create the new teacher
    const teacher = new SchoolUser({
      firstName,
      middleName,
      lastName,
      email,
      dob,
      itsNo,
      role,
      password,
      contactPersonMobile,
      WhatsAppNumber,
      HomeNumber,
      schoolId,
      address: address ? JSON.parse(address) : null,
      teacherType,
      bloodGroup,
      photo,
      notificationPreference,
      isProxyTeacher: (isProxyTeacher != null || isProxyTeacher != undefined || isProxyTeacher != 'undefined' || isProxyTeacher != 'null') ? isProxyTeacher : false,
      // academicYearId
    });

    let teacherData = await teacher.save();
    if (teacherData) {
      let url = `${process.env.STUDENT_TEACHER_BASE_URL}teacher/login/${sName}/${uniqueIdPadded}`
      const info = await transporter.sendMail({
        from: process.env.USERMAILSENDER, // Sender address
        to: [teacherData.email], // Contact person's email
        subject: "Teacher Account Details", // Email subject
        text: ` Dear Teacher,

        Here are your login credentials

        URL: ${url},
        Email: ${teacherData.email}, 
        Password: ${password}`, // Email body with credentials
      });

      await schoolConnection.close();
      res.status(201).json({ status: true, message: "Teacher Added Successfully", data: teacherData, });
    } else {
      res.status(400).json({ status: false, message: "Something Went Wrong", data: teacherData, });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.getLoginHistory = async (req, res, next) => {
  try {
    let schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userId = req.params.id;
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    const user = await SchoolUser.findById(userId).select("loginStats");

    if (!user) {
      return next(new AppError("Teacher not found", 404));
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
      const hours = totalTimeInMinutes ? Math.floor(totalTimeInMinutes / 60) : 0;
      const minutes = totalTimeInMinutes ? Math.floor(totalTimeInMinutes % 60) : 0;

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
    res.status(200).json({ status: "success", data: { loginHistory: formattedStats, }, });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.ImportTeachers = async (req, res, next) => {
  let schoolConnection;
  try {
    let school = await School.findById(req.user.schoolId);
    const uniqueIdPadded = school.uniqueId.toString().padStart(4, '0');
    let sName = school.schoolName.trim().replace(/\s+/g, "_");
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const file = req.file;
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const duplicateEntries = [];
    let successfullyImported = 0;
    let failedToImport = 0;
    const AcademicYearModel = schoolConnection.model('AcademicYears', AcademicYears.schema);
    const getCurrentAcademicYear = await AcademicYearModel.findOne({is_current_year : true})
    for (const data of jsonData) {
      let User = schoolConnection.model("User", UserModel.schema);

      // Check for duplicate ITS number
      const existingUser = await User.findOne({ itsNo: data.itsNo });
      if (existingUser) {
        await addDuplicateEntry(duplicateEntries, data, "Duplicate ITS number");
        failedToImport++;
        continue;
      }

      const TeacherTypeM = schoolConnection.model("TeacherType", TeacherTypeModel.schema);

      const teacherType = await TeacherTypeM.findOne({ type: data.teacherType }).select("_id");

      if (!teacherType) {
        await addDuplicateEntry(duplicateEntries, data, `Teacher Type not found`);
        failedToImport++;
        continue;
      }
      let academicYearId = null
      if(getCurrentAcademicYear){
        academicYearId = getCurrentAcademicYear._id
      }
      // Create the teacher object, including the address structure
      const teacher = new User({
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        email: data.email,
        dob: data.dob,
        itsNo: data.itsNo,
        role: data.role || "teacher",
        password: data.password,
        contactPersonMobile: data.contactPersonMobile,
        WhatsAppNumber: data.WhatsAppNumber,
        HomeNumber: data.HomeNumber,
        schoolId: data.schoolId,
        bloodGroup: data.bloodGroup,
        address: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
        },
        teacherType: teacherType._id,
        schoolId: req.user.schoolId,
      });
      // if(academicYearId){
      //   teacher.academicYearId = academicYearId
      // }

      await teacher.save();

      let url = `${process.env.STUDENT_TEACHER_BASE_URL}teacher/login/${sName}/${uniqueIdPadded}`
      const info = await transporter.sendMail({
        from: process.env.USERMAILSENDER, // Sender address
        to: [data.email], // Contact person's email
        subject: "Teacher Account Details", // Email subject
        text: ` Dear Teacher,

        Here are your login credentials

        URL: ${url},
        Email: ${data.email}, 
        Password: ${data.password}`, // Email body with credentials
      });

      successfullyImported++;
    }

    // Delete the uploaded file
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error(err);
        res.status(500).json("Failed to delete the file");
        return;
      }

      res.status(201).json({
        success: true,
        message: "Teachers imported successfully",
        duplicateEntries,
        successfullyImported,
        failedToImport,
      });


    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
  async function addDuplicateEntry(array, data, reason) {
    array.push({ ...data, reason });
  }
};

module.exports.updateTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userData = await userService.updateUser(
      req.params.id,
      req.body,
      req.file,
      schoolConnection
    );
    res.status(200).json({
      status: true,
      message: "Teacher updated successfully",
      data: userData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.getAllTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    const leaveModel = schoolConnection.model("leave", leave.schema);
    schoolConnection.model("TeacherType", TeacherTypeModel.schema);
    schoolConnection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    const BehaviorPointAssignPointModel = schoolConnection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    // Fetch the teacher's data and populate the teacherType
    // schoolConnection.model('AcademicYears', AcademicYears.schema);
    const teacherData = await new APIFeatures(req.query)
      .search()
      .sort()
      .limitFields()
      .paginate()
      .populate("teacherType")
      // .populate("academicYearId")
      .exec(SchoolUser);


    if (!teacherData) {
      throw new AppError("Invalid user id", 400);
    }
    let current = new Date().getTime();
    let modifiedTeachers = await Promise.all(
      teacherData.data.docs.map(async (teacher) => {
        let teacherObj = teacher.toObject(); // Convert to plain object

        const leaveRequests = await leaveModel.find({
          requested_by: teacherObj._id,
          is_approved: true
        }).lean();

        if (leaveRequests.length > 0) {
          // Filter leave requests manually since start_date and end_date are strings
          teacherObj.leaveRequests = leaveRequests.filter(leave => {
            let startDate = new Date(leave.start_date).getTime();
            let endDate = new Date(leave.end_date).getTime();
            return startDate <= current && endDate >= current;
          });
        } else {
          teacherObj.leaveRequests = [];
        }

        const result = await BehaviorPointAssignPointModel.aggregate([
          {
            $lookup: {
              from: 'behaviorpointcategories', // Make sure this matches the actual collection name in MongoDB
              localField: 'category_id',
              foreignField: '_id',
              as: 'category'
            }
          },
          { $unwind: '$category' }, // Unwind to access category data
          {
            $group: {
              _id: null,
              totalPointsReceived: {
                $sum: {
                  $cond: [{ $eq: ['$assigned_to', new ObjectId(teacherObj._id)] }, '$category.point', 0]
                }
              },
              totalPointsGiven: {
                $sum: {
                  $cond: [{ $eq: ['$assigned_by', new ObjectId(teacherObj._id)] }, '$category.point', 0]
                }
              }
            }
          }
        ]);
        teacherObj.behaviourPoints = result.length > 0 ? result[0] : { totalPointsReceived: 0, totalPointsGiven: 0 };
        return teacherObj;
      })
    );

    res.status(200).json({
      status: "success",
      data: modifiedTeachers,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.getTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const userId = req.params.id;
    const SchoolUser = schoolConnection.model("User", UserModel.schema);
    schoolConnection.model("TeacherType", TeacherTypeModel.schema);
    // Fetch the teacher's data and populate the teacherType
    const teacherData = await SchoolUser.findById(userId)
      .populate("teacherType")
      // .populate("academicYearId")
      .select("-loginStats");

    if (!teacherData) {
      throw new AppError("Invalid user id", 400);
    }
    res.status(200).json({
      status: "success",
      data: teacherData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.deleteTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    let data = await userService.deleteTeacher(req.body, schoolConnection); // Corrected req.pbody to req.body
    res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.error(error);
    next(error); // Pass error to middleware for centralized error handling
  } finally {
    if (schoolConnection) {
      await schoolConnection.close(); // Ensure proper cleanup
    }
  }
};

module.exports.updateStatusTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await userService.updateActive(req.body, schoolConnection);
    res.status(201).json({
      status: "success",
      result,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};
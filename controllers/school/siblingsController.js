const UserModel = require("../../models/user.model");
const SchoolModel = require("../../commonDbModels/school.model");
const userService = require("../../services/user");
const createSendToken = require("../../controllers/school/authController");
const AppError = require("../../utils/appError");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");

module.exports.addSibling = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    await userService.addSibling(req, schoolConnection);

    res.status(201).json({
      message: "Sibling added successfully",
      success: true,
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

module.exports.getSibling = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const siblings = await userService.getSiblings(req, schoolConnection);

    res.status(200).json({
      message: "Siblings list",
      siblings,
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

module.exports.removeSibling = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const siblingGroup = await userService.removeSibling(req, schoolConnection);

    res.status(200).json({
      message: "Sibling Removed successfully",
      success: true,
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

module.exports.swithSibling = async (req, res, next) => {
  try {
    let schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const studentId = req.params.id;
    const user = await schoolConnection.model("User", UserModel.schema);
    const student = await user.findById(studentId);
    let school = await SchoolModel.findById(student.schoolId);
    if (!student) {
      throw new AppError("No student found", 404);
    }

    if (!student.active) {
      throw new AppError(
        "Student is not active, Please contact to school",
        400
      );
    }
    student.dbURI = school.dbURI;
    schoolConnection.close();
    // 3) If everything ok, send token to client
    createSendToken(student, 200, res);
  } catch (error) {
    console.error(error);
    next(error);
  }
};
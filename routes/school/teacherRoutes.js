const express = require("express");
const authController = require("../../controllers/school/authController");
const catchAsync = require("../../utils/catchAsync");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const router = express.Router();
const teacherController = require("../../controllers/school/teacherController");
router.use(authController.protect);
router.use(authController.restrictTo("school-admin", "teacher", "student"));

router
  .route("/")
  .post(upload.single("photo"), catchAsync(teacherController.createTeacher))
  .get(catchAsync(teacherController.getAllTeacher))
  .patch(catchAsync(teacherController.updateStatusTeacher))
  .delete(catchAsync(teacherController.deleteTeacher));
  
router
  .route("/:id")
  .get(catchAsync(teacherController.getTeacher))
  .patch(upload.single("photo"), catchAsync(teacherController.updateTeacher))
  

router
  .route("/import-teacher")
  .post(upload.single("file"), catchAsync(teacherController.ImportTeachers));

router
  .route("/history/:id")
  .get(catchAsync(teacherController.getLoginHistory));

module.exports = router;

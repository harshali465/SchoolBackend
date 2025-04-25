const express = require('express');
const attendanceController = require('../../controllers/school/attendanceController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();
router.use(authController.protect);
router.use(authController.restrictTo('student', 'teacher', 'school-admin'));
const multer = require('multer')
const upload = multer({ dest: 'uploads/' });
//-----------------------------------------Tag--------------------------------------
router
  .route('/tags/')
  .get(catchAsync(attendanceController.getAllTags))
  .post(catchAsync(attendanceController.createTags))
  .delete(catchAsync(attendanceController.deleteTags));

router
  .route('/tag/:id')
  .patch(catchAsync(attendanceController.updateTag));

//----------------------------------------Day Type-----------------------------------------------

router
  .route('/day-type/')
  .get(catchAsync(attendanceController.getAllDayType))
  .post(catchAsync(attendanceController.createDayType))
  .delete(catchAsync(attendanceController.deleteDayType));

router
  .route('/day-type/:id')
  .patch(catchAsync(attendanceController.updateDayType));


//-----------------------------------------Class Attendance Tag--------------------------------------
router
  .route('/class-attendance-tag/')
  .get(catchAsync(attendanceController.getAllClassAttendanceTag))
  .post(catchAsync(attendanceController.createClassAttendanceTag))
  .delete(catchAsync(attendanceController.deleteClassAttendanceTag));

router
  .route('/class-attendance-tag/mark-active-inactive')
  .patch(catchAsync(attendanceController.updateActiveClassAttendanceTag))

router
  .route('/class-attendance-tag/:id')
  .get(catchAsync(attendanceController.getClassAttendanceTag))
  .patch(catchAsync(attendanceController.updateClassAttendanceTag));


//-----------------------------------------Day Attendance Tag--------------------------------------
router
  .route('/day-attendance-tag/')
  .get(catchAsync(attendanceController.getAllDayAttendanceTag))
  .post(catchAsync(attendanceController.createDayAttendanceTag))
  .delete(catchAsync(attendanceController.deleteDayAttendanceTag));

router
  .route('/day-attendance-tag/mark-active-inactive')
  .patch(catchAsync(attendanceController.updateActiveDayAttendanceTag))

router
  .route('/day-attendance-tag/:id')
  .get(catchAsync(attendanceController.getDayAttendanceTag))
  .patch(catchAsync(attendanceController.updateDayAttendanceTag));

//-----------------------------------------Day Attendance--------------------------------------
router
  .route('/day-attendance/student')
  .post(catchAsync(attendanceController.createManualScanForStudent))

router
  .route('/day-attendance/teacher')
  .post(catchAsync(attendanceController.createManualScanForTeacher))
  .get(catchAsync(attendanceController.getAllDayAttendanceForTeacher))
  .delete(catchAsync(attendanceController.undoTeachersAttendance))

router
  .route('/day-attendance/')
  .get(catchAsync(attendanceController.getAllDayAttendance))

router
  .route('/day-attendance/summary')
  .get(catchAsync(attendanceController.getDayAttendanceSummary))

//-----------------------------------------Attendance Certificate--------------------------------------
router
  .route('/attendance-certificate')
  .post(upload.single('photo'), catchAsync(attendanceController.createAttendanceCerrtificate))
  .get(catchAsync(attendanceController.getAllAttendanceCerrtificate))
  .patch(catchAsync(attendanceController.updateActiveAttendanceCerrtificate))

router
  .route('/attendance-certificate/:id')
  .get(catchAsync(attendanceController.getAttendanceCerrtificate))
  .patch(upload.single('photo'), catchAsync(attendanceController.updateAttendanceCerrtificate))

//-----------------------------------------------------------------------------------------------------
router
  .route('/user-attendance/:id')
  .get(catchAsync(attendanceController.getUserWiseAttendance))

router
  .route('/generate-certificate/:id')
  .get(catchAsync(attendanceController.generateCertificate))


//----------------------------------------Leave Request---------------------------------------------------
router
  .route('/leave-request')
  .post(catchAsync(attendanceController.createLeaveRequest))
  .get(catchAsync(attendanceController.getAllLeaveRequestForAdmin))
  

router
  .route('/leave-request/:id')
  .get(catchAsync(attendanceController.getLeaveRequestById))
  .patch(catchAsync(attendanceController.updateLeaveRequest))

router
  .route('/leave-request/user/:id')
  .get(catchAsync(attendanceController.getLeaveRequestUser)) //to be created

router
  .route('/leave-request/approve-or-reject/:id')
  .put(catchAsync(attendanceController.approveOrRejectLeaveRequest))

router
  .route('/leave-request/bulk-approve-or-reject')
  .post(catchAsync(attendanceController.bulkApproveOrRejectLeaveRequest))

router
  .route('/leave-request/withdraw')
  .put(catchAsync(attendanceController.withDrawLeaveRequest)) //to be created

//-------------------------------Class Attandance ---------------------------'
router
  .route('/class-attendance/')
  .post(catchAsync(attendanceController.markClassAttendance))
  .get(catchAsync(attendanceController.getAllMarkClassAttendance))
  // .delete(catchAsync(attendanceController.undoTeachersAttendance))

router
  .route('/class-attendance/:id')
  .get(catchAsync(attendanceController.getMarkClassAttendanceById))
  .put(catchAsync(attendanceController.updateClassAttendance))

router
  .route('/student/class-attendance/:studentId')
  .get(catchAsync(attendanceController.getAllMarkClassAttendanceForStudent))

module.exports = router;
const express = require('express');
const timeTableController = require('../../controllers/school/timeTableController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();
router.use(authController.protect);
router.use(authController.restrictTo('student', 'teacher', 'school-admin'));

//  ----------------------------- Academic Year------------------------

router
  .route('/')
  .post(catchAsync(timeTableController.createTimeTable))
  .delete(catchAsync(timeTableController.deleteTimeTable))
router
  .route('/class-wise')
  .get(catchAsync(timeTableController.getClassWiseTimeTable))

router
  .route('/day-wise')
  .get(catchAsync(timeTableController.getDayWiseTimeTable))

router
  .route('/teacher-wise')
  .get(catchAsync(timeTableController.getTeacherWiseTimeTable))

router
  .route('/:id')
  .get(catchAsync(timeTableController.getTimeTableById))
  .put(catchAsync(timeTableController.editTimeTable))

router
  .route('/teacher/:teacherId')
  .get(catchAsync(timeTableController.getTimeTableByTeacherId))

router
  .route('/grade-section/:gradeId/:sectionId')
  .get(catchAsync(timeTableController.getTimeTableByGradeAndSection))

router
  .route('/assign-proxy-teacher')
  .post(catchAsync(timeTableController.assignProxyTeacher))

module.exports = router;
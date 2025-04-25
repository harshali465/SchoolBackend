const express = require('express');
const teacherTypeController = require('../../controllers/school/teacherTypeController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('student', 'school-admin', 'teacher'));
router
  .route('/')
  .post(catchAsync(teacherTypeController.createTeacherType))
  .get(catchAsync(teacherTypeController.getAllTeacherTypes))
  .delete(catchAsync(teacherTypeController.deleteTeacherType))

router
  .route('/:typeId')
  .put(catchAsync(teacherTypeController.updateTeacherType))
  .get(catchAsync(teacherTypeController.getTeacherTypeById))


module.exports = router;
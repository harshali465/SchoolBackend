const express = require('express');
const router = express.Router();
const authController = require('../../controllers/school/authController');
const classworkController = require('../../controllers/school/classworkController');
const catchAsync = require('../../utils/catchAsync');
const uploadMiddleware = require('../../utils/upload');


router.use(authController.protect);
router.use(authController.restrictTo('admin', 'school-admin', 'student', 'teacher'));

router
  .route('/')
  .get(catchAsync(classworkController.getAllClassworks))
  .post(uploadMiddleware,catchAsync(classworkController.createClasswork))

router
  .route('/:id')
  .get(catchAsync(classworkController.getClassworkById))
  .post(catchAsync(classworkController.submitClasswork))
  .patch(uploadMiddleware, catchAsync(classworkController.updateClasswork))

router
  .route('/:id/mark')
  .put(catchAsync(classworkController.markClassWork))

router
  .route('/admin/teacher-wise/')
  .get(catchAsync(classworkController.getTeacherWiseClasswork));

router
  .route('/admin/counts/')
  .get(catchAsync(classworkController.allClassworkCounts));  

router
  .route('/teacher/:teacherId')
  .get(catchAsync(classworkController.getClassworkByTeacher));

router
  .route('/teacher/:teacherId/counts')
  .get(catchAsync(classworkController.classworkCounts))

router
  .route('/admin/student-wise/')
  .get(catchAsync(classworkController.allClassworkOfStudents));

router
  .route('/student/:studentId')
  .get(catchAsync(classworkController.getAllClassworkByStudentId))

router
  .route('/:classworkId/student/:studentId')
  .get(catchAsync(classworkController.getClassworkByStudentId))


module.exports = router;
const express = require('express');
const stageGradeSectionTimeController = require('../../controllers/school/stageGradeSectionTimeController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();

// Protect all routes and restrict access
router.use(authController.protect);
router.use(authController.restrictTo('student', 'school-admin', 'teacher'));

// Routes for fetching stages, grades, and sections
router.get('/stage', catchAsync(stageGradeSectionTimeController.getAllStages)); // Fetch all stages
router.get('/stage/:stageId/grade', catchAsync(stageGradeSectionTimeController.getGradesByStageId)); // Fetch grades by stage ID
router.get('/stage/:stageId/grade/:gradeId/section', catchAsync(stageGradeSectionTimeController.getSectionsByStageAndGradeId)); // Fetch sections by stage and grade ID

router.get('/grade',catchAsync(stageGradeSectionTimeController.getGrade));
router.get('/section/:gradeId', catchAsync(stageGradeSectionTimeController.getSectionsByGradeId));
router.get('/get-student-by-grade-section',catchAsync(stageGradeSectionTimeController.getStudentByGradeSection));
router.put('/update-teacher', catchAsync(stageGradeSectionTimeController.updateTeacherToSections))
// Routes for stage-grade-section management (CRUD)
router
  .route('/')
  .post(catchAsync(stageGradeSectionTimeController.createStageGradeSection))
  .get(catchAsync(stageGradeSectionTimeController.getAllStageGradeSection))
  .patch(catchAsync(stageGradeSectionTimeController.updateActiveStageGradeSection))
  .delete(catchAsync(stageGradeSectionTimeController.deleteStageGradeSection));

router
  .route('/:id')
  .put(catchAsync(stageGradeSectionTimeController.updateStageGradeSection))
  .get(catchAsync(stageGradeSectionTimeController.getStageGradeSection));

module.exports = router;

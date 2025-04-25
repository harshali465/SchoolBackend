const express = require('express');
const authController = require('../../controllers/school/authController');
const dashboardController = require('../../controllers/school/dashboardController');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin','school-admin', 'student', 'user'));
router
  .route('/')
  .get(catchAsync(dashboardController.getStudentCount))

router
  .route('/graph')
  .get(catchAsync(dashboardController.getStudentFormSubmission))

router
  .route('/leaderboard')
  .get(catchAsync(dashboardController.getLeaderBoard))

module.exports = router;
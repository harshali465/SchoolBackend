const express = require('express');
const authController = require('../../controllers/school/authController');
const miqaatController = require('../../controllers/school/miqaatController');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'student', 'user', 'school-admin'));

router
  .route('/')
  .get(catchAsync(miqaatController.getAllMiqaat))
  .post(catchAsync(miqaatController.createMiqaat))
  .delete(catchAsync(miqaatController.deleteMiqaat));

router
  .route('/current-miqaat')
  .get(catchAsync(miqaatController.getCurrentMiqaat))

router
  .route('/mark-active-inactive')
  .patch(catchAsync(miqaatController.updateActive))

router
  .route('/:id')
  .get(catchAsync(miqaatController.getMiqaat))
  .patch(catchAsync(miqaatController.updateMiqaat));

module.exports = router;

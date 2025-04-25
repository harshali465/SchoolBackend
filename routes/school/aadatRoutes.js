const express = require('express');
const authController = require('../../controllers/school/authController');
const aadatController = require('../../controllers/school/aadatController');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'student', 'user', 'school-admin'));

router
  .route('/')
  .get(catchAsync(aadatController.getAllAadat))
  .post(catchAsync(aadatController.createAadat))
  .put(catchAsync(aadatController.updateOrderValues))
  .delete(catchAsync(aadatController.deleteAadat));

router
  .route('/mark-active-inactive')
  .patch(catchAsync(aadatController.updateActive))

router
  .route('/getAllDailyAadat')
  .get(catchAsync(aadatController.getAllDailyAadat));

router
  .route('/:id')
  .get(catchAsync(aadatController.getAadat))
  .patch(catchAsync(aadatController.updateAadat));

module.exports = router;

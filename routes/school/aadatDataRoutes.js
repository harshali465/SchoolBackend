const express = require('express');
const authController = require('../../controllers/school/authController');
const aadatDataController = require('../../controllers/school/aadatDataController');
const catchAsync = require('../../utils/catchAsync');
const uploadMiddleware = require('../../utils/upload');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(
    authController.restrictTo('admin', 'student', 'user', 'school-admin'),
    catchAsync(aadatDataController.getAllAadatData),
  )
  .post(catchAsync(aadatDataController.createAadatData));

router
  .route('/sumbitresponse')
  .get(catchAsync(aadatDataController.getDailyAadatData))
  .post(catchAsync(aadatDataController.createDailyAadatData));

router
  .route('/sumbitresponse1')
  .post(uploadMiddleware, catchAsync(aadatDataController.createDailyAadatData1));
router
  .route('/uploadImage')
  .post(uploadMiddleware, catchAsync(aadatDataController.uploadImages));

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'student', 'user', 'school-admin'),
    catchAsync(aadatDataController.getAadatData),
  )
  .patch(catchAsync(aadatDataController.updateAadatData))
  .delete(catchAsync(aadatDataController.deleteAadatData));

module.exports = router;

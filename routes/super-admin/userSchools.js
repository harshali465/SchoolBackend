const express = require('express');
const schoolController = require('../../controllers/super-admin/schoolController');
const authController = require('../../controllers/super-admin/authController');
const catchAsync = require('../../utils/catchAsync');
const uploadMiddleware = require('../../utils/upload')
const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router
  .route('/uploadImage')
  .post(uploadMiddleware, catchAsync(schoolController.uploadSchoolLogo));

router
  .route('/')
  .get(catchAsync(schoolController.getall))
  .post(catchAsync(schoolController.createSchool))
  .delete(catchAsync(schoolController.deleteSchool));

router
  .route('/export')
  .get(catchAsync(schoolController.export))

router
  .route('/mark-active-inactive')
  .patch(catchAsync(schoolController.updateActive))

router
  .route('/:id')
  .get(catchAsync(schoolController.getone))
  .patch(catchAsync(schoolController.updateSchool))
  .put(catchAsync(schoolController.changePassword));

router
  .route('/:schoolId/module')
  .put(catchAsync(schoolController.updateModuleStatus))
  .delete(catchAsync(schoolController.deleteModule));

module.exports = router;

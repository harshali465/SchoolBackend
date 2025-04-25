const express = require('express');
const authController = require('../../controllers/super-admin/authController');
const moduleController = require('../../controllers/super-admin/modulesController');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'school-admin'));

router
  .route('/')
  .get(catchAsync(moduleController.getAllModule))
  .post(catchAsync(moduleController.createModule))
  .delete(catchAsync(moduleController.deleteModule));

router
  .route('/mark-active-inactive')
  .patch(catchAsync(moduleController.updateActive))

router
  .route('/:id')
  .get(catchAsync(moduleController.getModule))
  .patch(catchAsync(moduleController.updateModule));

module.exports = router;

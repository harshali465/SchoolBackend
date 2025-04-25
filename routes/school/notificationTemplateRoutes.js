const express = require('express');
const authController = require('../../controllers/school/authController');
const notificationTemplate = require('../../controllers/school/notificationTemplateController');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'school-admin', 'user'));

router
  .route('/')
  .get(catchAsync(notificationTemplate.getAllNotificationTemplate))
  .post(catchAsync(notificationTemplate.createNotificationTemplate))
  .delete(catchAsync(notificationTemplate.deleteNotificationTemplate));


router
  .route('/:id')
  .get(catchAsync(notificationTemplate.getNotificationTemplate))
  .patch(catchAsync(notificationTemplate.updateNotificationTemplate));

module.exports = router;

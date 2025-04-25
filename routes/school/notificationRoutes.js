const express = require("express");
const notificationController = require("../../controllers/school/notificationController");
const authController = require("../../controllers/school/authController");
const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo("school-admin", "admin", 'teacher', 'student'));

// Routes
router
  .route("/")
  .post(notificationController.createNotification)
  .get(notificationController.getAllNotifications)
  .delete(notificationController.deleteNotification)

router
  .route("/:id")
  .get(notificationController.getNotificationsById)
router
  .route("/user/:id") 
  .get(notificationController.getAllNotificationsByUserId)

router.route("/restore/:id")
.patch(notificationController.restoreNotification);

router.route("/:id/read")
.post(notificationController.markAsRead);


module.exports = router;

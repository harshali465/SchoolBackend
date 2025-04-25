const express = require("express");
const catchAsync = require("../../utils/catchAsync");
const authController = require("../../controllers/school/authController");
const router = express.Router();
const termDatesController = require("../../controllers/school/termDatesController");
router.use(authController.protect);
router.use(authController.restrictTo("student", "school-admin"));
router
  .route("/")
  .post(catchAsync(termDatesController.createTermDates))
  .get(catchAsync(termDatesController.getAllTermDates))
  .patch(termDatesController.updateStatus);
router
  .route("/:id")
  .put(catchAsync(termDatesController.updateTermDates))
  .get(catchAsync(termDatesController.getTermDatesId))
  .delete(catchAsync(termDatesController.deleteTermDates));

module.exports = router;

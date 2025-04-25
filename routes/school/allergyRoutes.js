const express = require('express');
const allergyController = require('../../controllers/school/allergiesController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('student','school-admin'));
router
  .route('/')
  .post(catchAsync(allergyController.createAllergy))
  .get(catchAsync(allergyController.getAllAllergies))

router
  .route('/:allergyId')
  .put(catchAsync(allergyController.updateAllergy))
  .get(catchAsync(allergyController.getAllergyById))
  .delete(catchAsync(allergyController.deleteAllergy))


module.exports = router;
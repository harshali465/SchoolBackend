const express = require('express');
const houseController = require('../../controllers/school/houseController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('student','school-admin'));
router
  .route('/')
  .post(catchAsync(houseController.createHouse))
  .get(catchAsync(houseController.getAllHouse))

router
  .route('/:houseId')
  .put(catchAsync(houseController.updateHouse))
  .get(catchAsync(houseController.getHouseById))
  .delete(catchAsync(houseController.deleteHouse))

module.exports = router;
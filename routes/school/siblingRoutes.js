const express = require('express');
const siblingController = require('../../controllers/school/siblingsController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('student'));
router
  .route('/')
  .get(catchAsync(siblingController.getSibling))
  .post(catchAsync(siblingController.addSibling))
  .delete(catchAsync(siblingController.removeSibling));

router
  .route('/:id')
  .get(catchAsync(siblingController.swithSibling))

module.exports = router;
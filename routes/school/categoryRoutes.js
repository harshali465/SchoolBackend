const express = require('express');
const authController = require('../../controllers/school/authController');
const categoryController = require('../../controllers/school/categoryController');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin', 'school-admin', 'user'));

router
  .route('/')
  .get(catchAsync(categoryController.getAllCategories))
  .post(catchAsync(categoryController.createCategory))
  .put(catchAsync(categoryController.updateOrderValues))
  .delete(catchAsync(categoryController.deleteCategory));

router
  .route('/mark-active-inactive')
  .patch(catchAsync(categoryController.updateActive))

router
  .route('/:id')
  .get(catchAsync(categoryController.getCategory))
  .patch(catchAsync(categoryController.updateCategory));

module.exports = router;

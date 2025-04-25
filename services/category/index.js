const categoryService = require('./category.service');

module.exports = {
  getAllCategories: categoryService.getAllCategories,
  getCategory: categoryService.getCategory,
  updateCategory: categoryService.updateCategory,
  deleteCategory: categoryService.deleteCategory,
  createCategory: categoryService.createCategory,
  updateActive:categoryService.updateActive,
  updateOrderValues:categoryService.updateOrderValues
};

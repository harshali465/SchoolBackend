const moduleService = require('./module.service');

module.exports = {
  getAllModule: moduleService.getAllModule,
  getModule: moduleService.getModule,
  updateModule: moduleService.updateModule,
  deleteModule: moduleService.deleteModule,
  createModule: moduleService.createModule,
  updateActive: moduleService.updateActive,
};
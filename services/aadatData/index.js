const aadatDataService = require('./aadatData.service');

module.exports = {
  getAllAadatData: aadatDataService.getAllAadatData,
  getAadatData: aadatDataService.getAadatData,
  updateAadatData: aadatDataService.updateAadatData,
  deleteAadatData: aadatDataService.deleteAadatData,
  createAadatData: aadatDataService.createAadatData,
};

const aadatService = require('./aadat.service');

module.exports = {
  getAllAadat: aadatService.getAllAadat,
  getAadat: aadatService.getAadat,
  updateAadat: aadatService.updateAadat,
  deleteAadat: aadatService.deleteAadat,
  createAadat: aadatService.createAadat,
  getAllDailyAadat: aadatService.getAllDailyAadat,
  updateActive:aadatService.updateActive,
  updateOrderValues:aadatService.updateOrderValues
};

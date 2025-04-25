const miqaatService = require('./miqaat.service');

module.exports = {
  getAllMiqaat: miqaatService.getAllMiqaat,
  getMiqaat: miqaatService.getMiqaat,
  updateMiqaat: miqaatService.updateMiqaat,
  deleteMiqaat: miqaatService.deleteMiqaat,
  createMiqaat: miqaatService.createMiqaat,
  updateActive:miqaatService.updateActive,
  getCurrentMiqaats: miqaatService.getCurrentMiqaats

};

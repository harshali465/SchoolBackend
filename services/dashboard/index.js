const dashboardServiceService = require('./dashboard.service');

module.exports = {
  getStudentCount: dashboardServiceService.getStudentCount,
  getStudentFormSubmission: dashboardServiceService.getStudentFormSubmission,
  getLeaderBoard: dashboardServiceService.getLeaderBoard,
};
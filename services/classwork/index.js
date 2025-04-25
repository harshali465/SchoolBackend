const classworkService = require('./classwork.service');

module.exports = {
  createClasswork: classworkService.createClasswork,
  getClassworkById: classworkService.getClassworkById,
  updateClasswork: classworkService.updateClasswork,
  getClassworkByTeacher: classworkService.getClassworkByTeacher,
  submitClasswork: classworkService.submitClasswork,
  getAllClassworkByStudentId: classworkService.getAllClassworkByStudentId,
  getClassworkByStudentId: classworkService.getClassworkByStudentId,
  classworkCounts: classworkService.classworkCounts,
  markClassWork: classworkService.markClassWork,
  getTeacherWiseClasswork: classworkService.getTeacherWiseClasswork,
  allClassworkCounts: classworkService.allClassworkCounts,
  allClassworkOfStudents: classworkService.allClassworkOfStudents,
};

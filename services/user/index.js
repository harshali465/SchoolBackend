const userService = require('./user.service');
const studentService = require('./student.service');

module.exports = {
  updateMe: userService.updateMe,
  deleteMe: userService.deleteMe,
  getUser: userService.getUser,
  getSchoolAdmin: userService.getSchoolAdmin,
  getAllUsers: userService.getAllUsers,
  updateUser: userService.updateUser,
  deleteUser: userService.deleteUser,
  createUser: userService.createUser,
  getAllSurat: userService.getAllSurat,
  addSibling: userService.addSibling,
  getSiblings: userService.getSiblings,
  removeSibling: userService.removeSibling,
  deleteTeacher: userService.deleteTeacher,
  createStudent: studentService.createStudent,
  deletestudent: studentService.deletestudent,
  updateActive: studentService.updateActive,
  getStudents: studentService.getStudents,
  findStudentByEmail:studentService.findStudentByEmail,
  findTeacherByEmailAndItsNo:userService.findTeacherByEmailAndItsNo,
};

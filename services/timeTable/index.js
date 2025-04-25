const timeTableService = require("./timeTable.service");

module.exports = {
    // -------------------------- Time Table ------------------------------------
    createTimeTable: timeTableService.createTimeTable,
    editTimeTable: timeTableService.editTimeTable,
    deleteTimeTable: timeTableService.deleteTimeTable,
    getClassWiseTimeTable: timeTableService.getClassWiseTimeTable,
    getTeacherWiseTimeTable: timeTableService.getTeacherWiseTimeTable,
    getDayWiseTimeTable: timeTableService.getDayWiseTimeTable,
    assignProxyTeacher: timeTableService.assignProxyTeacher,
    getTimeTableById: timeTableService.getTimeTableById,
    getTimeTableByTeacherId: timeTableService.getTimeTableByTeacherId,
    getTimeTableByGradeAndSection: timeTableService.getTimeTableByGradeAndSection
}
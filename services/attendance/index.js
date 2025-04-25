const attendanceService = require("./attendance.service");

module.exports = {
    // --------------------------Tags---------------------------------
    createTags: attendanceService.createTag,
    getAllTags: attendanceService.getAllTags,
    updateTag: attendanceService.updateTag,
    deleteTags: attendanceService.deleteTags,

    // --------------------------Day Types---------------------------------
    createDayType: attendanceService.createDayType,
    getAllDayType: attendanceService.getAllDayType,
    updateDayType: attendanceService.updateDayType,
    deleteDayType: attendanceService.deleteDayType,

    // --------------------------Class Attendance Tags---------------------------------

    createClassAttendanceTag: attendanceService.createClassAttendanceTag,
    getAllClassAttendanceTags: attendanceService.getAllClassAttendanceTags,
    getClassAttendanceTagById: attendanceService.getClassAttendanceTagById,
    updateClassAttendanceTag: attendanceService.updateClassAttendanceTag,
    updateActiveClassAttendanceTag: attendanceService.updateActiveClassAttendanceTag,
    deleteClassAttendanceTags: attendanceService.deleteClassAttendanceTags,

    // --------------------------Day Attendance Tags---------------------------------

    createDayAttendanceTag: attendanceService.createDayAttendanceTag,
    getDayAttendanceTag: attendanceService.getDayAttendanceTag,
    getAllDayAttendanceTag: attendanceService.getAllDayAttendanceTag,
    updateDayAttendanceTag: attendanceService.updateDayAttendanceTag,
    deleteDayAttendanceTag: attendanceService.deleteDayAttendanceTag,
    updateActiveDayAttendanceTag: attendanceService.updateActiveDayAttendanceTag,

    // ----------------------------Manual Attendance---------------------------------
    createManualScanForStudent: attendanceService.createManualScanForStudent,
    createManualScanForTeacher: attendanceService.createManualScanForTeacher,
    undoTeachersAttendance: attendanceService.undoTeachersAttendance,
    getAllDayAttendance: attendanceService.getAllDayAttendance,
    getDayAttendanceSummary: attendanceService.getDayAttendanceSummary,
    getAllDayAttendanceForTeacher: attendanceService.getAllDayAttendanceForTeacher,

    // ----------------------------Attendance Certificate---------------------------------
    createAttendanceCerrtificate: attendanceService.createAttendanceCerrtificate,
    updateAttendanceCerrtificate: attendanceService.updateAttendanceCerrtificate,
    getAllAttendanceCerrtificate: attendanceService.getAllAttendanceCertificate,
    updateActiveAttendanceCerrtificate:attendanceService.updateActiveAttendanceCerrtificate,
    getAttendanceCerrtificate: attendanceService.getAttendanceCerrtificate,

    // ----------------------------Users Attendance---------------------------------
    getUserWiseAttendance: attendanceService.getUserWiseAttendance,
    generateCertificate: attendanceService.generateCertificate,


    //----------------------------Leave Request-----------------------------------
    createLeaveRequest: attendanceService.createLeaveRequest,
    updateLeaveRequest: attendanceService.updateLeaveRequest,
    getAllLeaveRequestForAdmin: attendanceService.getAllLeaveRequestForAdmin,
    getLeaveRequestById: attendanceService.getLeaveRequestById,
    approveOrRejectLeaveRequest: attendanceService.approveOrRejectLeaveRequest,
    bulkApproveOrRejectLeaveRequest: attendanceService.bulkApproveOrRejectLeaveRequest,
    getLeaveRequestUser: attendanceService.getLeaveRequestUser,
    withDrawLeaveRequest: attendanceService.withDrawLeaveRequest,

    //-------------------------------Class Attendance------------------------------
    markClassAttendance: attendanceService.markClassAttendance, 
    updateClassAttendance: attendanceService.updateClassAttendance, 
    getAllMarkClassAttendance: attendanceService.getAllMarkClassAttendance,
    getMarkClassAttendanceById: attendanceService.getMarkClassAttendanceById,
    getAttendanceWithStatus: attendanceService.getAttendanceWithStatus,
    getAllMarkClassAttendanceForStudent: attendanceService.getAllMarkClassAttendanceForStudent
};
const academicsService = require("./academics.service");

module.exports = {

    // -------------------------- Academic Year ------------------------------------
    createAcademicYear: academicsService.createAcademicYear,
    getAllAcademicYears: academicsService.getAllAcademicYears,
    getAcademicYear: academicsService.getAcademicYear,
    updateAcademicYear: academicsService.updateAcademicYear,
    deleteAcademicYears: academicsService.deleteAcademicYears,

    // -------------------------- Report Card ------------------------------------
    createReportCard: academicsService.createReportCard,
    getAllReportCards: academicsService.getAllReportCards,
    getReportCard: academicsService.getReportCard,
    updateReportCard: academicsService.updateReportCard,
    deleteReportCards: academicsService.deleteReportCards,

    // ------------------------- School Type -------------------------------------
    createSchoolType: academicsService.createSchoolType,
    getAllSchoolTypes: academicsService.getAllSchoolTypes,
    getSchoolType: academicsService.getSchoolType,
    updateSchoolType: academicsService.updateSchoolType,
    deleteSchoolTypes: academicsService.deleteSchoolTypes,

    // -------------------------- Grade Wise Subjects ------------------------------
    getAllSubjects: academicsService.getAllSubjects,
    createGradeWiseSubjects: academicsService.createGradeWiseSubjects,
    getAllGradeWiseSubjects: academicsService.getAllGradeWiseSubjects,
    getGradeWiseSubjects: academicsService.getGradeWiseSubjects,
    updateGradeWiseSubjects: academicsService.updateGradeWiseSubjects,
    deleteGradeWiseSubjects: academicsService.deleteGradeWiseSubjects,

    // -------------------------- Event ------------------------------
    createEvent: academicsService.createEvent,
    getAllEvents: academicsService.getAllEvents,
    getEvent: academicsService.getEvent,
    updateEvent: academicsService.updateEvent,
    deleteEvents: academicsService.deleteEvents,
    updateEventStatus: academicsService.updateEventStatus,

    // -------------------------- Working Days  ------------------------------------
    createWorkingDays: academicsService.createWorkingDays,
    getAllWorkingDays: academicsService.getAllWorkingDays,
    getWorkingDay: academicsService.getWorkingDay,
    updateWorkingDay: academicsService.updateWorkingDay,
    deleteWorkingDays: academicsService.deleteWorkingDays,

    // -------------------------- Assign subjects to teacher  ------------------------------------
    assignSubjectToteacher: academicsService.assignSubjectToteacher,
    getAllassignSubjectToteacher: academicsService.getAllassignSubjectToteacher,
    getAssignSubjectToteacher: academicsService.getAssignSubjectToteacher,
    updateAssignSubjectToteacher: academicsService.updateAssignSubjectToteacher,
    deleteAssignSubjectToteachers: academicsService.deleteAssignSubjectToteachers,
}
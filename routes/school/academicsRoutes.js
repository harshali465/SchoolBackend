const express = require('express');
const academicsController = require('../../controllers/school/academicsController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();
router.use(authController.protect);
router.use(authController.restrictTo('student', 'teacher', 'school-admin'));

//  ----------------------------- Academic Year------------------------

router
    .route('/academic-year')
    .get(catchAsync(academicsController.getAllAcademicYears))
    .post(catchAsync(academicsController.createAcademicYear))
    .delete(catchAsync(academicsController.deleteAcademicYears))

router
    .route('/academic-year/:id')
    .get(catchAsync(academicsController.getAcademicYear))
    .patch(catchAsync(academicsController.updateAcademicYear))

//-----------------------------------------ReportCard--------------------------------------
router
    .route('/report-card')
    .get(catchAsync(academicsController.getAllReportCards))
    .post(catchAsync(academicsController.createReportCard))
    .delete(catchAsync(academicsController.deleteReportCards))

router
    .route('/report-card/:id')
    .get(catchAsync(academicsController.getReportCard))
    .patch(catchAsync(academicsController.updateReportCard))

// -------------------------------------- School Type ---------------------------------------

router
    .route('/school-type')
    .get(catchAsync(academicsController.getAllSchoolTypes))
    .post(catchAsync(academicsController.createSchoolType))
    .delete(catchAsync(academicsController.deleteSchoolTypes))

router
    .route('/school-type/:id')
    .get(catchAsync(academicsController.getSchoolType))
    .patch(catchAsync(academicsController.updateSchoolType))

// --------------------------------------- Grade Wise Subjects --------------------------------

router
    .route('/grade-wise-subjects')
    .get(catchAsync(academicsController.getAllGradeWiseSubjects))
    .post(catchAsync(academicsController.createGradeWiseSubjects))
    .delete(catchAsync(academicsController.deleteGradeWiseSubjects))

router
    .route('/grade-wise-subjects/:id')
    .get(catchAsync(academicsController.getGradeWiseSubjects))
    .patch(catchAsync(academicsController.updateGradeWiseSubjects))

router
    .route('/get-all-subjects')
    .get(catchAsync(academicsController.getAllSubjects))

// --------------------------------------- Event -------------------------------------------

router
    .route('/event')
    .get(catchAsync(academicsController.getAllEvents))
    .post(catchAsync(academicsController.createEvent))
    .delete(catchAsync(academicsController.deleteEvents))
    .put(catchAsync(academicsController.updateEventStatus))

router
    .route('/event/:id')
    .get(catchAsync(academicsController.getEvent))
    .patch(catchAsync(academicsController.updateEvent))

//-----------------------------------------WorkingDays--------------------------------------

router
    .route('/working-day')
    .get(catchAsync(academicsController.getAllWorkingDays))
    .post(catchAsync(academicsController.createWorkingDays))
    .delete(catchAsync(academicsController.deleteWorkingdays))

router
    .route('/working-day/:id')
    .get(catchAsync(academicsController.getworkingDay))
    .patch(catchAsync(academicsController.updateWorkingDay))

// -------------------------- Assign subjects to teacher  ------------------------------------

router
    .route('/assign-subjects-to-teacher')
    .post(catchAsync(academicsController.assignSubjectToteacher))
    .delete(catchAsync(academicsController.deleteAssignSubjectToteachers))
    .get(catchAsync(academicsController.getAllAssignSubjectToteacher))

router
    .route('/assign-subjects-to-teacher/:id')
    .get(catchAsync(academicsController.getAssignSubjectToteacher))
    .patch(catchAsync(academicsController.updateAssignSubjectToteacher))



module.exports = router;
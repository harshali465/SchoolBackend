const academicsService = require('../../services/academics');
const { connectToSchoolDB, waitForConnection } = require('../../utils/connectSchoolDb');

//  ----------------------------- Academic Year------------------------

module.exports.createAcademicYear = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const AcademicYear = await academicsService.createAcademicYear(req.body, schoolConnection);
        res.status(201).json({
            status: 'success',
            data: AcademicYear,
        });
    } catch (error) {
        console.log(error)
        if (error.message === 'CURRENT_ACADEMIC_YEAR_SET') {
            res.status(400).json({
                status: 'error',
                message: 'The current academic year is already set, so this academic year cannot be marked as the current one.',
            });
        }
        if (error.message === 'NEXT_ACADEMIC_YEAR_SET') {
            res.status(400).json({
                status: 'error',
                message: 'The next academic year is already set, so this academic year cannot be marked as the next one.',
            });
        }
        if (error.message === 'INVALID_ACADEMIC_YEAR_RANGE') {
            res.status(400).json({
                status: 'error',
                message: 'Invalid Academic year range',
            });
        }
        if (error.message === 'ACADEMIC_YEAR_ALREADY_EXISTS') {
            res.status(400).json({
                status: 'error',
                message: 'Academic Year already exists.',
            });
        }
        else {
            next(error); // Pass other errors to the global error handler
        }
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllAcademicYears = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const AcademicYears = await academicsService.getAllAcademicYears(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: AcademicYears.length,
            data: AcademicYears,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getAcademicYear = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const AcademicYear = await academicsService.getAcademicYear(id, schoolConnection);
        if (!AcademicYear) {
            return res.status(404).json({
                status: 'error',
                message: 'Academic year not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: AcademicYear,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateAcademicYear = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedAcademicYear = await academicsService.updateAcademicYear(id, req.body, schoolConnection);
        if (!updatedAcademicYear) {
            return res.status(404).json({
                status: 'error',
                message: 'Academic year not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedAcademicYear,
        });
    } catch (error) {
        console.log(error)
        if (error.message === 'CURRENT_ACADEMIC_YEAR_SET') {
            res.status(400).json({
                status: 'error',
                message: 'The current academic year is already set, so this academic year cannot be marked as the current one.',
            });
        }
        if (error.message === 'NEXT_ACADEMIC_YEAR_SET') {
            res.status(400).json({
                status: 'error',
                message: 'The next academic year is already set, so this academic year cannot be marked as the next one.',
            });
        }
        if (error.message === 'INVALID_ACADEMIC_YEAR_RANGE') {
            res.status(400).json({
                status: 'error',
                message: 'Invalid Academic year range',
            });
        }
        if (error.message === 'ACADEMIC_YEAR_ALREADY_EXISTS') {
            res.status(400).json({
                status: 'error',
                message: 'Academic Year already exists.',
            });
        }
        else {
            next(error); // Pass other errors to the global error handler
        }
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.deleteAcademicYears = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedAcademicYear = await academicsService.deleteAcademicYears(ids, schoolConnection);
        if (!deletedAcademicYear) {
            return res.status(404).json({
                status: 'error',
                message: 'Academic year not found',
            });
        }
        res.status(200).json({
            status: 'success',
            message: deletedAcademicYear.message,
            data: deletedAcademicYear
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

//  ----------------------------- Report Card ------------------------

module.exports.createReportCard = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const ReportCard = await academicsService.createReportCard(req.body, schoolConnection);
        res.status(201).json({
            status: 'success',
            data: ReportCard,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllReportCards = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const reportCards = await academicsService.getAllReportCards(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: reportCards.length,
            data: reportCards,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getReportCard = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const reportCard = await academicsService.getReportCard(id, schoolConnection);
        if (!reportCard) {
            return res.status(404).json({
                status: 'error',
                message: 'Report Card not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: reportCard,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateReportCard = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedReportCard = await academicsService.updateReportCard(id, req.body, schoolConnection);
        if (!updatedReportCard) {
            return res.status(404).json({
                status: 'error',
                message: 'Report Card not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedReportCard,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.deleteReportCards = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedReportCard = await academicsService.deleteReportCards(ids, schoolConnection);
        if (!deletedReportCard) {
            return res.status(404).json({
                status: 'error',
                message: 'Report Card not found',
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'Report Card deleted successfully',
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

// ------------------------------------ School Type ------------------------------------

module.exports.createSchoolType = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const schoolType = await academicsService.createSchoolType(req.body, schoolConnection);
        res.status(201).json({
            status: 'success',
            data: schoolType,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllSchoolTypes = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const schoolTypes = await academicsService.getAllSchoolTypes(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: schoolTypes.length,
            data: schoolTypes,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getSchoolType = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const schoolType = await academicsService.getSchoolType(id, schoolConnection);
        if (!schoolType) {
            return res.status(404).json({
                status: 'error',
                message: 'School Type not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: schoolType,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateSchoolType = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedSchoolType = await academicsService.updateSchoolType(id, req.body, schoolConnection);
        if (!updatedSchoolType) {
            return res.status(404).json({
                status: 'error',
                message: 'School Type not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedSchoolType,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.deleteSchoolTypes = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedSchoolType = await academicsService.deleteSchoolTypes(ids, schoolConnection);
        if (!deletedSchoolType) {
            return res.status(404).json({
                status: 'error',
                message: 'School Type not found',
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'School Type deleted successfully',
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

// --------------------------------------- Grade Wise Subjects --------------------------------

module.exports.getAllSubjects = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const subjects = await academicsService.getAllSubjects(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: subjects.length,
            data: subjects,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.createGradeWiseSubjects = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const gradeWiseSubjects = await academicsService.createGradeWiseSubjects(req.body, schoolConnection);
        res.status(201).json({
            status: 'success',
            data: gradeWiseSubjects,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllGradeWiseSubjects = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const gradeWiseSubjects = await academicsService.getAllGradeWiseSubjects(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: gradeWiseSubjects.length,
            data: gradeWiseSubjects,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getGradeWiseSubjects = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const gradeWiseSubject = await academicsService.getGradeWiseSubjects(id, schoolConnection);
        if (!gradeWiseSubject) {
            return res.status(404).json({
                status: 'error',
                message: 'Grade Wise Subject not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: gradeWiseSubject,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateGradeWiseSubjects = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedGradeWiseSubject = await academicsService.updateGradeWiseSubjects(id, req.body, schoolConnection);
        if (!updatedGradeWiseSubject) {
            return res.status(404).json({
                status: 'error',
                message: 'Grade Wise Subject not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedGradeWiseSubject,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.deleteGradeWiseSubjects = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedGradeWiseSubject = await academicsService.deleteGradeWiseSubjects(ids, schoolConnection);
        if (!deletedGradeWiseSubject) {
            return res.status(404).json({
                status: 'error',
                message: 'Grade Wise Subject not found',
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'Grade Wise Subject deleted successfully',
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

// --------------------------------------- Event ----------------------------------------------

module.exports.createEvent = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const event = await academicsService.createEvent(req.body, schoolConnection);
        res.status(201).json({
            status: 'success',
            data: event,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllEvents = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const events = await academicsService.getAllEvents(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: events.length,
            data: events,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getEvent = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const event = await academicsService.getEvent(id, schoolConnection);
        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: event,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateEvent = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedEvent = await academicsService.updateEvent(id, req.body, schoolConnection);
        if (!updatedEvent) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedEvent,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.deleteEvents = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedEvent = await academicsService.deleteEvents(ids, schoolConnection);
        if (!deletedEvent) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found',
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'Event deleted successfully',
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateEventStatus = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedEventStatus = await academicsService.updateEventStatus(req.body, schoolConnection);
        res.status(200).json({
            status: 'success',
            result: updatedEventStatus,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

//-----------------------------------------Working days ------------------------------------------

module.exports.createWorkingDays = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const workingDays = await academicsService.createWorkingDays(req.body, schoolConnection);
        if (workingDays == 'ALREADY_EXISTS') {
            throw new Error('A working day with the same details already exists.') 
        }
        res.status(201).json({
            status: 'success',
            data: workingDays,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllWorkingDays = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const WorkingDays = await academicsService.getAllWorkingDays(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: WorkingDays.length,
            data: WorkingDays,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getworkingDay = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const workingDay = await academicsService.getWorkingDay(id, schoolConnection);
        if (!workingDay) {
            return res.status(404).json({
                status: 'error',
                message: 'Working day not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: workingDay,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateWorkingDay = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedWorkingDay = await academicsService.updateWorkingDay(id, req.body, schoolConnection);

        if (updatedWorkingDay === 'ALREADY_EXISTS') {
            throw new Error('A working day with the same details already exists.') 
        }

        if (!updatedWorkingDay) {
            return res.status(404).json({
                status: 'error',
                message: 'Working day not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedWorkingDay,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.deleteWorkingdays = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedWorkingday = await academicsService.deleteWorkingDays(ids, schoolConnection);
        if (!deletedWorkingday) {
            return res.status(404).json({
                status: 'error',
                message: 'Working Day not found',
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'Working Day deleted successfully',
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

//-----------------------------------------Assign subject to teacher------------------------------------------

module.exports.assignSubjectToteacher = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const assignedSubjectsToTeacher = await academicsService.assignSubjectToteacher(req.body, schoolConnection);
        res.status(201).json({
            status: 'success',
            data: assignedSubjectsToTeacher,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
};

module.exports.getAllAssignSubjectToteacher = async (req, res, next) => {
    let schoolConnection;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const AssignSubjectToteacher = await academicsService.getAllassignSubjectToteacher(req.query, schoolConnection);
        res.status(200).json({
            status: 'success',
            results: AssignSubjectToteacher.length,
            data: AssignSubjectToteacher,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.getAssignSubjectToteacher = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const AssignSubjectToteacher = await academicsService.getAssignSubjectToteacher(id, schoolConnection);
        if (!AssignSubjectToteacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Assigned subject not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: AssignSubjectToteacher,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.updateAssignSubjectToteacher = async (req, res, next) => {
    let schoolConnection;
    const { id } = req.params;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const updatedAssignSubjectToteacher = await academicsService.updateAssignSubjectToteacher(id, req.body, schoolConnection);
        if (!updatedAssignSubjectToteacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Assigned subject not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: updatedAssignSubjectToteacher,
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}

module.exports.deleteAssignSubjectToteachers = async (req, res, next) => {
    let schoolConnection;
    const { ids } = req.body;
    try {
        schoolConnection = await connectToSchoolDB(req.user.dbURI);
        await waitForConnection(schoolConnection);
        const deletedAssignSubjectToteacher = await academicsService.deleteAssignSubjectToteachers(ids, schoolConnection);
        if (!deletedAssignSubjectToteacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Assigned subject not found',
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'Assigned subject deleted successfully',
        });
    } catch (error) {
        next(error);
    } finally {
        if (schoolConnection) {
            await schoolConnection.close();
        }
    }
}
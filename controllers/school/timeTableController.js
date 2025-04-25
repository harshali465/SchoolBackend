const timeTableService = require('../../services/timeTable');
const { connectToSchoolDB, waitForConnection } = require('../../utils/connectSchoolDb');


module.exports.createTimeTable = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const TimeTable = await timeTableService.createTimeTable(req.body, schoolConnection);
    res.status(201).json({
      status: 'success',
      data: TimeTable,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.editTimeTable = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const TimeTable = await timeTableService.editTimeTable(req.params.id, req.body, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: TimeTable,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteTimeTable = async (req, res, next) => {
  let schoolConnection;
  const { ids } = req.body;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const deletedTimeTable = await timeTableService.deleteTimeTable(ids, schoolConnection);
    if (!deletedTimeTable) {
      return res.status(404).json({
        status: 'error',
        message: 'Time table not found',
      });
    }
    res.status(204).json({
      status: 'success',
      message: 'Time table deleted successfully',
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getClassWiseTimeTable = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const classWiseTimetable = await timeTableService.getClassWiseTimeTable(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: classWiseTimetable,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getTeacherWiseTimeTable = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const teacherWiseTimetable = await timeTableService.getTeacherWiseTimeTable(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: teacherWiseTimetable,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getDayWiseTimeTable = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const dayWiseTimetable = await timeTableService.getDayWiseTimeTable(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: dayWiseTimetable,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.assignProxyTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const assignProxyTeacherResult = await timeTableService.assignProxyTeacher(req, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: assignProxyTeacherResult,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getTimeTableById = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const timeTableByid = await timeTableService.getTimeTableById(req.params, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: timeTableByid,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getTimeTableByTeacherId = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const timeTableByTeacher = await timeTableService.getTimeTableByTeacherId(req.params, req.query, schoolConnection);

    res.status(200).json({
      status: 'success',
      data: timeTableByTeacher,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getTimeTableByGradeAndSection = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const timeTableByGradeSection = await timeTableService.getTimeTableByGradeAndSection(req.params, req.query, schoolConnection);

    res.status(200).json({
      status: 'success',
      data: timeTableByGradeSection,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

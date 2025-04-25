const classworkServices = require("../../services/classwork");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");

module.exports.createClasswork = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const classworkData = await classworkServices.createClasswork(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: classworkData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getClassworkById = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!id) {
      return res.status(400).json({ error: "Teacher ID is required." });
    }

    const classwork = await classworkServices.getClassworkById(id, schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateClasswork = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!id) {
      return res.status(400).json({ error: "Class Work ID is required." });
    }

    const classwork = await classworkServices.updateClasswork(id, req, schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.submitClasswork = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    const { studentIds } = req.body
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!id) {
      return res.status(400).json({ error: "Teacher ID is required." });
    }

    const classwork = await classworkServices.submitClasswork(id, studentIds,schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getClassworkByTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    const { teacherId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required." });
    }

    const classwork = await classworkServices.getClassworkByTeacher(teacherId, req.query, schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllClassworkByStudentId = async (req, res, next) => {
  let schoolConnection;
  try {
    const { studentId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!studentId) {
      return res.status(400).json({ error: "Teacher ID is required." });
    }

    const classwork = await classworkServices.getAllClassworkByStudentId(studentId, req.query, schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getClassworkByStudentId = async (req, res, next) => {
  let schoolConnection;
  try {
    const { classworkId, studentId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!studentId) {
      return res.status(400).json({ error: "Teacher ID is required." });
    }

    const classwork = await classworkServices.getClassworkByStudentId(classworkId, studentId, schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.markClassWork = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    if (!id) {
      return res.status(400).json({ error: "Class-Work ID is required." });
    }

    const classwork = await classworkServices.markClassWork(id, schoolConnection);

    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.classworkCounts = async (req, res, next) => {
  let schoolConnection;
  try {
    const { teacherId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required." });
    }
    const classwork = await classworkServices.classworkCounts(teacherId, schoolConnection);
    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getTeacherWiseClasswork = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const classwork = await classworkServices.getTeacherWiseClasswork(req.query, schoolConnection);
    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.allClassworkCounts = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const classwork = await classworkServices.allClassworkCounts(req.query, schoolConnection);
    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.allClassworkOfStudents = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const classwork = await classworkServices.allClassworkOfStudents(req.query, schoolConnection);
    return res.status(200).json({ success: true, data: classwork });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};


const attendanceService = require('../../services/attendance');
const { connectToSchoolDB, waitForConnection } = require('../../utils/connectSchoolDb');

// Create a new Tag
module.exports.createTags = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const newTag = await attendanceService.createTags(req.body, schoolConnection);
    res.status(201).json({
      status: 'success',
      data: newTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Get all Tags with pagination and filtering
module.exports.getAllTags = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const tags = await attendanceService.getAllTags(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      results: tags.length,
      data: tags,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Update a Tag
module.exports.updateTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const updatedTag = await attendanceService.updateTag(req.params.id, req.body, schoolConnection);
    if (!updatedTag) return next(new AppError('No tag found with that ID', 404));
    res.status(200).json({
      status: 'success',
      data: updatedTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Delete a Tag
module.exports.deleteTags = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    await attendanceService.deleteTags(req.body.ids, schoolConnection);
    res.status(204).json({
      status: 'success',
      message: 'Tags deleted successfully',
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
//---------------------------------------------------------------------------------------------

// Create a new Day Type
module.exports.createDayType = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const newTag = await attendanceService.createDayType(req.body, schoolConnection);
    res.status(201).json({
      status: 'success',
      data: newTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Get all Day Type with pagination and filtering
module.exports.getAllDayType = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const tags = await attendanceService.getAllDayType(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      results: tags.length,
      data: tags,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Update a Day Type
module.exports.updateDayType = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const updatedTag = await attendanceService.updateDayType(req.params.id, req.body, schoolConnection);
    if (!updatedTag) return next(new AppError('No tag found with that ID', 404));
    res.status(200).json({
      status: 'success',
      data: updatedTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Delete Day Type
module.exports.deleteDayType = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    await attendanceService.deleteDayType(req.body.ids, schoolConnection);
    res.status(204).json({
      status: 'success',
      message: 'Tags deleted successfully',
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createClassAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const newTag = await attendanceService.createClassAttendanceTag(req.body, schoolConnection);
    res.status(201).json({
      status: 'success',
      data: newTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllClassAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const tags = await attendanceService.getAllClassAttendanceTags(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: tags,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getClassAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const tag = await attendanceService.getClassAttendanceTagById(req.params.id, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: tag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateClassAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const updatedTag = await attendanceService.updateClassAttendanceTag(req.params.id, req.body, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: updatedTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateActiveClassAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const updatedTag = await attendanceService.updateActiveClassAttendanceTag(
      req.body,
      schoolConnection
    );

    res.status(200).json({
      status: 'success',
      result: updatedTag,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteClassAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const deletedCount = await attendanceService.deleteClassAttendanceTags(req.body.ids, schoolConnection);
    res.status(200).json({
      status: 'success',
      message: `class attendance tags deleted successfully.`,
    });
  } catch (error) {
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createDayAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.body.created_by = req.user.id;
    const dayAttendanceTagData = await attendanceService.createDayAttendanceTag(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Day attendance tag created successfully",
      data: dayAttendanceTagData,
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateDayAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const DayAttendanceTagData = await attendanceService.updateDayAttendanceTag(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Day Attendance Tag updated successfully",
      data: DayAttendanceTagData,
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateActiveDayAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await attendanceService.updateActiveDayAttendanceTag(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      result,
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.deleteDayAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to delete categories
    const result = await attendanceService.deleteDayAttendanceTag(req.body, schoolConnection);

    // Prepare response
    res.status(200).json({
      status: "success",
      message: "Day Attendance Tag deletion completed.",
      data: {
        deleted: result.deleted,
        notDeleted: result.notDeleted,
      },
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

module.exports.getDayAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const DayAttendanceTagData = await attendanceService.getDayAttendanceTag(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: DayAttendanceTagData,
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

module.exports.getAllDayAttendanceTag = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const DayAttendanceTagData = await attendanceService.getAllDayAttendanceTag(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: DayAttendanceTagData,
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createManualScanForStudent = async(req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const ManualScanForStudentData = await attendanceService.createManualScanForStudent(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: ManualScanForStudentData,
    });
  }catch(error) {
    console.error(error);
    next(error);
  } finally {
    if(schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.createManualScanForTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const ManualScanForTeacherData = await attendanceService.createManualScanForTeacher(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: ManualScanForTeacherData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getAllDayAttendance = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const DayAttendanceData = await attendanceService.getAllDayAttendance(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: DayAttendanceData,
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

module.exports.undoTeachersAttendance = async(req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const undoForTeacherData = await attendanceService.undoTeachersAttendance(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: undoForTeacherData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getAllDayAttendanceForTeacher = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const teacherData = await attendanceService.getAllDayAttendanceForTeacher(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: teacherData,
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

module.exports.getDayAttendanceSummary = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const DayAttendanceSummaryData = await attendanceService.getDayAttendanceSummary(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: DayAttendanceSummaryData,
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

//---------------------------------------------------------------------------------------------
module.exports.createAttendanceCerrtificate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const AttendanceCerrtificateData = await attendanceService.createAttendanceCerrtificate(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: AttendanceCerrtificateData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.updateAttendanceCerrtificate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const AttendanceCerrtificateData = await attendanceService.updateAttendanceCerrtificate(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: AttendanceCerrtificateData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getAllAttendanceCerrtificate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const attendanceCertificateData = await attendanceService.getAllAttendanceCerrtificate(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceCertificateData,
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

module.exports.getAttendanceCerrtificate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const attendanceCertificateData = await attendanceService.getAttendanceCerrtificate(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceCertificateData,
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

module.exports.updateActiveAttendanceCerrtificate = async (req,res,next)=>{
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const updatedData = await attendanceService.updateActiveAttendanceCerrtificate(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

//--------------------------------------------------------------------------------------------
module.exports.getUserWiseAttendance = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const attendanceCertificateData = await attendanceService.getUserWiseAttendance(
      req.params.id,
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceCertificateData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.generateCertificate = async(req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const attendanceCertificateData = await attendanceService.generateCertificate(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceCertificateData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

//-------------------------------------------------------------------------------------------
module.exports.createLeaveRequest = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.createLeaveRequest(
      req,
      schoolConnection
    );
    res.status(200).json(leaveRequestData);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.updateLeaveRequest = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.updateLeaveRequest(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getAllLeaveRequestForAdmin = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.getAllLeaveRequestForAdmin(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
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

module.exports.getLeaveRequestById = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.getLeaveRequestById(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
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

module.exports.approveOrRejectLeaveRequest = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.approveOrRejectLeaveRequest(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.bulkApproveOrRejectLeaveRequest = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.bulkApproveOrRejectLeaveRequest(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.getLeaveRequestUser = async (req,res,next)=>{
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.getLeaveRequestUser(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.withDrawLeaveRequest = async (req,res,next)=>{
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const leaveRequestData = await attendanceService.withDrawLeaveRequest(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: leaveRequestData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

//--------------------------------Class Attandence--------------------------------
module.exports.markClassAttendance = async (req, res) => {
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const markClassAttendanceData = await attendanceService.markClassAttendance(
      req,
      schoolConnection
    );
    res.status(201).json({ message: 'Attendance marked successfully', markClassAttendanceData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateClassAttendance = async (req, res) => {
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const markClassAttendanceData = await attendanceService.updateClassAttendance(
      req,
      schoolConnection
    );
    res.status(200).json({ message: 'Attendance updated successfully', markClassAttendanceData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.getAllMarkClassAttendance = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const attendanceData = await attendanceService.getAttendanceWithStatus(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceData,
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

module.exports.getAllMarkClassAttendanceForStudent = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const attendanceData = await attendanceService.getAllMarkClassAttendanceForStudent(
      req,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceData,
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

module.exports.getMarkClassAttendanceById = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const attendanceData = await attendanceService.getMarkClassAttendanceById(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: attendanceData,
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
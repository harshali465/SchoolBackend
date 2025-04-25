const dashboardService = require("../../services/dashboard/index");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb")

module.exports.getStudentCount = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const studentCount = await dashboardService.getStudentCount(schoolConnection);

    // SEND RESPONSE
    res.status(200).json({ status: "success", data: { count: studentCount }, query: req.query, });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getStudentFormSubmission = async (req, res, next) => {
  try {
    const studentCount = await dashboardService.getStudentFormSubmission(
      req.query
    );
    // SEND RESPONSE
    res.status(200).json({ status: "success", data: studentCount, query: req.query, });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message, });
  }
};

module.exports.getLeaderBoard = async (req, res, next) => {
  try {
    const leaderboard = await dashboardService.getLeaderBoard(req.query);
    // SEND RESPONSE
    res.status(200).json({ status: "success", data: leaderboard, query: req.query, });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message, });
  }
};
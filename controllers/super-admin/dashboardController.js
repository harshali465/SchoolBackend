const dashboardService = require("../../services/dashboard/index");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb")
const School = require("../../commonDbModels/school.model")

module.exports.getStudentCount = async (req, res, next) => {
  let schoolConnection;
  try {
    const getSchools = await School.find({ status: true, isDeleted: false });

    // Initialize counts for accumulation
    let totalStudentCount = 0;
    let totalMaleCount = 0;
    let totalFemaleCount = 0;
    let totalSchools = getSchools.length;

    if (getSchools.length > 0) {
      for (let school of getSchools) {
        schoolConnection = await connectToSchoolDB(school.dbURI);
        await waitForConnection(schoolConnection);

        // Get counts for each school
        const studentCount = await dashboardService.getStudentCount(schoolConnection);

        // Accumulate each count into the totals
        totalStudentCount += studentCount.totalStudents;
        totalMaleCount += studentCount.totalBoys;
        totalFemaleCount += studentCount.totalGirls;

        // Close the connection for this school
        await schoolConnection.close();
      }
    }

    // Send accumulated response
    res.status(200).json({
      status: "success",
      data: {
        totalSchools,
        totalStudents: totalStudentCount,
        totalBoys: totalMaleCount,
        totalGirls: totalFemaleCount,
      },
      query: req.query,
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
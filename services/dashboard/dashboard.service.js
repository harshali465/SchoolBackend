const APIFeatures = require('../../utils/apiFeatures');
const UserModel = require('../../models/user.model')
const AadatDataModel = require('../../models/aadatData.model')
const mongoose = require('mongoose');

module.exports.getStudentCount = async (schoolConnection) => {
  try {

    const User = await schoolConnection.model('User', UserModel.schema);
    let AadatData = await schoolConnection.model('AadatData', AadatDataModel.schema)
    let count = {}
    const studentCount = await User.countDocuments({
      role: 'student'
    })

    const boysStudentCount = await User.countDocuments({
      role: 'student',
      gender: 'male'
    })

    const girldStudentCount = await User.countDocuments({
      role: 'student',
      gender: 'female'
    })

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const submissions = await AadatData.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: "$studentId", // Group by studentId
        },
      },
      {
        $count: "uniqueStudentSubmissions", // Count the number of unique students
      },
    ]);

    const submissionCount = submissions[0]?.uniqueStudentSubmissions || 0;


    count = {
      totalStudents: studentCount,
      totalBoys: boysStudentCount,
      totalGirls: girldStudentCount,
      todaysTotalSubmission: submissionCount
    }
    // Return count of students
    return count; // totalDocs is provided by mongoose-paginate
  } catch (err) {
    throw new Error(`Failed to get student count: ${err.message}`);
  }
};

module.exports.getStudentFormSubmission = async (query) => {
  let startDate, endDate;

  if (query.startDate && query.endDate) {
    // Parse provided startDate and endDate
    startDate = new Date(query.startDate);
    endDate = new Date(query.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid startDate or endDate');
    }
  } else {
    // Get the current date
    const currentDate = new Date();

    // Get the start date (first date) of the current month
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // End date is the current date (without time component)
    endDate = new Date(currentDate);
    endDate.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
  }

  let aggregationPipeline;

  // Check if date range is more than 1 month
  const diffInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth();
  if (diffInMonths > 1) {
    // Month-wise aggregation
    aggregationPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%d/%m/%Y', date: '$createdAt' } },
            studentId: '$studentId'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id.date',
          studentId: '$_id.studentId',
          submission: '$count',
          _id: 0
        }
      }
    ];
  } else {
    // Day-wise aggregation
    aggregationPipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%d/%m/%Y', date: '$createdAt' } },
            studentId: '$studentId'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id.date',
          studentId: '$_id.studentId',
          submission: '$count',
          _id: 0
        }
      }
    ];
  }

  // Perform aggregation
  const result = await AadatDataModel.aggregate(aggregationPipeline);

  return result;
};

module.exports.getLeaderBoard = async (query) => {
  const { activity, startDate, endDate } = query
  let matchConditions = {};
  if (activity) {
    matchConditions.aadat = new mongoose.Types.ObjectId(activity);
  }

  if (startDate && endDate) {
    matchConditions.createdAt = {};
    if (startDate) {
      matchConditions.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchConditions.createdAt.$lte = new Date(endDate);
    }
  }

  const activities = await AadatDataModel.aggregate([
    {
      $match: matchConditions,
    },
    {
      $lookup: {
        from: 'aadats', // collection name in MongoDB
        localField: 'aadat',
        foreignField: '_id',
        as: 'aadatDetails',
      },
    },
    {
      $lookup: {
        from: 'users', // collection name in MongoDB
        localField: 'student',
        foreignField: '_id',
        as: 'studentDetails',
      },
    },
    {
      $unwind: '$aadatDetails',
    },
    {
      $unwind: '$studentDetails',
    },
    {
      $group: {
        _id: {
          studentId: '$studentDetails._id',
          aadatName: '$aadatDetails.name',
          studentName: { $concat: ['$studentDetails.firstName', ' ', '$studentDetails.lastName'] },
          class: '$studentDetails.class',
          division: '$studentDetails.division',
        },
        yesCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id.studentId',
        aadatName: '$_id.aadatName',
        studentName: '$_id.studentName',
        class: '$_id.class',
        division: '$_id.division',
        yesCount: 1,
      },
    },
  ]);
  return activities
}
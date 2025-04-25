const {
  connectToSchoolDB,
  waitForConnection,
} = require("../../utils/connectSchoolDb");
const behaviorService = require("../../services/behavior");
const { BehaviorPointCoupon } = require("../../models/behaviourPoint.model");
const ObjectId = require('mongoose').Types.ObjectId;
//-------------------------------------CONDITIONS--------------------------------------------------
module.exports.createCondition = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.body.created_by = req.user.id;
    const conditionData = await behaviorService.createConditions(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Behaviour Condition created successfully",
      data: conditionData,
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

module.exports.updateCondition = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const conditionData = await behaviorService.updateConditions(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Behaviour Condition created successfully",
      data: conditionData,
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

module.exports.updateActiveCondition = async (req,res,next)=>{
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await behaviorService.updateActiveCondition(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      result,
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

module.exports.deleteCondition = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    await behaviorService.deleteCondition(req.body, schoolConnection);
    res.status(200).json({
      status: "success",
      data: null,
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

module.exports.getCondition = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const conditionData = await behaviorService.getCondition(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: conditionData,
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

module.exports.getAllCondition = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const conditionData = await behaviorService.getAllCondition(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: conditionData,
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
//--------------------------------------------------------------------------------------------------

//-------------------------------------CATEGORIES--------------------------------------------------
module.exports.createCategory = async (req, res, next) => {
  let schoolConnection;
  try {

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.body.created_by = req.user.id;
    const categoryData = await behaviorService.createCategory(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Behaviour Category created successfully",
      data: categoryData,
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

module.exports.updateCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const categoryData = await behaviorService.updateCategory(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Behaviour Category created successfully",
      data: categoryData,
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

module.exports.updateActiveCategory = async (req,res,next)=>{
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await behaviorService.updateActiveCategory(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      result,
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

module.exports.deleteCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to delete categories
    const result = await behaviorService.deleteCategory(req.body, schoolConnection);

    // Prepare response
    res.status(200).json({
      status: "success",
      message: "Category deletion completed.",
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

module.exports.getCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const categoryData = await behaviorService.getCategory(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: categoryData,
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

module.exports.getAllCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const categoryData = await behaviorService.getAllCategory(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: categoryData,
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
//--------------------------------------------------------------------------------------------------

//-------------------------------------COUPONS--------------------------------------------------
module.exports.createCoupon = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    
    req.body.created_by = req.user.id;
    const BehaviorPointCouponModel = await schoolConnection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
    let coupon = await BehaviorPointCouponModel.find({ coupon_for: { $in: req.body.coupon_for } }).lean()
    if (coupon && coupon.length > 0) {
      return res.status(400).json({
        status: false,
        message: "coupon already exists",
      });
    }

    const couponData = await behaviorService.createCoupon(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Behaviour Coupon created successfully",
      data: couponData,
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

module.exports.updateCoupon = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.updateCoupon(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Behaviour Coupon created successfully",
      data: couponData,
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

module.exports.deleteCoupon = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    await behaviorService.deleteCoupon(req.body, schoolConnection);
    res.status(200).json({
      status: "success",
      data: null,
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

module.exports.getCoupon = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.getCoupon(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: couponData,
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

module.exports.getAllCoupon = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.getAllCoupon(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: couponData,
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

module.exports.getCouponByRole = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.getCouponByRole(
      req.query.role,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: couponData,
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
//--------------------------------------------------------------------------------------------------

//-------------------------------------COUPON APPROVAL----------------------------------------------

module.exports.couponApprovalRequest = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.body.requested_by = req.user.id;
    req.body.requested_date = new Date();
    const couponData = await behaviorService.couponApprovalRequest(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Coupon approval request created successfully",
      data: couponData,
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

module.exports.getAllCouponApproval = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.getAllCouponApproval(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Coupon approval request fetch successfully",
      data: couponData,
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

module.exports.getCouponApproval = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.getCouponApproval(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Coupon approval request fetch successfully",
      data: couponData,
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

module.exports.getAllCouponApprovalForUser = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.getAllCouponApprovalForUser(
      req.query,
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Coupon approval request fetch successfully",
      data: couponData,
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

module.exports.deleteCouponApproval = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    await behaviorService.deleteCouponApproval(req.body, schoolConnection);
    res.status(200).json({
      status: "success",
      data: null,
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

module.exports.updateCouponApproval = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const couponData = await behaviorService.updateCouponApproval(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Approval Coupon updated successfully",
      data: couponData,
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

module.exports.acceptCouponApproval = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.body.issued_by = req.user.id;
    const couponData = await behaviorService.acceptCouponApproval(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Approval Accepted",
      data: couponData,
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

//--------------------------------------ASSIGN POINT----------------------------------------
module.exports.assignBehaviorPoint = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.body.assigned_by = req.user.id;
    const resData = await behaviorService.assignBehaviorPoint(
      req.body,
      schoolConnection
    );
    res.status(201).json({
      status: "success",
      message: "Behaviour Point Assign Successfully",
      data: resData,
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

module.exports.getPointAssignedByUser = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const resData = await behaviorService.getPointAssignedByUser(
      req.user,
      schoolConnection,
      req.query
    );
    res.status(200).json({
      status: true,
      data: resData,
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

module.exports.getPointAssignedToUser = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    let data = {
      assigned_to : req.user.id,
      role : req.user.role
    }
    const resData = await behaviorService.getPointAssignedToUser(
      data,
      schoolConnection,
      req.query
    );
    res.status(200).json({
      status: true,
      data: resData,
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

module.exports.getStudentLeaderboard = async (req, res, next) => {
  let schoolConnection;
  try {
    // Connect to the school's database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    req.query.role = req.user.role
    req.query.teacherId = req.user._id
    // Fetch leaderboard data
    const leaderboardData = await behaviorService.getStudentLeaderboard(schoolConnection,req.query);

    // Return the response
    res.status(200).json({
      status: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error("Error fetching student leaderboard:", error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAssignedPointsForStudent = async (req, res, next) => {
  const { studentId } = req.query;  // Extract studentId from query parameters
  let { page = 1, limit = 25 } = req.query;  // Default to page=1 and limit=25 if not provided
  const userRole = req.user.role; // Get the role of the logged-in user
  let schoolConnection;

  if (!studentId) {
    return res.status(400).json({
      status: false,
      message: "Student ID is required in the query parameters"
    });
  }

  try {
    // Ensure that `page` and `limit` are integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Ensure that page and limit are valid numbers
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        status: false,
        message: "Invalid page or limit value."
      });
    }

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const resData = await behaviorService.getAssignedPointsForStudent(
      studentId,
      userRole,
      req.user.id,
      page,    // Pass page as integer
      limit,   // Pass limit as integer
      req.query,
      schoolConnection
    );

    res.status(200).json({
      status: true,
      data: resData.data,
      pagination: resData.pagination,
    });
  } catch (error) {
    console.error("Error fetching points for student:", error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateIsRead = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const resData = await behaviorService.updateIsRead(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      message: "Marked as read",
      data: resData,
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

module.exports.getCategoryWisePoints = async (req, res, next) => {
  let schoolConnection;
  let { page = 1, limit = 25, from_date, end_date, pointType, academicYearId } = req.query;  // Get pagination and filter params from query

  try {
    // Ensure that `page` and `limit` are integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Ensure that page and limit are valid numbers
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        status: false,
        message: "Invalid page or limit value."
      });
    }

    // If startDate or endDate are provided, parse them to Date
    if (from_date) from_date = new Date(from_date);
    if (end_date) end_date = new Date(end_date);

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to get the data with pagination and filters
    const resData = await behaviorService.getCategoryWiseAssignedPoints(
      { startDate:from_date, endDate:end_date, pointType, page, limit, academicYearId },   // Pass filters and pagination parameters
      schoolConnection
    );

    res.status(200).json({
      status: true,
      data: resData.data,
      pagination: resData.pagination,
    });
  } catch (error) {
    console.error("Error fetching points for student:", error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAssignedPointsByCategory = async (req, res, next) => {
  let schoolConnection;
  let { page = 1, limit = 25, categoryId, academicYearId, startDate, endDate } = req.query;

  try {
    // Ensure that `page` and `limit` are integers
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        status: false,
        message: "Invalid page or limit value."
      });
    }

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to get assigned points by category
    const resData = await behaviorService.getAssignedPointsForCategory(categoryId, req.user.role, page, limit, academicYearId, startDate, endDate, schoolConnection);

    res.status(200).json({
      status: true,
      data: resData.data,
      pagination: resData.pagination,
    });
  } catch (error) {
    console.error('Error fetching assigned points by category:', error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

//------------------------------------------------ASSIGNED POINTS-------------------------------
module.exports.totalPoints = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to get assigned points by category
    const resData = await behaviorService.totalPoints(req.query, schoolConnection);

    res.status(200).json({
      status: true,
      data: resData,
    });
  } catch (error) {
    console.error('Error fetching assigned points by category:', error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.report = async (req, res, next) => {
  let schoolConnection;
  let { page = 1, limit = 25, recieverId, giverId, giverType,recieverType,startDate, endDate } = req.query
  try {

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to get assigned points by category
    const resData = await behaviorService.report(page, limit, schoolConnection, recieverId, giverId, giverType, recieverType,startDate, endDate);

    res.status(200).json({
      status: true,
      data: resData,
    });
  } catch (error) {
    console.error('Error fetching assigned report', error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.giverList = async(req, res, next) => {
  let schoolConnection;
  try {

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to get assigned points by category
    const resData = await behaviorService.giverList(schoolConnection, req.query);

    res.status(200).json({
      status: true,
      data: resData,
    });
  } catch (error) {
    console.error('Error fetching giver list', error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.recieverList = async (req, res, next) => {
  let schoolConnection;
  try {

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to get assigned points by category
    const resData = await behaviorService.recieverList(schoolConnection, req.query);

    res.status(200).json({
      status: true,
      data: resData,
    });
  } catch (error) {
    console.error('Error fetching reciever list', error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

//--------------------------------------Monthly report-------------------------------------------
module.exports.monthWiseStudentReport = async (req, res, next) => {
  let schoolConnection;
  const { studentId, page = 1, limit = 25 } = req.query;

  try {
    // Establish connection to the school's database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Call the service to fetch the monthly report
    const result = await behaviorService.monthWiseStudentReport(schoolConnection, studentId, page, limit );

    res.status(200).json({
      status: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
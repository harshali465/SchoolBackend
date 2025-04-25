const {
  BehaviorPointCondition,
  BehaviorPointCategory,
  BehaviorPointCoupon,
  BehaviorPointCouponApproval,
  BehaviorPointAssignPoint,
  BehaviorPointPoint,
} = require("../../models/behaviourPoint.model");
const AppError = require("../../utils/appError");
const APIFeatures = require("../../utils/apiFeatures");
const User = require("../../models/user.model");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const TeacherTypeModel = require("../../models/teacherType.model");
const notificationTemplate = require('../../models/notification-template.model');
const Notification = require('../../models/notification.model');
const { default: mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { sendMessage } = require("../../controllers/school/whatsappController");
const transporter = require("../../utils/sendMail");
const Module = require("../../commonDbModels/modules-master.model");
const { io } = require("../../server");
const { AcademicYears } = require('../../models/academics.model');
//-------------------------------------CONDITIONS--------------------------------------------------
module.exports.createConditions = async (reqBody, connection) => {
  const BehaviorPointConditionModel = await connection.model("BehaviorPointCondition", BehaviorPointCondition.schema);
  const findCondition = await BehaviorPointConditionModel.findOne({ module_id: reqBody.module_id })
  if (!findCondition) {
    const conditionData = await BehaviorPointConditionModel.create(reqBody);
    return conditionData;
  } else {
    throw new AppError("Condition for module already exists", 200)
  }
};

module.exports.updateConditions = async (conditionId, reqBody, connection) => {
  const BehaviorPointConditionModel = await connection.model("BehaviorPointCondition", BehaviorPointCondition.schema);
  const conditionData = await BehaviorPointConditionModel.findByIdAndUpdate(
    conditionId,
    reqBody
  );
  if (!conditionData) {
    throw new AppError("No document found with that ID", 404);
  }
  return conditionData;
};

module.exports.updateActiveCondition = async (body, connection) => {
  const BehaviorPointConditionModel = await connection.model("BehaviorPointCondition", BehaviorPointCondition.schema);

  const { ids, active } = body;
  const updatedresult = await BehaviorPointConditionModel.updateMany(
    { _id: { $in: ids } },
    { $set: { status: active } },
  );
  if (!updatedresult) {
    throw new AppError('could not update', 404);
  }
  return updatedresult;
};

module.exports.getCondition = async (conditionId, connection) => {
  const BehaviorPointConditionModel = await connection.model("BehaviorPointCondition", BehaviorPointCondition.schema);
  await connection.model("AcademicYears", AcademicYears.schema);
  const conditionData = await BehaviorPointConditionModel.findById(conditionId).populate('academicYearId');

  if (!conditionData) {
    throw new AppError("Invalid ID", 400);
  }

  return conditionData;
};

module.exports.getAllConditions = async (query, connection) => {
  const BehaviorPointConditionModel = await connection.model("BehaviorPointCondition", BehaviorPointCondition.schema);
  await connection.model("AcademicYears", AcademicYears.schema);
  const conditionData = await new APIFeatures(query)
    .search()
    .populate('academicYearId')
    .sort()
    .limitFields()
    .paginate()
    .exec(BehaviorPointConditionModel);

  // SEND RESPONSE
  return conditionData.data;
};

module.exports.deleteCondition = async (body, connection) => {
  try {
    const BehaviorPointConditionModel = await connection.model("BehaviorPointCondition", BehaviorPointCondition.schema);

    const { ids } = body;
    await BehaviorPointConditionModel.deleteMany({ _id: { $in: ids } });
    return "Users deleted successfully";
  } catch (error) {
    return "There was a problem deleting the users";
  }
};
//--------------------------------------------------------------------------------------------------

//-------------------------------------Categories--------------------------------------------------
module.exports.createCategory = async (reqBody, connection) => {
  const { category_for, academicYearId } = reqBody;

  // Get the BehaviorPointCategory model
  const BehaviorPointCategoryModel = await connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  let createdCategories = [];

  for (const category of category_for) {
    const categoryData = {
      category_for: category,
      category_name: reqBody.category_name,
      point_type: reqBody.point_type,
      point: reqBody.point,
      created_by: reqBody.created_by,
      academicYearId
    };
    createdCategories.push(
      await BehaviorPointCategoryModel.create(categoryData)
    );
  }
  return createdCategories;
};

module.exports.updateCategory = async (categoryId, reqBody, connection) => {
  const BehaviorPointCategoryModel = await connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);

  const categoryData = await BehaviorPointCategoryModel.findByIdAndUpdate(
    categoryId,
    reqBody
  );
  if (!categoryData) {
    throw new AppError("No document found with that ID", 404);
  }
  return categoryData;
};

module.exports.updateActiveCategory = async (body, connection) => {
  const BehaviorPointCategoryModel = await connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);

  const { ids, active } = body;
  const updatedresult = await BehaviorPointCategoryModel.updateMany(
    { _id: { $in: ids } },
    { $set: { status: active } },
  );
  if (!updatedresult) {
    throw new AppError('could not update', 404);
  }
  return updatedresult;
};

module.exports.getCategory = async (categoryId, connection) => {
  const BehaviorPointCategoryModel = await connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  await connection.model("AcademicYears", AcademicYears.schema);
  const categoryData = await BehaviorPointCategoryModel.findById(categoryId).populate('academicYearId');

  if (!categoryData) {
    throw new AppError("Invalid ID", 400);
  }

  return categoryData;
};

module.exports.getAllCategory = async (query, connection) => {
  const BehaviorPointCategoryModel = await connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  await connection.model("AcademicYears", AcademicYears.schema);
  const categoryData = await new APIFeatures(query)
    .search()
    .populate('academicYearId')
    .sort()
    .limitFields()
    .paginate()
    .exec(BehaviorPointCategoryModel);

  // SEND RESPONSE
  return categoryData.data;
};

module.exports.deleteCategory = async (body, connection) => {
  try {
    const BehaviorPointCategoryModel = connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    const { ids } = body;

    const result = {
      deleted: [],
      notDeleted: [],
    };

    for (const id of ids) {
      // Check if the category is assigned to any points
      const isAssigned = await BehaviorPointAssignPointModel.exists({ category_id: id });

      if (isAssigned) {
        // Add to the notDeleted list if assigned
        result.notDeleted.push(id);
      } else {
        // Delete if not assigned and add to the deleted list
        await BehaviorPointCategoryModel.findByIdAndDelete(id);
        result.deleted.push(id);
      }
    }

    return result; // Return the status of deleted and not deleted categories
  } catch (error) {
    console.error("Error deleting categories:", error);
    throw new Error("There was a problem deleting the categories.");
  }
};
//--------------------------------------------------------------------------------------------------

//-------------------------------------COUPONS--------------------------------------------------
module.exports.createCoupon = async (reqBody, connection) => {
  const { coupon_for, academicYearId } = reqBody;
  let createdCoupon = [];
  const BehaviorPointCouponModel = await connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
  for (const coupon of coupon_for) {
    const couponData = {
      coupon_for: coupon,
      coupon_value: reqBody.coupon_value,
      created_by: reqBody.created_by,
      academicYearId
    };
    createdCoupon.push(await BehaviorPointCouponModel.create(couponData));
  }
  return createdCoupon;
};

module.exports.updateCoupon = async (couponId, reqBody, connection) => {
  const BehaviorPointCouponModel = await connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);

  const couponData = await BehaviorPointCouponModel.findByIdAndUpdate(
    couponId,
    reqBody
  );
  if (!couponData) {
    throw new AppError("No document found with that ID", 404);
  }
  return couponData;
};

module.exports.getCoupon = async (couponId, connection) => {
  const BehaviorPointCouponModel = await connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
  await connection.model("AcademicYears", AcademicYears.schema);
  const couponData = await BehaviorPointCouponModel.findById(couponId).populate('academicYearId');

  if (!couponData) {
    throw new AppError("Invalid ID", 400);
  }

  return couponData;
};

module.exports.getAllCoupon = async (query, connection) => {
  const BehaviorPointCouponModel = await connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
  await connection.model("AcademicYears", AcademicYears.schema);
  const couponData = await new APIFeatures(query)
    .search()
    .populate('academicYearId')
    .sort()
    .limitFields()
    .paginate()
    .exec(BehaviorPointCouponModel);

  // SEND RESPONSE
  return couponData.data;
};

module.exports.getCouponByRole = async (role, connection) => {
  const BehaviorPointCouponModel = await connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);

  const couponData = await BehaviorPointCouponModel.find({
    coupon_for: role,
  });

  return couponData;
};

module.exports.deleteCoupon = async (body, connection) => {
  try {
    const BehaviorPointCouponModel = await connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);

    const { ids } = body;
    await BehaviorPointCouponModel.deleteMany({ _id: { $in: ids } });
    return "Users deleted successfully";
  } catch (error) {
    return "There was a problem deleting the users";
  }
};
//--------------------------------------------------------------------------------------------------

//-------------------------------------COUPONS APPROVAL--------------------------------------------------
module.exports.couponApprovalRequest = async (reqBody, connection) => {
  const BehaviorPointCouponApprovalModel = connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);
  const BehaviorPointCouponModel = connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
  const BehaviorPointPointModel = connection.model("BehaviorPointPoint", BehaviorPointPoint.schema);

  // Fetch the coupon value
  const couponPoint = await BehaviorPointCouponModel.findById(
    reqBody.coupon_id
  ).select("coupon_value");
  if (!couponPoint) {
    throw new AppError("Coupon not found", 400);
  }

  // Create a new entry in BehaviorPointCouponApprovalModel
  const requestedData = await BehaviorPointCouponApprovalModel.create(reqBody);

  // Fetch the user's behavior points
  const behaviorPoint = await BehaviorPointPointModel.findOne({
    user_id: reqBody.requested_by,
  });
  if (!behaviorPoint) {
    throw new AppError("User's behavior points not found", 400);
  }

  // Calculate the total points for the requested coupons
  const totalRedeemedPoints =
    (couponPoint.coupon_value || 0) * (reqBody.requested_coupon || 0);

  // Update the user's behavior points
  behaviorPoint.RemainingPoints -= totalRedeemedPoints;
  behaviorPoint.reedemedPoints += totalRedeemedPoints;

  // Save the updated behavior points
  await behaviorPoint.save();

  // Return the created coupon approval request
  return requestedData;
};

module.exports.getAllCouponApproval = async (reqQuery, connection) => {
  const {
    startDate,
    endDate,
    user_type,
    is_issued,
    search,
    academicYealId
  } = reqQuery;

  const BehaviorPointCouponApprovalModel = connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);
  const UserModel = connection.model("User", User.schema); // Assuming user model exists
  connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
  connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  connection.model("Grade", Grade.schema);
  connection.model("Section", Section.schema);
  connection.model("TeacherType", TeacherTypeModel.schema);
  connection.model("AcademicYears", AcademicYears.schema);

  // Build the query criteria based on filters
  const queryCriteria = {};

  // Date range filter
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set the endDate to the last millisecond of the day
    end.setHours(23, 59, 59, 999);

    queryCriteria.createdAt = {
      $gte: start,
      $lte: end,
    };
  }

  // Filter by is_issued status if provided
  if (typeof is_issued !== 'undefined' && is_issued !== "" && is_issued != null) {
    queryCriteria.is_issued = is_issued === 'true' ? true : false;
  }

  // Filter by user_type or search if provided
  if (user_type !== "all" || search) {
    // Build dynamic query for UserModel
    const userQuery = {};

    // Add user_type filter
    if (user_type && user_type !== "all") {
      userQuery.role = user_type; // Match the role field
    }

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(`.*${search}.*`, "i");
      const searchTerms = search.split(" ");

      if (searchTerms.length > 1) {
        // Handle full name search
        const firstNameRegex = new RegExp(`.*${searchTerms[0]}.*`, "i");
        const lastNameRegex = new RegExp(`.*${searchTerms.slice(1).join(" ")}.*`, "i");

        userQuery.$or = [
          { $and: [{ firstName: firstNameRegex }, { lastName: lastNameRegex }] },
          { $and: [{ lastName: lastNameRegex }] },
        ];
      } else {
        // Single term search for firstName or lastName
        userQuery.$or = [{ firstName: searchRegex }, { lastName: searchRegex }];
      }
    }

    // Fetch user IDs based on the combined query
    const users = await UserModel.find(userQuery).select("_id");
    const userIds = users.map((user) => user._id);

    if (userIds.length > 0) {
      queryCriteria.requested_by = { $in: userIds };
    } else {
      // If no users match, set an empty array to avoid returning results
      queryCriteria.requested_by = { $in: [] };
    }
  }

  if (academicYealId) {
    queryCriteria.academicYealId = academicYealId;
  }

  try {
    // Use find instead of paginate to get all matching records without pagination
    const result = await BehaviorPointCouponApprovalModel.find(queryCriteria)
      .populate([
        {
          path: "coupon_id", // Populate coupon details
        },
        {
          path: "academicYearId", // Populate coupon details
        },
        {
          path: "requested_by", // Populate the requested_by user details
          populate: [
            {
              path: "stageGradeSection",
              select: "grade section",
              populate: [
                { path: "grade", select: "grade" },
                { path: "section", select: "section" },
              ],
            },
            {
              path: "teacherType",
              select: "type",
            },
          ]
        },
      ])
      .sort({ createdAt: -1 });

    return result;
  } catch (error) {
    console.error("Error fetching coupon approval data:", error);
    throw error;
  }
};


module.exports.getAllCouponApprovalForUser = async (reqQuery, userId, connection) => {
  const { startDate, endDate, academicYealId } = reqQuery;

  const BehaviorPointCouponApprovalModel = connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);
  const UserModel = connection.model("User", User.schema); // Assuming user model exists
  connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);
  connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  connection.model("Grade", Grade.schema);
  connection.model("Section", Section.schema);
  connection.model("TeacherType", TeacherTypeModel.schema);
  connection.model("AcademicYears", AcademicYears.schema);
  // Build the query criteria based on filters
  const queryCriteria = {};

  // Date range filter
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set the endDate to the last millisecond of the day
    end.setHours(23, 59, 59, 999);
    queryCriteria.createdAt = {
      $gte: start,
      $lte: end,
    };
  }

  // Filter by the userId (always filter by the requested_by userId)
  queryCriteria.requested_by = new ObjectId(userId);
  if (academicYealId) {
    queryCriteria.academicYealId = new ObjectId(academicYealId);
  }
  
  try {
    // Paginate the results based on the query criteria
    const result = await BehaviorPointCouponApprovalModel.find(queryCriteria)
      .populate([
        {
          path: "coupon_id", // Populate coupon details
        },
        {
          path: "academicYearId", options: { strictPopulate: false }// Populate coupon details
        },
        {
          path: "requested_by", // Populate the requested_by user details
          populate: [
            {
              path: "stageGradeSection",
              select: "grade section",
              populate: [
                { path: "grade", select: "grade" },
                { path: "section", select: "section" },
              ],
            },
            {
              path: "teacherType",
              select: "type",
            },
          ],
        },
      ])
      .lean();

    return result;
  } catch (error) {
    console.error("Error fetching coupon approval data:", error);
    throw error;
  }
};

module.exports.getCouponApproval = async (couponApprovalId, connection) => {
  const BehaviorPointCouponApprovalModel = await connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);
  connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);

  const result =
    await BehaviorPointCouponApprovalModel.findById(couponApprovalId).populate("coupon_id");
  return result;
};

module.exports.deleteCouponApproval = async (body, connection) => {
  try {
    const BehaviorPointCouponApprovalModel = await connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);

    const { ids } = body;
    await BehaviorPointCouponApprovalModel.deleteMany({ _id: { $in: ids } });
    return "Coupon Approval deleted successfully";
  } catch (error) {
    return "There was a problem deleting the users";
  }
};

module.exports.updateCouponApproval = async (couponId, reqBody, connection) => {
  const BehaviorPointCouponApprovalModel = await connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);

  const couponData = await BehaviorPointCouponApprovalModel.findByIdAndUpdate(
    couponId,
    reqBody
  );
  if (!couponData) {
    throw new AppError("No document found with that ID", 404);
  }
  return couponData;
};

module.exports.acceptCouponApproval = async (couponId, reqBody, connection) => {
  const BehaviorPointCouponApprovalModel = await connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);

  const couponData = await BehaviorPointCouponApprovalModel.findByIdAndUpdate(
    couponId,
    reqBody
  );
  if (!couponData) {
    throw new AppError("No document found with that ID", 404);
  }
  return couponData;
};

//-----------------------------------------------ASSIGN POINTS----------------------------------------------------------
module.exports.assignBehaviorPoint = async (body, connection) => {
  const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
  const BehaviorPointPointModel = connection.model("BehaviorPointPoint", BehaviorPointPoint.schema);
  const BehaviorPointCategoryModel = connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);

  // Fetch the point value from the BehaviorPointCategoryModel
  const categoryPoint = await BehaviorPointCategoryModel.findOne({
    _id: body.category_id,
  }).select("point point_type");

  if (!categoryPoint) {
    throw new Error("Category points not found.");
  }

  // Iterate over each assigned_to user and perform operations
  const results = [];
  for (const userId of body.assigned_to) {
    // Create a new entry in BehaviorPointAssignPointModel for each user
    const assignPointData = {
      ...body,
      assigned_to: userId, // Set current userId in the body
    };

    const requestedData =
      await BehaviorPointAssignPointModel.create(assignPointData);

    // Check if a record exists in BehaviorPointPointModel for this user
    let behaviorPoint = await BehaviorPointPointModel.findOne({
      user_id: userId,
    });

    if (!behaviorPoint) {
      // If no document exists, create a new one
      behaviorPoint = new BehaviorPointPointModel({
        user_id: userId,
        user_type: body.user_type,
        totalPoints: categoryPoint.point || 0,
        reedemedPoints: 0, // Default to 0
        RemainingPoints: categoryPoint.point || 0,
        academicYearId: body.academicYearId
      });
    } else {
      // Update the existing document by adding the points
      behaviorPoint.totalPoints += categoryPoint.point || 0;
      behaviorPoint.RemainingPoints += categoryPoint.point || 0;
    }

    // Save the document (create or update)
    await behaviorPoint.save();

    // Store the result for this user
    results.push({
      assignPoint: requestedData,
      behaviorPoint,
    });

    //   const NotificationModel = connection.model("Notification", Notification.schema);
    //   const notificationTemplateModel = connection.model('notificationTemplate', notificationTemplate.schema);
    //   const UserModel = connection.model("user", User.schema);
    //   let user = await UserModel.findById(userId)
    //   let type = user.notificationPreference
    //   let message = await notificationTemplateModel.findOne({ module: 'behaviour' })
    //   let moduleId = Module.findOne({ moduleName: 'Behaviour' }).select("_id")
    //   // Modify the template based on point_type
    //   let notificationMessage;
    //   if (categoryPoint.point_type == "Negative") {
    //     // Remove the "{{x}} points /" part
    //     notificationMessage = message.remark.replace("{{x}} points / ", "").trim();
    //   } else if (categoryPoint.point_type == "Positive") {
    //     // Remove the "/ {{y}} remark" part
    //     notificationMessage = message.remark.replace(" / {{y}} remark", "").trim();
    //   }
    //   // Replace placeholders dynamically
    //   notificationMessage = notificationMessage
    //     .replace("{{x}}", categoryPoint.point || 0)
    //     .replace("{{y}}", categoryPoint.remark || 0)
    //     .replace("{{user}}", `${user.firstName} ${user.lastName} ` || "Unknown");

    //   let subject = 'Behaviour Notification'
    //   let notification = new NotificationModel({
    //     senderId: body.assigned_by,
    //     receiverId: userId, // Assuming receiver is the user ID
    //     message: notificationMessage,
    //     type: type,
    //     moduleId: moduleId._id,
    //     userType: user.role,
    //     subject,
    //   });
    //   // Send WhatsApp message to all relevant phone numbers
    //   if (type === "Whatsapp" || type === "both") {
    //     let number = [];

    //     if (user.role === "student") {
    //       number.push(user.familyDetails.fatherPhone, user.familyDetails.motherPhone);
    //     } else if (user.role === "teacher") {
    //       number.push(user.contactPersonMobile);
    //     }

    //     await Promise.all(
    //       number.map(async (phoneNumber) => {
    //         try {
    //           await sendMessage(body.assigned_by, phoneNumber, notificationMessage, connection);
    //         } catch (error) {
    //           console.error(error);
    //         }
    //       })
    //     );
    //   }
    //   // Handle email notifications
    //   if (type === "email" || type === "both") {
    //     const mailOptions = {
    //       from: process.env.USERMAILSENDER,
    //       to: user.role === "student" ? `${user.familyDetails.fatherEmail}, ${user.familyDetails.motherEmail}` : user.role === "teacher" ? user.email : "",
    //       subject: subject,
    //       text: notificationMessage,
    //     };
    //     await transporter.sendMail(mailOptions);
    //   }
    //   await notification.save();
  }
  // let obj = {
  //   sender: body.assigned_by,
  //   reciever: body.assigned_to,
  // }
  // io.emit('receiveNotificationArr', obj)

  // Return the results for all users
  return results;
};

module.exports.getPointAssignedByUser = async (data, connection, reqQuery) => {
  try {
    const {
      page = 1,
      limit = 25,
      from_date,
      end_date,
      user_type,
      point_type,
      search,
      academicYearId
    } = reqQuery;

    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    const UserModel = connection.model("User", User.schema);
    connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    connection.model("TeacherType", TeacherTypeModel.schema);
    connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    let match1 = { assigned_by: new ObjectId(data.id) }

    if (point_type) {
      match1 = { point_type: point_type }
    }
    // Initialize the match criteria
    let matchCriteria = {};
    // Role-based filtering for points
    if (data.role === "student") {
      matchCriteria = { point_type: "Positive" };
    }
    else if (data.role === "teacher") {
      matchCriteria = {
        $or: [
          // Case where assigned_by matches the teacherId, get both Positive and Negative
          {
            $and: [
              { "assigned_by._id": new ObjectId(data.id) },
              { point_type: { $in: ["Positive", "Negative"] } }
            ]
          },
          // Case where assigned_by does not match the teacherId, only get Positive
          {
            $and: [
              { "assigned_by._id": { $ne: new ObjectId(data.id) } },
              { point_type: "Positive" }
            ]
          }
        ]
      };
    }
    // Date filtering
    if (from_date && end_date) {
      const start = new Date(from_date);
      const end = new Date(end_date);
      // Set the endDate to the last millisecond of the day
      end.setHours(23, 59, 59, 999);
      match1.createdAt = {
        $gte: start,
        $lte: end,
      };
    }
    // Add filters for user_type and point_type
    if (user_type) {
      match1.user_type = user_type;
    }
    if (point_type) {
      match1.point_type = point_type;
    }
    // Add search filter
    if (search) {
      const searchQuery = {}; // Temporary object for search criteria
      if (search.includes(" ")) {
        // Split full name into first and last name
        const [firstNameTerm, ...lastNameTerms] = search.split(" ");
        const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, "i");
        const lastNameRegex = new RegExp(`.*${lastNameTerms.join(" ")}.*`, "i");
        searchQuery.$or = [
          { firstName: firstNameRegex, lastName: lastNameRegex },
          { lastName: lastNameRegex },
        ];
      } else {
        // Single-word search for either firstName or lastName
        const searchRegex = new RegExp(`.*${search}.*`, "i");
        searchQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
        ];
      }
      // Fetch user IDs matching the search query
      const users = await UserModel.find(searchQuery, { _id: 1 }).lean();
      const userIds = users.map((user) => user._id);
      // Filter assigned_to or assigned_by using matched user IDs
      match1.$or = [
        { assigned_to: { $in: userIds } },
        { assigned_by: { $in: userIds } },
      ];
    }
    if (academicYearId) {
      match1.academicYearId = new ObjectId(academicYearId)
    }
    // Fetch paginated results
    const assignedByPoints = await BehaviorPointAssignPointModel.aggregate([
      { $match: match1 },
      {
        $lookup: {
          from: "users", // User model collection
          localField: "assigned_to",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "assigned_to",
        },
      },
      { $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "assigned_to.stageGradeSection",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "assigned_to.stageGradeSection.grade",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "assigned_to.stageGradeSection.section",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "assigned_to.teacherType",
          foreignField: "_id",
          as: "assigned_to.teacherType",
        },
      },
      { $unwind: { path: "$assigned_to.teacherType", preserveNullAndEmptyArrays: true } },
      // Assigned_by lookups
      {
        $lookup: {
          from: "users",
          localField: "assigned_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "assigned_by",
        },
      },
      { $unwind: { path: "$assigned_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "assigned_by.stageGradeSection",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "assigned_by.stageGradeSection.grade",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "assigned_by.stageGradeSection.section",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "assigned_by.teacherType",
          foreignField: "_id",
          as: "assigned_by.teacherType",
        },
      },
      { $unwind: { path: "$assigned_by.teacherType", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "behaviorpointcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "category_id",
        },
      },
      { $unwind: { path: "$category_id", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "academicyears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearId",
        },
      },
      { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
      { $match: matchCriteria },
      { $sort: { createdAt: -1 } },
    ]);
    let result = {}
    result.docs = assignedByPoints
    return result; // Return the paginated result
  } catch (error) {
    console.error("Error fetching assigned points:", error);
    throw error;
  }
};

module.exports.getPointAssignedToUser = async (data, connection, reqQuery) => {
  try {
    const {
      page = 1,
      limit = 25,
      from_date,
      end_date,
      user_type,
      point_type,
      search,
      academicYearId
    } = reqQuery;
    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    connection.model("TeacherType", TeacherTypeModel.schema);
    connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    const UserModel = connection.model("User", User.schema);

    // Build the query object
    let query = { assigned_to: new ObjectId(data.assigned_to) };

    // Add date filter
    if (from_date) {
      query.createdAt = {
        $gte: new Date(from_date),
        $lte: end_date ? new Date(end_date) : new Date(), // Default end_date to now
      };
    }

    // Add other filters
    // if (user_type) {
    //   query.user_type = user_type;
    // }

    if (point_type) {
      query.point_type = point_type;
    }
    if (search || user_type) {
      const searchQuery = {}; // Temporary object for search criteria

      if (search) {
        if (search.includes(" ")) {
          // Split full name into first and last name
          const [firstNameTerm, ...lastNameTerms] = search.split(" ");
          const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, "i");
          const lastNameRegex = new RegExp(`.*${lastNameTerms.join(" ")}.*`, "i");

          searchQuery.$or = [
            { firstName: firstNameRegex, lastName: lastNameRegex },
            { lastName: lastNameRegex },
          ];
        } else {
          // Single-word search for either firstName or lastName
          const searchRegex = new RegExp(`.*${search}.*`, "i");
          searchQuery.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
          ];
        }
      }

      if (user_type) {
        // Add user_type to searchQuery
        searchQuery.role = user_type;
      }

      // Fetch user IDs matching the search query
      const users = await UserModel.find(searchQuery, { _id: 1 }).lean();
      const userIds = users.map((user) => user._id);

      // Apply filter only to `assigned_by`
      query.$and = [
        { assigned_by: { $in: userIds } }, // Ensure assigned_by matches search and user_type
      ];
    }
    if (academicYearId) {
      query.academicYearId = new ObjectId(academicYearId)
    }
    // Fetch paginated results
    let assignedByPoints = await BehaviorPointAssignPointModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users", // User model collection
          localField: "assigned_to",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "assigned_to",
        },
      },
      { $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "assigned_to.stageGradeSection",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "assigned_to.stageGradeSection.grade",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "assigned_to.stageGradeSection.section",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "assigned_to.teacherType",
          foreignField: "_id",
          as: "assigned_to.teacherType",
        },
      },
      { $unwind: { path: "$assigned_to.teacherType", preserveNullAndEmptyArrays: true } },
      // Assigned_by lookups
      {
        $lookup: {
          from: "users",
          localField: "assigned_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "assigned_by",
        },
      },
      { $unwind: { path: "$assigned_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "assigned_by.stageGradeSection",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "assigned_by.stageGradeSection.grade",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "assigned_by.stageGradeSection.section",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "assigned_by.teacherType",
          foreignField: "_id",
          as: "assigned_by.teacherType",
        },
      },
      { $unwind: { path: "$assigned_by.teacherType", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "behaviorpointcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "category_id",
        },
      },
      { $unwind: { path: "$category_id", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "academicyears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearId",
        },
      },
      { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
    ]);

    // Additional role-based filtering
    if (data.role !== "school-admin") {
      assignedByPoints = assignedByPoints.filter(
        (point) => point.point_type === "Positive"
      );
    }
    let result = {}
    result.docs = assignedByPoints
    return result;
  } catch (error) {
    console.error("Error fetching assigned points:", error);
    throw error;
  }
};

// module.exports.getStudentLeaderboard = async (connection, query) => {
//   const {
//     startDate,
//     endDate,
//     grade,
//     section,
//     userType,
//     teacherType,
//     role,
//     teacherId
//   } = query;

//   try {
//     const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
//     const UserModel = connection.model("User", User.schema);
//     const StageGradeSectionTimeModel = connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
//     connection.model("Grade", Grade.schema);
//     connection.model("Section", Section.schema);
//     connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
//     connection.model("TeacherType", TeacherTypeModel.schema);

//     // Initialize the match criteria
//     let matchCriteria = {};
//     // Role-based filtering for points
//     if (role === "student") {
//       matchCriteria = { point_type: "Positive" };
//     }

//     else if (role === "teacher") {
//       matchCriteria = {
//         $or: [
//           // Case where assigned_by matches the teacherId, get both Positive and Negative
//           {
//             $and: [
//               { "assigned_by._id": new ObjectId(teacherId) },
//               { point_type: { $in: ["Positive", "Negative"] } }
//             ]
//           },
//           // Case where assigned_by does not match the teacherId, only get Positive
//           {
//             $and: [
//               { "assigned_by._id": { $ne: new ObjectId(teacherId) } },
//               { point_type: "Positive" }
//             ]
//           }
//         ]
//       };
//     }

//     // Additional filters based on user type
//     if (userType) {
//       matchCriteria["user_type"] = userType;
//     }

//     // Date filtering
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);

//       // Set the endDate to the last millisecond of the day
//       end.setHours(23, 59, 59, 999);

//       matchCriteria.createdAt = {
//         $gte: start,
//         $lte: end,
//       };
//     }


//     // Filter by teacher type (only if user is a teacher)
//     if (teacherType) {
//       const teacherIds = await UserModel.find({ teacherType }).select("_id");
//       if (teacherIds.length === 0) {
//         throw new Error("No teachers found for the provided teacherType");
//       }
//       matchCriteria["assigned_to._id"] = {
//         $in: teacherIds.map((item) => item._id),
//       };
//     }

//     // Grade and section filtering
//     if (grade || section) {
//       const stageGradeFilter = {};
//       if (grade) stageGradeFilter.grade = grade;
//       if (section) stageGradeFilter.section = section;

//       const stageGradeSection = await StageGradeSectionTimeModel.find(stageGradeFilter).select("_id");
//       const sectionIds = stageGradeSection.map((item) => item._id);

//       const usersWithStageGradeSection = await UserModel.find({
//         "stageGradeSection": { $in: sectionIds },
//       }).select("_id");

//       if (usersWithStageGradeSection.length === 0) {
//         throw new Error("No users found for the provided grade/section");
//       }
//       matchCriteria["assigned_to._id"] = { $in: usersWithStageGradeSection.map((item) => item._id) };
//     }

//     // Aggregation pipeline
//     const behaviorPoints = await BehaviorPointAssignPointModel.aggregate([
//       {
//         $lookup: {
//           from: "users", // User model collection
//           localField: "assigned_to",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 _id: 1,
//                 firstName: 1,
//                 middleName: 1,
//                 lastName: 1,
//                 role: 1,
//                 photo: 1,
//                 teacherType: 1,
//                 itsNo: 1,
//                 stageGradeSection: 1
//               }
//             }
//           ],
//           as: "assigned_to",
//         },
//       },
//       { $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "stagegradesectiontimes",
//           localField: "assigned_to.stageGradeSection",
//           foreignField: "_id",
//           as: "assigned_to.stageGradeSection",
//         },
//       },
//       { $unwind: { path: "$assigned_to.stageGradeSection", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "grades",
//           localField: "assigned_to.stageGradeSection.grade",
//           foreignField: "_id",
//           as: "assigned_to.stageGradeSection.grade",
//         },
//       },
//       { $unwind: { path: "$assigned_to.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "sections",
//           localField: "assigned_to.stageGradeSection.section",
//           foreignField: "_id",
//           as: "assigned_to.stageGradeSection.section",
//         },
//       },
//       { $unwind: { path: "$assigned_to.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "teachertypes",
//           localField: "assigned_to.teacherType",
//           foreignField: "_id",
//           as: "assigned_to.teacherType",
//         },
//       },
//       { $unwind: { path: "$assigned_to.teacherType", preserveNullAndEmptyArrays: true } },
//       // Assigned_by lookups
//       {
//         $lookup: {
//           from: "users",
//           localField: "assigned_by",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $project: {
//                 _id: 1,
//                 firstName: 1,
//                 middleName: 1,
//                 lastName: 1,
//                 role: 1,
//                 photo: 1,
//                 teacherType: 1,
//                 itsNo: 1,
//                 stageGradeSection: 1
//               }
//             }
//           ],
//           as: "assigned_by",
//         },
//       },
//       { $unwind: { path: "$assigned_by", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "stagegradesectiontimes",
//           localField: "assigned_by.stageGradeSection",
//           foreignField: "_id",
//           as: "assigned_by.stageGradeSection",
//         },
//       },
//       { $unwind: { path: "$assigned_by.stageGradeSection", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "grades",
//           localField: "assigned_by.stageGradeSection.grade",
//           foreignField: "_id",
//           as: "assigned_by.stageGradeSection.grade",
//         },
//       },
//       { $unwind: { path: "$assigned_by.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "sections",
//           localField: "assigned_by.stageGradeSection.section",
//           foreignField: "_id",
//           as: "assigned_by.stageGradeSection.section",
//         },
//       },
//       { $unwind: { path: "$assigned_by.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "teachertypes",
//           localField: "assigned_by.teacherType",
//           foreignField: "_id",
//           as: "assigned_by.teacherType",
//         },
//       },
//       { $unwind: { path: "$assigned_by.teacherType", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "behaviorpointcategories",
//           localField: "category_id",
//           foreignField: "_id",
//           as: "category_id",
//         },
//       },
//       { $unwind: { path: "$category_id", preserveNullAndEmptyArrays: true } },
//       { $match: matchCriteria },
//     ]);
//     let leaderboard = []
//     // Check if behaviorPoints is empty
//     if (!behaviorPoints || behaviorPoints.length === 0) {
//       return leaderboard
//     }
//     const groupedData = {};
//     for (const point of behaviorPoints) {
//       const studentId = point.assigned_to._id;
//       const categoryPositivePoints = (point.category_id?.point_type == 'Positive') ? point.category_id?.point : 0;
//       const categoryNegativePoints = (point.category_id?.point_type == 'Negative') ? 1 : 0;
//       if (!groupedData[studentId]) {
//         groupedData[studentId] = {
//           totalPositivePoints: 0,
//           totalNegativePoints: 0,
//           studentDetails: point.assigned_to,
//           assignedBy: point.assigned_by
//         };
//       }
//       groupedData[studentId].totalPositivePoints += categoryPositivePoints;
//       groupedData[studentId].totalNegativePoints += categoryNegativePoints;
//     }
//     // Format the leaderboard data
//     leaderboard = Object.values(groupedData).map((data) => ({
//       studentId: data.studentDetails._id,
//       totalPositivePoints: data.totalPositivePoints,
//       totalNegativePoints: data.totalNegativePoints,
//       itsNo: data.studentDetails.itsNo,
//       role: data.studentDetails.role,
//       name: `${data.studentDetails.firstName} ${data.studentDetails.lastName}`,
//       gradeName: data.studentDetails.stageGradeSection?.grade?.grade || "",
//       sectionName: data.studentDetails.stageGradeSection?.section?.section || "",
//       teacherType: data.studentDetails.teacherType?.type || "",
//       assignedBy: data.assignedBy
//     }));
//     return leaderboard;
//   } catch (error) {
//     console.error("Error fetching student leaderboard:", error);
//     throw error;
//   }
// };

module.exports.getStudentLeaderboard = async (connection, query) => {
  const {
    startDate,
    endDate,
    stage,
    grade,
    section,
    userType,
    teacherType,
    academicYearId
  } = query;
  try {
    const BehaviorPointPointModel = connection.model("BehaviorPointPoint", BehaviorPointPoint.schema);
    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    const UserModel = connection.model("User", User.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Prepare match criteria for the aggregation pipeline
    let matchCriteria = {};
    // Filter by userType
    if (userType) {
      matchCriteria.user_type = userType;
    }
    // Date filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set the endDate to the last millisecond of the day
      end.setHours(23, 59, 59, 999);
      matchCriteria.createdAt = {
        $gte: start,
        $lte: end,
      };
    }
    // Teacher type filtering (if userType is teacher)
    if (teacherType) {
      const teacherTypeMatch = { "user.teacherType.type": teacherType };
      matchCriteria = { ...matchCriteria, ...teacherTypeMatch };
    }
    // Grade and section filtering
    if (stage) {
      if (stage) matchCriteria["user.stageGradeSection.stage._id"] = new ObjectId(stage);
    }
    if (grade) {
      if (grade) matchCriteria["user.stageGradeSection.grade._id"] = new ObjectId(grade);
    }
    if (section) {
      if (section) matchCriteria["user.stageGradeSection.section._id"] = new ObjectId(section);
    }
    let queryObj = {}
    if (academicYearId) {
      queryObj.academicYearId = new ObjectId(academicYearId)
      matchCriteria.academicYearId = new ObjectId(academicYearId)
    }
    // Aggregation pipeline
    const behaviorPoints = await BehaviorPointAssignPointModel.aggregate(
      [
        { $match: queryObj },
        {
          $lookup: {
            from: "behaviorpointcategories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_id",
          },
        },
        { $unwind: { path: "$category_id", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "academicyears",
            localField: "academicYearId",
            foreignField: "_id",
            as: "academicYearId",
          },
        },
        { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
      ]
    );
    const groupedData = {};
    for (const point of behaviorPoints) {
      const studentId = point.assigned_to._id;
      const categoryNegativePoints = (point.category_id?.point_type == 'Negative') ? 1 : 0;
      if (!groupedData[studentId]) {
        groupedData[studentId] = {
          totalNegativePoints: 0,
        };
      }
      groupedData[studentId].totalNegativePoints += categoryNegativePoints;
    }

    // Aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "user.stageGradeSection",
          foreignField: "_id",
          as: "user.stageGradeSection",
        },
      },
      { $unwind: { path: "$user.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stages",
          localField: "user.stageGradeSection.stage",
          foreignField: "_id",
          as: "user.stageGradeSection.stage",
        },
      },
      { $unwind: { path: "$user.stageGradeSection.stage", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "user.stageGradeSection.grade",
          foreignField: "_id",
          as: "user.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$user.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "academicyears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearDetails",
        },
      },
      { $unwind: { path: "$academicYearDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "user.stageGradeSection.section",
          foreignField: "_id",
          as: "user.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$user.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "user.teacherType",
          foreignField: "_id",
          as: "user.teacherType",
        },
      },
      { $unwind: { path: "$user.teacherType", preserveNullAndEmptyArrays: true } },
      { $match: matchCriteria },
      {
        $project: {
          studentId: "$user._id",
          user_type: "$user_type",
          totalPositivePoints: "$totalPoints",
          redeemedPoints: "$redeemedPoints",
          remainingPoints: "$remainingPoints",
          itsNo: "$user.itsNo",
          role: "$user.role",
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          stageName: "$user.stageGradeSection.stage.stage",
          gradeName: "$user.stageGradeSection.grade.grade",
          sectionName: "$user.stageGradeSection.section.section",
          teacherType: "$user.teacherType.type",
          academicYearId: "$academicYearDetails"
        },
      },
      {
        $sort: { totalPositivePoints: -1 }, // Sort by totalPositivePoints in descending order
      },
    ];
    const leaderboard = await BehaviorPointPointModel.aggregate(pipeline);
    // Add totalNegativePoints to leaderboard
    const updatedLeaderboard = leaderboard.map((entry) => {
      const studentId = entry.studentId.toString(); // Ensure consistent string keys
      return {
        ...entry,
        totalNegativePoints: groupedData[studentId]?.totalNegativePoints || 0, // Default to 0 if no negative points
      };
    });

    return updatedLeaderboard;
  } catch (error) {
    console.error("Error fetching student leaderboard:", error);
    throw error;
  }
};

module.exports.getAssignedPointsForStudent = async (studentId, role, userId, page, limit, query, connection) => {
  try {
    const { category, point_type, from_date, end_date, academicYearId } = query;
    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    const UserModel = connection.model("User", User.schema);
    connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    connection.model("TeacherType", TeacherTypeModel.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    let match1 = {}
    if (category) {
      match1 = { category_id: category }
    }
    if (point_type) {
      match1 = { point_type: point_type }
    }
    if (academicYearId) {
      match1.academicYearId = new ObjectId(academicYearId)
    }
    // Initialize the match criteria
    let matchCriteria = {};
    // Role-based filtering for points

    if (role === "student") {
      matchCriteria = { point_type: "Positive" };
    }
    else if (role === "teacher") {
      matchCriteria = {
        $or: [
          // Case where assigned_by matches the teacherId, get both Positive and Negative
          {
            $and: [
              { "assigned_by._id": new ObjectId(userId) },
              { point_type: { $in: ["Positive", "Negative"] } }
            ]
          },
          // Case where assigned_by does not match the teacherId, only get Positive
          {
            $and: [
              { "assigned_by._id": { $ne: new ObjectId(userId) } },
              { point_type: "Positive" }
            ]
          }
        ]
      };
    }

    matchCriteria["assigned_to._id"] = new ObjectId(studentId)
    // Date filtering
    if (from_date && end_date) {
      const start = new Date(from_date);
      const end = new Date(end_date);
      // Set the endDate to the last millisecond of the day
      end.setHours(23, 59, 59, 999);
      matchCriteria.createdAt = {
        $gte: start,
        $lte: end,
      };
    }
    let totalPositivePoints = 0
    let totalNegativePoints = 0
    // Aggregation pipeline
    const assignedPoints = await BehaviorPointAssignPointModel.aggregate([
      { $match: match1 },
      {
        $lookup: {
          from: "users",
          localField: "assigned_to",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "assigned_to",
        },
      },
      { $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "assigned_to.stageGradeSection",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "assigned_to.stageGradeSection.grade",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "assigned_to.stageGradeSection.section",
          foreignField: "_id",
          as: "assigned_to.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$assigned_to.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "assigned_to.teacherType",
          foreignField: "_id",
          as: "assigned_to.teacherType",
        },
      },
      { $unwind: { path: "$assigned_to.teacherType", preserveNullAndEmptyArrays: true } },
      // Assigned_by lookups
      {
        $lookup: {
          from: "users",
          localField: "assigned_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "assigned_by",
        },
      },
      { $unwind: { path: "$assigned_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "assigned_by.stageGradeSection",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "assigned_by.stageGradeSection.grade",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "assigned_by.stageGradeSection.section",
          foreignField: "_id",
          as: "assigned_by.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$assigned_by.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teachertypes",
          localField: "assigned_by.teacherType",
          foreignField: "_id",
          as: "assigned_by.teacherType",
        },
      },
      { $unwind: { path: "$assigned_by.teacherType", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "behaviorpointcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "category_id",
        },
      },
      { $unwind: { path: "$category_id", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "academicyears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearId",
        },
      },
      { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
      { $match: matchCriteria },
      { $sort: { createdAt: -1 }, },
    ]);
    // Fetch the total count of the assigned points for pagination
    const totalRecords = assignedPoints.length;
    // Fetch the student details (assigned_to) once and store in a map
    const studentData = await UserModel.findById(
      studentId,
      "itsNo firstName middleName lastName stageGradeSection teacherType"
    )
      .populate({
        path: "stageGradeSection",
        select: "grade section",
        populate: [
          { path: "grade", select: "grade" },
          { path: "section", select: "section" },
        ],
      })
      .populate({
        path: "teacherType",
        select: "type",
      }) // Populate teacherType
      .lean();

    // Process the result to include conditional logic for 'assigned_by' and attach student data
    assignedPoints.forEach((point) => {
      // Add the necessary details based on the role of the 'assigned_by'
      if (point.assigned_by.role === "student") {
        // Ensure student details are populated for assigned_by (stage, grade, section)
        if (point.assigned_by.stageGradeSection) {
          point.assigned_by.stageGradeSection = {
            stage:
              point.assigned_by.stageGradeSection.stage ?
                point.assigned_by.stageGradeSection.stage.name
                : null,
            grade:
              point.assigned_by.stageGradeSection.grade ?
                point.assigned_by.stageGradeSection.grade.grade
                : null,
            section:
              point.assigned_by.stageGradeSection.section ?
                point.assigned_by.stageGradeSection.section.section
                : null,
          };
        }
      }
      if (point.assigned_by.role === "teacher") {
        // Ensure teacher type is populated for assigned_by
        if (point.assigned_by.teacherType) {
          point.assigned_by.teacherType = point.assigned_by.teacherType.type;
        }
      }
      // For school-admin, no further details needed
      if (point.assigned_by.role === "school-admin") {
        point.assigned_by.stageGradeSection = undefined; // No need to include stage/grade/section
        point.assigned_by.teacherType = undefined; // No need to include teacher type
      }
      if (point.category_id.point_type == 'Positive') {
        totalPositivePoints += point.category_id.point
      } else {
        totalNegativePoints++
      }
    });
    // Create pagination object
    const pagination = {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      limit,
    };
    return {
      data: {
        student: studentData,
        assignedPoints,
        totalPositivePoints,
        totalNegativePoints
      },
      pagination,
    };
  } catch (error) {
    console.error("Error fetching assigned points for student:", error);
    throw error; // Rethrow the error to be handled by the controller
  };
}

module.exports.updateIsRead = async (pointId, connection) => {
  const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
  try {
    const updatedPoint = await BehaviorPointAssignPointModel.findByIdAndUpdate(
      pointId,
      { is_read: true },
      { new: true }
    );
    return updatedPoint;
  } catch (error) {
    console.error("Error updating isRead status:", error);
    throw error; // Rethrow the error to be handled by the controller
  }
};

module.exports.getCategoryWiseAssignedPoints = async ({ startDate, endDate, pointType, page = 1, limit = 25, academicYearId }, connection) => {
  const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
  connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  connection.model("AcademicYears", AcademicYears.schema);

  try {
    // Build dynamic query for date range and point type
    const matchQuery = {
      user_type: { $in: ["student", "teacher", "school-admin"] }, // Filter for relevant user types
    };

    if (startDate && endDate) {
      // Filter by created_at date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      matchQuery.createdAt = {
        $gte: start,
        $lte: end,
      };
    }
    if (academicYearId) {
      matchQuery.academicYearId = new ObjectId(academicYearId)
    }
    if (pointType) {
      // Filter by point_type (either 'Positive' or 'Negative')
      matchQuery.point_type = pointType;
    } else {
      // If no point_type is specified, include both 'Positive' and 'Negative'
      matchQuery.$or = [{ point_type: "Positive" }, { point_type: "Negative" }];
    }
    // Aggregate points assigned to each user (student or others), grouped by category
    const categoryAssignedPoints = await BehaviorPointAssignPointModel.aggregate([
      {
        // Apply the dynamic match filter based on point_type and date range
        $match: matchQuery,
      },
      {
        // Lookup the associated category to fetch the point value
        $lookup: {
          from: "behaviorpointcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        // Unwind the category details array
        $unwind: "$categoryDetails",
      },
      {
        // Group by category_id and calculate either the sum of points for positive points,
        // or the count of entries for negative points
        $group: {
          _id: "$category_id",
          totalPointsInCategory: {
            $sum: {
              $cond: [
                { $eq: ["$point_type", "Positive"] },
                "$categoryDetails.point", // Add the points for Positive type
                0,
              ],
            },
          },
          remarkCountInCategory: {
            $sum: {
              $cond: [
                { $eq: ["$point_type", "Negative"] },
                1, // Count the occurrence for Negative type as remark
                0,
              ],
            },
          },
          totalCategoryCount: {
            $sum: 1, // Total number of documents in the group (category)
          },
        },
      },
      {
        // Lookup category details to get the category name
        $lookup: {
          from: "behaviorpointcategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        // Unwind the category details array to get the category name
        $unwind: "$categoryDetails",
      },
      {
        // Lookup category details to get the category name
        $lookup: {
          from: "academicyears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearDetails",
        },
      },
      {
        // Unwind the category details array to get the category name
        $unwind: { path: "$academicYearDetails", preserveNullAndEmptyArrays: true, }
      },
      {
        // Project the required fields
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: "$categoryDetails.category_name",
          totalPointsInCategory: 1,
          remarkCountInCategory: 1,
          totalCategoryCount: 1,
          academicYearDetails: 1,
        },
      },
      {
        // Sort the categories by total points in descending order
        $sort: { totalPointsInCategory: -1 },
      },
      {
        // Apply pagination
        $skip: (page - 1) * limit, // Skip the first (page - 1) * limit records
      },
      {
        $limit: limit, // Limit the number of records returned to the limit
      },
    ]);

    // Get total count of records for pagination
    const totalRecords = await BehaviorPointAssignPointModel.aggregate([
      {
        $match: matchQuery,
      },
      {
        // Lookup the associated category to fetch the point value
        $lookup: {
          from: "behaviorpointcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        // Unwind the category details array
        $unwind: "$categoryDetails",
      },
      {
        // Group by category_id and calculate either the sum of points for positive points,
        // or the count of entries for negative points
        $group: {
          _id: "$category_id",
          totalPointsInCategory: {
            $sum: {
              $cond: [
                { $eq: ["$point_type", "Positive"] },
                "$categoryDetails.point", // Add the points for Positive type
                0,
              ],
            },
          },
          remarkCountInCategory: {
            $sum: {
              $cond: [
                { $eq: ["$point_type", "Negative"] },
                1, // Count the occurrence for Negative type as remark
                0,
              ],
            },
          },
        },
      },
      {
        // Lookup category details to get the category name
        $lookup: {
          from: "behaviorpointcategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        // Unwind the category details array to get the category name
        $unwind: "$categoryDetails",
      },
      {
        // Lookup category details to get the category name
        $lookup: {
          from: "academicyears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearDetails",
        },
      },
      {
        // Unwind the category details array to get the category name
        $unwind: { path: "$academicYearDetails", preserveNullAndEmptyArrays: true, }
      },
      {
        // Project the required fields
        $project: {
          _id: 0,
          categoryId: "$_id",
          categoryName: "$categoryDetails.category_name",
          totalPointsInCategory: 1,
          remarkCountInCategory: 1,
          academicYearDetails: 1
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      data: categoryAssignedPoints,
      pagination: {
        totalRecords: totalRecords.length > 0 ? totalRecords[0].count : 0,
        page,
        limit,
      },
    };
  } catch (error) {
    console.error("Error fetching category-wise assigned points:", error);
    throw error;
  }
};

module.exports.getAssignedPointsForCategory = async (
  categoryId,
  userRole,
  page,
  limit,
  academicYealId,
  startDate, 
  endDate,
  connection
) => {
  const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
  const CategoryModel = connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  connection.model("TeacherType", TeacherTypeModel.schema);
  connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  connection.model("Grade", Grade.schema);
  connection.model("Section", Section.schema);
  connection.model("User", User.schema);
  connection.model("AcademicYears", AcademicYears.schema);

  try {
    // Build the query filter to get behavior points for a specific category
    const filter = { category_id: categoryId };

    // If the user is not "school-admin", we only want Positive points
    if (userRole !== "school-admin") {
      filter.point_type = "Positive";
    }
    if (academicYealId) {
      filter.academicYealId = academicYealId
    }
    if (startDate && endDate) {
      // Filter by created_at date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      filter.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // Fetch the assigned points for the category, with pagination
    const assignedPoints = await BehaviorPointAssignPointModel.find(filter)
      .populate({
        path: "assigned_by",
        select: "itsNo firstName lastName role photo stageGradeSection teacherType",
        populate: [
          {
            path: "stageGradeSection",
            select: "grade section",
            populate: [
              { path: "grade", select: "grade" },
              { path: "section", select: "section" },
            ],
          },
          {
            path: "teacherType",
            select: "type",
          },
        ],
      }) // Include assigned by details
      .populate({
        path: "assigned_to",
        select: "itsNo firstName lastName role photo stageGradeSection teacherType",
        populate: [
          {
            path: "stageGradeSection",
            select: "grade section",
            populate: [
              { path: "grade", select: "grade" },
              { path: "section", select: "section" },
            ],
          },
          {
            path: "teacherType",
            select: "type",
          },
        ],
      }) // Include assigned to details
      .populate("category_id", "category_name point_type point") // Include category details
      .populate("academicYearId")
      .skip((page - 1) * limit) // Skip the records based on page
      .limit(limit) // Limit the number of records per page
      .lean(); // Convert to plain JS objects

    // Fetch the total count of the assigned points for pagination
    const totalRecords =
      await BehaviorPointAssignPointModel.countDocuments(filter);

    // Fetch the category details
    const categoryData = await CategoryModel.findById(
      categoryId,
      "category_name point_type point"
    ).lean();
    let totalPoints = 0;
    // Process the result to include conditional logic for 'assigned_by'
    assignedPoints.forEach((point) => {
      // Add the necessary details based on the role of the 'assigned_by'
      if (point.assigned_by.role === "student") {
        // Ensure student details are populated for assigned_by (stage, grade, section)
        if (point.assigned_by.stageGradeSection) {
          point.assigned_by.stageGradeSection = {
            stage: point.assigned_by.stageGradeSection.stage ? point.assigned_by.stageGradeSection.stage.name : null,
            grade: point.assigned_by.stageGradeSection.grade ? point.assigned_by.stageGradeSection.grade.grade : null,
            section: point.assigned_by.stageGradeSection.section ? point.assigned_by.stageGradeSection.section.section : null,
          };
        }
      }

      if (point.assigned_by.role === "teacher") {
        // Ensure teacher type is populated for assigned_by
        if (point.assigned_by.teacherType) {
          point.assigned_by.teacherType = point.assigned_by.teacherType.type;
        }
      }

      // For school-admin, no further details needed
      if (point.assigned_by.role === "school-admin") {
        point.assigned_by.stageGradeSection = undefined; // No need to include stage/grade/section
        point.assigned_by.teacherType = undefined; // No need to include teacher type
      }

      if (point.assigned_to.role === "student") {
        // Ensure student details are populated for assigned_to (stage, grade, section)
        if (point.assigned_to.stageGradeSection) {
          point.assigned_to.stageGradeSection = {
            stage:
              point.assigned_to.stageGradeSection.stage ?
                point.assigned_to.stageGradeSection.stage.name
                : null,
            grade:
              point.assigned_to.stageGradeSection.grade ?
                point.assigned_to.stageGradeSection.grade.grade
                : null,
            section:
              point.assigned_to.stageGradeSection.section ?
                point.assigned_to.stageGradeSection.section.section
                : null,
          };
        }
      }

      if (point.assigned_to.role === "teacher") {
        // Ensure teacher type is populated for assigned_to
        if (point.assigned_to.teacherType) {
          point.assigned_to.teacherType = point.assigned_to.teacherType.type;
        }
      }

      // For school-admin, no further details needed
      if (point.assigned_to.role === "school-admin") {
        point.assigned_to.stageGradeSection = undefined; // No need to include stage/grade/section
        point.assigned_to.teacherType = undefined; // No need to include teacher type
      }
      totalPoints += point.category_id.point
    });

    // Create pagination object
    const pagination = {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      limit,
    };

    return {
      data: {
        category: categoryData,
        assignedPoints,
        totalPoints
      },
      pagination,
    };
  } catch (error) {
    console.error("Error fetching assigned points for category:", error);
    throw error; // Rethrow the error to be handled by the controller
  }
};

//----------------------------------------------ASSIGNED POINTS-----------------------------------------------------------
module.exports.totalPoints = async (query, connection) => {
  const BehaviorPointPointModel = connection.model("BehaviorPointPoint", BehaviorPointPoint.schema);
  connection.model("AcademicYears", AcademicYears.schema);
  let filter = { user_id: new ObjectId(query.userId) }
  if (query.academicYearId) {
    filter.academicYearId = new ObjectId(query.academicYearId)
  }
  const points = BehaviorPointPointModel.findOne(filter).populate('academicYearId')

  if (!points) {
    throw new AppError('No point assigned yet', 200)
  }

  return points;
}

module.exports.report = async (
  page,
  limit,
  connection,
  recieverId,
  giverId,
  giverType,
  recieverType,
  startDate,
  endDate
) => {
  const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
  connection.model("User", User.schema);
  connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  connection.model("TeacherType", TeacherTypeModel.schema);
  connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
  connection.model("Grade", Grade.schema);
  connection.model("Section", Section.schema);
  try {
    // Initialize the match filter
    const match = {};
    // Filter for assigned_to based on recieverType and recieverId
    if (giverType) {
      match["assigned_by.role"] = giverType;
    }
    if (recieverType) {
      match["assigned_to.role"] = recieverType;
    }
    if (recieverId) {
      match["assigned_to._id"] = new ObjectId(recieverId); // Filter by recieverId
    }
    // Filter for assigned_by based on giverType and giverId  
    if (giverId) {
      match["assigned_by._id"] = new ObjectId(giverId); // Filter by giverId
    }
    // Filter for created_at using startDate and endDate

    if (startDate || endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      start.setHours(0, 0, 0, 0);
      match["createdAt"] = {};
      if (startDate) {
        match["createdAt"].$gte = start; // Filter from the startDate
      }
      if (endDate) {
        match["createdAt"].$lte = end; // Filter until the endDate
      }
    }
    // Define the aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "assigned_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                itsNo: 1,
                role: 1,
                photo: 1,
                stageGradeSection: 1,
                teacherType: 1,
              },
            },
            {
              $lookup: {
                from: "teachertypes",
                localField: "teacherType",  // Ensure this is the correct reference
                foreignField: "_id",
                as: "teacherType",
              },
            },
            { $unwind: { path: "$teacherType", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "stagegradesectiontimes",
                localField: "stageGradeSection",
                foreignField: "_id",
                as: "stageGradeSection",
                pipeline: [{ $project: { grade: 1, section: 1 } }],
              },
            },
            { $unwind: { path: "$stageGradeSection", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "grades",
                localField: "stageGradeSection.grade",
                foreignField: "_id",
                as: "stageGradeSection.grade",
                pipeline: [{ $project: { grade: 1 } }],
              },
            },
            { $unwind: { path: "$stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "sections",
                localField: "stageGradeSection.section",
                foreignField: "_id",
                as: "stageGradeSection.section",
                pipeline: [{ $project: { section: 1 } }],
              },
            },
            { $unwind: { path: "$stageGradeSection.section", preserveNullAndEmptyArrays: true } },
          ],
          as: "assigned_by",
        },
      },
      { $unwind: { path: "$assigned_by", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "assigned_to",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                itsNo: 1,
                role: 1,
                photo: 1,
                stageGradeSection: 1,
                teacherType: 1,
              },
            },
            {
              $lookup: {
                from: "teachertypes",
                localField: "teacherType", // Ensure this is the correct reference
                foreignField: "_id",
                as: "teacherType",
              },
            },
            { $unwind: { path: "$teacherType", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "stagegradesectiontimes",
                localField: "stageGradeSection",
                foreignField: "_id",
                as: "stageGradeSection",
                pipeline: [{ $project: { grade: 1, section: 1 } }],
              },
            },
            { $unwind: { path: "$stageGradeSection", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "grades",
                localField: "stageGradeSection.grade",
                foreignField: "_id",
                as: "stageGradeSection.grade",
                pipeline: [{ $project: { grade: 1 } }],
              },
            },
            { $unwind: { path: "$stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "sections",
                localField: "stageGradeSection.section",
                foreignField: "_id",
                as: "stageGradeSection.section",
                pipeline: [{ $project: { section: 1 } }],
              },
            },
            { $unwind: { path: "$stageGradeSection.section", preserveNullAndEmptyArrays: true } },
          ],
          as: "assigned_to",
        },
      },
      { $unwind: { path: "$assigned_to", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "behaviorpointcategories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $match: match },
      { $sort: { createdAt: -1 } }, // Sort by created_at in descending order
    ];
    // Execute the aggregation

    const results = await BehaviorPointAssignPointModel.aggregate(pipeline);
    const assignedPoints = results;
    // Create pagination object

    return {
      assignedPoints,
    };
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error; // Rethrow the error to be handled by the controller
  }
};

module.exports.giverList = async (connection, query) => {
  try {
    const { userType, grade, section, teacherType } = query;

    // Initialize models
    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    const UserModel = connection.model("User", User.schema);
    const StageGradeSectionTimeModel = connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    connection.model("TeacherType", TeacherTypeModel.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);

    // Step 1: Fetch data from BehaviorPointAssignPointModel
    const behaviorPoints = await BehaviorPointAssignPointModel.find().select("assigned_by");

    if (!behaviorPoints || behaviorPoints.length === 0) {
      throw new AppError("No data found in BehaviorPointAssignPoint", 200);
    }

    // Extract unique `assigned_by` user IDs
    const assignedUserIds = [...new Set(behaviorPoints.map(bp => bp.assigned_by.toString()))];

    // Step 2: Prepare user filtering logic
    const userFilter = { _id: { $in: assignedUserIds } };

    if (userType) {
      userFilter.role = userType;
    }

    if (teacherType) {
      userFilter.teacherType = ObjectId.isValid(teacherType) ? new ObjectId(teacherType) : teacherType;
    }

    if (grade || section) {
      const stageGradeFilter = {};

      if (grade) {
        stageGradeFilter.grade = ObjectId.isValid(grade) ? new ObjectId(grade) : grade;
      }
      if (section) {
        stageGradeFilter.section = ObjectId.isValid(section) ? new ObjectId(section) : section;
      }

      // Fetch stage-grade-section IDs
      const stageGradeSection = await StageGradeSectionTimeModel.find(stageGradeFilter).select("_id");
      const sectionIds = stageGradeSection.map((item) => item._id);
      userFilter.stageGradeSection = { $in: sectionIds };
    }

    // Step 3: Fetch filtered users
    const filteredUsers = await UserModel.find(userFilter).select(
      "itsNo firstName lastName role photo stageGradeSection teacherType"
    ).populate([
      {
        path: "teacherType",
        select: "type",
      },
      {
        path: "stageGradeSection",
        select: "grade section",
        populate: [
          { path: "grade", select: "grade" },
          { path: "section", select: "section" },
        ],
      },
    ]);

    if (!filteredUsers || filteredUsers.length === 0) {
      throw new AppError("No users found for the given filters", 200);
    }

    // Step 4: Map the filtered users back to their corresponding BehaviorPointAssignPoint entries
    const givers = behaviorPoints.filter(bp =>
      filteredUsers.some(user => user._id.toString() === bp.assigned_by.toString())
    );

    if (givers.length === 0) {
      throw new AppError("No giver available", 200);
    }

    return filteredUsers;
  } catch (error) {
    console.error("Error fetching givers:", error);
    throw error; // Rethrow the error to be handled by the controller
  }
};

module.exports.receiverList = async (connection, query) => {
  try {
    const { userType, grade, section, teacherType } = query;

    // Initialize models
    const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
    const UserModel = connection.model("User", User.schema);
    const StageGradeSectionTimeModel = connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
    connection.model("TeacherType", TeacherTypeModel.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);

    // Step 1: Fetch data from BehaviorPointAssignPointModel
    const behaviorPoints = await BehaviorPointAssignPointModel.find().select("assigned_to");

    if (!behaviorPoints || behaviorPoints.length === 0) {
      throw new AppError("No data found in BehaviorPointAssignPoint", 200);
    }

    // Extract unique `assigned_to` user IDs
    const assignedUserIds = [...new Set(behaviorPoints.map(bp => bp.assigned_to.toString()))];

    // Step 2: Prepare user filtering logic
    const userFilter = { _id: { $in: assignedUserIds } };

    if (userType) {
      userFilter.role = userType;
    }

    if (teacherType) {
      userFilter.teacherType = new ObjectId(teacherType);
    }

    if (grade || section) {
      const stageGradeFilter = {};

      if (grade) {
        stageGradeFilter.grade = ObjectId.isValid(grade) ? new ObjectId(grade) : grade;
      }
      if (section) {
        stageGradeFilter.section = ObjectId.isValid(section) ? new ObjectId(section) : section;
      }

      // Fetch stage-grade-section IDs
      const stageGradeSection = await StageGradeSectionTimeModel.find(stageGradeFilter).select("_id");
      const sectionIds = stageGradeSection.map((item) => item._id);
      userFilter.stageGradeSection = { $in: sectionIds };
    }

    // Step 3: Fetch filtered users
    const filteredUsers = await UserModel.find(userFilter).select(
      "itsNo firstName lastName role photo stageGradeSection teacherType"
    ).populate([
      {
        path: "teacherType",
        select: "type",
      },
      {
        path: "stageGradeSection",
        select: "grade section",
        populate: [
          { path: "grade", select: "grade" },
          { path: "section", select: "section" },
        ],
      },
    ]);

    if (!filteredUsers || filteredUsers.length === 0) {
      throw new AppError("No users found for the given filters", 200);
    }

    // Step 4: Map the filtered users back to their corresponding BehaviorPointAssignPoint entries
    const receivers = behaviorPoints.filter(bp =>
      filteredUsers.some(user => user._id.toString() === bp.assigned_to.toString())
    );

    if (receivers.length === 0) {
      throw new AppError("No receiver available", 200);
    }

    return filteredUsers;
  } catch (error) {
    console.error("Error fetching receivers:", error);
    throw error; // Rethrow the error to be handled by the controller
  }
};

//-------------------------------------Monthly Report-----------------------------------
module.exports.monthWiseStudentReport = async (connection, userId, page = 1, limit = 10) => {
  const BehaviorPointAssignPointModel = connection.model("BehaviorPointAssignPoint", BehaviorPointAssignPoint.schema);
  const BehaviorPointCategoryModel = connection.model("BehaviorPointCategory", BehaviorPointCategory.schema);
  const BehaviorPointCouponApprovalModel = connection.model("BehaviorPointCouponApproval", BehaviorPointCouponApproval.schema);
  const BehaviorPointCouponModel = connection.model("BehaviorPointCoupon", BehaviorPointCoupon.schema);

  try {
    // Step 1: Fetch Earned Points
    const earnedPointsData = await BehaviorPointAssignPointModel.find({ assigned_to: userId })
      .populate("category_id", "point") // Populate the category_id field and fetch only necessary fields
      .lean();

    const earnedPoints = {};

    for (const entry of earnedPointsData) {
      const date = new Date(entry.createdAt);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`; // Format as MM/YYYY
      const points = entry.category_id?.point || 0;

      // Initialize the month key if it doesn't exist
      if (!earnedPoints[monthKey]) {
        earnedPoints[monthKey] = { totalEarned: 0 };
      }
      // Add the points to the corresponding month
      earnedPoints[monthKey].totalEarned += points;
    }

    // Step 2: Fetch Redeemed Points
    const redeemedPointsData = await BehaviorPointCouponApprovalModel.find({
      requested_by: userId,
      is_issued: true,
    })
      .populate("coupon_id", "coupon_value") // Populate coupon_id and fetch only necessary fields
      .lean();

    const redeemedPoints = redeemedPointsData.reduce((acc, entry) => {
      const date = new Date(entry.requested_date);
      const monthKey = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`; // Format as MM/YYYY
      const couponValue = entry.coupon_id?.coupon_value || 0;
      const totalRedeemed = (entry.requested_coupon || 0) * couponValue;

      if (!acc[monthKey]) {
        acc[monthKey] = { totalRedeemed: 0 };
      }
      acc[monthKey].totalRedeemed += totalRedeemed;

      return acc;
    }, {});

    // Step 3: Combine Earned and Redeemed Points
    const combinedData = [];
    let previousBalance = 0;

    const allMonths = new Set([...Object.keys(earnedPoints), ...Object.keys(redeemedPoints)]);
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const [monthA, yearA] = a.split("/").map(Number);
      const [monthB, yearB] = b.split("/").map(Number);
      return yearA !== yearB ? yearA - yearB : monthA - monthB;
    });

    for (const month of sortedMonths) {
      const earned = earnedPoints[month]?.totalEarned || 0;
      const redeemed = redeemedPoints[month]?.totalRedeemed || 0;
      const balance = previousBalance + earned - redeemed;

      combinedData.push({
        Month: month,
        TotalEarned: earned,
        Redeemed: redeemed,
        Balance: balance,
      });

      previousBalance = balance;
    }

    // Step 4: Pagination
    const startIndex = (page - 1) * limit;
    const paginatedData = combinedData.slice(startIndex, startIndex + limit);

    const totalRecords = combinedData.length;

    const pagination = {
      totalRecords,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
      limit,
    };

    return {
      success: true,
      data: paginatedData,
      pagination,
    };
  } catch (error) {
    console.error("Error fetching month-wise behavior points:", error);
    return {
      success: false,
      message: "Failed to fetch month-wise behavior points. Please try again later.",
      error: error.message,
    };
  }
};
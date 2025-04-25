const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");
const transporter = require("../../utils/sendMail");
const { sendMessage } = require("./whatsappController");
const { default: mongoose } = require("mongoose");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const TeacherTypeModel = require("../../models/teacherType.model");
const Module = require("../../commonDbModels/modules-master.model");
const AppError = require("../../utils/appError");
const { io } = require("../../server");
const ObjectId = mongoose.Types.ObjectId;

module.exports.createNotification = async (req, res, next) => {
  let schoolConnection;
  try {
    const { senderId, message, type, subject, stage, grade, section, phoneNumbers, userType, receiverId = [], moduleId } = req.body;

    // Ensure only one of the two options is provided

    const isStageGradeSectionProvided = (stage && grade && section) ? true : false;
    const receiverIdProvided = Array.isArray(receiverId) && receiverId.length > 0;
    const isPhoneNumbersProvided = Array.isArray(phoneNumbers) && phoneNumbers.length > 0;

    if (receiverIdProvided && isStageGradeSectionProvided && isPhoneNumbersProvided) {
      return res.status(400).json({ message: "Provide either stage, grade, section or phone numbers, not both." });
    }
    if (!receiverIdProvided && !isStageGradeSectionProvided && !isPhoneNumbersProvided) {
      return res.status(400).json({ message: "Either stage, grade, section or phone numbers must be provided." });
    }

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const NotificationModel = schoolConnection.model("Notification", Notification.schema);
    const UserModel = schoolConnection.model("User", User.schema);
    const StageGradeSectionTimeModel = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);

    let receivers = [];
    // If stage, grade, and section are provided, fetch user IDs
    if (receiverIdProvided) {
      receivers = receiverId;
    }
    if (isStageGradeSectionProvided) {
      const stageGradeSection = await StageGradeSectionTimeModel.findOne({ stage, section, grade });

      if (!stageGradeSection) {
        throw new AppError("Please provide valid stage, grade, and section.", 400);
      }

      let data = await UserModel.find({ stageGradeSection: stageGradeSection }).select("_id");
      receivers = data.map((item) => item._id);
    }
    if (isPhoneNumbersProvided) {
      // If phone numbers are provided, no need to fetch users
      receivers = phoneNumbers; // Use the provided phone numbers directly
    }

    // Create notifications and send messages
    const notifications = await Promise.all(
      receivers.map(async (receiver) => {
        let notification;
        if (receiverIdProvided) {
          notification = new NotificationModel({
            senderId,
            receiverId: receiver, // Assuming receiver is the user ID
            message,
            type,
            moduleId,
            userType,
            subject
          });
        }

        if (isStageGradeSectionProvided) {
          notification = new NotificationModel({
            senderId,
            receiverId: receiver, // Assuming receiver is the user ID
            message,
            type,
            moduleId,
            userType,
            subject
          });
        }

        if (isPhoneNumbersProvided) {
          notification = new NotificationModel({
            senderId,
            phoneNumber: receiver, // Assuming receiver is the user ID
            message,
            type,
            moduleId,
            userType,
            subject
          });
        }
        let user;
        // If phone numbers were provided, use them directly to send messages
        let actualPhoneNumbers = [];
        if (isPhoneNumbersProvided) {
          actualPhoneNumbers = phoneNumbers;
        } else {
          // Otherwise, fetch user details to get their phone numbers
          const SchoolUserModel = schoolConnection.model("User", User.schema);
          user = await SchoolUserModel.findById(receiver);

          // Determine the phone numbers based on the user role
          if (user.role === "teacher") {
            actualPhoneNumbers.push(user.contactPersonMobile);
          } else if (user.role === "student") {
            if (user.familyDetails.fatherPhone) {
              actualPhoneNumbers.push(user.familyDetails.fatherPhone);
            }
            if (user.familyDetails.motherPhone) {
              actualPhoneNumbers.push(user.familyDetails.motherPhone);
            }
          }
        }

        // Send WhatsApp message to all relevant phone numbers
        if ((type === "Whatsapp" || type === "both") && actualPhoneNumbers.length > 0) {
          await Promise.all(
            actualPhoneNumbers.map(async (phoneNumber) => {
              try {
                await sendMessage(senderId, phoneNumber, message, schoolConnection);
              } catch (error) {
                console.error(error);
              }
            })
          );
        }

        // Handle email notifications
        if (type === "email" || type === "both") {
          const mailOptions = {
            from: process.env.USERMAILSENDER,
            to:
              user.role === "student"
                ? `${user.familyDetails.fatherEmail}, ${user.familyDetails.motherEmail}`
                : user.role === "teacher" ? user.email : "",
            subject: subject,
            text: message,
          };
          await transporter.sendMail(mailOptions);
        }
        return await notification.save();
      })
    );
    let obj = {
      sender: senderId,
      reciever: receivers,
    }
    io.emit('receiveNotificationArr', obj)
    res.status(201).json({ success: true, message: "Notifications sent successfully", notifications });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllNotifications = async (req, res, next) => {
  let schoolConnection;
  try {
    const { startDay, endDay, grade, section, search, userType, moduleId } = req.query;

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const NotificationModel = schoolConnection.model("Notification", Notification.schema);
    const ModuleModel = schoolConnection.model("Module", Module.schema);
    schoolConnection.model("User", User.schema);
    schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);

    const pipeline = [];

    // Lookup for receiver details
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              stageGradeSection: 1,
              role: 1,
              photo: 1,
              itsNo: 1,
              teacherType: 1,
            },
          },
          {
            $lookup: {
              from: "teachertypes",
              localField: "teacherType",
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
              pipeline: [
                {
                  $project: {
                    grade: 1,
                    section: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: "$stageGradeSection", preserveNullAndEmptyArrays: true } },
        ],
        as: "receiverDetails",
      },
    });

    // Lookup for sender details
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "senderId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              stageGradeSection: 1,
              role: 1,
              photo: 1,
              itsNo: 1,
              teacherType: 1,
            },
          },
          {
            $lookup: {
              from: "teachertypes",
              localField: "teacherType",
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
              pipeline: [
                {
                  $project: {
                    grade: 1,
                    section: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: "$stageGradeSection", preserveNullAndEmptyArrays: true } },
        ],
        as: "senderDetails",
      },
    });

    // Apply filters dynamically
    const matchStage = {};

    if (userType) matchStage.userType = userType;

    if (startDay || endDay) {
      matchStage.createdAt = {};
      if (startDay) matchStage.createdAt.$gte = new Date(startDay);
      if (endDay) matchStage.createdAt.$lte = new Date(endDay);
    }

    if (moduleId) matchStage.moduleId = new ObjectId(moduleId);

    if (search) {
      const searchRegex = new RegExp(search, "i");
      matchStage.$or = [
        { "receiverDetails.firstName": { $regex: searchRegex } },
        { "receiverDetails.lastName": { $regex: searchRegex } },
        { "receiverDetails.itsNo": { $regex: searchRegex } },
        { "senderDetails.firstName": { $regex: searchRegex } },
        { "senderDetails.lastName": { $regex: searchRegex } },
        { "senderDetails.itsNo": { $regex: searchRegex } },
      ];
    }

    pipeline.push({ $match: matchStage });

    // Add pagination if needed
    const notifications = await NotificationModel.aggregate(pipeline);

    // Fetch module details for notifications
    const notificationsData = await Promise.all(
      notifications.map(async (data) => {
        if (data.moduleId) {
          const module = await ModuleModel.findById(data.moduleId);
          if (module) {
            data.moduleName = module.moduleName;
          }
        }
        return data;
      })
    );

    const totalCount = await NotificationModel.countDocuments(matchStage);
    const unreadCount = await NotificationModel.countDocuments({ ...matchStage, isRead: false });
    const readCount = totalCount - unreadCount;

    res.status(200).json({
      totalCount,
      readCount,
      unreadCount,
      notifications: notificationsData,
      message: "Fetched notifications successfully.",
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};


module.exports.getNotificationsById = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const NotificationModel = schoolConnection.model("Notification", Notification.schema);
    schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    schoolConnection.model("Grade", Grade.schema);
    schoolConnection.model("Section", Section.schema);
    schoolConnection.model("TeacherType", TeacherTypeModel.schema);
    schoolConnection.model("User", User.schema);
    const notification = await NotificationModel.findById(id)
      .populate([{
        path: "senderId", // Populate the requested_by user details
        select: "firstName lastName stageGradeSection photo role itsNo teacherType",
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
      }]).lean()
      ;
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const ModuleData = await Module.findById(notification.moduleId); // Use await here
    if (ModuleData) {
      notification.module = ModuleData.moduleName; // Add module name to the notification
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}

module.exports.deleteNotification = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const NotificationModel = schoolConnection.model("Notification", Notification.schema);

    const { ids } = req.body;
    const deletedNotification = await NotificationModel.deleteMany({ _id: { $in: ids } });

    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res
      .status(200)
      .json({ message: "Notification deleted" });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.restoreNotification = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const NotificationModel = schoolConnection.model("Notification", Notification.schema);
    const restoredNotification = await NotificationModel.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true }
    );
    if (!restoredNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res
      .status(200)
      .json({ message: "Notification restored", restoredNotification });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.markAsRead = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const NotificationModel = schoolConnection.model("Notification", Notification.schema);
    const updatedNotification = await NotificationModel.findByIdAndUpdate(
      id,
      {
        isRead: true,
        readTime: new Date(),
      },
      { new: true }
    );
    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res
      .status(200)
      .json({ message: "Notification marked as read", updatedNotification });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllNotificationsByUserId = async (req, res, next) => {
  let schoolConnection;
  try {
    const userId = req.params.id;
    const { send, receive, userType, module, search, startDate, endDate } = req.query;

    // Connect to the school database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Register models with the school database connection
    const NotificationModel = schoolConnection.model("Notification", Notification.schema);
    // Build filter based on query parameters
    let matchStage = { deletedAt: null };
    // Helper function to generate search conditions
    const getSearchConditions = (fieldPrefix, search) => {
      if (search.includes(" ")) {
        // Split the search term into firstName and lastName components
        const [firstNameTerm, ...lastNameTerms] = search.split(" ");
        const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, "i");
        const lastNameRegex = new RegExp(`.*${lastNameTerms.join(" ")}.*`, "i");

        // Return conditions for firstName and lastName
        return [
          {
            $and: [
              { [`${fieldPrefix}.firstName`]: firstNameRegex },
              { [`${fieldPrefix}.lastName`]: lastNameRegex },
            ],
          },
        ];
      } else {
        // Single-word search for either firstName or lastName
        const searchRegex = new RegExp(`.*${search}.*`, "i");
        return [
          { [`${fieldPrefix}.firstName`]: searchRegex },
          { [`${fieldPrefix}.lastName`]: searchRegex },
        ];
      }
    };

    // Main matching logic
    if (send === "true") {
      matchStage.senderId = new ObjectId(userId);

      if (userType) {
        matchStage["receiverDetails.role"] = userType;
      }

      if (search) {
        matchStage.$or = getSearchConditions("receiverDetails", search);
      }
    } else if (receive === "true") {
      matchStage.receiverId = new ObjectId(userId);

      if (userType) {
        matchStage["senderDetails.role"] = userType;
      }

      if (search) {
        matchStage.$or = getSearchConditions("senderDetails", search);
      }
    }


    if (module) {
      matchStage.moduleId = new ObjectId(module);
    }
    // Match start_date if provided
    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setDate(startDateObj.getDate() - 1); // Optionally subtract one day
      matchStage.createdAt = { $gte: startDateObj };
    }

    // Match end_date if provided
    if (endDate) {
      matchStage.createdAt = { $lte: new Date(endDate) };
    }
    // Aggregation pipeline
    const notifications = await NotificationModel.aggregate([
      // Lookup sender details

      { $unwind: { path: "$senderDetails", preserveNullAndEmptyArrays: true } },
      // Lookup receiver details
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "receiverDetails",
        },
      },
      { $unwind: { path: "$receiverDetails", preserveNullAndEmptyArrays: true } },
      // Lookup stageGradeSection details for sender
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "senderDetails",
        },
      },
      { $unwind: { path: "$senderDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "senderDetails.stageGradeSection",
          foreignField: "_id",
          as: "senderStageGradeSectionDetails",
        },
      },
      { $unwind: { path: "$senderStageGradeSectionDetails", preserveNullAndEmptyArrays: true } },
      // Lookup stageGradeSection details for receiver
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "receiverDetails.stageGradeSection",
          foreignField: "_id",
          as: "receiverStageGradeSectionDetails",
        },
      },
      { $unwind: { path: "$receiverStageGradeSectionDetails", preserveNullAndEmptyArrays: true } },
      // Lookup grade details for sender
      {
        $lookup: {
          from: "grades",
          localField: "senderStageGradeSectionDetails.grade",
          foreignField: "_id",
          as: "senderGradeDetails",
        },
      },
      { $unwind: { path: "$senderGradeDetails", preserveNullAndEmptyArrays: true } },
      // Lookup section details for sender
      {
        $lookup: {
          from: "sections",
          localField: "senderStageGradeSectionDetails.section",
          foreignField: "_id",
          as: "senderSectionDetails",
        },
      },
      { $unwind: { path: "$senderSectionDetails", preserveNullAndEmptyArrays: true } },
      // Lookup grade details for receiver
      {
        $lookup: {
          from: "grades",
          localField: "receiverStageGradeSectionDetails.grade",
          foreignField: "_id",
          as: "receiverGradeDetails",
        },
      },
      { $unwind: { path: "$receiverGradeDetails", preserveNullAndEmptyArrays: true } },
      // Lookup section details for receiver
      {
        $lookup: {
          from: "sections",
          localField: "receiverStageGradeSectionDetails.section",
          foreignField: "_id",
          as: "receiverSectionDetails",
        },
      },
      { $unwind: { path: "$receiverSectionDetails", preserveNullAndEmptyArrays: true } },
      // Match stage
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      // Project final output
      {
        $project: {
          _id: 1,
          senderId: 1,
          receiverId: 1,
          message: 1,
          createdAt: 1,
          moduleId: 1,
          type: 1,
          sender: {
            firstName: "$senderDetails.firstName",
            lastName: "$senderDetails.lastName",
            photo: "$senderDetails.photo",
            role: "$senderDetails.role",
            itsNo: "$senderDetails.itsNo",
            stageGradeSection: {
              grade: "$senderGradeDetails.grade",
              section: "$senderSectionDetails.section",
            },
          },
          receiver: {
            firstName: "$receiverDetails.firstName",
            lastName: "$receiverDetails.lastName",
            photo: "$receiverDetails.photo",
            role: "$receiverDetails.role",
            itsNo: "$receiverDetails.itsNo",
            stageGradeSection: {
              grade: "$receiverGradeDetails.grade",
              section: "$receiverSectionDetails.section",
            },
          },
        },
      },
    ]);

    const totalCount = await NotificationModel.countDocuments(matchStage);
    const unreadCount = await NotificationModel.countDocuments({ ...matchStage, isRead: false });
    const readCount = totalCount - unreadCount;


    // Add module name to each notification from the global database
    for (const notification of notifications) {
      const moduleData = await Module.findById(notification.moduleId).select("moduleName");
      notification.module = moduleData ? moduleData.moduleName : null;
    }

    // Respond with all notifications
    res.status(200).json({
      totalCount,
      unreadCount,
      readCount,
      notification: notifications
    });
  } catch (error) {
    console.error(error);
    next(error); // Pass the error to the global error handler
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
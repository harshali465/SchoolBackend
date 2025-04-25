const notificationTemplateModel = require('../models/notification-template.model');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');


module.exports.createNotificationTemplate = async (reqBody, connection) => {
  if (reqBody.assignedAadatCount) reqBody.assignedAadatCount = 0;
  const NotificationTemplate= await connection.model('notificationTemplate', notificationTemplateModel.schema)
  const templateData = await NotificationTemplate.create(reqBody);
  return templateData;
};

module.exports.getNotificationTemplate = async (id, connection) => {
  const NotificationTemplate= await connection.model('notificationTemplate', notificationTemplateModel.schema)
  const templateData = await NotificationTemplate.findById(id);

  if (!templateData) {
    throw new AppError('Invalid ID', 400);
  }

  return templateData;
};

// Service function
module.exports.getAllNotificationTemplate = async (query,connection) => {
  const NotificationTemplate = connection.model('notificationTemplate', notificationTemplateModel.schema);

  const filter = {};
  if (query.module) {
    filter.module = query.module;
  }
  if (query.condition) {
    filter.condition = { $regex: query.condition, $options: 'i' }; // Case-insensitive search
  }
  if (query.remark) {
    filter.remark = { $regex: query.remark, $options: 'i' }; // Case-insensitive search
  }
  // Fetch data based on filter
  const templateData = await NotificationTemplate.find(filter).lean();

  return templateData;
};

// Do NOT update passwords with this!
module.exports.updateNotificationTemplate = async (templateId, reqBody,connection) => {
  const NotificationTemplate= await connection.model('notificationTemplate', notificationTemplateModel.schema)
  const templateData = await NotificationTemplate.findByIdAndUpdate(
    templateId,
    reqBody,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!templateData) {
    throw new AppError('No document found with that ID', 404);
  }

  return templateData;
};

module.exports.deleteNotificationTemplate = async (body, connection) => {
  try {
    const NotificationTemplate= await connection.model('notificationTemplate', notificationTemplateModel.schema);
    const { ids } = body;

    await NotificationTemplate.deleteMany({ _id: { $in: ids } });

    return {
      deletedIds: ids,
    };
  } catch (error) {
    console.error(error);
    throw new Error('There was a problem deleting the categories');
  }
};
const notificationTemplateService = require("../../services/notificationTemplateService");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");

module.exports.createNotificationTemplate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const templateData = await notificationTemplateService.createNotificationTemplate(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: templateData,
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

module.exports.getNotificationTemplate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const templateData = await notificationTemplateService.getNotificationTemplate(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: templateData,
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

module.exports.getAllNotificationTemplate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const templateData = await notificationTemplateService.getAllNotificationTemplate(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: templateData,
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

//Update Active or Inactive
// Do NOT update passwords with this!
module.exports.updateNotificationTemplate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const templateData = await notificationTemplateService.updateNotificationTemplate(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: templateData,
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

module.exports.deleteNotificationTemplate = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await notificationTemplateService.deleteNotificationTemplate(req.body, schoolConnection);
    res.status(204).json({
      status: true,
      data: result,
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
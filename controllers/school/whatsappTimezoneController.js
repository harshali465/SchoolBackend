const TimeZone = require("../../commonDbModels/time-zone.model");
const WhatsAppTimeZoneSetting = require("../../models/whatsappTimezoneSetting.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");

// Create a new WhatsApp Time Zone Setting
module.exports.createWhatsAppTimeZoneSetting = async (req, res, next) => {
  let schoolConnection;
  try {
    const { timeZone, notifications, whatsappNumbers } = req.body;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model("WhatsAppTimeZoneSetting", WhatsAppTimeZoneSetting.schema);
    const newSetting = await WhatsAppTimeZoneSettingModel.create({
      timeZone,
      notifications,
      whatsappNumbers,
    });

    res.status(201).json({
      status: "success", message: "WhatsApp Time Zone Setting created successfully", data: newSetting,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.getAllWhatsAppTimeZoneSettings = async (req, res, next) => {
  let schoolConnection;
  try {
    const { page = 1, limit = 10 } = req.query;
    // Connect to the school database (local DB)
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model(
      "WhatsAppTimeZoneSetting",
      WhatsAppTimeZoneSetting.schema
    );

    // Fetch all WhatsAppTimeZoneSettings from the local DB
    const settings = await WhatsAppTimeZoneSettingModel.find({})
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // For each WhatsApp setting, populate the time zone data from the global DB
    const populatedSettings = await Promise.all(
      settings.map(async (setting) => {
        const timeZone = await TimeZone.findById(setting.timeZone); // Assuming timeZone is an ObjectId
        return { ...setting._doc, timeZone }; // Merge the time zone data with the WhatsApp setting
      })
    );

    // Get total number of settings for pagination
    const totalSettings = await WhatsAppTimeZoneSettingModel.countDocuments();

    // Return the populated settings along with pagination info
    res.status(200).json({ status: "success", total: totalSettings, page, limit, data: populatedSettings, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.getWhatsAppTimeZoneSettingById = async (req, res, next) => {
  let schoolConnection;
  try {
    // Connect to the school database (local DB)
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model(
      "WhatsAppTimeZoneSetting",
      WhatsAppTimeZoneSetting.schema
    );

    // Fetch the WhatsAppTimeZoneSetting by its ID
    const setting = await WhatsAppTimeZoneSettingModel.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    // Populate the time zone data from the global database
    const timeZone = await TimeZone.findById(setting.timeZone); // Assuming timeZone is an ObjectId

    if (!timeZone) {
      return res.status(404).json({ message: "TimeZone not found" });
    }

    // Merge the time zone data with the WhatsApp setting
    const populatedSetting = { ...setting._doc, timeZone };

    // Return the populated setting
    res.status(200).json({ status: "success", data: populatedSetting, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

// Update an existing WhatsApp Time Zone Setting by ID
module.exports.updateWhatsAppTimeZoneSetting = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model("WhatsAppTimeZoneSetting", WhatsAppTimeZoneSetting.schema);
    const { timeZone, notifications, whatsappNumbers } = req.body;

    const updatedSetting = await WhatsAppTimeZoneSettingModel.findByIdAndUpdate(
      req.params.id,
      { timeZone, notifications, whatsappNumbers },
      { new: true, runValidators: true }
    );

    if (!updatedSetting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.status(200).json({ status: "success", message: "WhatsApp Time Zone Setting updated successfully", data: updatedSetting, });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

// Delete a WhatsApp Time Zone Setting by ID
module.exports.deleteWhatsAppTimeZoneSetting = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model("WhatsAppTimeZoneSetting", WhatsAppTimeZoneSetting.schema);

    const setting = await WhatsAppTimeZoneSettingModel.findByIdAndDelete(
      req.params.id
    );

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.status(204).json({ status: "success", message: "WhatsApp Time Zone Setting deleted successfully", });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.addWhatsAppNumber = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    const { whatsappNumber, countryCode } = req.body;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model("WhatsAppTimeZoneSetting", WhatsAppTimeZoneSetting.schema);

    const setting = await WhatsAppTimeZoneSettingModel.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    // Add the number if it doesn't already exist
    if (
      !setting.whatsappNumbers.find(
        (num) => num.whatsappNumber === whatsappNumber
      )
    ) {
      setting.whatsappNumbers.push({ number: whatsappNumber, countryCode });
      await setting.save();
      res.status(200).json({ message: "WhatsApp number added successfully", data: setting });
    } else {
      res.status(400).json({ message: "WhatsApp number already exists" });
    }
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.removeWhatsAppNumber = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    const { whatsappNumber } = req.body;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model("WhatsAppTimeZoneSetting", WhatsAppTimeZoneSetting.schema);

    const setting = await WhatsAppTimeZoneSettingModel.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    const numberIndex = setting.whatsappNumbers.findIndex(
      (num) => num.number === whatsappNumber
    );

    // If the number exists, remove it
    if (numberIndex !== -1) {
      setting.whatsappNumbers.splice(numberIndex, 1);
      await setting.save();
      res.status(200).json({
        message: "WhatsApp number removed successfully",
        data: setting,
      });
    } else {
      res.status(400).json({ message: "WhatsApp number not found" });
    }
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.updateWhatsAppNumberStatus = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    const { whatsappNumber, status } = req.body; // status can be true/false
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const WhatsAppTimeZoneSettingModel = await schoolConnection.model("WhatsAppTimeZoneSetting", WhatsAppTimeZoneSetting.schema);

    const setting = await WhatsAppTimeZoneSettingModel.findById(id);
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    const number = setting.whatsappNumbers.find(
      (num) => num.number === whatsappNumber
    );

    // If the number exists, update its status
    if (number) {
      number.status = status;
      await setting.save();
      res.status(200).json({ message: "WhatsApp number status updated successfully", data: setting, });
    } else {
      res.status(400).json({ message: "WhatsApp number not found" });
    }
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};
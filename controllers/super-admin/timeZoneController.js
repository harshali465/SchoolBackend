const TimeZone = require("../../commonDbModels/time-zone.model");

module.exports.getTimeZone = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query; 

    // Convert to integers and calculate the number of documents to skip
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const timeZones = await TimeZone.find({});
    res.status(200).json({
      status: "success",
      data: timeZones
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

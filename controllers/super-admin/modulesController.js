const moduleService = require("../../services/module");

module.exports.createModule = async (req, res, next) => {
  try {
    const ModuleData = await moduleService.createModule(req.body);

    res.status(200).json({
      status: "Module Successfully Added",
      data: ModuleData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.updateActive = async (req, res, next) => {
  try {
    const result = await moduleService.updateActive(req.body);

    res.status(201).json({
      status: "success",
      result,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.getModule = async (req, res, next) => {
  try {
    const ModuleData = await moduleService.getModule(req.params.id);

    res.status(200).json({
      status: "success",
      data: ModuleData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Controller function
module.exports.getAllModule = async (req, res, next) => {
  try {
    const ModuleData = await moduleService.getAllModule(req.query);

    // SEND RESPONSE
    res.status(200).json({
      status: "success",
      data: ModuleData,
      query: req.query,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Do NOT update passwords with this!
module.exports.updateModule = async (req, res, next) => {
  try {
    const ModuleData = await moduleService.updateModule(
      req.params.id,
      req.body
    );

    res.status(200).json({
      status: "Module Successfully updated",
      data: ModuleData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.deleteModule = async (req, res, next) => {
  try {
    await moduleService.deleteModule(req.body);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
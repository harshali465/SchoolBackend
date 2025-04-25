const Module = require('../../commonDbModels/modules-master.model');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

module.exports.createModule = async (reqBody) => {
  const moduleData = await Module.create(reqBody);

  return moduleData;
};

module.exports.getModule = async (id) => {
  const moduleData = await Module.findById(id);

  if (!moduleData) {
    throw new AppError('Invalid ID', 400);
  }

  return moduleData;
};

// Service function
module.exports.getAllModule = async (query) => {
  const moduleData = await new APIFeatures(query)
    .search()
    .sort()
    .limitFields()
    .paginate()
    .exec(Module);

    
  return moduleData;
};

module.exports.updateActive = async (body) => {
  const { ids, active } = body;
  const updatedresult = await Module.updateMany(
    { _id: { $in: ids } },
    { $set: { status: active } },
  );
  if (!updatedresult) {
    throw new AppError('could not update', 404);
  }
  return updatedresult;
};

module.exports.updateModule = async (moduleId, reqBody) => {
  const moduleData = await Module.findByIdAndUpdate(moduleId, reqBody, {
    new: true,
    runValidators: true,
  });

  if (!moduleData) {
    throw new AppError('No document found with that ID', 404);
  }

  return moduleData;
};

module.exports.deleteModule = async (body) => {
  try {
    const { ids } = body;
    await Module.deleteMany({ _id: { $in: ids } });
    return 'Module deleted successfully';
  } catch (error) {
    console.log(error);
    return 'There was a problem deleting the Module';
  }
};
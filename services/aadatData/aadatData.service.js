const AadatDataModel = require('../../models/aadatData.model');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const Aadat = require('../../models/aadat.model');
const User = require('../../models/user.model');

module.exports.createAadatData = async (reqBody, connection) => {
  const AadatData = await connection.model('AadatData', AadatDataModel.schema)
  const aadatData = await AadatData.create(reqBody);
  return aadatData;
};

module.exports.getAadatData = async (aadatId,connection) => {
  const AadatData = await connection.model('AadatData', AadatDataModel.schema)
  const aadatData = await AadatData.findById(aadatId).populate('academicYearId');

  if (!aadatData) {
    throw new AppError('Invalid ID', 400);
  }

  return aadatData;
};

module.exports.getAllAadatData = async (query,connection) => {
  const AadatData = await connection.model('AadatData', AadatDataModel.schema)
  await connection.model('Aadat', Aadat.schema)
  await connection.model('User', User.schema)
  const aadatData = await new APIFeatures(query)
    .filter()
    .populate([
      { path: 'aadatId', select: 'name' },
      { path: 'studentId', select: 'firstName' },
      { path: 'academicYearId'}
    ])
    .sort()
    .limitFields()
    .paginate()
    .exec(AadatData);

  // SEND RESPONSE
  return aadatData.data;
};

// Do NOT update passwords with this!
module.exports.updateAadatData = async (aadatId, reqBody,connection) => {
  const AadatData = await connection.model('AadatData', AadatDataModel.schema)
  const aadatData = await AadatData.findByIdAndUpdate(aadatId, reqBody, {
    new: true,
    runValidators: true,
  });

  if (!aadatData) {
    throw new AppError('No document found with that ID', 404);
  }

  return aadatData;
};

module.exports.deleteAadatData = async (aadatId,connection) => {
  const AadatData = await connection.model('AadatData', AadatDataModel.schema)
  const aadatData = await AadatData.findByIdAndDelete(aadatId);

  if (!aadatData) {
    throw new AppError('No document found with that ID', 404);
  }

  return aadatData;
};

const CategoryModel = require('../../models/category.model');
const { AcademicYears } = require('../../models/academics.model');
const Aadat = require('../../models/aadat.model');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports.createCategory = async (reqBody, connection) => {
  if (reqBody.assignedAadatCount) reqBody.assignedAadatCount = 0;
  const Category = await connection.model('Category', CategoryModel.schema)
  const categoryCount = await Category.countDocuments();
  reqBody.orderValue = categoryCount + 1;
  const categoryData = await Category.create(reqBody);
  return categoryData;
};

module.exports.getCategory = async (categoryId, connection) => {
  const Category = await connection.model('Category', CategoryModel.schema)
  await connection.model('AcademicYears', AcademicYears.schema);
  const categoryData = await Category.findById(categoryId).populate('academicYearId');

  if (!categoryData) {
    throw new AppError('Invalid ID', 400);
  }

  return categoryData;
};

module.exports.updateActive = async (body, connection) => {
  const Category = await connection.model('Category', CategoryModel.schema)
  const { ids, active } = body;
  const updatedresult = await Category.updateMany(
    { _id: { $in: ids } },
    { $set: { active: active } },
  );
  if (!updatedresult) {
    throw new AppError('could not update', 404);
  }
  return updatedresult;
};

// Service function
module.exports.getAllCategories = async (query, connection) => {
  const Category = await connection.model('Category', CategoryModel.schema)
  await connection.model('AcademicYears', AcademicYears.schema);
  const categoryData = await new APIFeatures(query)
    .search()
    .sort('orderValue')
    .limitFields()
    .populate('academicYearId')
    .paginate()
    .exec(Category);

  // SEND RESPONSE
  return categoryData.data;
};

// Do NOT update passwords with this!
module.exports.updateCategory = async (categoryId, reqBody, connection) => {
  const Category = await connection.model('Category', CategoryModel.schema)
  const filteredBody = filterObj(reqBody, 'name');
  const categoryData = await Category.findByIdAndUpdate(
    categoryId,
    filteredBody,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!categoryData) {
    throw new AppError('No document found with that ID', 404);
  }

  return categoryData;
};

module.exports.deleteCategory = async (body, connection) => {
  try {
    const Category = await connection.model('Category', CategoryModel.schema);
    const AadatModel = await connection.model('Aadat', Aadat.schema);
    const { ids } = body;

    const associatedIds = []; // To store category IDs associated with BehaviorPointAssignPoint
    const deletableIds = []; // To store IDs that can be deleted

    for (let id of ids) {
      const categoryExists = await AadatModel.find({ category: id });
      if (categoryExists && categoryExists.length > 0) {
        associatedIds.push(id); // Collect associated IDs
      } else {
        deletableIds.push(id); // Collect IDs that can be deleted
      }
    }

    // Delete the categories that are not associated
    await Category.deleteMany({ _id: { $in: deletableIds } });

    return {
      deletedIds: deletableIds,
      associatedIds, // Return the associated IDs
    };
  } catch (error) {
    console.error(error);
    throw new Error('There was a problem deleting the categories');
  }
};

module.exports.updateOrderValues = async (body, connection) => {
  const Category = await connection.model('Category', CategoryModel.schema);
  let updatedResults = [];
  for (let item of body) {
    const updatedResult = await Category.findByIdAndUpdate(
      item.id,
      { $set: { orderValue: item.orderValue } },
      { new: true } // Ensures the updated document is returned
    );
    if (updatedResult) {
      updatedResults.push(updatedResult);
    }
  }
  return updatedResults;
};
const AadatModel = require('../../models/aadat.model');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const Category = require('../../models/category.model');
const {AcademicYears} = require('../../models/academics.model');
const StageGradeSectionTime = require('../../models/stageGradeSectionTime.model');
const mongoose = require('mongoose');

module.exports.createAadat = async (reqBody, connection) => {
  // reqBody.responseType = JSON.parse(reqBody.responseType)
  const Aadat = await connection.model('Aadat', AadatModel.schema);
  const categoryModel = await connection.model('Category', Category.schema);
  const classesArr = [];
  for (let item of reqBody.classes) {
    const StageGradeSectionTimeModel = await connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);

    // Build the query object conditionally based on the presence of "all"
    const query = {};
    if (item.stage !== "all") {
      query.stage = item.stage;
    }
    if (item.grade !== "all") {
      query.grade = item.grade;
    }
    if (item.section !== "all") {
      query.section = item.section;
    }

    const stageGradeSection = await StageGradeSectionTimeModel.find(query);
    if (stageGradeSection.length === 0) {
      throw new AppError("Please provide valid stage, grade, and section.", 400);
    }

    // Add all matching _ids to classesArr
    stageGradeSection.forEach((data) => {
      classesArr.push(new mongoose.Types.ObjectId(data._id));
    });
  }
  reqBody.classes = classesArr
  const aadatData = await Aadat.create(reqBody);

  // filling category assigned count to +1
  // Validation to be handled on the frontend
  const { category } = reqBody;
  const categoryToUpdate = await categoryModel.findById(category);

  categoryToUpdate.assignedAadatCount += 1;
  await categoryToUpdate.save();

  // Store the assignedAadatCount as orderValue in aadatData
  aadatData.orderValue = categoryToUpdate.assignedAadatCount;
  await aadatData.save();

  return aadatData;
};

module.exports.getAadat = async (aadatId, connection) => {
  const Aadat = await connection.model('Aadat', AadatModel.schema);
  await connection.model('StageGradeSectionTime', StageGradeSectionTime.schema)
  await connection.model('AcademicYears', AcademicYears.schema)
  const aadatData = await Aadat.findById(aadatId).populate("classes").populate("academicYearId");

  if (!aadatData) {
    throw new AppError('Invalid ID', 400);
  }

  return aadatData;
};

module.exports.getAllAadat = async (query,connection) => {
  const Aadat = await connection.model('Aadat', AadatModel.schema);
  await connection.model('Category', Category.schema);
  await connection.model('StageGradeSectionTime', StageGradeSectionTime.schema)
  await connection.model('AcademicYears', AcademicYears.schema)
  const aadatData = await new APIFeatures(query)
    .search()
    .populate('category')
    .populate('classes')
    .populate("academicYearId")
    .sort()
    .limitFields()
    .paginate()
    .exec(Aadat);

  // SEND RESPONSE
  return aadatData.data;
};

// Update Active Api
module.exports.updateActive = async (body, connection) => {
  const Aadat = await connection.model('Aadat', AadatModel.schema);
  const { ids, active } = body;
  const updatedresult = await Aadat.updateMany(
    { _id: { $in: ids } },
    { $set: { active: active } },
  );
  if (!updatedresult) {
    throw new AppError('could not update', 404);
  }
  return updatedresult;
};

// Do NOT update passwords with this!
module.exports.updateAadat = async (aadatId, reqBody, connection) => {
  const Aadat = await connection.model('Aadat', AadatModel.schema);
  const classesArr = [];
  for (let item of reqBody.classes) {
    const StageGradeSectionTimeModel = await connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    const query = {};
    if (item.stage !== "all") {
      query.stage = item.stage;
    }
    if (item.grade !== "all") {
      query.grade = item.grade;
    }
    if (item.section !== "all") {
      query.section = item.section;
    }
    const stageGradeSection = await StageGradeSectionTimeModel.find(query);
    if (!stageGradeSection) {
      throw new AppError("Please provide the valid stage, grade, and section.", 400);
    }
     // Add all matching _ids to classesArr
    stageGradeSection.forEach((data) => {
      classesArr.push(new mongoose.Types.ObjectId(data._id));
    });
  }
  reqBody.classes = classesArr
  const aadatData = await Aadat.findByIdAndUpdate(aadatId, reqBody, { new: true, runValidators: true });
  if (!aadatData) {
    throw new AppError('No document found with that ID', 404);
  }

  return aadatData;
};

module.exports.deleteAadat = async (body, connection) => {
  try {
    const Aadat = await connection.model('Aadat', AadatModel.schema);
    const categoryModel = await connection.model('Category', Category.schema);

    const { ids } = body;
    const aadatsToDelete = await Aadat.find({ _id: { $in: ids } }).select('category');
    await Aadat.deleteMany({ _id: { $in: ids } });
    const affectedCategoryIds = [...new Set(aadatsToDelete.map(aadat => aadat.category))];
    for (const categoryId of affectedCategoryIds) {
      const count = await Aadat.countDocuments({ category: categoryId });
      await categoryModel.findByIdAndUpdate(categoryId, { assignedAadatCount: count });
    }
    return 'Adaats deleted successfully';
  } catch (error) {
    console.error(error);
    return 'There was a problem deleting the Adaats';
  }
};

module.exports.getAllDailyAadat = async (query, connection) => {
  try {
    let applicableToQuery = {};
    const Aadat = await connection.model('Aadat', AadatModel.schema);
    if (['male', 'female'].includes(query.applicableTo)) {
      applicableToQuery = { $or: [{ applicableTo: query.applicableTo }, { applicableTo: 'both' }] };
    } else if (query.applicableTo === 'both') {
      applicableToQuery = { applicableTo: { $in: ['male', 'female', 'both'] } };
    }

    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const monthOfYear = currentDate.getMonth();
    const dayOfMonth = currentDate.getDate();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const monthsOfYear = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];

    const dayOfWeekStr = daysOfWeek[dayOfWeek];
    const monthOfYearStr = monthsOfYear[monthOfYear];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

    const filter = {
      repetation: query.repetation,
      active: true,
      // _id : new mongoose.Types.ObjectId('66839147e6bd9907d1d5732a'),
      classes: { $in: [new mongoose.Types.ObjectId(query.class)] },
      ...applicableToQuery,
    };
    
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0); // Set to 00:00:00
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999); // Set to 23:59:59

    if (query.repetation === 'daily') {
      filter.repeatMonths = { $in: [monthOfYearStr] };
    } else if (['monthly'].includes(query.repetation)) {
      filter.repeatMonths = { $in: [monthOfYearStr] };
    } else if (['weekly'].includes(query.repetation)) {
      filter.repeatMonths = { $in: [monthOfYearStr] };
      filter.repeatDays = { $in: [dayOfWeekStr] };
    } else if (query.repetation === 'norepeat') {
      filter.repeatDays = { $in: [dayOfWeekStr] }; // Match specific day of month only
      filter.repeatMonths = { $in: [monthOfYearStr] };
      filter.createdAt = { $gte: oneYearAgo }; // Only show within last year, if needed
    } else if(query.repetation === 'custom'){
      filter.customDate = {  $gte: startOfDay, $lte: endOfDay }
    }

    const aggregationPipeline = [
      {
        $match: filter // Your filter conditions here
      },
      {
        $addFields: {
          repeatMonth: { $month: "$repeatDateForYear" }, // Assuming you need this for date manipulation
          repeatDay: { $dayOfMonth: "$repeatDateForYear" }, // Assuming you need this for date manipulation
          customType: {
            values: {
              $map: {
                input: {
                  $filter: {
                    input: '$customType.values',
                    as: 'item',
                    cond: {
                      $or: [
                        { $eq: ['$$item.customFor', 'both'] },
                        { $eq: ['$$item.customFor', query.applicableTo] }
                      ]
                    }
                  }
                },
                as: 'value',
                in: '$$value.value'
              }
            }
          }
        }
      },
      {
        $match: {
          $or: [
            { repetation: { $ne: 'yearly' } }, // Example condition for repetation
            {
              $and: [
                { repeatMonth: monthOfYear + 1 }, // Example condition for repeatMonth
                { repeatDay: dayOfMonth } // Example condition for repeatDay
              ]
            },
          ],
          $and: [
            { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: currentDate } }] },
            { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: currentDate } }] }
          ]
        }
      },
      {
        $lookup: {
          from: 'categories', // Assuming collection name for categories
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: { path : '$category', preserveNullAndEmptyArrays: true}
      },
      {
        $project: {
          repeatMonth: 0, // Exclude repeatMonth field
          repeatDay: 0, // Exclude repeatDay field
          'category._id': 0, // Exclude category._id field
          'customType.customFor' : 0
        }
      },
      {
        $addFields: {
          customType: { values: '$customType.values' } // Rename customType.values to customType
        }
      },
      {
        $sort: {
          'category.orderValue': 1, // Sort by category.orderValue in ascending order
          'orderValue': 1 // Sort by aadat.orderValue in ascending order
        }
      }
    ];

    const allAadats = await Aadat.aggregate(aggregationPipeline);
    // Remove null customType fields
    const filteredAadats = allAadats.map(aadat => {
      if (aadat.customType === null) {
        delete aadat.customType;
      }
      return aadat;
    });

    return filteredAadats;
  } catch (error) {
    console.error("Error fetching adaats:", error);
    throw new AppError('failed to fetch daily adats', 404);
  }
};

module.exports.updateOrderValues = async (body, connection) => {
  const Aadat = await connection.model('Aadat', AadatModel.schema);
  let updatedResults = [];
  for (let item of body) {
    const updatedResult = await Aadat.findByIdAndUpdate
      (
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

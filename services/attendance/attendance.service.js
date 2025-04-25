const {
  tag, dayType, dayAttendanceTag, classAttendanceTag, dayAttendance, attendanceCertificate,
  leave, classAttendance
} = require("../../models/attendance.model");
const { AcademicYears, Subject, WorkingDays } = require('../../models/academics.model');
const AppError = require("../../utils/appError");
const User = require("../../models/user.model");
const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const TeacherTypeModel = require("../../models/teacherType.model");
const { TimeTable } = require("../../models/timeTable.model");
const { default: mongoose } = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const path = require("path");
const fs = require("fs");

module.exports.createTag = async (tagData, connection) => {
  try {
    const TagModel = connection.model('Tag', tag.schema);
    const newTag = await TagModel.create(tagData);
    return newTag;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw new Error('There was a problem creating the tag.');
  }
};

module.exports.getAllTags = async (query, connection) => {
  try {
    const { page = 1, limit = 10, search } = query; // Default pagination settings
    const TagModel = connection.model('Tag', tag.schema);

    // Build the search filter
    const filter = {};
    if (search) {
      filter.tag = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Using paginate method with the filter
    const tags = await TagModel.paginate(filter, { page, limit });

    return tags; // Returns paginated and filtered tags
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('There was a problem fetching the tags.');
  }
};

module.exports.updateTag = async (id, updateData, connection) => {
  try {
    const TagModel = connection.model('Tag', tag.schema);
    const updatedTag = await TagModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedTag) {
      throw new Error('Tag not found');
    }
    return updatedTag;
  } catch (error) {
    console.error('Error updating tag:', error);
    throw new Error('There was a problem updating the tag.');
  }
};

module.exports.deleteTags = async (tagIds, connection) => {
  try {
    const TagModel = connection.model('Tag', tag.schema);
    const result = await TagModel.deleteMany({ _id: { $in: tagIds } });
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting tags:', error);
    throw new Error('There was a problem deleting the tags.');
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createDayType = async (DayTypeData, connection) => {
  try {
    const dayTypeModel = connection.model('DayType', dayType.schema);
    const existingType = await dayTypeModel.findOne({ type: DayTypeData.type.trim() });
    if (existingType) {
      throw new Error("Type already exists.");
    }
    const newDayType = await dayTypeModel.create(DayTypeData);
    return newDayType;
  } catch (error) {
    console.error("Error creating School Type:", error);

    // Handle duplicate error specifically
    if (error.message === "Type already exists.") {
      throw new Error(error.message); // Send duplicate error as-is
    }

    throw new Error("There was a problem creating the School Type.");
  }
};

module.exports.getAllDayType = async (query, connection) => {
  try {
    const { page = 1, limit = 10, search } = query; // Default pagination settings
    const dayTypeModel = connection.model('DayType', dayType.schema);

    // Build the search filter
    const filter = {};
    if (search) {
      filter.tag = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Using paginate method with the filter
    const tags = await dayTypeModel.paginate(filter, { page, limit });

    return tags; // Returns paginated and filtered tags
  } catch (error) {
    console.error('Error fetching Day types:', error);
    throw new Error('There was a problem fetching the Day types.');
  }
};

module.exports.updateDayType = async (id, updateData, connection) => {
  try {
    const dayTypeModel = connection.model('DayType', dayType.schema);
    if (updateData.type) {
      const existingType = await dayTypeModel.findOne({ type: updateData.type.trim(), _id: { $ne: id } });
      if (existingType) {
        throw new Error("Type already exists.");
      }
    }
    const updatedDayType = await dayTypeModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedDayType) {
      throw new Error('Day type not found');
    }
    return updatedDayType;
  } catch (error) {
    console.error('Error updating Day type:', error);
    throw new Error('There was a problem updating the Day type.');
  }
};

module.exports.deleteDayType = async (tagIds, connection) => {
  try {
    const dayTypeModel = connection.model('DayType', dayType.schema);
    const result = await dayTypeModel.deleteMany({ _id: { $in: tagIds } });
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting Day type:', error);
    throw new Error('There was a problem deleting the Day type.');
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createClassAttendanceTag = async (reqBody, connection) => {
  try {
    const { dayTypeObj, tagObj, applicableTo, scanSource,
      // startTime, endTime, 
      refTime, moreThan, lessThan, scenario, academicYearId } = reqBody;

    // Get models
    const ClassAttendanceTagModel = connection.model('ClassAttendanceTag', classAttendanceTag.schema);
    const DayTypeModel = connection.model("DayType", dayType.schema);
    const TagModel = connection.model("Tag", tag.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    // Initialize typeId and tagId
    let typeId = dayTypeObj?.id || null;
    let tagId = tagObj?.id || null;

    // Handle Day Type creation if not provided
    if (!typeId && dayTypeObj?.type) {
      let dayType = await DayTypeModel.findOne({ type: dayTypeObj.type });

      if (!dayType) {
        const dayTypeData = { type: dayTypeObj.type };
        dayType = await DayTypeModel.create(dayTypeData);
      }

      typeId = dayType._id;
    }

    // Handle Tag creation if not provided
    if (!tagId && tagObj?.tag) {
      let tag = await TagModel.findOne({ tag: tagObj.tag });

      if (!tag) {
        const tagData = { tag: tagObj.tag };
        tag = await TagModel.create(tagData);
      }

      tagId = tag._id;
    }

    // Ensure required fields are valid
    if (!typeId) {
      throw new Error("Invalid or missing dayType information.");
    }
    if (!tagId) {
      throw new Error("Invalid or missing tag information.");
    }

    let result = []
    if (applicableTo && applicableTo.length > 0) {
      for (let applicable of applicableTo) {
        // Check if the ClassAttendanceTag already exists
        const existingTag = await ClassAttendanceTagModel.findOne({
          day_type: typeId,
          applicable_to: applicable,
          scan_source: scanSource,
          tag: tagId,
          ref_time: refTime,
          less_than: lessThan,
          more_than: moreThan,
          scenario: scenario,
          academicYearId: academicYearId
        });

        if (existingTag) {
          console.log(`ClassAttendanceTag already exists for applicable_to: ${applicable}`);
          result.push({ message: "ClassAttendanceTag already exists", tag: existingTag });
          continue; // Skip creating a new entry
        }

        // Prepare data for ClassAttendanceTag creation
        const classAttendanceTagData = {
          day_type: typeId,
          applicable_to: applicable,
          scan_source: scanSource,
          tag: tagId,
          ref_time: refTime,
          less_than: lessThan,
          more_than: moreThan,
          scenario: scenario,
          academicYearId: academicYearId
        };

        // Create new ClassAttendanceTag
        const newClassAttendanceTag = await ClassAttendanceTagModel.create(classAttendanceTagData);
        result.push(newClassAttendanceTag);
      }
    }
    return result;
  } catch (error) {
    console.error('Error creating class attendance tag:', error);
    throw new Error('There was a problem creating the class attendance tag.');
  }
};

module.exports.getAllClassAttendanceTags = async (query, connection) => {
  try {
    const { page = 1, limit = 10, dayType, applicableTo, academicYearId } = query;
    const ClassAttendanceTagModel = connection.model('ClassAttendanceTag', classAttendanceTag.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Aggregation pipeline
    const pipeline = [];

    // Match stage to apply filters
    const matchStage = {};
    if (dayType) {
      matchStage.day_type = new mongoose.Types.ObjectId(dayType); // Ensure `day_type` is an ObjectId
    }
    if (applicableTo) {
      matchStage.applicable_to = applicableTo; // Filter by applicable_to
    }
    if (academicYearId) {
      matchStage.academicYearId = new mongoose.Types.ObjectId(academicYearId); // Filter by applicable_to
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Lookup to populate 'day_type' and 'tag'
    pipeline.push(
      {
        $lookup: {
          from: 'daytypes',  // Collection to join with (daytypes)
          localField: 'day_type',  // Field in ClassAttendanceTag to match
          foreignField: '_id',  // Field in daytypes collection to match
          as: 'day_type',  // Output field in the result
        },
      },
      {
        $lookup: {
          from: 'tags',  // Collection to join with (tags)
          localField: 'tag',  // Field in ClassAttendanceTag to match
          foreignField: '_id',  // Field in tags collection to match
          as: 'tag',  // Output field in the result
        },
      },
      {
        $lookup: {
          from: 'academicyears',  // Collection to join with (tags)
          localField: 'academicYearId',  // Field in ClassAttendanceTag to match
          foreignField: '_id',  // Field in tags collection to match
          as: 'academicYearDetails',  // Output field in the result
        },
      }
    );

    // Unwind the populated fields for better formatting
    pipeline.push(
      { $unwind: { path: '$day_type', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$tag', preserveNullAndEmptyArrays: true } }
    );

    // Pagination
    pipeline.push(
      { $skip: (page - 1) * limit },  // Skip the documents to implement pagination
      { $limit: parseInt(limit, 10) }  // Limit the number of documents to the specified limit
    );
    // Count total documents for pagination metadata
    const totalDocsPipeline = [...pipeline];
    totalDocsPipeline.pop(); // Remove skip and limit for count
    totalDocsPipeline.pop();

    const [data, totalCount] = await Promise.all([
      ClassAttendanceTagModel.aggregate(pipeline),  // Fetch paginated data
      ClassAttendanceTagModel.aggregate([...totalDocsPipeline, { $count: 'total' }]),  // Count total documents
    ]);

    const total = totalCount[0]?.total || 0;  // Total documents count (default to 0 if not found)

    return {
      data,
      total,
      page: parseInt(page, 10),  // Current page number
      limit: parseInt(limit, 10),  // Limit per page
      totalPages: Math.ceil(total / limit),  // Calculate total pages
    };
  } catch (error) {
    console.error('Error fetching class attendance tags:', error);
  }
}

module.exports.getClassAttendanceTagById = async (id, connection) => {
  try {
    // Ensure that the ID parameter is provided
    if (!id) {
      throw new Error("ID parameter is required.");
    }
    connection.model("AcademicYears", AcademicYears.schema);
    // Get the ClassAttendanceTag model
    connection.model("Tag", tag.schema);
    connection.model("DayType", dayType.schema);
    const ClassAttendanceTagModel = connection.model("ClassAttendanceTag", classAttendanceTag.schema);

    // Fetch the document by ID and populate related fields
    const tagData = await ClassAttendanceTagModel.findById(id)
      .populate({
        path: "tag", // Populate the `tag` field
        select: "tag", // Include only the `tag` field
      })
      .populate({
        path: "day_type", // Populate the `day_type` field
        select: "type", // Include only the `type` field
      })
      .populate('academicYearId')
      .lean();

    if (!tagData) {
      return {
        message: "Class Attendance Tag not found.",
        data: null,
      };
    }

    return {
      message: "Class Attendance Tag fetched successfully.",
      data: tagData,
    };
  } catch (error) {
    console.error("Error fetching Class Attendance Tag:", error);
    throw new Error("There was a problem fetching the class attendance tag.");
  }
};

module.exports.updateClassAttendanceTag = async (id, reqBody, connection) => {
  try {
    const {
      dayTypeObj,
      tagObj,
      applicableTo,
      scanSource,
      // startTime,
      // endTime,
      refTime,
      moreThan,
      lessThan,
      scenario,
      academicYearId
    } = reqBody;

    // Get models
    const ClassAttendanceTagModel = connection.model("ClassAttendanceTag", classAttendanceTag.schema);
    const DayTypeModel = connection.model("DayType", dayType.schema);
    const TagModel = connection.model("Tag", tag.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Ensure the ID is provided
    if (!id) {
      throw new Error("ID of the classAttendanceTag is required for update.");
    }

    // Fetch the existing record
    const existingTag = await ClassAttendanceTagModel.findById(id);
    if (!existingTag) {
      throw new Error(`ClassAttendanceTag with ID ${id} not found.`);
    }

    // Update or create Day Type if provided
    let typeId = dayTypeObj?.id || existingTag.day_type;
    if (!dayTypeObj?.id && dayTypeObj?.type) {
      let dayType = await DayTypeModel.findOne({ type: dayTypeObj.type });

      if (!dayType) {
        const dayTypeData = { type: dayTypeObj.type };
        dayType = await DayTypeModel.create(dayTypeData);
      }

      typeId = dayType._id;
    }

    // Update or create Tag if provided
    let tagId = tagObj?.id || existingTag.tag;
    if (!tagObj?.id && tagObj?.tag) {
      let tag = await TagModel.findOne({ tag: tagObj.tag });

      if (!tag) {
        const tagData = { tag: tagObj.tag };
        tag = await TagModel.create(tagData);
      }

      tagId = tag._id;
    }

    // Prepare updated fields
    const updatedData = {
      day_type: typeId,
      applicable_to: applicableTo || existingTag.applicable_to,
      scan_source: scanSource || existingTag.scan_source,
      tag: tagId,
      // start_time: startTime || existingTag.start_time,
      // end_time: endTime || existingTag.end_time,
      ref_time: refTime || existingTag.ref_time,
      less_than: lessThan || existingTag.less_than,
      more_than: moreThan || existingTag.more_than,
      scenario: scenario || existingTag.scenario,
      academicYearId: academicYearId || existingTag.academicYearId
    };

    // Update the ClassAttendanceTag
    const updatedTag = await ClassAttendanceTagModel.findByIdAndUpdate(id, updatedData, {
      new: true,         // Return the updated document
      runValidators: true, // Ensure validation on update
    });

    if (!updatedTag) {
      throw new Error("Class attendance tag not found.");
    }

    return updatedTag;
  } catch (error) {
    console.error("Error updating class attendance tag:", error);
    throw new Error("There was a problem updating the class attendance tag.");
  }
};

module.exports.updateActiveClassAttendanceTag = async (body, connection) => {
  try {
    // Destructure the request body
    const { ids, active } = body;

    // Validate the input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error("Invalid or missing `ids`. It should be a non-empty array.");
    }

    if (typeof active !== "boolean") {
      throw new Error("Invalid or missing `active` status. It should be a boolean.");
    }

    // Get the model
    const ClassAttendanceTagModel = connection.model("ClassAttendanceTag", classAttendanceTag.schema);

    // Update active status for the provided IDs
    const result = await ClassAttendanceTagModel.updateMany(
      { _id: { $in: ids } }, // Filter for matching IDs
      { $set: { active } }    // Set the `active` field
    );

    // Return the update result
    return {
      message: `Successfully updated ${result.modifiedCount} records.`,
      updatedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error updating active status of Class Attendance Tags:", error);
    throw error;
  }
};

module.exports.deleteClassAttendanceTags = async (ids, connection) => {
  try {
    const ClassAttendanceTagModel = connection.model('ClassAttendanceTag', classAttendanceTag.schema);
    const result = await ClassAttendanceTagModel.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  } catch (error) {
    console.error('Error deleting class attendance tags:', error);
    throw new Error('There was a problem deleting the class attendance tags.');
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createDayAttendanceTag = async (reqBody, connection) => {
  try {
    // Destructure reqBody
    const { dayTypeObj, tagObj, applicableTo, scanSource, startTime, endTime, refTime, moreThan, lessThan, scenario, parentAccompaningNeeded, academicYearId } = reqBody;

    // Get models
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);
    const DayTypeModel = connection.model("DayType", dayType.schema);
    const TagModel = connection.model("Tag", tag.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Initialize typeId and tagId
    let typeId = dayTypeObj?.id || null;
    let tagId = tagObj?.id || null;

    // Handle Day Type creation if not provided
    if (!typeId && dayTypeObj?.type) {
      let dayType = await DayTypeModel.findOne({ type: dayTypeObj.type });
      console.log(dayType, "dayType")
      if (!dayType) {
        const dayTypeData = { type: dayTypeObj.type };
        dayType = await DayTypeModel.create(dayTypeData);
      }

      typeId = dayType._id;
    }

    // Handle Tag creation if not provided
    if (!tagId && tagObj?.tag) {
      let tag = await TagModel.findOne({ tag: tagObj.tag });
      console.log(tag, "tag")
      if (!tag) {
        const tagData = { tag: tagObj.tag };
        tag = await TagModel.create(tagData);
      }

      tagId = tag._id;
    }

    // Ensure required fields are valid
    if (!typeId) {
      throw new Error("Invalid or missing dayType information.");
    }
    if (!tagId) {
      throw new Error("Invalid or missing tag information.");
    }
    let result = []
    if (applicableTo && applicableTo.length > 0) {
      for (let applicable of applicableTo) {
        // Prepare query to check for existing dayAttendanceTag
        const existingTag = await DayAttendanceTagModel.findOne({
          day_type: typeId,
          applicable_to: applicable,
          scan_source: scanSource,
          tag: tagId,
          ref_time: refTime,
          less_than: lessThan,
          more_than: moreThan,
          parent_accompaning_needed: parentAccompaningNeeded,
          academicYearId: academicYearId
        });

        if (existingTag) {
          console.log(`DayAttendanceTag already exists for applicable_to: ${applicable}`);
          result.push({ message: "DayAttendanceTag already exists", tag: existingTag });
          continue; // Skip creating a new entry
        }

        // Prepare data for new dayAttendanceTag creation
        const dayAttendanceTagData = {
          day_type: typeId,
          applicable_to: applicable,
          scan_source: scanSource,
          tag: tagId,
          ref_time: refTime,
          less_than: lessThan,
          more_than: moreThan,
          scenario: scenario,
          parent_accompaning_needed: parentAccompaningNeeded,
          academicYearId: academicYearId
        };

        // Create new Day Attendance Tag
        const createdTag = await DayAttendanceTagModel.create(dayAttendanceTagData);
        result.push(createdTag);
      }
    }
    return result;
  } catch (error) {
    console.error("Error creating Day Attendance Tag:", error);
    throw error;
  }
};

module.exports.updateDayAttendanceTag = async (id, reqBody, connection) => {
  try {
    // Destructure reqBody
    const { dayTypeObj, tagObj, applicableTo, scanSource, startTime, endTime, refTime, moreThan, lessThan, scenario, academicYearId } = reqBody;

    // Get models
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);
    const DayTypeModel = connection.model("DayType", dayType.schema);
    const TagModel = connection.model("Tag", tag.schema);
    connection.model("AcademicYears", AcademicYears.schema)
    // Ensure the ID is provided
    if (!id) {
      throw new Error("ID of the dayAttendanceTag is required for update.");
    }

    // Fetch the existing record
    const existingTag = await DayAttendanceTagModel.findById(id);
    if (!existingTag) {
      throw new Error(`DayAttendanceTag with ID ${id} not found.`);
    }

    // Update or create Day Type if provided
    let typeId = dayTypeObj?.id || existingTag.day_type;
    if (!dayTypeObj?.id && dayTypeObj?.type) {
      let dayType = await DayTypeModel.findOne({ type: dayTypeObj.type });

      if (!dayType) {
        const dayTypeData = { type: dayTypeObj.type };
        dayType = await DayTypeModel.create(dayTypeData);
      }

      typeId = dayType._id;
    }

    // Update or create Tag if provided
    let tagId = tagObj?.id || existingTag.tag;
    if (!tagObj?.id && tagObj?.tag) {
      let tag = await TagModel.findOne({ tag: tagObj.tag });

      if (!tag) {
        const tagData = { tag: tagObj.tag };
        tag = await TagModel.create(tagData);
      }

      tagId = tag._id;
    }

    // Prepare updated fields
    const updatedData = {
      day_type: typeId,
      applicable_to: applicableTo || existingTag.applicable_to,
      scan_source: scanSource || existingTag.scan_source,
      tag: tagId,
      // start_time: startTime || existingTag.start_time,
      // end_time: endTime || existingTag.end_time,
      ref_time: refTime || existingTag.ref_time,
      less_than: lessThan || existingTag.less_than,
      more_than: moreThan || existingTag.more_than,
      scenario: scenario || existingTag.scenario,
      academicYearId: academicYearId || existingTag.academicYearId
    };

    // Update the DayAttendanceTag
    const updatedTag = await DayAttendanceTagModel.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });

    return updatedTag;
  } catch (error) {
    console.error("Error updating Day Attendance Tag:", error);
    throw error;
  }
};

module.exports.updateActiveDayAttendanceTag = async (body, connection) => {
  try {
    // Destructure the request body
    const { ids, active } = body;

    // Validate the input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error("Invalid or missing `ids`. It should be a non-empty array.");
    }

    if (typeof active !== "boolean") {
      throw new Error("Invalid or missing `active` status. It should be a boolean.");
    }

    // Get the model
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);

    // Update active status for the provided IDs
    const result = await DayAttendanceTagModel.updateMany(
      { _id: { $in: ids } }, // Filter for matching IDs
      { $set: { active } }   // Set the `active` field
    );

    // Return the update result
    return {
      message: `Successfully updated ${result.modifiedCount} records.`,
      updatedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error updating active status of Day Attendance Tags:", error);
    throw error;
  }
};

module.exports.getDayAttendanceTag = async (id, connection) => {
  try {
    // Destructure the ID from the request parameters
    if (!id) {
      throw new Error("ID parameter is required.");
    }
    // Get the model
    connection.model("Tag", tag.schema);
    connection.model("DayType", dayType.schema);
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Fetch the document by ID and populate related fields
    const tagData = await DayAttendanceTagModel.findOne({ _id: id })
      .populate({
        path: "tag", // Populate the `tag` field
        select: "tag", // Include only the `tag` field
      })
      .populate({
        path: "day_type", // Populate the `day_type` field
        select: "type", // Include only the `type` field
      })
      .populate("academicYearId")
      .lean();

    if (!tagData) {
      return {
        message: "Day Attendance Tag not found.",
        data: null,
      };
    }

    return {
      message: "Day Attendance Tag fetched successfully.",
      data: tagData,
    };
  } catch (error) {
    console.error("Error fetching Day Attendance Tag:", error);
    throw error;
  }
};

module.exports.getAllDayAttendanceTag = async (reqQuery, connection) => {
  try {
    const { dayType, status, applicableTo, search, academicYearId } = reqQuery;
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    const pipeline = [];

    // Match stage for filtering by dayType, status, applicableTo
    const matchStage = {};
    if (academicYearId) matchStage["academicYearId"] = new mongoose.Types.ObjectId(academicYearId);
    if (dayType) matchStage["day_type"] = new ObjectId(dayType);
    if (typeof status !== "undefined") matchStage["active"] = status === "true";
    if (applicableTo) matchStage["applicable_to"] = applicableTo;
    pipeline.push({ $match: matchStage });
    // Populate related fields
    pipeline.push(
      {
        $lookup: {
          from: "daytypes", // Replace with your day types collection name
          localField: "day_type",
          foreignField: "_id",
          as: "dayTypeDetails",
        },
      },
      {
        $lookup: {
          from: "tags", // Replace with your tags collection name
          localField: "tag",
          foreignField: "_id",
          as: "tagDetails",
        },
      },
      {
        $lookup: {
          from: "academicyears", // Replace with your tags collection name
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearDetails",
        },
      },
    );

    // Extract first elements using $addFields
    pipeline.push({
      $addFields: {
        firstTag: { $arrayElemAt: ["$tagDetails.tag", 0] },
        firstDayType: { $arrayElemAt: ["$dayTypeDetails.type", 0] },
      },
    });

    // Match stage for search filtering
    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { firstTag: searchRegex },
            { firstDayType: searchRegex },
            { scenario: searchRegex },
          ],
        },
      });
    }

    // Project specific fields for clean output
    pipeline.push({
      $project: {
        _id: 1,
        scenario: 1,
        applicable_to: 1,
        // start_time: 1,
        // end_time: 1,
        ref_time: 1,
        less_than: 1,
        scan_source: 1,
        tag: 1,
        active: 1,
        dayTypeDetails: { _id: 1, type: 1 },
        tagDetails: { _id: 1, tag: 1 },
        academicYearDetails: 1
      },
    });

    // Execute the aggregation pipeline
    const tags = await DayAttendanceTagModel.aggregate(pipeline);

    return {
      data: tags,
      message: "Fetched day attendance tags successfully.",
    };
  } catch (error) {
    console.error("Error fetching Day Attendance Tags:", error);
    throw error;
  }
};

module.exports.deleteDayAttendanceTag = async (reqBody, connection) => {
  try {
    // Destructure `ids` from the request body
    const { ids } = reqBody;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("Invalid request. `ids` must be a non-empty array.");
    }

    // Get the model
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);

    // Perform deletion
    const result = await DayAttendanceTagModel.deleteMany({ _id: { $in: ids } });

    // Return response
    return {
      message: `${result.deletedCount} Day Attendance Tag(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("Error deleting Day Attendance Tags:", error);
    throw error;
  }
};

//---------------------------------------------------------------------------------------------
async function assignAttendanceTag(connection, attendanceTime, applicableTo, scanSource, isParentAccompanying = false, workingDayTime) {
  try {
    const DayAttendanceTagModel = connection.model("DayAttendanceTag", dayAttendanceTag.schema);
    const TagModel = connection.model("Tag", tag.schema);

    // Convert attendanceTime to minutes for easier comparison
    const attendanceMinutes = convertTimeToMinutes(attendanceTime);

    // Fetch all relevant scenarios for the day
    const scenarios = await DayAttendanceTagModel.find({
      applicable_to: applicableTo, // Example: 'student'
      scan_source: scanSource,    // Example: 'card' or 'manual'
      active: true,               // Only active scenarios
    });

    const startMinutes = convertTimeToMinutes(workingDayTime.start_time);
    const endMinutes = convertTimeToMinutes(workingDayTime.end_time);
    for (const scenario of scenarios) {

      const refMinutes = convertTimeToMinutes(scenario.ref_time === "startTime" ? workingDayTime.start_time : scenario.ref_time === "endTime" ? workingDayTime.end_time : workingDayTime.start_time
      );

      // Log the values for each scenari
      const condition = (attendanceMinutes >= startMinutes) && (attendanceMinutes <= endMinutes) &&
        (!scenario.less_than || attendanceMinutes <= refMinutes + parseInt(scenario.less_than)) &&
        (!scenario.more_than || attendanceMinutes >= refMinutes + parseInt(scenario.more_than)) &&
        (scenario.parent_accompaning_needed == isParentAccompanying);
      if (condition) {
        return scenario.tag;
      }
    }
    const tagId = await TagModel.findOne({ tag: "Absent" });
    return tagId ? tagId._id : null;
  } catch (error) {
    console.error("Error assigning attendance tag:", error);
    throw error;
  }
}

async function assignClassAttendanceTag(connection, attendanceTime, applicableTo, scanSource, isParentAccompanying = false, startTime, endTime) {
  try {
    const classAttendanceTagModel = connection.model("classAttendanceTag", classAttendanceTag.schema);
    const TagModel = connection.model("Tag", tag.schema);
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    // Convert attendanceTime to minutes for easier comparison
    const attendanceMinutes = convertTimeToMinutes(attendanceTime);
    // Fetch all relevant scenarios for the day
    const scenarios = await classAttendanceTagModel.find({
      applicable_to: applicableTo, // Example: 'student'
      scan_source: scanSource,    // Example: 'card' or 'manual'
      active: true,               // Only active scenarios
    });
    for (const scenario of scenarios) {
      const refMinutes = convertTimeToMinutes(scenario.ref_time === "startTime" ? startTime : scenario.ref_time === "endTime" ? endTime : startTime
      );
      // Log the values for each scenari
      const condition = (attendanceMinutes >= startMinutes) && (attendanceMinutes <= endMinutes) &&
        (!scenario.less_than || attendanceMinutes <= refMinutes + parseInt(scenario.less_than)) &&
        (!scenario.more_than || attendanceMinutes >= refMinutes + parseInt(scenario.more_than)) &&
        (scenario.parent_accompaning_needed == isParentAccompanying);
      if (condition) {
        return scenario.tag;
      }
    }
    const tagId = await TagModel.findOne({ tag: "Absent" });
    return tagId ? tagId._id : null;
  } catch (error) {
    console.error("Error assigning attendance tag:", error);
    throw error;
  }
}

// Utility function to convert "HH:mm" time format to total minutes
function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const getWorkingDayTime = async (WorkingDaysModel, workingDayId, day) => {
  try {
    const workingDay = await WorkingDaysModel.findOne({ _id: workingDayId });

    if (!workingDay) {
      return null; // No working day found
    }

    const weekday = workingDay.weekdays.find((w) => w.day === day);

    if (!weekday) {
      return null; // No matching weekday found
    }

    return { start_time: weekday.start_time, end_time: weekday.end_time };
  } catch (error) {
    console.error("Error fetching working day:", error);
    throw error; // Handle or log the error as needed
  }
};
//---------------------------------------------------------------------------------------------

module.exports.createManualScanForStudent = async (reqBody, connection) => {
  try {
    // Destructure reqBody
    const { date, dayType, scanSource = 'manual', applicableTo = 'student', students, academicYearId, workingDaysId, day } = reqBody;

    // Get models
    const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
    const WorkingDaysModel = connection.model("WorkingDays", WorkingDays.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    const workingDayTime = await getWorkingDayTime(WorkingDaysModel, workingDaysId, day);

    if (students && students.length > 0) {
      let resultArr = [];

      for (let student of students) {
        let id = student.id;
        let attendanceTime = student.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        let isParentAccompanying = student.isParentAccompanying || false;

        // Check if attendance already exists for this student on the given date
        const existingAttendance = await DayAttendanceModel.findOne({ user_id: id, date: new Date(date) });

        if (existingAttendance) {
          console.log(`Attendance already exists for user_id: ${id} on ${date}, skipping...`);
          continue; // Skip this student
        }

        let tagId = await assignAttendanceTag(connection, attendanceTime, applicableTo, scanSource, isParentAccompanying, workingDayTime);

        let data = {
          user_id: id,
          user_type: applicableTo,
          day_type: dayType,
          tag: tagId,
          scan_source: scanSource,
          date: new Date(date),
          time: attendanceTime,
          is_parent_accompaning: isParentAccompanying,
          academicYearId: academicYearId
        };

        let result = await DayAttendanceModel.create(data);
        resultArr.push(result);
      }

      return resultArr;
    } else {
      throw new Error('No student selected');
    }
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.createManualScanForTeacher = async (reqBody, connection) => {
  try {
    // Destructure reqBody
    const { date, dayType, scanSource = 'manual', applicableTo = 'teacher', teachers, academicYearId, workingDaysId, day } = reqBody;

    // Get models
    const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
    const WorkingDaysModel = connection.model("WorkingDays", WorkingDays.schema);
    const workingDayTime = await getWorkingDayTime(WorkingDaysModel, workingDaysId, day);
    const TagModel = connection.model("Tag", tag.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    if (teachers && teachers.length > 0) {
      let resultArr = [];

      for (let teacher of teachers) {
        let { id } = teacher;
        let attendanceTime = teacher.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        let isParentAccompanying = false;

        // Check if attendance already exists for this teacher on the given date
        const existingAttendance = await DayAttendanceModel.findOne({ user_id: id, date: new Date(date) });

        if (existingAttendance) {
          console.log(`Attendance already exists for user_id: ${id} on ${date}, skipping...`);
          continue; // Skip this teacher
        }
        let tagId;
        if (teacher.isAbsent) {
          tagId = await assignAttendanceTag(connection, attendanceTime, applicableTo, scanSource, isParentAccompanying, workingDayTime);
        } else {
          let absentTag = await TagModel.findOne({ tag: "Absent" });
          tagId = absentTag ? absentTag._id : null;
        }

        let data = {
          user_id: id,
          user_type: applicableTo,
          day_type: dayType,
          tag: tagId,
          scan_source: scanSource,
          date: new Date(date),
          time: attendanceTime,
          is_parent_accompaning: isParentAccompanying,
          academicYearId: academicYearId
        };

        let result = await DayAttendanceModel.create(data);
        resultArr.push(result);
      }

      return resultArr;
    } else {
      throw new Error('No teacher selected');
    }
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.getAllDayAttendance = async (reqQuery, connection) => {
  try {
    // Destructure query parameters
    const { scanSource, dayTypeId, status, userType, applicableTo, stage, grade, section, startDate, endDate, teacherType, studentId, tagId, academicYearId } = reqQuery;
    // Get the model
    const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
    connection.model("DayAttendanceTag", dayAttendanceTag.schema);
    connection.model("User", User.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    // Initialize the aggregation pipeline
    const pipeline = [];

    // Build the match stage (filtering by dayType, status, applicableTo)
    const matchStage = {};
    if (dayTypeId) matchStage["day_type"] = new ObjectId(dayTypeId);
    if (typeof status !== "undefined") matchStage["active"] = status === "true";
    if (applicableTo) matchStage["applicable_to"] = applicableTo;
    if (academicYearId) matchStage["academicYearId"] = new ObjectId(academicYearId);
    if (userType) matchStage["user_type"] = userType;
    // Date Range Filtering (startDate and endDate)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      matchStage['date'] = { $gte: start, $lte: end };
    }

    // Additional filters for stage, grade, section, teacherType
    if (stage) {
      matchStage['userDetails.stageGradeSection.stage'] = new ObjectId(stage);
    }
    if (grade) {
      matchStage['userDetails.stageGradeSection.grade._id'] = new ObjectId(grade);
    }
    if (section) {
      matchStage['userDetails.stageGradeSection.section._id'] = new ObjectId(section);
    }
    if (teacherType) {
      matchStage['userDetails.teacherType'] = new ObjectId(teacherType);
    }
    if (studentId) {
      matchStage['userDetails._id'] = new ObjectId(studentId);
    }
    if (tagId) {
      matchStage['tag'] = new ObjectId(tagId);
    }
    if (scanSource) {
      matchStage['scan_source'] = scanSource;
    }

    // Populate related fields using $lookup for dayType and tag
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, firstName: 1, middleName: 1, lastName: 1, role: 1, photo: 1, teacherType: 1, itsNo: 1, stageGradeSection: 1 } }
          ],
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

      // Lookup user stage, grade, and section
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "userDetails.stageGradeSection",
          foreignField: "_id",
          as: "userDetails.stageGradeSection",
        },
      },
      { $unwind: { path: "$userDetails.stageGradeSection", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "grades",
          localField: "userDetails.stageGradeSection.grade",
          foreignField: "_id",
          as: "userDetails.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$userDetails.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sections",
          localField: "userDetails.stageGradeSection.section",
          foreignField: "_id",
          as: "userDetails.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$userDetails.stageGradeSection.section", preserveNullAndEmptyArrays: true } },

      // Teacher Type Lookup
      {
        $lookup: {
          from: "teachertypes",
          localField: "userDetails.teacherType",
          foreignField: "_id",
          as: "userDetails.teacherType",
        },
      },
      { $unwind: { path: "$userDetails.teacherType", preserveNullAndEmptyArrays: true } },

      // DayType and Tag Lookup
      {
        $lookup: {
          from: "daytypes",
          localField: "day_type",
          foreignField: "_id",
          as: "dayTypeDetails",
        },
      },
      { $unwind: { path: "$dayTypeDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "tags",
          localField: "tag",
          foreignField: "_id",
          as: "tagDetails",
        },
      },
      { $unwind: { path: "$tagDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "AcademicYears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearDetails",
        },
      },
      { $unwind: { path: "$academicYearDetails", preserveNullAndEmptyArrays: true } },
    );
    pipeline.push({ $match: matchStage });
    // Fetch data using aggregation pipeline
    const tags = await DayAttendanceModel.aggregate(pipeline);


    // Check if we got any results
    if (tags && tags.length > 0) {
      return {
        data: tags,
        message: "Fetched day attendance successfully.",
      };
    } else {
      return {
        data: [],
        message: "No day attendance records found.",
      };
    }

  } catch (error) {
    console.error("Error fetching Day Attendance Tags:", error);
    throw error;
  }
};

module.exports.undoTeachersAttendance = async (reqBody, connection) => {
  try {
    // Destructure reqBody
    const { teacherIds, date } = reqBody;
    let startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    let endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get models
    const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
    if (teacherIds && teacherIds.length > 0) {
      let deletedAttendance = await DayAttendanceModel.deleteMany({
        user_id: { $in: teacherIds },
        date: { $gte: startOfDay, $lte: endOfDay }
      });
      return deletedAttendance;
    }
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.getAllDayAttendanceForTeacher = async (reqQuery, connection) => {
  try {
    // Destructure query parameters
    const { date, status, userType, search, academicYearId } = reqQuery;

    // Validate the date input
    if (!date) {
      throw new Error("Date is required to fetch attendance data.");
    }

    // Get the models
    const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
    const UserModel = connection.model("User", User.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    connection.model("TeacherType", TeacherTypeModel.schema);
    // Fetch all teachers
    const filter = {}
    if (userType) {
      filter.role = userType;
    }
    if (search) {
      if (search.includes(' ')) {
        // Split search term into first and last names
        const [firstNameTerm, ...lastNameTerms] = search.split(' ');
        const firstNameRegex = new RegExp(`.*${firstNameTerm}.*`, 'i'); // Regex for first name
        const lastNameRegex = new RegExp(`.*${lastNameTerms.join(' ')}.*`, 'i'); // Regex for last name
        filter.$or = [
          { firstName: firstNameRegex, lastName: lastNameRegex },
          { lastName: lastNameRegex }
        ];
      } else {
        // If the search term doesn't include a space, match it against either firstName or lastName
        const searchRegex = new RegExp(`.*${search}.*`, 'i');
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex }
        ];
      }
    }
    const teachers = await UserModel.find(filter).select("_id firstName lastName photo role itsNo teacherType").populate({
      path: "teacherType",
      select: "type",
    }).lean();

    // Initialize the result array
    const teacherAttendanceList = [];

    for (const teacher of teachers) {
      let filter = {
        user_id: teacher._id,
        date: new Date(date), // Match the exact date string
      }
      if (academicYearId) {
        filter.academicYearId = academicYearId
      }
      // Check for attendance in DayAttendance collection using the 'date' field
      const attendance = await DayAttendanceModel.findOne(filter);

      const isPresent = !!attendance;

      // Include all data if status is undefined, otherwise apply filter
      if (status == "all" || String(isPresent) == status) {
        teacherAttendanceList.push({
          ...teacher,
          attendanceTime: isPresent ? attendance.time : "",
          status: isPresent,
        });
      }
    }

    return {
      data: teacherAttendanceList,
      message: "Fetched teacher attendance successfully.",
    };
  } catch (error) {
    console.error("Error fetching Day Attendance for Teachers:", error);
    throw error;
  }
};

module.exports.getDayAttendanceSummary = async (reqQuery, connection) => {
  try {
    const { date, grade, section, dayTypeId, academicYearId } = reqQuery;

    // Register models
    const StageGradeSectionTimeModel = connection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );
    const UserModel = connection.model("User", User.schema);
    const DayAttendanceModel = connection.model("dayAttendance", dayAttendance.schema);
    const TagModel = connection.model("Tag", tag.schema);
    const GradeModel = connection.model("Grade", Grade.schema);
    const SectionModel = connection.model("Section", Section.schema);
    const DayTypeModel = connection.model("DayType", dayType.schema);

    // const currentDate = new Date();
    const startOfDay = date ? new Date(date) : new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = date ? new Date(date) : new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const matchStageGradeSection = {};
    if (grade) matchStageGradeSection.grade = new ObjectId(grade);
    if (section) matchStageGradeSection.section = new ObjectId(section);

    // Step 1: Get unique grades and sections
    const uniqueGradeSections = await StageGradeSectionTimeModel.aggregate([
      { $match: matchStageGradeSection },
      {
        $group: {
          _id: { grade: "$grade", section: "$section" },
          stageGradeSectionIds: { $addToSet: "$_id" },
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "_id.grade",
          foreignField: "_id",
          as: "gradeDetails",
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "_id.section",
          foreignField: "_id",
          as: "sectionDetails",
        },
      },
      { $unwind: "$gradeDetails" },
      { $unwind: "$sectionDetails" },
      {
        $project: {
          gradeId: "$_id.grade",
          gradeName: "$gradeDetails.grade",
          sectionId: "$_id.section",
          sectionName: "$sectionDetails.section",
          stageGradeSectionIds: 1,
        },
      },
    ]);

    // Step 2: Fetch all tags
    const allTags = await TagModel.find().select("_id tag");

    // Step 3: Process attendance by grade-section and dayType
    const attendanceSummary = await Promise.all(
      uniqueGradeSections.map(async (item) => {
        const users = await UserModel.find({
          stageGradeSection: { $in: item.stageGradeSectionIds },
        }).select("_id");

        const userIds = users.map((user) => new ObjectId(user._id));
        const totalUserCount = userIds.length;

        const filter = {
          user_id: { $in: userIds },
          date: { $gte: startOfDay, $lte: endOfDay },
        };

        if (dayTypeId) filter.day_type = new ObjectId(dayTypeId);
        if (academicYearId) filter.academicYearId = new ObjectId(academicYearId);
        const attendanceByDayType = await DayAttendanceModel.aggregate([
          { $match: filter },
          {
            $group: {
              _id: { dayType: "$day_type", tag: "$tag" },
              count: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "tags",
              localField: "_id.tag",
              foreignField: "_id",
              as: "tagDetails",
            },
          },
          {
            $lookup: {
              from: "daytypes",
              localField: "_id.dayType",
              foreignField: "_id",
              as: "dayTypeDetails",
            },
          },
          {
            $lookup: {
              from: "AcademicYears",
              localField: "_id.academicYearId",
              foreignField: "_id",
              as: "academicYearId",
            },
          },
          { $unwind: { path: "$tagDetails", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$dayTypeDetails", preserveNullAndEmptyArrays: true } },
          { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              dayType: "$_id.dayType",
              dayTypeName: "$dayTypeDetails.type",
              tag: "$tagDetails.tag",
              academicYearId: "$academicYearId",
              count: 1,
            },
          },
        ]);

        // Initialize an empty structure for attendance grouped by dayType
        const attendanceGroupedByDayType = attendanceByDayType.reduce((acc, record) => {
          const { dayType, dayTypeName, tag, count } = record;

          if (!acc[dayType]) {
            acc[dayType] = {
              dayTypeId: dayType,
              dayType,
              dayTypeName,
              academicYearId,
              scanCount: 0,  // Initialize scan count
              attendance: allTags.map((tagEntry) => ({
                tag: tagEntry.tag,
                count: 0,  // Initialize all counts as 0
              })),
            };
          }

          // Update scanCount
          acc[dayType].scanCount += count;

          const tagEntry = acc[dayType].attendance.find((entry) => entry.tag === tag);
          if (tagEntry) tagEntry.count = count;

          return acc;
        }, {});

        // Ensure all tags are included with 0 count for missing tags
        Object.values(attendanceGroupedByDayType).forEach((dayTypeGroup) => {
          dayTypeGroup.attendance = allTags.map((tagEntry) => ({
            tag: tagEntry.tag,
            count: dayTypeGroup.attendance.find((entry) => entry.tag === tagEntry.tag)?.count || 0,
          }));
        });

        return {
          gradeId: item.gradeId,
          gradeName: item.gradeName,
          sectionId: item.sectionId,
          sectionName: item.sectionName,
          totalStudents: totalUserCount,  // Add total student count
          dayTypes: Object.values(attendanceGroupedByDayType),
        };
      })
    );

    const attendanceFinalData = [];
    attendanceSummary.forEach((data) => {
      if (!dayTypeId || dayTypeId == data.dayTypes[0]?.dayTypeId) {
        data.dayTypes.forEach((attendanceData) => {
          attendanceFinalData.push({
            gradeId: data.gradeId,
            gradeName: data.gradeName,
            sectionId: data.sectionId,
            sectionName: data.sectionName,
            userCount: data.totalStudents,
            dayType: attendanceData.dayTypeName,
            dayTypeId: attendanceData.dayTypeId,
            scanCount: attendanceData.scanCount,  // Add scan count
            attendance: attendanceData.attendance,
          });
        });

      }
    });

    return attendanceFinalData;
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    throw error;
  }
};

//----------------------------------CERTIFICATE---------------------------------
module.exports.createAttendanceCerrtificate = async (req, connection) => {
  try {
    // Destructure reqBody
    const { certificateName, tagId, desctiption, startDay, endDay, academicYearId } = req.body;

    let photo = ""
    // Handle photo if uploaded
    if (req.file) {
      const extension = path.extname(req.file.originalname);
      const newFilename = `${req.file.filename}${extension}`;
      const newPath = path.join(req.file.destination, newFilename);
      fs.renameSync(req.file.path, newPath); // Rename the file to include the correct extension
      photo = newFilename;
    }
    // Get models
    const attendanceCertificateModel = connection.model("attendanceCertificate", attendanceCertificate.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    let data = {
      certificate_image: photo,
      certificate_name: certificateName,
      tag: tagId,
      description: desctiption,
      start_day: startDay,
      end_day: endDay,
      academicYearId: academicYearId
    }
    let result = await attendanceCertificateModel.create(data)
    return result
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.updateAttendanceCerrtificate = async (req, connection) => {
  try {
    // Destructure reqBody
    const { certificateName, tagId, desctiption, startDay, endDay, active, academicYearId } = req.body;
    const attendanceCertificateModel = connection.model("attendanceCertificate", attendanceCertificate.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    const existingCertificate = await attendanceCertificateModel.findById(req.params.id);
    if (!existingCertificate) {
      throw new AppError("Certificate not found", 400);
    }

    let photo = existingCertificate.certificate_image;
    // Handle photo if uploaded
    if (req.file) {
      const extension = path.extname(req.file.originalname);
      const newFilename = `${req.file.filename}${extension}`;
      const newPath = path.join(req.file.destination, newFilename);
      fs.renameSync(req.file.path, newPath); // Rename the file to include the correct extension
      photo = newFilename;
    }

    // Get models

    let data = {
      certificate_image: photo,
      certificate_name: certificateName || existingCertificate.certificate_name,
      tag: tagId || existingCertificate.tag,
      description: desctiption || existingCertificate.description,
      start_day: startDay || existingCertificate.start_day,
      end_day: endDay || existingCertificate.end_day,
      active: active || existingCertificate.active,
      academicYearId: academicYearId || existingCertificate.academicYearId
    }

    let result = await attendanceCertificateModel.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    return result
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.getAllAttendanceCertificate = async (query, connection) => {
  try {
    const { page = 1, limit = 10, search, status, academicYearId } = query; // Default pagination settings
    const attendanceCertificateModel = connection.model("attendanceCertificate", attendanceCertificate.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    // Build the search filter
    const filter = {};
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { certificate_name: { $regex: search, $options: 'i' } } // Case-insensitive search
      ];
    }
    if (status) {
      filter.active = status;
    }
    if (academicYearId) {
      filter.academicYearId = academicYearId
    }
    // Using paginate method with the filter
    const attendanceCertificates = await attendanceCertificateModel.paginate(filter, { page, limit })
    // .populate("academicYearId");

    return attendanceCertificates; // Returns paginated and filtered certificates
  } catch (error) {
    console.error('Error fetching attendance certificates:', error);
    throw new Error('There was a problem fetching the attendance certificates.');
  }
};

module.exports.getAttendanceCerrtificate = async (id, connection) => {
  try {
    const attendanceCertificateModel = connection.model("attendanceCertificate", attendanceCertificate.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    // Validate and fetch attendance certificate by ID
    const attendanceCertificate2 = await attendanceCertificateModel.findById(id).populate("academicYearId");

    if (!attendanceCertificate2) {
      throw new Error(`Attendance certificate with ID ${id} not found.`);
    }

    return attendanceCertificate2; // Return the found attendance certificate
  } catch (error) {
    console.error(`Error fetching attendance certificate with ID ${id}:`, error);
    throw new Error('There was a problem fetching the attendance certificate.');
  }
};

module.exports.updateActiveAttendanceCerrtificate = async (body, connection) => {
  const { ids, active } = body;
  try {
    const attendanceCertificateModel = connection.model("attendanceCertificate", attendanceCertificate.schema);

    // Validate and fetch attendance certificate by ID
    const attendanceCertificate2 = await attendanceCertificateModel.updateMany(
      { _id: { $in: ids } },
      { $set: { active: active } },
    );
    if (!attendanceCertificate2) {
      throw new AppError('could not update', 404);
    }
    return attendanceCertificate2;
  } catch (error) {
    console.error(`Error updating attendance certificate with ID ${ids}:`, error);
    throw new Error('There was a problem updating the attendance certificate.');
  }
}

// ----------------------------Users Attendance---------------------------------
module.exports.getUserWiseAttendance = async (id, query, connection) => {
  try {
    const { tagId, dayTypeId, startDate, endDate, academicYearId } = query; // Default pagination settings

    // Ensure all required models are registered in the connection
    connection.model('Tag', tag.schema);
    connection.model('DayType', dayType.schema);
    connection.model('User', User.schema);

    const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Build the search filter
    const filter = { user_id: new ObjectId(id) };

    // Filter by dayTypeId
    if (dayTypeId) {
      filter.day_type = new ObjectId(dayTypeId);
    }

    // Filter by tagId
    if (tagId) {
      filter.tag = new ObjectId(tagId);
    }

    // Filter by date range (dd/mm/yyyy format as string)
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate); // Greater than or equal to startDate
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate); // Less than or equal to endDate
      }
    }
    if (academicYearId) {
      filter.academicYearId = new ObjectId(academicYearId)
    }

    // Fetch attendance records without pagination
    const attendanceRecords = await DayAttendanceModel.find(filter)
      .populate({ path: 'user_id', select: 'firstName lastName photo itsNo' }) // Populate user details
      .populate({ path: 'day_type', select: 'type' }) // Populate day type details
      .populate({ path: 'tag', select: 'tag' }) // Populate tag details
      .populate("academicYearId");

    return attendanceRecords; // Returns filtered records
  } catch (error) {
    console.error('Error fetching attendance records:', error.message);
    throw new Error('There was a problem fetching the attendance records.');
  }
};

module.exports.generateCertificate = async (id, connection) => {
  // Fetch all certificates
  const attendanceCertificateModel = connection.model("attendanceCertificate", attendanceCertificate.schema);
  const DayAttendanceModel = connection.model("DayAttendance", dayAttendance.schema);
  connection.model("AcademicYears", AcademicYears.schema);
  connection.model("tag", tag.schema);
  connection.model("dayType", dayType.schema);
  connection.model("User", User.schema);
  const certificates = await attendanceCertificateModel.find({ active: true }).populate([
    { path: 'tag', select: 'tag' },
    { path: 'academicYearId' } // Populate tag details
  ]);

  const eligibleCertificates = [];

  for (const certificate of certificates) {
    const { tag, start_day, end_day, academicYearId } = certificate;

    // Fetch attendance records for the user with the specified tag
    const attendanceRecords = await DayAttendanceModel.find({
      user_id: id,
      tag: tag,
      academicYearId: academicYearId
    }).sort({ createdAt: 1 }); // Sort by date to check streak

    if (attendanceRecords.length < end_day) {
      continue; // Skip if records are less than required streak
    }

    // Check for streak
    let streak = 0;
    let previousDate = null;
    let streakStartDate = null;

    for (const record of sortedRecords) {
      const currentDate = record.parsedDate;

      if (
        !previousDate ||
        currentDate.diff(previousDate, 'day') === 1 // Difference is 1 day
      ) {
        streak++;
        if (streak === 1) {
          streakStartDate = record.date; // Track the start of the streak
        }

        if (streak === end_day) {
          eligibleCertificates.push({
            certificate,
            dateFrom: streakStartDate,
            dateTo: record.date, // Track the end of the streak
          });
          break;
        }
      } else {
        streak = 1; // Reset streak
        streakStartDate = record.date; // Restart streak start date
      }
      previousDate = currentDate;
    }
  }
  return eligibleCertificates
}

//------------------------------Leave Request---------------------------------
module.exports.createLeaveRequest = async (req, connection) => {
  try {
    // Destructure reqBody
    const {
      requestedBy,
      leaveType,
      eventType,
      startDate,
      endDate,
      earlyLeaveTime,
      lectureId,
      reason,
      academicYearId
    } = req.body;
    // Get models
    const leaveModel = connection.model("leave", leave.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    let checkExists = await leaveModel.findOne({ requested_by: requestedBy, start_date: startDate, end_date: endDate, is_withdrawn: false, is_rejected: false, });
    // Check if leave request already exists
    if (checkExists) {
      return {
        status: "error",
        message: "Leave already exists for given dates",
        data: checkExists,
      }
    }
    let data = {
      requested_by: requestedBy,
      leave_type: leaveType,
      event_type: eventType,
      start_date: startDate,
      end_date: endDate,
      early_leave_time: earlyLeaveTime,
      lecture_id: lectureId,
      reason: reason,
      academicYearId: academicYearId
    }
    let result = await leaveModel.create(data)
    return {
      status: "success",
      message: "Leave created successfully",
      data: result,
    }
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.updateLeaveRequest = async (req, connection) => {
  try {
    // Destructure reqBody
    const {
      requestedBy,
      leaveType,
      eventType,
      startDate,
      endDate,
      earlyLeaveTime,
      lectureId,
      reason,
      academicYearId
    } = req.body;
    const leaveModel = connection.model("leave", leave.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    const existingLeaveRequest = await leaveModel.findById(req.params.id);
    if (!existingLeaveRequest) {
      throw new AppError("Certificate not found", 400);
    }
    let data = {
      requested_by: requestedBy || existingLeaveRequest.requested_by,
      leave_type: leaveType || existingLeaveRequest.leave_type,
      event_type: eventType || existingLeaveRequest.event_type,
      start_date: startDate || existingLeaveRequest.start_date,
      end_date: endDate || existingLeaveRequest.end_date,
      earlyLeaveTime: earlyLeaveTime || existingLeaveRequest.earlyLeaveTime,
      lecture_id: lectureId || existingLeaveRequest.lecture_id,
      reason: reason || existingLeaveRequest.reason,
      academicYearId: academicYearId || existingLeaveRequest.academicYearId
    }
    let result = await leaveModel.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    return result
  } catch (error) {
    console.error("Error creating Manual Day Attendance", error);
    throw error;
  }
};

module.exports.getAllLeaveRequestForAdmin = async (query, connection) => {
  try {
    const { search, status, leaveType, grade, section, startDate, endDate, teacherType, userType, academicYearId } = query;
    const leaveModel = connection.model("leave", leave.schema);
    const UserModel = connection.model("User", User.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    const matchStage = {};
    matchStage["is_withdrawn"] = false;
    if (status == "pending") {
      matchStage["is_approved"] = false;
      matchStage["is_rejected"] = false;
      matchStage["is_withdrawn"] = false;
    }
    const pipeline = []
    if (leaveType) {
      matchStage["leave_type"] = leaveType;
    }
    if (typeof status !== "undefined" && status == 'is_approved') {
      matchStage["is_approved"] = true;
      matchStage["is_withdrawn"] = false;
    }
    if (typeof status !== "undefined" && status == 'is_rejected') {
      matchStage["is_rejected"] = true;
      matchStage["is_withdrawn"] = false;
    }
    if (typeof status !== "undefined" && status == 'is_pending') {
      matchStage["is_rejected"] = false;
      matchStage["is_approved"] = false;
      matchStage["is_withdrawn"] = false;
    }
    if (startDate && endDate) {
      matchStage.$expr = {
        $and: [
          {
            $gte: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      { $substr: ["$start_date", 6, 4] }, // year
                      "-",
                      { $substr: ["$start_date", 3, 2] }, // month
                      "-",
                      { $substr: ["$start_date", 0, 2] }  // day
                    ]
                  }
                }
              },
              new Date(startDate)
            ]
          },
          {
            $lte: [
              {
                $dateFromString: {
                  dateString: {
                    $concat: [
                      { $substr: ["$end_date", 6, 4] }, // year
                      "-",
                      { $substr: ["$end_date", 3, 2] }, // month
                      "-",
                      { $substr: ["$end_date", 0, 2] }  // day
                    ]
                  }
                }
              },
              new Date(endDate)
            ]
          }
        ]
      };
    }
    if (grade) {
      matchStage['userDetails.stageGradeSection.grade._id'] = new ObjectId(grade);
    }
    if (section) {
      matchStage['userDetails.stageGradeSection.section._id'] = new ObjectId(section);
    }
    if (teacherType) {
      matchStage['userDetails.teacherType'] = new ObjectId(teacherType);
    }
    if (userType) {
      matchStage['userDetails.role'] = userType;
    }
    if (academicYearId) {
      matchStage['academicYearId'] = new ObjectId(academicYearId)
    }
    // Populate related fields using $lookup for dayType and tag
    pipeline.push(
      // Get user details
      {
        $lookup: {
          from: "users",
          localField: "requested_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1
              }
            }
          ],
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

      // Get stage-grade-section
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "userDetails.stageGradeSection",
          foreignField: "_id",
          as: "userDetails.stageGradeSection"
        }
      },
      { $unwind: { path: "$userDetails.stageGradeSection", preserveNullAndEmptyArrays: true } },

      // Get grade
      {
        $lookup: {
          from: "grades",
          localField: "userDetails.stageGradeSection.grade",
          foreignField: "_id",
          as: "userDetails.stageGradeSection.grade"
        }
      },
      { $unwind: { path: "$userDetails.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },

      // Get section
      {
        $lookup: {
          from: "sections",
          localField: "userDetails.stageGradeSection.section",
          foreignField: "_id",
          as: "userDetails.stageGradeSection.section"
        }
      },
      { $unwind: { path: "$userDetails.stageGradeSection.section", preserveNullAndEmptyArrays: true } },

      // Get teacher type
      {
        $lookup: {
          from: "teachertypes",
          localField: "userDetails.teacherType",
          foreignField: "_id",
          as: "userDetails.teacherType"
        }
      },
      { $unwind: { path: "$userDetails.teacherType", preserveNullAndEmptyArrays: true } },

      // Get academic year details
      {
        $lookup: {
          from: "AcademicYears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearIdDetails"
        }
      },
      { $unwind: { path: "$academicYearIdDetails", preserveNullAndEmptyArrays: true } },

      // Lookup lecture slotDetails from timetable
      {
        $lookup: {
          from: "timetables",
          let: {
            lectureIds: {
              $map: {
                input: "$lecture_id",
                as: "id",
                in: { $toObjectId: "$$id" }
              }
            }
          },
          pipeline: [
            { $unwind: "$timeTable" },
            { $unwind: "$timeTable.slots" },
            {
              $match: {
                $expr: {
                  $in: ["$timeTable.slots._id", "$$lectureIds"]
                }
              }
            },
            // Lookup subject details
            {
              $lookup: {
                from: "subjects",
                localField: "timeTable.slots.subjectId",
                foreignField: "_id",
                as: "subject"
              }
            },
            {
              $set: {
                "timeTable.slots.subjectId": { $arrayElemAt: ["$subject", 0] }
              }
            },
            // Reshape to return just slot object
            {
              $replaceWith: "$timeTable.slots"
            }
          ],
          as: "slotDetails"
        }
      },

      // Sort results
      { $sort: { createdAt: -1 } }
    );
    // Add search filter for firstName and lastName
    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive regex
      pipeline.push({
        $match: {
          $or: [
            { "userDetails.firstName": { $regex: searchRegex } },
            { "userDetails.lastName": { $regex: searchRegex } }
          ]
        },
      });
    }
    pipeline.push({ $match: matchStage });
    // Fetch data using aggregation pipeline
    const leaveRequests = await leaveModel.aggregate(pipeline);
    // Check if we got any results
    if (leaveRequests && leaveRequests.length > 0) {
      return {
        data: leaveRequests,
        message: "Fetched leave request successfully.",
      };
    } else {
      return {
        data: [],
        message: "No leave request records found.",
      };
    }
  } catch (error) {
    console.error('Error fetching leave request:', error);
    throw new Error('There was a problem fetching the leave request.');
  }
};

module.exports.getLeaveRequestById = async (requestId, connection) => {
  try {
    // Validate input
    if (!requestId) {
      throw new Error("Request ID is required.");
    }
    const leaveModel = connection.model("leave", leave.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    // Validate if the requestId is a valid ObjectId
    if (!ObjectId.isValid(requestId)) {
      throw new Error("Invalid Request ID.");
    }
    // Build aggregation pipeline
    const pipeline = [
      {
        $match: { _id: new ObjectId(requestId) },
      },
      // Populate user details
      {
        $lookup: {
          from: "users",
          localField: "requested_by",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                middleName: 1,
                lastName: 1,
                role: 1,
                photo: 1,
                teacherType: 1,
                itsNo: 1,
                stageGradeSection: 1,
              },
            },
          ],
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      // Lookup stageGradeSection details
      {
        $lookup: {
          from: "stagegradesectiontimes",
          localField: "userDetails.stageGradeSection",
          foreignField: "_id",
          as: "userDetails.stageGradeSection",
        },
      },
      { $unwind: { path: "$userDetails.stageGradeSection", preserveNullAndEmptyArrays: true } },
      // Lookup grade details
      {
        $lookup: {
          from: "grades",
          localField: "userDetails.stageGradeSection.grade",
          foreignField: "_id",
          as: "userDetails.stageGradeSection.grade",
        },
      },
      { $unwind: { path: "$userDetails.stageGradeSection.grade", preserveNullAndEmptyArrays: true } },
      // Lookup section details
      {
        $lookup: {
          from: "sections",
          localField: "userDetails.stageGradeSection.section",
          foreignField: "_id",
          as: "userDetails.stageGradeSection.section",
        },
      },
      { $unwind: { path: "$userDetails.stageGradeSection.section", preserveNullAndEmptyArrays: true } },
      // Lookup teacher type
      {
        $lookup: {
          from: "teachertypes",
          localField: "userDetails.teacherType",
          foreignField: "_id",
          as: "userDetails.teacherType",
        },
      },
      { $unwind: { path: "$userDetails.teacherType", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "AcademicYears",
          localField: "academicYearId",
          foreignField: "_id",
          as: "academicYearId",
        },
      },
      { $unwind: { path: "$academicYearId", preserveNullAndEmptyArrays: true } },
      // Lookup lecture slotDetails from timetable
      {
        $lookup: {
          from: "timetables",
          let: {
            lectureIds: {
              $map: {
                input: "$lecture_id",
                as: "id",
                in: { $toObjectId: "$$id" }
              }
            }
          },
          pipeline: [
            { $unwind: "$timeTable" },
            { $unwind: "$timeTable.slots" },
            {
              $match: {
                $expr: {
                  $in: ["$timeTable.slots._id", "$$lectureIds"]
                }
              }
            },
            // Lookup subject details
            {
              $lookup: {
                from: "subjects",
                localField: "timeTable.slots.subjectId",
                foreignField: "_id",
                as: "subject"
              }
            },
            {
              $set: {
                "timeTable.slots.subjectId": { $arrayElemAt: ["$subject", 0] }
              }
            },
            // Reshape to return just slot object
            {
              $replaceWith: "$timeTable.slots"
            }
          ],
          as: "slotDetails"
        }
      },
    ];
    // Execute the pipeline
    const leaveRequest = await leaveModel.aggregate(pipeline);
    // Check if the leave request exists
    if (!leaveRequest || leaveRequest.length === 0) {
      return {
        data: null,
        message: "No leave request found for the provided Request ID.",
      };
    }
    return {
      data: leaveRequest[0],
      message: "Fetched leave request successfully.",
    };
  } catch (error) {
    console.error("Error fetching leave request by ID:", error);
    throw new Error("There was a problem fetching the leave request by ID.");
  }
};

module.exports.approveOrRejectLeaveRequest = async (req, connection) => {
  try {
    const { approved, rejected, remark } = req.body;
    // Validate input
    if (approved && rejected) {
      throw new Error("Leave request cannot be both approved and rejected.");
    }
    const leaveModel = connection.model("leave", leave.schema);
    // Fetch existing leave request
    const existingLeaveRequest = await leaveModel.findById(req.params.id);
    if (!existingLeaveRequest) {
      throw new Error("Leave request not found");
    }
    // Prepare update data
    const updateData = {};
    if (approved == true) {
      updateData.is_approved = true;
      updateData.is_rejected = false; // Ensure consistency
    }
    if (rejected == true) {
      updateData.is_rejected = true;
      updateData.is_approved = false; // Ensure consistency
    }
    if (remark) {
      updateData.remark = remark;
    }
    // Update the leave request
    const updatedLeaveRequest = await leaveModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    // Return updated leave request
    return {
      message: `Leave request successfully ${approved === true ? "approved" : "rejected"}.`,
      data: updatedLeaveRequest,
    };
  } catch (error) {
    console.error("Error in approveOrRejectLeaveRequest:", error);
    throw new Error("There was a problem processing the leave request.");
  }
};

module.exports.bulkApproveOrRejectLeaveRequest = async (req, connection) => {
  try {
    const { ids, approved, rejected, remark } = req.body;

    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("No leave request IDs provided.");
    }

    if (approved && rejected) {
      throw new Error("Leave request cannot be both approved and rejected.");
    }

    const leaveModel = connection.model("leave", leave.schema);

    const updateData = {
      ...(approved === true && { is_approved: true, is_rejected: false }),
      ...(rejected === true && { is_rejected: true, is_approved: false }),
      ...(remark && { remark }),
    };

    // Bulk update using $in
    const result = await leaveModel.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    return {
      message: `Leave request(s) successfully ${approved === true ? "approved" : "rejected"}.`,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error in bulkApproveOrRejectLeaveRequest:", error);
    throw new Error("There was a problem processing the leave requests.");
  }
};

module.exports.getLeaveRequestUser = async (req, connection) => {
  try {
    const { startDate, endDate, leaveType, status, academicYearId } = req.query;
    const userId = req.params.id;
    const leaveModel = connection.model("leave", leave.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    // Build the query filters
    const queryFilters = { requested_by: userId }; // Filter by user ID

    if (leaveType) queryFilters.leave_type = leaveType;
    if (typeof status !== "undefined" && status == 'is_approved') {
      queryFilters["is_approved"] = true;
    }
    if (typeof status !== "undefined" && status == 'is_rejected') {
      queryFilters["is_rejected"] = true;
    }
    if (typeof status !== "undefined" && status == 'is_withdrawn') {
      queryFilters["is_withdrawn"] = true;
    }
    if (academicYearId) {
      queryFilters['academicYearId'] = academicYearId;
    }

    // Fetch leave requests first
    let leaveRequests = await leaveModel
      .find(queryFilters)
      .populate("academicYearId")
      .sort({ createdAt: -1 });

    // Apply date filtering in JS to avoid MongoDB date parsing issues
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      leaveRequests = leaveRequests.filter((leave) => {
        if (!leave.start_date || !leave.end_date) return false;
        console.log(leave.start_date, "leave.start_date")
        console.log(leave.end_date, "leave.end_date")
        try {
          const [dd1, mm1, yyyy1] = leave.start_date.split("/");
          const leaveStart = new Date(`${yyyy1}-${mm1}-${dd1}`);

          const [dd2, mm2, yyyy2] = leave.end_date.split("/");
          const leaveEnd = new Date(`${yyyy2}-${mm2}-${dd2}`);

          return leaveStart >= start && leaveEnd <= end;
        } catch (e) {
          return false;
        }
      });
    }

    if (!leaveRequests.length) {
      return {
        data: [],
        message: "No leave requests found matching the criteria.",
      };
    }

    return {
      data: leaveRequests,
      message: "Fetched leave requests successfully.",
    };
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    throw new Error("There was a problem fetching leave requests.");
  }
};

module.exports.withDrawLeaveRequest = async (req, connection) => {
  try {
    const { ids } = req.body

    const leaveModel = connection.model("leave", leave.schema);
    const leaveRequest = await leaveModel.updateMany(
      { _id: { $in: ids } }, // Match IDs
      { is_withdrawn: true }    // Update operation
    );
    if (!leaveRequest) throw new Error('Leave request not found.');
    return {
      data: leaveRequest,
      message: 'Leave request withdrawn successfully.'
    }
  } catch (error) {
    console.error('Error withdrawing leave request:', error);
    throw new Error('There was a problem withdrawing the leave request.');
  }
}

//--------------------------------------------
module.exports.markClassAttendance = async (req, connection) => {
  try {
    const { teacherId, assistantTeachers, students, date, startTime, endTime, subjectId, academicYearId, gradeId, sectionId } = req.body;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    let attandenceTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    let teacherTagId;
    if (teacherId) {
      teacherTagId = await assignClassAttendanceTag(connection, attandenceTime, "teacher", "manual", false, startTime, endTime)
    }
    if (assistantTeachers) {
      for (let assT of assistantTeachers) {
        let tag = await assignClassAttendanceTag(connection, attandenceTime, "teacher", "manual", false, startTime, endTime)
        assT.tag = tag;
      }
    }
    if (students) {
      for (let student of students) {
        let tag = await assignClassAttendanceTag(connection, attandenceTime, "student", "manual", false, startTime, endTime)
        student.tag = tag;
      }
    }
    const attendance = new classAttendanceModel({
      teacherId,
      teacherTag: teacherTagId,
      assistantTeachers,
      students,
      date,
      startTime,
      endTime,
      subjectId,
      academicYearId,
      gradeId,
      sectionId
    });
    let data = await attendance.save();
    return data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw new Error('There was a problem in marking attendance.');
  }
}

module.exports.getAllMarkClassAttendance = async (reqQuery, connection) => {
  try {
    const { teacherId, assistantTeachers, students, date, startTime, endTime, subjectId, academicYearId, gradeId, sectionId } = reqQuery;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    connection.model("User", User.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    connection.model("Tag", tag.schema);
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;
    if (assistantTeachers) filter['assistantTeachers.asstTeacherId'] = { $in: assistantTeachers.split(',') };
    if (students) filter['students.studentId'] = { $in: students.split(',') };
    if (date) filter.date = new Date(date);
    if (startTime) filter.startTime = startTime;
    if (endTime) filter.endTime = endTime;
    if (subjectId) filter.subjectId = subjectId;
    if (academicYearId) filter.academicYearId = academicYearId;
    if (gradeId) filter.gradeId = gradeId;
    if (sectionId) filter.sectionId = sectionId;

    const attendanceRecords = await classAttendanceModel.find(filter)
      .populate('teacherId', 'id firstName lastName itsNo photo email')
      .populate('teacherTag', 'id tag')
      .populate('assistantTeachers.asstTeacherId', 'id firstName lastName itsNo photo email')
      .populate('assistantTeachers.tag', 'id tag')
      .populate('students.studentId', 'id firstName lastName itsNo photo email')
      .populate('students.tag', 'id tag')
      .populate('gradeId', 'id grade')
      .populate('subjectId', 'id subject')
      .populate('sectionId', 'id section');

    return attendanceRecords;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw new Error('There was a problem in marking attendance.');
  }
}

module.exports.getMarkClassAttendanceById = async (reqQuery, connection) => {
  try {
    const { id } = reqQuery;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    connection.model("User", User.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);
    connection.model("AcademicYears", AcademicYears.schema);

    const attendanceRecords = await classAttendanceModel.findById(id)
      .populate('teacherId', 'id firstName lastName itsNo photo email')
      .populate('teacherTag', 'id tag')
      .populate('assistantTeachers.asstTeacherId', 'id firstName lastName itsNo photo email')
      .populate('assistantTeachers.tag', 'id tag')
      .populate('students.studentId', 'id firstName lastName itsNo photo email')
      .populate('students.tag', 'id tag')
      .populate('gradeId', 'id grade')
      .populate('subjectId', 'id subject')
      .populate('sectionId', 'id section');

    return attendanceRecords;
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw new Error('There was a problem in marking attendance.');
  }
}

async function getDayLongFromDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

module.exports.getAttendanceWithStatus = async (reqQuery, connection) => {
  try {
    const { teacherId, assistantTeachers, students, academicYearId, gradeId, sectionId, workingDayId, date } = reqQuery;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    const workingDaysModel = connection.model("WorkingDays", WorkingDays.schema);
    const userModel = connection.model("User", User.schema);
    const StageGradeSectionTimeModel = connection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    const TimeTableModel = connection.model("TimeTable", TimeTable.schema);
    connection.model("Grade", Grade.schema);
    connection.model("Section", Section.schema);
    connection.model("Subject", Subject.schema);
    connection.model("AcademicYears", AcademicYears.schema);
    connection.model("Tag", tag.schema);

    let start_date, end_date, weekdays, validDays = new Set();
    const filter = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let day = await getDayLongFromDate(today)
    let matchFilter = {};
    let matchFilter1 = {};
    matchFilter.day = day

    if (workingDayId) {
      const workingDay = await workingDaysModel.findById(workingDayId);
      if (workingDay) {
        start_date = workingDay.start_date;
        end_date = workingDay.end_date;
        weekdays = workingDay.weekdays;
        validDays = new Set(weekdays.map(day => day.day.toLowerCase()));
        filter.date = { $gte: start_date, $lte: end_date };
      }
      matchFilter.workingDaysId = new ObjectId(workingDayId);
    }

    if (teacherId) filter.teacherId = new ObjectId(teacherId);
    if (assistantTeachers) {
      filter['assistantTeachers.asstTeacherId'] = {
        $in: assistantTeachers.split(',').map(id => new ObjectId(id.trim()))
      };
    }
    if (students) {
      filter['students.studentId'] = {
        $in: students.split(',').map(id => new ObjectId(id.trim()))
      };
    }
    if (academicYearId) {
      filter.academicYearId = new ObjectId(academicYearId);
      matchFilter.academicYearId = new ObjectId(academicYearId);
    }
    if (gradeId) {
      filter.gradeId = new ObjectId(gradeId);
      matchFilter1['timeTable.gradeId'] = new ObjectId(gradeId);
    }
    if (sectionId) {
      filter.sectionId = new ObjectId(sectionId);
      matchFilter1['timeTable.sectionId'] = new ObjectId(sectionId);
    }
    // Fetch attendance records
    const attendanceRecords = await classAttendanceModel.find(filter)
      .populate('teacherId', 'id firstName lastName itsNo photo email')
      .populate('teacherTag', 'id tag')
      .populate('assistantTeachers.asstTeacherId', 'id firstName lastName itsNo photo email')
      .populate('assistantTeachers.tag', 'id tag')
      .populate('students.studentId', 'id firstName lastName itsNo photo email')
      .populate('students.tag', 'id tag')
      .populate('gradeId', 'id grade')
      .populate('subjectId', 'id subject')
      .populate('sectionId', 'id section');

    let allDates = [];
    if (date) {
      // Convert date to the required format
      let formattedDate = new Date(date).toISOString().split('T')[0];

      // If workingDayId is also provided, ensure the date falls within range and is a valid weekday
      if (workingDayId) {
        let givenDate = new Date(date);
        let givenWeekday = givenDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        if (givenDate >= new Date(start_date) && givenDate <= new Date(end_date) && validDays.has(givenWeekday)) {
          allDates = [formattedDate];
        }
      } else {
        allDates = [formattedDate];
      }
    } else {
      // Generate all valid dates within the workingDay range
      let currentDate = new Date(start_date);
      const end = new Date(end_date);
      while (currentDate <= end) {
        if (validDays.has(currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())) {
          allDates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // **Fetch timetable data**
    const allGradeSectionSubjects = await TimeTableModel.aggregate([
      { $match: matchFilter }, // Apply filtering based on query params
      { $unwind: "$timeTable" },
      { $match: matchFilter1 },
      { $unwind: "$timeTable.slots" }, // Extract each slot separately
      {
        $match: { "timeTable.slots.subjectId": { $exists: true, $ne: null } } // Ensure subjectId exists and is not null
      },
      {
        $project: {
          gradeId: "$timeTable.gradeId",
          sectionId: "$timeTable.sectionId",
          subjectId: "$timeTable.slots.subjectId",
          startTime: "$timeTable.slots.startTime",
          endTime: "$timeTable.slots.endTime",
          mainTeacherId: "$timeTable.slots.mainTeacherId",
          asstTeacherId1: "$timeTable.slots.asstTeacherId1",
          asstTeacherId2: "$timeTable.slots.asstTeacherId2",
        }
      },
      {
        $lookup: {
          from: "grades",
          localField: "gradeId",
          foreignField: "_id",
          as: "gradeInfo"
        }
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionInfo"
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subjectInfo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "mainTeacherId",
          foreignField: "_id",
          as: "mainTeacher"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "asstTeacherId1",
          foreignField: "_id",
          as: "asstTeacher1"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "asstTeacherId2",
          foreignField: "_id",
          as: "asstTeacher2"
        }
      },
      {
        $project: {
          gradeId: 1,
          sectionId: 1,
          subjectId: 1,
          grade: { $arrayElemAt: ["$gradeInfo.grade", 0] },
          section: { $arrayElemAt: ["$sectionInfo.section", 0] },
          subject: { $arrayElemAt: ["$subjectInfo.subject", 0] },
          startTime: 1,
          endTime: 1,
          mainTeacher: {
            _id: { $arrayElemAt: ["$mainTeacher._id", 0] },
            firstName: { $arrayElemAt: ["$mainTeacher.firstName", 0] },
            lastName: { $arrayElemAt: ["$mainTeacher.lastName", 0] },
            itsNo: { $arrayElemAt: ["$mainTeacher.itsNo", 0] },
            email: { $arrayElemAt: ["$mainTeacher.email", 0] },
            photo: { $arrayElemAt: ["$mainTeacher.photo", 0] }
          },
          asstTeacher1: {
            _id: { $arrayElemAt: ["$asstTeacher1._id", 0] },
            firstName: { $arrayElemAt: ["$asstTeacher1.firstName", 0] },
            lastName: { $arrayElemAt: ["$asstTeacher1.lastName", 0] },
            itsNo: { $arrayElemAt: ["$asstTeacher1.itsNo", 0] },
            email: { $arrayElemAt: ["$asstTeacher1.email", 0] },
            photo: { $arrayElemAt: ["$asstTeacher1.photo", 0] }
          },
          asstTeacher2: {
            _id: { $arrayElemAt: ["$asstTeacher2._id", 0] },
            firstName: { $arrayElemAt: ["$asstTeacher2.firstName", 0] },
            lastName: { $arrayElemAt: ["$asstTeacher2.lastName", 0] },
            itsNo: { $arrayElemAt: ["$asstTeacher2.itsNo", 0] },
            email: { $arrayElemAt: ["$asstTeacher2.email", 0] },
            photo: { $arrayElemAt: ["$asstTeacher2.photo", 0] }
          },
          mainTeacherId: 1,
          asstTeacherId1: 1,
          asstTeacherId2: 1,
        }
      }
    ]);

    const formattedRecords = [];

    for (const date of allDates) {
      for (let tdata of allGradeSectionSubjects) {
        const { gradeId, sectionId, subjectId, grade, section, subject, startTime, endTime, mainTeacher, asstTeacher1, asstTeacher2, mainTeacherId } = tdata
        const recordDate = new Date(date);
        // Get grade-section mapping
        const stageGradeSection = await StageGradeSectionTimeModel.findOne({
          grade: new ObjectId(gradeId),
          section: new ObjectId(sectionId)
        });

        // Get total number of students in this grade-section
        const totalStrength = await userModel.countDocuments({
          role: "student",
          stageGradeSection: stageGradeSection?._id
        });

        // **Determine present & absent count**
        let presentCount = 0;
        let absentCount = totalStrength;
        // **Fetch Attendance Record for this Date, Grade, Section, and Subject**
        const records = attendanceRecords.filter(
          record =>
            record.date.toISOString().split('T')[0] === date &&
            record.gradeId._id.toString() === gradeId.toString() &&
            record.sectionId._id.toString() === sectionId.toString() &&
            record.subjectId._id.toString() === subjectId.toString() &&
            record.startTime === startTime &&
            record.endTime === endTime
        );

        if (records.length > 0) {
          presentCount = records.reduce((count, record) => count + record.students.length, 0);
          absentCount = totalStrength - presentCount;
        }

        // **Determine attendance status**
        let status;
        if (records.length > 0) {
          status = "submitted";
        } else if (recordDate < today) {
          status = "missed";
        } else {
          status = "yet to submit";
        }
        if (!teacherId || teacherId.toString() === mainTeacherId.toString()) {
          // **Push formatted record**
          formattedRecords.push({
            _id: records.length > 0 ? records[0]._id : null,
            date,
            grade,
            section,
            subject,
            totalStrength,
            presentCount,
            absentCount,
            status,
            startTime,
            endTime,
            subjectId: records.length > 0 ? records[0].subjectId?._id : subjectId,
            gradeId: records.length > 0 ? records[0].gradeId?._id : gradeId,
            sectionId: records.length > 0 ? records[0].sectionId?._id : sectionId,
            students: records.length > 0 ? records[0].students : [],
            teacher: records.length > 0 ? records[0].teacherId : mainTeacher, // Fallback to timetable teacher
            teacherTag: records.length > 0 ? records[0].teacherTag : '',
            assistantTeachers: records.length > 0 && records[0].assistantTeachers.length > 0 ? records[0].assistantTeachers : [...asstTeacher1, ...asstTeacher2],
          });
        }

      }
    }
    // After formattedRecords array is fully created
    const page = parseInt(reqQuery.page) || 1;
    const limit = parseInt(reqQuery.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedRecords = formattedRecords.slice(startIndex, endIndex);

    return {
      currentPage: page,
      totalPages: Math.ceil(formattedRecords.length / limit),
      totalRecords: formattedRecords.length,
      limit,
      data: paginatedRecords
    };
    // return formattedRecords;
  } catch (error) {
    console.error('Error fetching attendance with status:', error);
    throw new Error('There was a problem retrieving attendance records.');
  }
};

module.exports.updateClassAttendance = async (req, connection) => {
  try {
    const { teacherId, assistantTeachers, students } = req.body;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);

    let attendanceTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Fetch existing attendance record
    let attendanceRecord = await classAttendanceModel.findById(req.params.id);

    if (!attendanceRecord) {
      throw new Error("Attendance record not found.");
    }

    let isUpdated = false;

    // **Check and update teacherId only if it's different**
    if (teacherId && (!attendanceRecord.teacherId || attendanceRecord.teacherId.toString() !== teacherId.toString())) {
      let teacherTagId = await assignClassAttendanceTag(connection, attendanceTime, "teacher", "App", false, attendanceRecord.startTime, attendanceRecord.endTime);
      attendanceRecord.teacherId = teacherId;
      attendanceRecord.teacherTag = teacherTagId;
      isUpdated = true;
    }

    // **Check and update assistant teachers only if they are not already in the record**
    if (assistantTeachers && assistantTeachers.length > 0) {
      for (let assT of assistantTeachers) {
        const exists = attendanceRecord.assistantTeachers.some(
          existing => existing.asstTeacherId.toString() === assT.asstTeacherId.toString()
        );
        if (!exists) {
          let tag = await assignClassAttendanceTag(connection, attendanceTime, "teacher", "App", false, attendanceRecord.startTime, attendanceRecord.endTime);
          assT.tag = tag;
          attendanceRecord.assistantTeachers.push(assT);
          isUpdated = true;
        }
      }
    }

    // **Check and add students only if they are not already in the record**
    if (students && students.length > 0) {
      for (let student of students) {
        const exists = attendanceRecord.students.some(
          existing => existing.studentId.toString() === student.studentId.toString()
        );
        if (!exists) {
          let tag = await assignClassAttendanceTag(connection, attendanceTime, "student", "App", false, attendanceRecord.startTime, attendanceRecord.endTime);
          student.tag = tag;
          attendanceRecord.students.push(student);
          isUpdated = true;
        }
      }
    }

    if (!isUpdated) {
      return { message: "No changes made. Attendance is already up-to-date." };
    }

    // **Save the updated record only if changes were made**
    let updatedData = await attendanceRecord.save();
    return updatedData;
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw new Error('There was a problem updating attendance.');
  }
};

module.exports.getAllMarkClassAttendanceForStudent = async (req, connection) => {
  try {
    const { studentId } = req.params;
    const { date, startTime, endTime, subjectId, academicYearId, gradeId, sectionId, workingDayId } = req.query;
    const classAttendanceModel = connection.model("classAttendance", classAttendance.schema);
    const workingDaysModel = connection.model("WorkingDays", WorkingDays.schema);
    connection.model("Subject", Subject.schema);
    connection.model("Tag", tag.schema);

    const filter = {};
    filter['students.studentId'] = new ObjectId(studentId);

    if (date) filter.date = new Date(date);
    if (startTime) filter.startTime = startTime;
    if (endTime) filter.endTime = endTime;
    if (subjectId) filter.subjectId = subjectId;
    if (academicYearId) filter.academicYearId = academicYearId;
    if (gradeId) filter.gradeId = gradeId;
    if (sectionId) filter.sectionId = sectionId;

    if (workingDayId) {
      const workingDay = await workingDaysModel.findById(workingDayId);
      if (workingDay) {
        const { start_date, end_date, weekdays } = workingDay;
        const validDays = new Set(weekdays.map(day => day.day.toLowerCase()));
        filter.date = { $gte: start_date, $lte: end_date };
      }
    }

    let attendanceRecords = await classAttendanceModel.find(filter)
      .populate('students.tag', 'id tag')
      .populate('subjectId', 'id subject')
      .lean(); // Convert to plain objects for easy manipulation

    // Filter out only the matching student's data in the students array
    attendanceRecords = attendanceRecords.map(record => ({
      ...record,
      students: record.students.filter(student => student.studentId._id.toString() === studentId),
    }));

    return attendanceRecords;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    throw new Error('There was a problem retrieving attendance records.');
  }
};
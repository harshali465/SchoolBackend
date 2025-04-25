const StageGradeSectionTime = require("../../models/stageGradeSectionTime.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");
const {
  findOrCreateStageGradeSection,
} = require("../../services/stageGradeSectionService");
const Stage = require("../../models/stage.model");
const Grade = require("../../models/grade.model");
const Section = require("../../models/section.model");
const mongoose = require('mongoose');
const User = require("../../models/user.model");
const ObjectId = mongoose.Types.ObjectId;
const { BehaviorPointCategory, BehaviorPointAssignPoint } = require('../../models/behaviourPoint.model');
const { leave } = require('../../models/attendance.model');

// Add new Stage, Grade, Section, and Time
module.exports.createStageGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    const { stage, grade, section, time, classTeachers } = req.body;

    // Connect to the specific school's database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    // Handle finding or creating stage, grade, section, and time
    await findOrCreateStageGradeSection(
      stage,
      grade,
      section,
      time.start_time,
      time.end_time,
      classTeachers,
      schoolConnection
    );

    res
      .status(201)
      .json({ message: "Stage, Grade, Section, and Time added successfully!" });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

// Update StageGradeSectionTime by ID
module.exports.updateStageGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    const { time } = req.body.data;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const StageGradeSectionTimemodel = await schoolConnection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );
    let updatedRecord = await StageGradeSectionTimemodel.findByIdAndUpdate(
      id,
      {
        start_time: time.start_time,
        end_time: time.end_time,
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(updatedRecord);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

// Get all StageGradeSectionTimes
module.exports.getAllStageGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Define the model
    const StageGradeSectionTimeModel = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    // Normalize query parameters
    const {
      search = null,
      sortBy = "stage",
      sortDirection = "asc",
      page = 1,
      limit = 25,
      stageId = null,
      gradeId = null,
      sectionId = null,
    } = Object.fromEntries(
      Object.entries(req.query).map(([key, value]) => [key, value || null])
    );

    // Use normalized parameters in your logic
    const sortOptions = {};
    sortOptions[sortBy === "stage" ? "stage.stage" : sortBy] = sortDirection === "asc" ? 1 : -1;

    const paginationLimit = limit === "All" ? 0 : parseInt(limit);
    const paginationSkip = (parseInt(page) - 1) * paginationLimit;

    // Construct the aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "stages",
          localField: "stage",
          foreignField: "_id",
          as: "stage",
        },
      },
      {
        $lookup: {
          from: "grades",
          localField: "grade",
          foreignField: "_id",
          as: "grade",
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "section",
          foreignField: "_id",
          as: "section",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "class_teachers",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, firstName: 1, lastName: 1, email: 1, photo: 1, itsNo: 1, role: 1 } }
          ],
          as: "class_teachers",
        },
      },
      // Only unwind after lookup to flatten arrays
      { $unwind: { path: "$stage", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$grade", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$class_teachers", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          stage_id: "$stage._id",
          stage_name: "$stage.stage",
          grade_id: "$grade._id",
          grade_name: "$grade.grade",
          section_id: "$section._id",
          section_name: "$section.section",
          start_time: "$start_time",
          end_time: "$end_time",
          class_teachers: "$class_teachers",
          status: 1
        },
      },
    ];

    const matchConditions = [];
    if (search) {
      matchConditions.push(
        { "stage_name": { $regex: search, $options: "i" } },
        { "grade_name": { $regex: search, $options: "i" } },
        { "section_name": { $regex: search, $options: "i" } }
      );
    }
    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $or: matchConditions } });
    }
    // Add additional filters
    const additionalFilters = {};
    if (stageId) additionalFilters["stage_id"] = new ObjectId(stageId);
    if (gradeId) additionalFilters["grade_id"] = new ObjectId(gradeId);
    if (sectionId) additionalFilters["section_id"] = new ObjectId(sectionId);

    if (Object.keys(additionalFilters).length > 0) {
      pipeline.push({ $match: additionalFilters });
    }

    // Group the data into the required format
    pipeline.push(
      {
        $group: {
          _id: "$_id",
          stage_id: { $first: "$stage_id" },
          stage_name: { $first: "$stage_name" },
          grade_id: { $first: "$grade_id" },
          grade_name: { $first: "$grade_name" },
          section_id: { $first: "$section_id" },
          section_name: { $first: "$section_name" },
          start_time: { $first: "$start_time" },
          end_time: { $first: "$end_time" },
          class_teachers: {
            $push: {
              _id: "$class_teachers._id",
              firstName: "$class_teachers.firstName",
              lastName: "$class_teachers.lastName",
              photo: "$class_teachers.photo",
              role: "$class_teachers.role",
              itsNo: "$class_teachers.itsNo",
              email: "$class_teachers.email",
            },
          },
          status: { $first: "$status" }
        },
      },
      {
        $sort: {
          section_name: sortDirection === "asc" ? 1 : -1, // Sort sections by name
        },
      },
      {
        $group: {
          _id: null,
          stages: {
            $push: {
              _id: "$_id",
              stage_id: "$stage_id",
              stage_name: "$stage_name",
              grades: {
                grade_id: "$grade_id",
                grade_name: "$grade_name",
                sections: {
                  section_id: "$section_id",
                  section_name: "$section_name",
                  start_time: "$start_time",
                  end_time: "$end_time",
                },
              },
              class_teachers: "$class_teachers",
              status: "$status"
            },
          },
        },
      }
    );
    // Count total records
    const countPipeline = [...pipeline, { $count: "totalCount" }];
    const countResult = await StageGradeSectionTimeModel.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

    // Add pagination
    pipeline.push({ $sort: sortOptions });
    pipeline.push({ $skip: paginationSkip });
    pipeline.push({ $limit: paginationLimit });

    // Execute the pipeline
    const records = await StageGradeSectionTimeModel.aggregate(pipeline);

    // Send response
    res.status(200).json({
      totalCount,
      data: records.length > 0 ? records[0].stages : [],
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

// Get a StageGradeSectionTime by ID
module.exports.getStageGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    const { id } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    schoolConnection.model("Stage", Stage.schema);
    schoolConnection.model("Grade", Grade.schema);
    schoolConnection.model("Section", Section.schema);
    schoolConnection.model("User", User.schema);
    const StageGradeSectionTimemodel = await schoolConnection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );
    const record = await StageGradeSectionTimemodel.findById(id)
      .populate("stage")
      .populate("grade")
      .populate("section")
      .populate("class_teachers", "firstName lastName itsNo photo email");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

module.exports.deleteStageGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const StageGradeSectionTimemodel = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    const UserModel = schoolConnection.model("User", User.schema);
    const { ids } = req.body;
    const associatedIds = []; // Stores IDs referenced in User model
    const deletableIds = []; // Stores IDs that can be deleted

    for (let id of ids) {
      const isReferenced = await UserModel.findOne({ stageGradeSection: id }, { stageGradeSection: 1 });

      if (isReferenced) {
        associatedIds.push(id); // If referenced, add to associatedIds
      } else {
        deletableIds.push(id); // Otherwise, add to deletableIds
      }
    }

    // Delete only unreferenced records
    const deleteResult = await StageGradeSectionTimemodel.deleteMany({ _id: { $in: deletableIds } });
    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} record(s) deleted successfully.`,
      data: {
        deletedIds: deletableIds,
        associatedIds, // Return the IDs that were not deleted due to references
      }
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

module.exports.updateActiveStageGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    const { ids, active } = req.body; // Extracting from req.body
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const StageGradeSectionTimeModel = schoolConnection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );

    const updatedResult = await StageGradeSectionTimeModel.updateMany(
      { _id: { $in: ids } },
      { $set: { status: active } }
    );

    if (updatedResult.modifiedCount === 0) {
      return res.status(404).json({ message: "Could not update the status" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      result: updatedResult,
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

module.exports.getAllStages = async (req, res, next) => {
  let schoolConnection;
  try {
    // Connect to the school database if necessary
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)

    // Fetch all stages from the database
    const stages = await schoolConnection.model("Stage", Stage.schema).find({});

    // Check if any stages were found
    if (!stages.length) {
      return res.status(404).json({ message: "No stages found." });
    }

    // Return the found stages
    res.status(200).json({
      totalCount: stages.length,
      records: stages, // Return all stage details
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

module.exports.getGradesByStageId = async (req, res, next) => {
  let schoolConnection;
  try {
    const { stageId } = req.params;

    // Connect to the school database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const StageGradeSectionTimeModel = schoolConnection.model("StageGradeSectionTime", StageGradeSectionTime.schema);
    schoolConnection.model("User", User.schema);
    schoolConnection.model("Section", Section.schema);
    let grades;
    if (stageId === "all") {
      // Fetch distinct grade IDs without filtering by stage
      grades = await StageGradeSectionTimeModel.distinct("grade");
    } else {
      // Fetch data with populated references
      grades = await StageGradeSectionTimeModel.find({ stage: stageId })
        .select("grade section class_teachers") // Select required fields
        .populate("class_teachers", "_id firstName lastName itsNo email photo") // Populate class_teachers
        .populate("section", "_id section"); // Populate sections
    }

    // Extract unique grade IDs
    const gradeIds = [...new Set(grades.map((g) => g.grade.toString()))];

    // Fetch grade names from the Grade model
    const gradeDetails = await schoolConnection
      .model("Grade", Grade.schema)
      .find({ _id: { $in: gradeIds } })
      .select("_id grade");

    // Map grades to sections and class teachers
    const gradeMap = {};

    grades.forEach((item) => {
      const gradeId = item.grade.toString();
      const sectionId = item.section?._id.toString();
      const classTeacher = item.class_teachers?.[0] || null; // Only one class teacher per section

      if (!gradeMap[gradeId]) {
        gradeMap[gradeId] = {
          _id: gradeId,
          grade: null,
          sections: []
        };
      }

      // Ensure unique sections with their class teacher
      if (!gradeMap[gradeId].sections.some(sec => sec._id === sectionId)) {
        gradeMap[gradeId].sections.push({
          _id: sectionId,
          section: item.section?.section || "",
          class_teacher: classTeacher,
        });
      }
    });

    // Merge grade names
    const finalRecords = gradeDetails.map((grade) => ({
      _id: grade._id,
      grade: grade.grade,
      sections: gradeMap[grade._id.toString()]?.sections || [],
    }));

    console.log(finalRecords);
    
    // Check if any grades were found
    if (!finalRecords.length) {
      return res
        .status(404)
        .json({ message: "No grades found for this stage ID." });
    }

    // Return the found grades
    res.status(200).json({
      totalCount: finalRecords.length,
      records: finalRecords, // Return the grade details with class_teachers
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

module.exports.getSectionsByStageAndGradeId = async (req, res, next) => {
  let schoolConnection;
  try {
    const { stageId, gradeId } = req.params; // Get stage ID and grade ID from request parameters
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const StageGradeSectionTimeModel = schoolConnection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );
    schoolConnection.model("Section", Section.schema);

    // Build the query based on stageId and gradeId values
    const query = {};
    if (stageId !== "all") {
      query.stage = stageId;
    }
    if (gradeId !== "all") {
      query.grade = gradeId;
    }

    // Fetch sections based on the dynamic query
    const sections = await StageGradeSectionTimeModel.find(query)
      .populate("section", "section") // Populate section field to get the section name
      .select("section -_id class_teachers") // Select only the section field and exclude default _id
      .sort({ createdAt: -1 });

    // Check if any sections were found
    if (!sections.length) {
      return res
        .status(404)
        .json({ message: "No sections found for this stage and grade." });
    }

    // Return the found sections
    res.status(200).json({
      totalCount: sections.length,
      records: sections.map((item) => item.section), // Return only the section names
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

module.exports.getGrade = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const GradeModel = schoolConnection.model("Grade", Grade.schema);

    // Fetch grade details based on the given gradeId
    const grade = await GradeModel.find();

    // Check if any grade was found
    if (!grade) {
      return res.status(404).json({ message: "Grade not found." });
    }
    // Return the found grade
    res.status(200).json(grade);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
}

module.exports.getSectionsByGradeId = async (req, res, next) => {
  let schoolConnection;
  try {
    const { gradeId } = req.params; // Get stage ID and grade ID from request parameters
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const StageGradeSectionTimeModel = schoolConnection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );
    schoolConnection.model("Section", Section.schema);

    // Build the query based on stageId and gradeId values
    const query = {};
    if (gradeId !== "all") {
      query.grade = gradeId;
    }

    // Fetch sections based on the dynamic query
    const sections = await StageGradeSectionTimeModel.find(query)
      .populate("section", "section") // Populate section field to get the section name
      .select("section -_id"); // Select only the section field and exclude default _id

    if (!sections.length) {
      return res
        .status(404)
        .json({ message: "No sections found for this stage and grade." });
    }

    // Return the found sections
    res.status(200).json({
      totalCount: sections.length,
      records: sections.map((item) => item.section), // Return only the section names
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
}

module.exports.getStudentByGradeSection = async (req, res, next) => {
  let schoolConnection;
  try {
    const { gradeId, sectionId } = req.query;

    // Connect to school database
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    // Models
    const StageGradeSectionTimeModel = schoolConnection.model('StageGradeSectionTime', StageGradeSectionTime.schema);
    const UserModel = schoolConnection.model('User', User.schema);
    const BehaviorPointAssignPointModel = schoolConnection.model('BehaviorPointAssignPoint', BehaviorPointAssignPoint.schema);
    const BehaviorPointCategoryModel = schoolConnection.model('BehaviorPointCategory', BehaviorPointCategory.schema);
    const leaveModel = schoolConnection.model("leave", leave.schema);
    schoolConnection.model("Stage", Stage.schema);
    schoolConnection.model("Grade", Grade.schema);
    schoolConnection.model("Section", Section.schema);
    // Filter for grade and section
    const filter = {};
    if (gradeId) filter.grade = gradeId;
    if (sectionId) filter.section = sectionId;

    // Fetch stage-grade-section entries
    const stageGradeSectionEntries = await StageGradeSectionTimeModel.find(filter)
      .populate("stage")
      .populate("grade")
      .populate("section")
      .lean();

    if (!stageGradeSectionEntries.length) {
      return res.status(404).json({ message: 'No matching grade or section found.' });
    }

    const stageGradeSectionIds = stageGradeSectionEntries.map(entry => entry._id);

    // Fetch students with their associated stage-grade-section
    const students = await UserModel.find(
      {
        role: 'student',
        stageGradeSection: { $in: stageGradeSectionIds },
      })
      .populate({
        path: "stageGradeSection",
        select: "grade section",
        populate: [
          { path: "grade", select: "grade" },
          { path: "section", select: "section" },
        ],
      })
      .select('-loginStats')
      .lean();

    // Add behavior points and remark counts for each student
    for (const student of students) {
      let remarkCount = 0;
      let pointsCount = 0;

      // Fetch assigned behavior points for the student
      const assignedPoints = await BehaviorPointAssignPointModel.find({ assigned_to: student._id }).lean();

      // Process behavior points
      for (const assigned of assignedPoints) {
        const categoryPoint = await BehaviorPointCategoryModel.findOne({ _id: assigned.category_id }).lean();
        if (categoryPoint) {
          if (categoryPoint.point_type == 'Negative') {
            remarkCount += 1;
          } else {
            pointsCount += categoryPoint.point;
          }
        }

      }

      // Add computed fields to the student object
      student.remarkCount = remarkCount;
      student.pointsCount = pointsCount;

      // Get current date as a timestamp (milliseconds)
      let current = new Date().getTime();

      // Fetch leave requests where the current date is between start_date and end_date
      const leaveRequests = await leaveModel.find({
        requested_by: student._id,
        is_approved: true
      }).lean();
      if (leaveRequests.length > 0) {
        // Filter leave requests manually since start_date and end_date are strings
        student.leaveRequests = leaveRequests.filter(leave => {
          let startDate = new Date(leave.start_date).getTime(); // Convert string to Date timestamp
          let endDate = new Date(leave.end_date).getTime(); // Convert string to Date timestamp

          return startDate <= current && endDate >= current;
        });
      } else {
        student.leaveRequests = []
      }
    }

    res.status(200).json({
      status: true,
      data: students,
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

module.exports.updateTeacherToSections = async (req, res, next) => {
  let schoolConnection;
  try {
    // const { data } = req.body;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const StageGradeSectionTimemodel = await schoolConnection.model(
      "StageGradeSectionTime",
      StageGradeSectionTime.schema
    );
    for (let item of req.body){
      let updatedRecord = await StageGradeSectionTimemodel.findByIdAndUpdate(
        item.id,
        {
          class_teachers : [new ObjectId(item.teacherId)]
        },
        { new: true }
      );
    }
    res.status(200).json({status : "success" , message : "class teacher(s) updated successfully"});
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
}
const TeacherType = require("../../models/teacherType.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");

// Create a new Teacher Type
exports.createTeacherType = async (req, res, next) => {
  let schoolConnection;
  try {
    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ error: "Type is required." });
    }

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const TeacherTypeModel = schoolConnection.model("TeacherType", TeacherType.schema);

    // Check if the type already exists
    const existingType = await TeacherTypeModel.findOne({ type: type.trim() });
    if (existingType) {
      throw new Error('Type already exists.')
      // return res.status(200).json({ success: false, message: "Type already exists." });
    }

    // Create the new type
    const newTeacherType = await TeacherTypeModel.create({ type: type.trim() });
    res.status(201).json({ success: true, data: newTeacherType });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      schoolConnection.close();
    }
  }
};

// Get all Teacher Types for a specific school
exports.getAllTeacherTypes = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TeacherTypeModel = await schoolConnection.model("TeacherType", TeacherType.schema);
    let { search } = req.query
    // Add search filter
    let searchQuery = {}; // Temporary object for search criteria
    if (search) {
      let typeRegex = new RegExp(`.*${search}.*`, "i");
      searchQuery = { type: typeRegex }
    }
    const teacherTypes = await TeacherTypeModel.find(searchQuery);

    if (!teacherTypes) {
      return res.status(404).json({ error: "No teacher types found for this school." });
    }

    res.status(200).json({ success: true, data: teacherTypes });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Get a single Teacher Type by ID
exports.getTeacherTypeById = async (req, res, next) => {
  let schoolConnection;
  try {
    const { typeId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TeacherTypeModel = await schoolConnection.model(
      "TeacherType",
      TeacherType.schema
    );
    const teacherType = await TeacherTypeModel.findById(typeId);

    if (!teacherType) {
      return res.status(404).json({ error: "Teacher Type not found." });
    }

    res.status(200).json({ success: true, data: teacherType });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Update a Teacher Type by ID
exports.updateTeacherType = async (req, res, next) => {
  let schoolConnection;
  try {
    const { typeId } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Type is required." });
    }

    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const TeacherTypeModel = schoolConnection.model("TeacherType", TeacherType.schema);

    // Check if a type with the same name exists (excluding the current typeId)
    const existingType = await TeacherTypeModel.findOne({ type: type.trim(), _id: { $ne: typeId } });
    if (existingType) {
      return res.status(200).json({ success: false, message: "Type already exists." });
    }

    // Update the teacher type
    const updatedTeacherType = await TeacherTypeModel.findByIdAndUpdate(
      typeId,
      { type: type.trim() },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTeacherType) {
      return res.status(404).json({ error: "Teacher Type not found." });
    }

    res.status(200).json({ success: true, data: updatedTeacherType });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Delete a Teacher Type by ID
exports.deleteTeacherType = async (req, res, next) => {
  let schoolConnection;
  try {
    const { ids } = req.body;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TeacherTypeModel = await schoolConnection.model("TeacherType", TeacherType.schema);
    const deletedTeacherType = await TeacherTypeModel.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ success: true, data: deletedTeacherType });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
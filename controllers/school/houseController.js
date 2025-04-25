const House = require("../../models/house.model");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");
// Create a new Teacher Type
exports.createHouse = async (req, res, next) => {
  let schoolConnection;
  try {
    const { title, description } = req.body;
    if (!title) {
      return res
        .status(400)
        .json({ error: "Title is required." });
    }
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const HouseModel = await schoolConnection.model("House", House.schema);
    const newHouse = await HouseModel.create({ title, description });
    res.status(201).json({ success: true, data: newHouse });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

exports.getAllHouse = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const HouseModel = await schoolConnection.model("House", House.schema);
    const house = await HouseModel.find({});

    if (!house) {
      return res
        .status(404)
        .json({ error: "No teacher types found for this school." });
    }

    res.status(200).json({ success: true, data: house });
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
exports.getHouseById = async (req, res, next) => {
  let schoolConnection;
  try {
    const { houseId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const HouseModel = await schoolConnection.model("House", House.schema);
    const house = await HouseModel.findById(houseId);
    if (!house) {
      return res.status(404).json({ error: "Teacher Type not found." });
    }
    res.status(200).json({ success: true, data: house });
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
exports.updateHouse = async (req, res, next) => {
  let schoolConnection;
  try {
    const { houseId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const HouseModel = await schoolConnection.model("House", House.schema);
    const updatedHouse = await HouseModel.findByIdAndUpdate(houseId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedHouse) {
      return res.status(404).json({ error: "Teacher Type not found." });
    }
    res.status(200).json({ success: true, data: updatedHouse });
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
exports.deleteHouse = async (req, res, next) => {
  let schoolConnection;
  try {
    const { houseId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const HouseModel = await schoolConnection.model("House", House.schema);
    const deletedHouse = await HouseModel.findByIdAndDelete(houseId);

    if (!deletedHouse) {
      return res.status(404).json({ error: "Teacher Type not found." });
    }

    res.status(200).json({ success: true, data: deletedHouse });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
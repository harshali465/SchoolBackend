const Allergy = require('../../models/allergies.model');
const {connectToSchoolDB, waitForConnection} = require('../../utils/connectSchoolDb')
// Create a new Teacher Type
exports.createAllergy = async (req, res, next) => {
  let schoolConnection;
  try {
    const { title,description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    const AllergyModel = await schoolConnection.model('Allergy', Allergy.schema)
    const newAllergy = await AllergyModel.create({ title, description });
    res.status(201).json({ success: true, data: newAllergy });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally{
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Get all Teacher Types for a specific school
exports.getAllAllergies = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    const AllergyModel = await schoolConnection.model('Allergy', Allergy.schema)
    const allergies = await AllergyModel.find({});

    if (!allergies) {
      return res.status(404).json({ error: 'No teacher types found for this school.' });
    }

    res.status(200).json({ success: true, data: allergies });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally{
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Get a single Teacher Type by ID
exports.getAllergyById = async (req, res, next) => {
  let schoolConnection;
  try {
    const { allergyId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    const allergyModel = await schoolConnection.model('Allergy', Allergy.schema)
    const allergy = await allergyModel.findById(allergyId);

    if (!allergy) {
      return res.status(404).json({ error: 'Teacher Type not found.' });
    }

    res.status(200).json({ success: true, data: allergy });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally{
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Update a Teacher Type by ID
exports.updateAllergy = async (req, res, next) => {
  let schoolConnection;
  try {
    const { allergyId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    const AllergyModel = await schoolConnection.model('Allergy', Allergy.schema)
    const updatedAllergy = await AllergyModel.findByIdAndUpdate(allergyId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedAllergy) {
      return res.status(404).json({ error: 'Teacher Type not found.' });
    }

    res.status(200).json({ success: true, data: updatedAllergy });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally{
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Delete a Teacher Type by ID
exports.deleteAllergy = async (req, res, next) => {
  let schoolConnection;
  try {
    const { allergyId } = req.params;
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    const AllergyModel = await schoolConnection.model('Allergy', Allergy.schema)
    const deletedAllergy = await AllergyModel.findByIdAndDelete(allergyId);
    if (!deletedAllergy) {
      return res.status(404).json({ error: 'Teacher Type not found.' });
    }
    res.status(200).json({ success: true, data: deletedAllergy });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally{
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
const aadatService = require("../../services/aadat");
const { convertToMidnight } = require("../../utils/midnightConverter");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");

module.exports.createAadat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatService.createAadat(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "Aadat Successfully Added",
      data: aadatData,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAadat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatService.getAadat(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: aadatData,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllAadat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatService.getAllAadat(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: aadatData,
      query: req.query,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateActive = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    let msg = req.body.active ? "activated" : "Deactivated"
    const result = await aadatService.updateActive(req.body, schoolConnection);
    res.status(201).json({
      message: `Aadat ${msg} successfully`,
      status: "success",
      result,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Do NOT update passwords with this!
module.exports.updateAadat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatService.updateAadat(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: aadatData,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteAadat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    await aadatService.deleteAadat(req.body, schoolConnection);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllDailyAadat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatService.getAllDailyAadat(
      req.query,
      schoolConnection
    );
    const { currentTime } = req.query;
    const midnightOfgivenTime = convertToMidnight(currentTime);
    res.status(200).json({
      status: "success",
      data: aadatData,
      query: req.query,
      midnightOfgivenTime: midnightOfgivenTime,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateOrderValues = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await aadatService.updateOrderValues(req.body, schoolConnection);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error(error);
    next(error)
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
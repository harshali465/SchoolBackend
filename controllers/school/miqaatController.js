const miqaatService = require("../../services/miqaat");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");

module.exports.createMiqaat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const miqaatData = await miqaatService.createMiqaat(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "Miqaat Successfully Added",
      data: miqaatData,
    });
  } catch (error) {
    console.error(error);
    next(error);
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
    const result = await miqaatService.updateActive(req.body, schoolConnection);
    let msg = req.body.active ? "activated" : "Deactivated"
    res.status(201).json({
      message : `Miqaat ${msg} successfully`,
      status: "success",
      result,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getMiqaat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const miqaatData = await miqaatService.getMiqaat(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: miqaatData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Controller function
module.exports.getAllMiqaat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const miqaatData = await miqaatService.getAllMiqaat(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: miqaatData,
      query: req.query,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getCurrentMiqaat = async (req, res, next) => {
  let schoolConnection;

  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const miqaatData = await miqaatService.getCurrentMiqaats(req.query,schoolConnection);

    res.status(200).json({
      status: "success",
      data: miqaatData,
      query: req.query,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Do NOT update passwords with this!
module.exports.updateMiqaat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const miqaatData = await miqaatService.updateMiqaat(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "Miqaat Successfully updated",
      data: miqaatData,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteMiqaat = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    await miqaatService.deleteMiqaat(req.body, schoolConnection);
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
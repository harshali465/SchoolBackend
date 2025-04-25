const categoryService = require("../../services/category");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");

module.exports.createCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const categoryData = await categoryService.createCategory(
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: categoryData,
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

module.exports.getCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const categoryData = await categoryService.getCategory(
      req.params.id,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: categoryData,
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

module.exports.getAllCategories = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const categoryData = await categoryService.getAllCategories(
      req.query,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: categoryData,
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

//Update Active or Inactive
module.exports.updateActive = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await categoryService.updateActive(
      req.body,
      schoolConnection
    );
    res.status(201).json({
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

// Do NOT update passwords with this!
module.exports.updateCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const categoryData = await categoryService.updateCategory(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: "success",
      data: categoryData,
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

module.exports.deleteCategory = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await categoryService.deleteCategory(req.body, schoolConnection);
    res.status(200).json({
      status: true,
      data: result,
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

module.exports.updateOrderValues = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const result = await categoryService.updateOrderValues(req.body, schoolConnection);
    res.status(200).json({
      status: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}
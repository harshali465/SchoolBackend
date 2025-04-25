const TermDates = require("../../models/termDates.model");
const { AcademicYears } = require("../../models/academics.model");
const { connectToSchoolDB, waitForConnection } = require("../../utils/connectSchoolDb");

module.exports.createTermDates = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const TermDatesModel = schoolConnection.model("TermDates", TermDates.schema);
    await schoolConnection.model("AcademicYears", AcademicYears.schema);
    const { academic_year_id, term, active } = req.body;


    // Check if a document with the same year range exists
    let existingTermDates = await TermDatesModel.findOne({ academic_year_id: academic_year_id });

    if (existingTermDates) {
      // Filter out duplicate terms by comparing only the date
      const newTerms = term.filter((newTerm) => {
        return !existingTermDates.term.some((existingTerm) => {
          return (
            existingTerm.term === newTerm.term &&
            new Date(existingTerm.startDate).toISOString().split("T")[0] ===
            new Date(newTerm.startDate).toISOString().split("T")[0] &&
            new Date(existingTerm.endDate).toISOString().split("T")[0] ===
            new Date(newTerm.endDate).toISOString().split("T")[0]
          );
        });
      });

      if (newTerms.length > 0) {
        // Push only new terms to the existing document
        existingTermDates.term.push(...newTerms);
        await existingTermDates.save();
        res.status(200).json(existingTermDates);
      } else {
        res.status(400).json({ message: "No new terms to add." });
      }
    } else {
      // Create a new document if no matching year exists
      const termDates = new TermDatesModel({
        academic_year_id,
        term,
        active,
      });
      await termDates.save();
      res.status(201).json(termDates);
    }
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getAllTermDates = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);

    const TermDatesModel = schoolConnection.model("TermDates", TermDates.schema);
    await schoolConnection.model("AcademicYears", AcademicYears.schema);

    let { academicYearId, name } = req.query;
    let filter = {};

    if (academicYearId) {
      filter.academic_year_id = academicYearId;
    }

    if (name) {
      filter.term = { $elemMatch: { term: { $regex: name, $options: "i" } } };
    }

    const termDates = await TermDatesModel.find(filter).populate("academic_year_id");
    res.status(200).json(termDates);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateTermDates = async (req, res, next) => {
  let schoolConnection;
  const { id } = req.params;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TermDatesModel = await schoolConnection.model("TermDates", TermDates.schema);
    const termDates = await TermDatesModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!termDates) {
      return res.status(404).json({ message: "TermDates not found" });
    }
    res.status(200).json(termDates);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getTermDatesId = async (req, res, next) => {
  let schoolConnection;
  const { id } = req.params;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TermDatesModel = await schoolConnection.model("TermDates", TermDates.schema);
    await schoolConnection.model("AcademicYears", AcademicYears.schema);
    const termDates = await TermDatesModel.findById(id).populate("academic_year_id");
    if (!termDates) {
      return res.status(404).json({ message: "TermDates not found" });
    }
    res.status(200).json(termDates);
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.deleteTermDates = async (req, res, next) => {
  let schoolConnection;
  const { id } = req.params;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TermDatesModel = await schoolConnection.model("TermDates", TermDates.schema);
    const termDates = await TermDatesModel.findByIdAndDelete(id);
    if (!termDates) {
      return res.status(404).json({ message: "TermDates not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.updateStatus = async (req, res, next) => {
  let schoolConnection;
  const { ids, status } = req.body;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const TermDatesModel = await schoolConnection.model("TermDates", TermDates.schema);
    await TermDatesModel.updateMany(
      { _id: { $in: ids } },
      { $set: { active: status } }
    );
    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};
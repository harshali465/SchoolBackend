const aadatDataService = require('../../services/aadatData');
const AadatDataModel = require('../../models/aadatData.model');
const mongoose = require('mongoose');
const { connectToSchoolDB, waitForConnection } = require('../../utils/connectSchoolDb');
const Aadat = require('../../models/aadat.model');
const Surat = require("../../commonDbModels/surat.model");
const Module = require('../../commonDbModels/modules-master.model');
const { BehaviorPointCondition, BehaviorPointPoint } = require('../../models/behaviourPoint.model');
const { AcademicYears } = require('../../models/academics.model');

module.exports.createAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatDataService.createAadatData(req.body, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: aadatData,
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

module.exports.getAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatDataService.getAadatData(req.params.id, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: aadatData,
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

module.exports.getAllAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatDataService.getAllAadatData(req.query, schoolConnection);
    res.status(200).json({
      status: 'success',
      data: aadatData,
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
module.exports.updateAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    const aadatData = await aadatDataService.updateAadatData(
      req.params.id,
      req.body,
      schoolConnection
    );
    res.status(200).json({
      status: 'success',
      data: aadatData,
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

module.exports.deleteAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection)
    await aadatDataService.deleteAadatData(req.params.id, schoolConnection);

    res.status(204).json({
      status: 'success',
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

module.exports.uploadImages = async (req, res, next) => {
  try {
    const images = req.files
    let imagesArr = images.map(data => data.path)
    res.status(201).json({ status: 'success', imagesArr });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

module.exports.createDailyAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI);
    await waitForConnection(schoolConnection);
    const { aadat, miqaat, academicYearId } = req.body;
    const getStartOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
    const todayStart = getStartOfDay(new Date());

    const results = [];
    let pointsIncremented = false; // Flag to ensure points are incremented only once

    const AadatData = await schoolConnection.model('AadatData', AadatDataModel.schema);
    const BehaviorPointConditionModel = await schoolConnection.model('BehaviorPointCondition', BehaviorPointCondition.schema);
    const BehaviorPointPointModel = await schoolConnection.model('BehaviorPointPoint', BehaviorPointPoint.schema);
    const AcademicYearsModel = await schoolConnection.model('AcademicYears', AcademicYears.schema);
    const moduleId = await Module.findOne({ moduleName: "Aadat" }).select("_id status");

    const incrementBehaviorPoints = async (studentId) => {
      const findCondition = await BehaviorPointConditionModel.findOne({ module_id: moduleId._id });
      if (findCondition) {
        if (!pointsIncremented && moduleId && moduleId.status === true) {
          const point = findCondition && findCondition?.point ? findCondition.point : 0;
          const updatedPoints = await BehaviorPointPointModel.findOneAndUpdate(
            { user_id: studentId, academicYearId: new mongoose.Types.ObjectId(academicYearId) }, // Search criteria
            {
              $inc: {
                totalPoints: point,
                RemainingPoints: point,
              },
              $setOnInsert: { academicYearId: new mongoose.Types.ObjectId(academicYearId), user_id: studentId, user_type: "student" }, // Set only on insert
            },
            { new: true, upsert: true } // Create a new document if not found
          );
          pointsIncremented = true; // Set flag to true after incrementing points
        }
      }
    };

    if (aadat && Array.isArray(aadat)) {
      for (const data of aadat) {
        if (data.aadatId) {
          data.aadatId = new mongoose.Types.ObjectId(data.aadatId);
          data.studentId = new mongoose.Types.ObjectId(req.user.id);

          const existingData = await AadatData.findOne({
            studentId: data.studentId,
            aadatId: data.aadatId,
            createdAt: { $gte: todayStart }
          });

          if (existingData) {
            const updatedData = await AadatData.findByIdAndUpdate(existingData._id, { $set: data }, { new: true });
            const existingResult = results.find(result => result._id.toString() === updatedData._id.toString());
            if (!existingResult) {
              results.push(updatedData);
            }
          } else {
            data.createdAt = new Date();
            const newData = new AadatData(data);
            const savedData = await newData.save();
            results.push(savedData);

            // Increment behavior points for new data
            await incrementBehaviorPoints(data.studentId);
          }
        }
      }
    }

    if (miqaat && Array.isArray(miqaat)) {
      for (const data of miqaat) {
        if (data.miqaatId) {
          data.miqaatId = new mongoose.Types.ObjectId(data.miqaatId);
          data.studentId = new mongoose.Types.ObjectId(req.user.id);

          const existingData = await AadatData.findOne({
            studentId: data.studentId,
            miqaatId: data.miqaatId,
            createdAt: { $gte: todayStart }
          });

          if (existingData) {
            const updatedData = await AadatData.findByIdAndUpdate(existingData._id, data, { new: true });
            const existingResult = results.find(result => result._id.toString() === updatedData._id.toString());
            if (!existingResult) {
              results.push(updatedData);
            }
          } else {
            data.createdAt = new Date();
            const newData = new AadatData(data);
            const savedData = await newData.save();
            results.push(savedData);

            // Increment behavior points for new data
            await incrementBehaviorPoints(data.studentId);
          }
        }
      }
    }
    res.status(201).json({ status: 'success', data: results });
  } catch (error) {
    console.error(error);
    next(error);
  } finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

// Helper function to parse flat object into nested structure
const parseBody = (body) => {
  const nested = { aadat: [], miqaat: [], surat: {} };
  for (const key in body) {
    const value = body[key];
    if (key.startsWith('aadat[')) {
      const match = key.match(/aadat\[(\d+)\]\.(.+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!nested.aadat[index]) nested.aadat[index] = {};
        const subFields = field.split('.');
        let current = nested.aadat[index];
        for (let i = 0; i < subFields.length - 1; i++) {
          if (!current[subFields[i]]) current[subFields[i]] = {};
          current = current[subFields[i]];
        }
        current[subFields[subFields.length - 1]] = value;
      }
    } else if (key.startsWith('miqaat[')) {
      const match = key.match(/miqaat\[(\d+)\]\.(.+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        const field = match[2];
        if (!nested.miqaat[index]) nested.miqaat[index] = {};
        nested.miqaat[index][field] = value;
      }
    } else if (key.startsWith('surat.')) {
      const field = key.split('.')[1];
      nested.surat[field] = value;
    }
  }
  return nested;
};

module.exports.createDailyAadatData1 = async (req, res, next) => {
  let schoolConnection;
  try {
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    // Parse the flat req.body into nested objects
    const { aadat, miqaat } = parseBody(req.body);
    const getStartOfDay = (date) => {
      return new Date(date.setHours(0, 0, 0, 0));
    };
    let AadatData = await schoolConnection.model('AadatData', AadatDataModel.schema)
    // Assign uploaded files to the respective aadat entries
    req.files.forEach(file => {
      const match = file.fieldname.match(/aadat\[(\d+)\]\.images/);
      if (match) {
        const index = parseInt(match[1], 10);
        if (!aadat[index].images) {
          aadat[index].images = [];
        }
        aadat[index].images.push(file.path); // Store the file path
      }
    });
    const results = [];
    if (aadat && Array.isArray(aadat)) {
      for (const data of aadat) {
        if (data.aadatId) {
          data.aadatId = new mongoose.Types.ObjectId(data.aadatId);
          data.studentId = new mongoose.Types.ObjectId(req.user.id);
          const todayStart = getStartOfDay(new Date());
          const existingData = await AadatData.findOne({
            studentId: data.studentId,
            aadatId: data.aadatId,
            createdAt: { $gte: todayStart }
          });
          if (existingData) {
            const updatedData = await AadatData.findByIdAndUpdate(existingData._id, data, { new: true });
            const existingResult = results.find(result => result._id.toString() === updatedData._id.toString());
            if (!existingResult) {
              results.push(updatedData);
            }
          } else {
            data.createdAt = new Date();
            const newData = new AadatData(data);
            const savedData = await newData.save();
            const existingResult = results.find(result => result._id.toString() === savedData._id.toString());
            if (!existingResult) {
              results.push(savedData);
            }
          }
        }
      }
    }
    if (miqaat && Array.isArray(miqaat)) {
      for (const data of miqaat) {
        if (data.miqaatId) {
          data.miqaatId = new mongoose.Types.ObjectId(data.miqaatId);
          data.studentId = new mongoose.Types.ObjectId(req.user.id);
          const todayStart = getStartOfDay(new Date());

          const existingData = await AadatData.findOne({
            studentId: data.studentId,
            miqaatId: data.miqaatId,
            createdAt: { $gte: todayStart }
          });

          if (existingData) {
            const updatedData = await AadatData.findByIdAndUpdate(existingData._id, data, { new: true });
            const existingResult = results.find(result => result._id.toString() === updatedData._id.toString());
            if (!existingResult) {
              results.push(updatedData);
            }
          } else {
            data.createdAt = new Date();
            const newData = new AadatData(data);
            const savedData = await newData.save();
            const existingResult = results.find(result => result._id.toString() === savedData._id.toString());
            if (!existingResult) {
              results.push(savedData);
            }
          }
        }
      }
    }
    res.status(201).json({ status: 'success', data: results });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
};

module.exports.getDailyAadatData = async (req, res, next) => {
  let schoolConnection;
  try {
    const studentId = req.user._id;
    schoolConnection = await connectToSchoolDB(req.user.dbURI)
    await waitForConnection(schoolConnection)
    // Helper function to get the start of the current day
    const getStartOfDay = (date) => {
      return new Date(date.setHours(0, 0, 0, 0));
    };
    // Helper function to get the end of the current day
    const getEndOfDay = (date) => {
      return new Date(date.setHours(23, 59, 59, 999));
    };
    await schoolConnection.model('Aadat', Aadat.schema)
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid studentId' });
    }
    let AadatData = await schoolConnection.model('AadatData', AadatDataModel.schema)
    const startOfDay = getStartOfDay(new Date());
    const endOfDay = getEndOfDay(new Date());
    let query = {
      studentId: new mongoose.Types.ObjectId(studentId),
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    }
    // if(req.query.academicYearId){
    //   query.academicYearId = new mongoose.Types.ObjectId(req.query.academicYearId)
    // }
    const data = await AadatData.find(query).populate([
      { path: 'aadatId', select: 'responseType' }, // Populate aadatId and select responseType
      // { path: 'academicYearId' }, // Populate academicYearId
    ])
    const response = {
      aadat: [],
      miqaat: [],
      surat: {}
    };
    for (const item of data) {
      let surat;
      if (item.suratId) {
        surat = await Surat.findById(item.suratId);
      }

      if (item.aadatId) {
        const transformedItem = {
          ...item.toObject(),
          aadatId: item.aadatId._id.toString(),
          responseType: item.aadatId.responseType,
          remarkBoxes: item.remarkBoxes ? Object.fromEntries(item.remarkBoxes) : {},
          suratId: item?.suratId ? item.suratId : "",
          suratName: surat?.suratName || "",
          ayatNo: surat?.ayatNo || "",
        };
        response.aadat.push(transformedItem);
      } else if (item.miqaatId) {
        response.miqaat.push(item);
      } else if (item.suratId) {
        response.surat = item;
      }
    }
    res.status(200).json({ data: response });
  } catch (error) {
    console.error(error);
    next(error);
  }
  finally {
    if (schoolConnection) {
      await schoolConnection.close();
    }
  }
}
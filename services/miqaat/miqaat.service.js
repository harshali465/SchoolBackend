const MiqaatModel = require('../../models/miqaat.model');
const { AcademicYears } = require('../../models/academics.model');
const AppError = require('../../utils/appError');
const APIFeatures = require('../../utils/apiFeatures');
const moment = require('moment');
require('moment-hijri');

module.exports.createMiqaat = async (reqBody, schoolConnection) => {
  const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
  const miqaatData = await Miqaat.create(reqBody);
  return miqaatData;
};

module.exports.getMiqaat = async (id, schoolConnection) => {
  const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
  await schoolConnection.model('AcademicYears', AcademicYears.schema);
  const miqaatData = await Miqaat.findById(id).populate('academicYearId');

  if (!miqaatData) {
    throw new AppError('Invalid ID', 400);
  }

  return miqaatData;
};

// Service function
module.exports.getAllMiqaat = async (query, schoolConnection) => {
  const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
  await schoolConnection.model('AcademicYears', AcademicYears.schema);
  const miqaatData = await new APIFeatures(query)
    .search()
    .sort()
    .limitFields()
    .paginate()
    .populate('academicYearId')
    .exec(Miqaat);

  const miqaatDocs = miqaatData.data.docs.map(doc => {
    // Format startDate to Hijri date
    const gregorianStartDate = moment(doc.startDate).toDate();
    const hijriStartDate = new Intl.DateTimeFormat('fr-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(gregorianStartDate);

    // Format endDateArabic if available
    let endDateArabic = null;
    if (doc.endDate) {
      const gregorianEndDateArabic = moment(doc.endDate).toDate();
      endDateArabic = new Intl.DateTimeFormat('fr-TN-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(gregorianEndDateArabic);
    }

    return {
      ...doc.toObject(),
      startDateArabic: hijriStartDate,
      endDateArabic: endDateArabic
    };
  });

  return {
    ...miqaatData.data,
    docs: miqaatDocs
  };
};

async function convertToLocalDate(utcDateString) {
  const utcDate = new Date(utcDateString);
  const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
  localDate.setHours(0, 0, 0, 0); // Set time to midnight
  return localDate;
}

module.exports.getCurrentMiqaats = async (query, schoolConnection) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set to the start of the current day
  const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
  await schoolConnection.model('AcademicYears', AcademicYears.schema);
  let { academicYearId } = query;
  try {
    let filter = {
      $and: [
        { startDate: { $lte: currentDate } }, // Start date is less than or equal to current date
        { endDate: { $gte: currentDate } },   // End date is greater than or equal to current date
        { active: true }                      // Ensures only active records are considered
      ]
    };

    if (academicYearId){
      filter.academicYearId = academicYearId
    }
    const miqaats = await Miqaat.find(filter).populate('academicYearId');

    const filteredMiqaats = miqaats.filter(async (miqaat) => {
      let startDate = await convertToLocalDate(miqaat.startDate);
      const endDate = await convertToLocalDate(miqaat.endDate);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Normalize current date to midnight

      while (startDate <= endDate) {
        if (startDate.getTime() === currentDate.getTime()) {
          return true;
        }

        switch (miqaat.repeat) {
          case 'everyweek':
            startDate.setDate(startDate.getDate() + 7);
            break;
          case 'everymonth':
            startDate.setMonth(startDate.getMonth() + 1);
            break;
          case 'everyyear':
            startDate.setFullYear(startDate.getFullYear() + 1);
            break;
        }
      }

      return false;
    });
    const miqaatDocs = filteredMiqaats.map(doc => {
      const gregorianStartDate = moment(doc.startDate).toDate();
      const hijriStartDate = new Intl.DateTimeFormat('fr-TN-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(gregorianStartDate);
      doc.startDateArabic = hijriStartDate
      // Format endDateArabic if available
      let endDateArabic = null;
      if (doc.endDate) {
        const gregorianEndDateArabic = moment(doc.endDate).toDate();
        endDateArabic = new Intl.DateTimeFormat('fr-TN-u-ca-islamic', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(gregorianEndDateArabic);
      }
      doc.endDateArabic = endDateArabic
      return {
        ...doc.toObject(),
        startDateArabic: hijriStartDate,
        endDateArabic: endDateArabic
      };
    });

    return miqaatDocs; // Return the modified miqaatDocs
  } catch (error) {
    console.error('Error fetching miqaats:', error);
    throw error;
  }
};

module.exports.updateActive = async (body, schoolConnection) => {
  const { ids, active } = body;
  const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
  const updatedresult = await Miqaat.updateMany(
    { _id: { $in: ids } },
    { $set: { active: active } },
  );
  if (!updatedresult) {
    throw new AppError('could not update', 404);
  }
  return updatedresult;
};

// Do NOT update passwords with this!
module.exports.updateMiqaat = async (miqaatId, reqBody, schoolConnection) => {
  const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
  const miqaatData = await Miqaat.findByIdAndUpdate(miqaatId, reqBody, {
    new: true,
    runValidators: true,
  });

  if (!miqaatData) {
    throw new AppError('No document found with that ID', 404);
  }

  return miqaatData;
};

module.exports.deleteMiqaat = async (body, schoolConnection) => {
  try {
    const Miqaat = await schoolConnection.model('Miqaat', MiqaatModel.schema);
    const { ids } = body;
    await Miqaat.deleteMany({ _id: { $in: ids } });
    return 'miqaats deleted successfully';
  } catch (error) {
    console.log(error);
    return 'There was a problem deleting the miqaats';
  }
};
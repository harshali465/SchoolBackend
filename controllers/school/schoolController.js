// const School = require('../models/school.model');
const User = require('../../models/user.model');
const bcrypt = require('bcrypt');
const moment = require('moment');
const transporter = require('../../utils/sendMail')

module.exports.uploadSchoolLogo = async (req, res, next) => {
  try {
    const image = req.files[0].path
    res.status(201).json({ status: 'success', image });
  } catch (error) {
    console.error(error);
    next(error);
  }
}

module.exports.updateSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { contactPersonEmail, email, password, subscriptionStart, validityOfSubscription, modulesActivated, contactPersonName, contactPersonMobile, schoolAdminUsername, ...rest } = req.body;

    // Prepare update data for the School
    const updateData = { ...rest };

    // Convert dates to valid Date objects
    if (subscriptionStart) {
      updateData.subscriptionStart = moment(subscriptionStart, 'DD/MM/YYYY').toDate();
    }
    if (validityOfSubscription) {
      updateData.validityOfSubscription = moment(validityOfSubscription, 'DD/MM/YYYY').toDate();
    }

    // Hash the password if it's provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Ensure modulesActivated is updated correctly
    if (modulesActivated && modulesActivated.length) {
      updateData.modulesActivated = modulesActivated.map(module => ({
        moduleId: module.moduleId,
        status: module.status || true, // default to true if not provided
      }));
    }

    // Fetch the current School Admin user by schoolId and role 'school-admin'
    let schoolAdminUser = await User.findOne({ schoolId: id, role: 'school-admin' });

    if (!schoolAdminUser) {
      return res.status(404).json({ error: 'Admin user for this school not found' });
    }

    // If a new contactPersonEmail is provided and it's different from the current one, check for duplicates
    if (contactPersonEmail && schoolAdminUser.contactPersonEmail !== contactPersonEmail) {
      const contactEmailExists = await User.findOne({ contactPersonEmail });
      if (contactEmailExists) {
        return res.status(400).json({ error: 'The new contact person email address is already associated with another user' });
      }
      schoolAdminUser.contactPersonEmail = contactPersonEmail; // Update with the new personal email
    }

    if (schoolAdminUsername && schoolAdminUser.email !== schoolAdminUsername) {
      const AdminUsernameExists = await User.findOne({ email: schoolAdminUsername });
      if (AdminUsernameExists) {
        return res.status(400).json({ error: 'The new school Admin Username email address is already associated with another user' });
      }
      schoolAdminUser.contactPersonEmail = contactPersonEmail; // Update with the new personal email
    }

    // Update other details of the School Admin user
    schoolAdminUser.firstName = contactPersonName.split(' ')[0] || schoolAdminUser.firstName;
    schoolAdminUser.lastName = contactPersonName.split(' ')[1] || schoolAdminUser.lastName;
    schoolAdminUser.contactPersonMobile = contactPersonMobile || schoolAdminUser.contactPersonMobile;
    schoolAdminUser.email = schoolAdminUsername || schoolAdminUser.email;

    // Hash the password if provided and update it in the User schema
    if (password) {
      schoolAdminUser.password = password;
    }

    // Save updated School Admin user
    await schoolAdminUser.save();

    // Find and update the school (this includes the official school email)
    const school = await School.findByIdAndUpdate(id, {
      ...updateData,
      contactPersonName,
      contactPersonMobile,
      contactPersonEmail, // Save personal email of the contact person
      schoolAdminUsername, // Save official school email (login email)
    }, { new: true });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Optionally send password update email if password is updated
    if (password) {
      const info = await transporter.sendMail({
        from: process.env.USERMAILSENDER,
        to: contactPersonEmail,
        subject: 'Your updated school account password',
        text: `Your new password is: ${password}`,
      });
    }

    // Remove password from the response for security
    school.password = undefined;

    res.status(200).json({ school, message: 'School data and School Admin updated successfully' });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.export = async (req, res, next) => {
  try {
    // Fetch the schools with populated module data
    const schools = await School.find()
      .select('-password') // Exclude the password field  
      .populate('modulesActivated.moduleId', 'moduleName') // Populate the moduleId with the moduleName from the Module schema
      .lean(); // Convert Mongoose documents to plain JS objects for easy manipulation

    // Prepare the response with specified columns
    const response = schools.map((school, index) => ({
      ...school,
      subscriptionStart: new Date(school.subscriptionStart).toLocaleDateString(),
      validity: `${Math.floor(
        (new Date(school.validityOfSubscription) - new Date(school.subscriptionStart)) /
        (1000 * 60 * 60 * 24 * 30)
      )} months`, // Calculate months of validity
      validityOfSubscription: new Date(school.validityOfSubscription).toLocaleDateString(),
      modulesActivated: school.modulesActivated.map((module) => ({
        moduleName: module.moduleId ? module.moduleId.moduleName : 'Unknown', // Module name from populated data
        status: module.status ? 'Active' : 'Inactive', // Status from the school data
      })),
      status: school.status ? 'Active' : 'Inactive',
    }));

    res.status(200).json({
      data: response,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.getone = async (req, res,next) => {
  try {
    const { id } = req.params;

    // Find school by ID and populate module information
    const school = await School.findById(id)
      .populate('modulesActivated.moduleId', 'moduleName'); // Populate the moduleId with the moduleName from the Module schema

    if (!school) throw new Error('School not found');

    // Send response with populated modulesActivated data
    res.status(200).json({ school });
  } catch (error) {
    console.error(error);
    next(error);
    
  }
};
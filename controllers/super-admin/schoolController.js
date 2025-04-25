const School = require("../../commonDbModels/school.model");
const User = require("../../models/user.model");
const Aadat = require("../../models/aadat.model");
const AadatData = require("../../models/aadatData.model");
const Allergies = require("../../models/allergies.model");
const Categories = require("../../models/category.model");
const House = require("../../models/house.model");
const Miqaat = require("../../models/miqaat.model");
const TeacherType = require("../../models/teacherType.model");
const bcrypt = require("bcrypt");
const moment = require("moment");
const transporter = require("../../utils/sendMail");
const { connectToSchoolDB, waitForConnection, generateUniqueDbName } = require("../../utils/connectSchoolDb");
const AppError = require("../../utils/appError");
const notificationTemplate = require("../../models/notification-template.model");
// const schoolConnection = await connectToSchoolDB(schoolId);

module.exports.uploadSchoolLogo = async (req, res, next) => {
  try {
    const image = req.files[0].path;
    res.status(201).json({ status: "success", image });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Function to create a new school
module.exports.createSchool = async (req, res, next) => {
  try {
    let {
      password,
      contactPersonEmail,
      contactPersonName,
      contactPersonMobile,
      schoolAdminUsername,
      subscriptionStart,
      validityOfSubscription,
      modulesActivated,
    } = req.body;

    // Check if the school already exists by email
    const existingSchool = await School.findOne({ schoolAdminUsername });
    if (existingSchool) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Sanitize the school name
    let sName = req.body.schoolName.trim().replace(/\s+/g, "_");

    // Convert subscription dates to valid Date objects
    subscriptionStart = moment(subscriptionStart, "DD/MM/YYYY").toDate();
    validityOfSubscription = moment(
      validityOfSubscription,
      "DD/MM/YYYY"
    ).toDate();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);
    req.body.password = hashedPassword;
    req.body.subscriptionStart = subscriptionStart;
    req.body.validityOfSubscription = validityOfSubscription;

    // Ensure modulesActivated follows the correct format
    if (modulesActivated && modulesActivated.length) {
      req.body.modulesActivated = modulesActivated.map((module) => ({
        moduleId: module.moduleId,
        status: module.status || true, // default status to true
      }));
    }

    // Step 1: Generate a unique database name
    const uniqueDbName = await generateUniqueDbName(sName);

    // Generate the dbURI (Assuming local MongoDB connection)
    const dbURI = `${process.env.URI}${uniqueDbName}?retryWrites=true&w=majority`;

    // Step 2: Create the school and store the dbURI in the school document
    const lastSchool = await School.findOne().sort({ uniqueId: -1 }); // Get the latest uniqueId
    const uniqueId = (lastSchool?.uniqueId || 0) + 1; // Increment the ID
    const uniqueIdPadded = uniqueId.toString().padStart(4, '0');
    let baseUrl = `${process.env.BASE_URL}#/school/admin/${sName}/${uniqueIdPadded}`
    const school = await School.create({
      ...req.body,
      password: hashedPassword,
      dbURI, // Add the dbURI field to the school document
      uniqueId,
      baseUrl
    });

    // Step 3: Create school admin user in the new database
    let schoolAdminUser;
    const schoolDbConnection = await connectToSchoolDB(dbURI);
    await waitForConnection(schoolDbConnection)


    async function createDatabaseAndAdminUser() {
      // Define the User model for this new connection
      const SchoolUser = schoolDbConnection.model("User", User.schema);
      schoolDbConnection.model("Aadat", Aadat.schema);
      schoolDbConnection.model("AadatData", AadatData.schema);
      schoolDbConnection.model("Allergy", Allergies.schema);
      schoolDbConnection.model("category", Categories.schema);
      schoolDbConnection.model("house", House.schema);
      schoolDbConnection.model("TeacherType", TeacherType.schema);
      schoolDbConnection.model("miqaat", Miqaat.schema);
      let imageName = req?.body?.schoolLogo ? req.body.schoolLogo.split('/').pop() : "";
      // Create the school admin user with the hashed password
      schoolAdminUser = await SchoolUser.create({
        firstName: contactPersonName.split(" ")[0], // First name
        lastName: contactPersonName.split(" ")[1] || "", // Last name or empty
        email: schoolAdminUsername, // Email for the school admin
        password: password, // Use the hashed password
        contactPersonEmail: contactPersonEmail,
        contactPersonMobile: contactPersonMobile,
        role: "school-admin", // Assign 'school-admin' role
        active: true,
        schoolId: school._id, // Reference the created school's ID
        photo: imageName
      });
    }

    // Step 4: Create the database and admin user
    await createDatabaseAndAdminUser();

    const info = await transporter.sendMail({
      from: process.env.USERMAILSENDER, // Sender address
      to: contactPersonEmail, // Contact person's email
      subject: "Your School Admin Account Details", // Email subject
      text: `Username/Email: ${schoolAdminUsername}, Password: ${password}, URL: ${baseUrl}`, // Email body with credentials
    });

    // Remove the password from the responses
    school.password = undefined;
    schoolAdminUser.password = undefined;
    const NotificationTemplateModel = schoolDbConnection.model('notificationTemplate', notificationTemplate.schema);


    const Templatedata = [
      {
        module: "behaviour",
        condition: "when points / remark is given a",
        remark: "you have been awarded with {{x}} points / {{y}} remark by {{user}} user"
      },
      {
        module: "attendance",
        condition: "when points / remark is given a",
        remark: "you have been awarded with {{x}} points "
      },
      {
        module: "proxy",
        condition: "when points / remark is given a",
        remark: "you have been awarded with {{x}} points "
      },
      {
        module: "homework",
        condition: "when points / remark is given a",
        remark: "you have been awarded with {{x}} points "
      }
    ]

    for (const template of Templatedata) {
      await NotificationTemplateModel.create(template);
    }
    // Step 6: Respond to the client
    await schoolDbConnection.close();
    res.status(201).json({
      school,
      schoolAdminUser,
      message: "School and School Admin created successfully.",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.updateSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { contactPersonEmail, email, password, subscriptionStart, validityOfSubscription, modulesActivated, contactPersonName, contactPersonMobile, schoolAdminUsername, ...rest } = req.body;
    const schoolData = await School.findById(id);
    if (!schoolData) {
      return res.status(404).json({ error: "School not found" });
    }
    const dbURI = schoolData.dbURI;
    // Prepare update data for the School
    const updateData = { ...rest };
    // Convert dates to valid Date objects
    if (subscriptionStart) {
      updateData.subscriptionStart = moment(
        subscriptionStart,
        "DD/MM/YYYY"
      ).toDate();
    }
    if (validityOfSubscription) {
      updateData.validityOfSubscription = moment(
        validityOfSubscription,
        "DD/MM/YYYY"
      ).toDate();
    }
    // Hash the password if it's provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    // Ensure modulesActivated is updated correctly
    if (modulesActivated && modulesActivated.length) {
      updateData.modulesActivated = modulesActivated.map((module) => ({
        moduleId: module.moduleId,
        status: module.status || true, // default to true if not provided
      }));
    }
    const schoolDbConnection = await connectToSchoolDB(dbURI);
    await waitForConnection(schoolDbConnection)
    // Fetch the current School Admin user by schoolId and role 'school-admin'
    const SchoolUser = schoolDbConnection.model("User", User.schema);
    let schoolAdminUser = await SchoolUser.findOne({
      schoolId: id,
      role: "school-admin",
    });
    if (!schoolAdminUser) {
      await schoolDbConnection.close();
      return res
        .status(404)
        .json({ error: "Admin user for this school not found" });
    }
    // If a new contactPersonEmail is provided and it's different from the current one, check for duplicates
    if (
      contactPersonEmail &&
      schoolAdminUser.contactPersonEmail !== contactPersonEmail
    ) {
      const contactEmailExists = await SchoolUser.findOne({
        contactPersonEmail,
      });
      if (contactEmailExists) {
        await schoolDbConnection.close();
        return res.status(400).json({
          error:
            "The new contact person email address is already associated with another user",
        });
      }
      schoolAdminUser.contactPersonEmail = contactPersonEmail; // Update with the new personal email
    }
    if (schoolAdminUsername && schoolAdminUser.email !== schoolAdminUsername) {
      const AdminUsernameExists = await SchoolUser.findOne({
        email: schoolAdminUsername,
      });
      if (AdminUsernameExists) {
        await schoolDbConnection.close();
        return res.status(400).json({
          error:
            "The new school Admin Username email address is already associated with another user",
        });
      }
      schoolAdminUser.contactPersonEmail = contactPersonEmail; // Update with the new personal email
    }
    // Update other details of the School Admin user
    schoolAdminUser.firstName =
      contactPersonName.split(" ")[0] || schoolAdminUser.firstName;
    schoolAdminUser.lastName =
      contactPersonName.split(" ")[1] || schoolAdminUser.lastName;
    schoolAdminUser.contactPersonMobile =
      contactPersonMobile || schoolAdminUser.contactPersonMobile;
    schoolAdminUser.email = schoolAdminUsername || schoolAdminUser.email;
    // Hash the password if provided and update it in the User schema
    if (password) {
      schoolAdminUser.password = password;
    }
    // Save updated School Admin user
    await schoolAdminUser.save();
    // Find and update the school (this includes the official school email)
    const school = await School.findByIdAndUpdate(
      id,
      {
        ...updateData,
        contactPersonName,
        contactPersonMobile,
        contactPersonEmail, // Save personal email of the contact person
        schoolAdminUsername, // Save official school email (login email)
      },
      { new: true }
    );
    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }
    // Optionally send password update email if password is updated
    if (password) {
      const info = await transporter.sendMail({
        from: process.env.USERMAILSENDER,
        to: contactPersonEmail,
        subject: "Your updated school account password",
        text: `Your new password is: ${password}`,
      });
    }
    // Remove password from the response for security
    school.password = undefined;
    await schoolDbConnection.close();
    res.status(200).json({
      school,
      message: "School data and School Admin updated successfully",
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.deleteSchool = async (req, res, next) => {
  try {
    let { ids } = req.body;
    // Ensure IDs are in an array
    if (typeof ids === "string") {
      ids = ids.split(","); // Convert comma-separated string to an array
    }

    // Step 1: Find all matching schools
    const schools = await School.find({ _id: { $in: ids } });
    if (!schools.length) {
      return res.status(404).json({ error: "No valid schools found" });
    }

    // Step 2: Process each school
    await Promise.all(
      schools.map(async (school) => {
        const { _id, dbURI } = school;
        if (!dbURI) {
          console.warn(`Database URI not found for school ${_id}, skipping.`);
          return;
        }
        try {
          // Step 3: Connect to school's database
          const schoolDbConnection = await connectToSchoolDB(dbURI);
          await waitForConnection(schoolDbConnection);

          // Step 4: Drop the database and close connection
          await schoolDbConnection.dropDatabase();
          await schoolDbConnection.close();

          // Step 5: Remove the school from the main database
          await School.findByIdAndDelete(_id);
        } catch (err) {
          console.error(`Failed to delete school ${_id}:`, err);
        }
      })
    );
    res.status(200).json({ sucess: true, message: "Selected schools deleted successfully." });
  } catch (error) {
    console.error("Error deleting schools:", error);
    next(error);
  }
};

// finding one specific school
module.exports.getone = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find school by ID and populate module information
    const school = await School.findById(id).populate(
      "modulesActivated.moduleId",
      "moduleName"
    ); // Populate the moduleId with the moduleName from the Module schema

    if (!school) throw new Error("School not found");

    // Send response with populated modulesActivated data
    res.status(200).json({ school });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// get all
module.exports.getall = async (req, res, next) => {
  try {
    const {
      search = "",
      minStudents = 0,
      maxStudents = Number.MAX_SAFE_INTEGER,
      sortBy = "schoolName",
      sortDirection = "asc",
      page = 1,
      limit = 25,
    } = req.query;

    // Create a filter object
    const filters = {
      isDeleted: { $eq: false }, // Ensure that isDeleted is explicitly false
      schoolName: { $regex: search, $options: "i" }, // Case-insensitive search on school name
      numberOfStudents: {
        $gte: parseInt(minStudents),
        $lte: parseInt(maxStudents),
      }, // Filter by student count range
    };

    const sortOptions = {};
    if (sortBy === "schoolName") {
      sortOptions.schoolName = sortDirection === "asc" ? 1 : -1;
    } else if (sortBy === "subscriptionDate") {
      sortOptions.subscriptionStart = sortDirection === "asc" ? 1 : -1;
    } else if (sortBy === "status") {
      sortOptions.status = sortDirection === "asc" ? 1 : -1; // Ascending for true < false
    } else {
      // Fallback to default sorting if needed
      sortOptions.schoolName = 1; // Default sorting by schoolName
    }

    // Pagination options
    const paginationLimit = limit === "All" ? 0 : parseInt(limit); // If 'All', do not limit results
    const paginationSkip = (parseInt(page) - 1) * paginationLimit;

    // Fetch total count for pagination
    const totalSchools = await School.countDocuments(filters);

    // Fetch the schools with applied filters, sorting, and pagination, and populate the `modulesActivated.moduleId` field
    const schools = await School.find(filters)
      .populate("modulesActivated.moduleId", "moduleName") // Populate the moduleId with the moduleName from the Module schema
      .sort(sortOptions)
      .collation({ locale: "en", strength: 2 }) // Case-insensitive sorting
      .skip(paginationSkip)
      .limit(paginationLimit);
    // Prepare the response with specified columns
    const response = schools.map((school, index) => ({
      _id: school._id,
      srNo: paginationSkip + index + 1, // Serial number
      schoolName: school.schoolName,
      subscriptionDate: school.subscriptionStart.toLocaleDateString(),
      baseUrl: school.baseUrl,
      uniqueId: school.uniqueId,
      validity: `${Math.floor(
        (new Date(school.validityOfSubscription) -
          new Date(school.subscriptionStart)) /
        (1000 * 60 * 60 * 24 * 30)
      )} months`, // Calculate months of validity
      endDate: school.validityOfSubscription.toLocaleDateString(),
      modulesAssigned: school.modulesActivated.map((module) => ({
        moduleName: module.moduleId ? module.moduleId.moduleName : "Unknown", // Module name from populated data
        status: module.status ? "Active" : "Inactive", // Status from the school data
      })),
      status: school.status ? "Active" : "Inactive",
    }));

    // Send the response with pagination meta
    res.status(200).json({
      totalRecords: totalSchools,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalSchools / paginationLimit),
      data: response,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.updateActive = async (req, res, next) => {
  try {
    const { ids, active } = req.body;
    const updatedresult = await School.updateMany(
      { _id: { $in: ids } },
      { $set: { status: active } }
    );

    res.status(201).json({
      status: "success",
      updatedresult,
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
};

//
module.exports.changePassword = async (req, res, next) => {
  try {
    const { passwordCurrent, passwordConfirm } = req.body;
    const { id } = req.params;
    // 1. Find the school by its ID
    const existingSchool = await School.findById(id);
    if (!existingSchool) {
      return res.status(404).json({ error: "School not found" });
    }
    const schoolDbConnection = await connectToSchoolDB(existingSchool.dbURI);
    await waitForConnection(schoolDbConnection)
    const SchoolUser = schoolDbConnection.model("User", User.schema);
    // 2. Find the school admin user by school ID and role 'school-admin'
    const schoolAdminUser = await SchoolUser.findOne({
      schoolId: id,
      role: "school-admin",
    }).select("+password");
    if (!schoolAdminUser) {
      await schoolDbConnection.close();
      return res.status(404).json({ error: "School Admin user not found" });
    }
    // Check if POSTed current password is correct
    if (
      !(await schoolAdminUser.correctPassword(
        passwordCurrent,
        schoolAdminUser.password
      ))
    ) {
      await schoolDbConnection.close();
      return next(new AppError("Your current password is wrong.", 401));
    }
    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(passwordConfirm, 12);
    // 4. Update the school's password
    existingSchool.password = hashedPassword;
    await existingSchool.save();
    // 5. Update the school admin user's password
    schoolAdminUser.password = passwordConfirm;
    await schoolAdminUser.save();
    // 6. Send the new password to the school admin's personal email
    const info = await transporter.sendMail({
      from: process.env.USERMAILSENDER, // sender address
      to: schoolAdminUser.contactPersonEmail, // admin's personal email
      subject: "Below is your updated password for the school", // Subject line
      text: `Your new password is: ${passwordConfirm}`, // plain text body
    });
    // 7. Remove the password from the response for security
    existingSchool.password = undefined;
    schoolAdminUser.password = undefined;
    // 8. Return success response
    await schoolDbConnection.close();
    res.status(200).json({
      message: "Password updated successfully",
      school: existingSchool,
      schoolAdminUser,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Update Module Status
module.exports.updateModuleStatus = async (req, res, next) => {
  try {
    const { modules } = req.body; // Expecting an array of module objects
    const { schoolId } = req.params;

    // Validate inputs
    if (!schoolId || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Prepare update operations
    const updatePromises = modules.map((module) => {
      const { moduleId, status } = module;

      if (!moduleId || typeof status !== "boolean") {
        throw new Error("Invalid module data");
      }

      return School.updateOne(
        { _id: schoolId, "modulesActivated.moduleId": moduleId },
        { $set: { "modulesActivated.$.status": status } }
      );
    });

    // Execute all updates
    await Promise.all(updatePromises);

    // Fetch the updated school to return
    const school = await School.findById(schoolId).populate(
      "modulesActivated.moduleId",
      "moduleName"
    );

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res
      .status(200)
      .json({ school, message: "Module statuses updated successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Delete Module
module.exports.deleteModule = async (req, res, next) => {
  try {
    const { moduleIds } = req.body;
    const { schoolId } = req.params;

    // Validate inputs
    if (!schoolId || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // Remove module from the modulesActivated array
    const school = await School.findOneAndUpdate(
      { _id: schoolId },
      { $pull: { modulesActivated: { moduleId: { $in: moduleIds } } } },
      { new: true } // Return the updated document
    );

    if (!school) {
      return res.status(404).json({ error: "School not found" });
    }

    res.status(200).json({ school, message: "Module deleted successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

//Export schools
module.exports.export = async (req, res, next) => {
  try {
    // Fetch the schools with populated module data
    const schools = await School.find()
      .select("-password") // Exclude the password field
      .populate("modulesActivated.moduleId", "moduleName") // Populate the moduleId with the moduleName from the Module schema
      .lean(); // Convert Mongoose documents to plain JS objects for easy manipulation

    // Prepare the response with specified columns
    const response = schools.map((school, index) => ({
      ...school,
      subscriptionStart: new Date(
        school.subscriptionStart
      ).toLocaleDateString(),
      validity: `${Math.floor(
        (new Date(school.validityOfSubscription) -
          new Date(school.subscriptionStart)) /
        (1000 * 60 * 60 * 24 * 30)
      )} months`, // Calculate months of validity
      validityOfSubscription: new Date(
        school.validityOfSubscription
      ).toLocaleDateString(),
      modulesActivated: school.modulesActivated.map((module) => ({
        moduleName: module.moduleId ? module.moduleId.moduleName : "Unknown", // Module name from populated data
        status: module.status ? "Active" : "Inactive", // Status from the school data
      })),
      status: school.status ? "Active" : "Inactive",
    }));

    res.status(200).json({
      data: response,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
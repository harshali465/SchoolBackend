const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../../models/user.model");
const {AcademicYears} = require("../../models/academics.model");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const crypto = require("crypto"); // For token generation
const bcrypt = require("bcryptjs"); // For password hashing
const transporter = require("../../utils/sendMail");
const {connectToSchoolDB, waitForConnection} = require("../../utils/connectSchoolDb");
const School = require("../../commonDbModels/school.model");
const mongoose = require('mongoose');
const path = require('path')

const signToken = (id, schoolId, dbURI) =>
  jwt.sign({ id, schoolId, dbURI }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
});

const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user._id, user.schoolId, user.dbURI);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    // Remove password from output
    user.password = undefined;
    res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = createSendToken;

module.exports.signup = catchAsync(async (req, res, next) => {
  delete req.body.role;
  delete req.body.active;
  const newUser = await User.create(req.body);

  createSendToken(newUser, 201, res);
});

module.exports.login = catchAsync(async (req, res, next) => {
  try {
    const { itsNo, email, password, uniqueId, role } = req.body;
    const formattedUniqueId = uniqueId.replace(/^0+/, '');

    let user;
    let errorMessage;
    const school = await School.findOne({ uniqueId: formattedUniqueId }).populate({
      path: "modulesActivated.moduleId", // Populate the moduleId with the Module schema data
    });


    if (!school || !school.status || school.isDeleted) {
      throw new Error("School is either inactive/deleted or not found");
    }

    const schoolSubscriptionDate = new Date(school.validityOfSubscription);
    const currentDate = new Date();

    // Compare only the date parts (ignoring the time)
    const isSubscriptionExpired =
      schoolSubscriptionDate.getFullYear() < currentDate.getFullYear() ||
      (schoolSubscriptionDate.getFullYear() === currentDate.getFullYear() &&
        schoolSubscriptionDate.getMonth() < currentDate.getMonth()) ||
      (schoolSubscriptionDate.getFullYear() === currentDate.getFullYear() &&
        schoolSubscriptionDate.getMonth() === currentDate.getMonth() &&
        schoolSubscriptionDate.getDate() < currentDate.getDate());
    // Check if the subscription has expired
    if (isSubscriptionExpired) {
      throw new Error("Subscription has expired");
    }

    let schoolConnection = await connectToSchoolDB(school.dbURI);
    await waitForConnection(schoolConnection)
    const SchoolUser = schoolConnection.model("User", User.schema);
    const AcademicYear = schoolConnection.model("AcademicYears", AcademicYears.schema);
    // Determine user type and fetch user data
    if (itsNo) {
      user = await SchoolUser.findOne({ itsNo, role }).select("+password");
      errorMessage = "Invalid credentials";
    } else if (email) {
      user = await SchoolUser.findOne({ email: email, role }).select(
        "+password"
      );
      errorMessage = "Invalid credentials";
    }

    // Validate user existence and password correctness
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error(errorMessage);
    }

    if (!user.active) {
      throw new Error("User is either inactive/deleted or not found");
    }

    if (user.role == "teacher" || user.role == "student") {
      const lastLogin = user.loginStats[user.loginStats.length - 1];
      if (lastLogin && !lastLogin.logoutTime) {
        lastLogin.logoutTime = new Date();
      }

      // Update loginStats with the new login information
      user.loginStats.push({
        loginDate: new Date(),
        loginTime: new Date(),
      });
    }

    await user.save();

    const getCurrentAcademicYear = await AcademicYear.find({ is_current_year: true })
    const getNextAcademicYear = await AcademicYear.find({ is_next_year: true })
    // Map the populated modulesActivated array to the desired structure
    const modulesActivated = school.modulesActivated?.map((module) => ({
      module_id: module.moduleId?._id, // Get the _id from the populated moduleId
      moduleName: module.moduleId?.moduleName, // Get the moduleName from the populated moduleId
      status: module?.status,
    }));

    // Create new userData object with the additional properties
    let userData = {
      ...user.toObject(), // Copy all user properties
      schoolId: school._id, // Add schoolId
      modulesActivated: modulesActivated, // Add modulesActivated
      dbURI: school.dbURI, // Add dbURI
      currentAcademicYear: getCurrentAcademicYear ? getCurrentAcademicYear : {},
      nextAcademicYear: getNextAcademicYear ? getNextAcademicYear : {}
    };

    // Explicitly remove loginStats from userData
    delete userData.loginStats;

    // Send token to client
    createSendToken(userData, 200, res);
    await schoolConnection.close();
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
});

module.exports.manifest = catchAsync(async (req, res, next) => {
  try {
    const { schoolName, uniqueId, user } = req.query; // Capture dynamic data
    let url = (user == 'student') ? `${process.env.STUDENT_TEACHER_BASE_URL}student/login/${schoolName}/${uniqueId}` : (user == 'teacher') ? `${process.env.STUDENT_TEACHER_BASE_URL}teacher/login/${schoolName}/${uniqueId}` : `${process.env.BASE_URL}#/school/admin/${schoolName}/${uniqueId}`;

    const school = await School.findOne({ uniqueId: uniqueId })
    const manifest = {
      short_name: `${user} - ${school.schoolName}`,
      name: `${user} - ${school.schoolName}`,
      // icons: [
      //   {
      //     src: (school && school.schoolLogo) ? school.schoolLogo : `${process.env.BASE_URL}/uploads/default_logo.png`,
      //     // src: `http://111.118.252.246:3002/uploads/default_logo.png`,
      //     sizes: "192x192",
      //     type: "image/png"
      //   }
      // ],
      icons:[
        {
          "src": (school && school.schoolLogo) ? school.schoolLogo : `${process.env.API_URL}uploads/default_logo.png`,
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": (school && school.schoolLogo) ? school.schoolLogo : `${process.env.API_URL}uploads/default_logo.png`,
          "sizes": "512x512",
          "type": "image/png"
        },
        {
          "src": (school && school.schoolLogo) ? school.schoolLogo : `${process.env.API_URL}uploads/default_logo.png`,
          "sizes": "152x152",
          "type": "image/png",
          "purpose": "any maskable"
        }
        // {
        //   "src": `${process.env.API_URL}uploads/default_logo.png`,
        //   "sizes": "192x192",
        //   "type": "image/png"
        // },
        // {
        //   "src": `${process.env.API_URL}uploads/default_logo.png`,
        //   "sizes": "512x512",
        //   "type": "image/png"
        // },
        // {
        //   "src": `${process.env.API_URL}uploads/default_logo.png`,
        //   "sizes": "152x152",
        //   "type": "image/png",
        //   "purpose": "any maskable"
        // }
      ],
      start_url: url,
      display: "standalone",
      theme_color: "#000000",
      background_color: "#ffffff",
    };
    res.json(manifest);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
});

module.exports.getImage = catchAsync(async (req, res) => {

    const { uniqueId } = req.query; // Capture dynamic data

    const school = await School.findOne({ uniqueId: uniqueId })

    // Get the image name or fallback to a default
    const parts = (school && school.schoolLogo) ? school.schoolLogo.split('/') : [];
    const imageName = parts.length > 0 ? parts[parts.length - 1] : 'nophoto2-Photoroom1.png';

    // Construct the image path
    const imagePath = path.join(process.env.PROJECT_DIR, 'uploads', imageName);
    
    // Sending the image file in the response
    res.sendFile(imagePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).send('Error sending image.');
        }
    });
});

module.exports.logout = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const school = await School.findById(req.user.schoolId);
    const schoolConnection = await connectToSchoolDB(school.dbURI);
    await waitForConnection(schoolConnection)
    const SchoolUser = schoolConnection.model("User", User.schema);
    const user = await SchoolUser.findById(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const lastLoginStat = user.loginStats[user.loginStats.length - 1];
    if (lastLoginStat) {
      lastLoginStat.logoutTime = new Date();
    } else {
      return next(new AppError("No login record found", 404));
    }
    await user.save();
    await schoolConnection.close();
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
});

module.exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const connection = await connectToSchoolDB(decoded.dbURI);
    await waitForConnection(connection)
    // 3) Check if user still exists
    const userModel = await connection.model("User", User.schema);
    const currentUser = await userModel.findById(decoded.id).select(["_id","schoolId","role"]);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401
        )
      );
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    await connection.close();
    req.user = currentUser;
    req.user.dbURI = decoded.dbURI;
    next();
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
});

module.exports.restrictTo = (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
};

module.exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection

  try {
    const school = await School.findById(req.user.schoolId);
    if (!school || !school.status || school.isDeleted) {
      return next(new AppError("School is either inactive or deleted", 403));
    }
    const schoolConnection = await connectToSchoolDB(school.dbURI);
    await waitForConnection(schoolConnection)
    const SchoolUser = schoolConnection.model("User", User.schema);
    const user = await SchoolUser.findById(req.user._id).select("+password");

    // 2) Check if POSTed current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError("Your current password is wrong.", 401));
    }

    // 3) If so, update password
    user.password = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!
    await schoolConnection.close();
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
});

module.exports.forgotPassword = async (req, res, next) => {
  const { itsNo, email, role = "school-admin" } = req.body;
  const uniqueId = req.params.id;
  const formattedUniqueId = uniqueId.replace(/^0+/, '');
  try {
    const school = await School.findOne({ uniqueId: formattedUniqueId });
    if (!school || !school.status || school.isDeleted) {
      return next(new AppError("School is either inactive or deleted", 403));
    }

    const schoolConnection = await connectToSchoolDB(school.dbURI);
    await waitForConnection(schoolConnection)
    const SchoolUser = schoolConnection.model("User", User.schema);
    let user;

    // Determine user based on provided identifier
    if (itsNo) {
      user = await SchoolUser.findOne({ itsNo });
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found with this ITS number" });
      }
    } else if (email) {
      user = await SchoolUser.findOne({
        $and: [
          { email: email },
          { role: role }
        ]
      });
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found with this email" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Please provide either ITS number or email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set password reset token in the database
    user.passwordResetToken = hashedToken;
    await user.save({ validateBeforeSave: false });

    // Prepare the reset URL and email options
    const resetURL = `${process.env.BASE_URL}#/resetpassword/${resetToken}`;
    const mailOptions = {
      from: process.env.USERMAILSENDER,
      to:
        user.role == "student" ?
          `${user.familyDetails.fatherEmail}, ${user.familyDetails.motherEmail}`
          : user.role == "teacher" ? email
            : user.role == "school-admin" ? email
              : "",
      subject: "Password Reset Link",
      html: `<p>Please click the link below to reset your password:</p><a href="${resetURL}">${resetURL}</a>`,
    };

    await transporter.sendMail(mailOptions);

    await schoolConnection.close();
    res.status(200).json({ message: "Password reset email sent", resetToken });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
};
module.exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const uniqueId = req.params.id;
  const formattedUniqueId = uniqueId.replace(/^0+/, '');
  try {
    const school = await School.findOne({ uniqueId:formattedUniqueId });
    if (!school || !school.status || school.isDeleted) {
      return next(new AppError("School is either inactive or deleted", 403));
    }

    const schoolConnection = await connectToSchoolDB(school.dbURI);
    await waitForConnection(schoolConnection)
    const SchoolUser = schoolConnection.model("User", User.schema);
    // Hash the token to match the stored hashed token in DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by token and check if token has not expired
    const user = await SchoolUser.findOne({
      passwordResetToken: hashedToken,
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid" });
    }

    // Update user's password
    user.password = newPassword; //await bcrypt.hash(newPassword, 12); // Hash the new password
    user.passwordResetToken = undefined;
    if (user.role == "school-admin") {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      school.password = hashedPassword;
      await school.save();
    }
    await user.save();

    // Redirect to login or send response
    await schoolConnection.close();
    res.status(200).json({ 
      message: "Password reset successful. Please login again.",
      role: user.role 
    });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: "Internal server error" });
    next(error);
  }
};
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../../commonDbModels/admin-user.model");
const School = require("../../commonDbModels/school.model");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const crypto = require("crypto"); // For token generation
const transporter = require("../../utils/sendMail");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  try {
    const token = signToken(user._id);
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

    res.status(statusCode).json({ status: "success", token, data: { user }, });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = createSendToken;

module.exports.login = catchAsync(async (req, res, next) => {
  const { itsNo, email, password } = req.body;
  try {
    let user;
    let errorMessage;

    // 1) Check if the user is a student (itsNo) or admin (email) and query accordingly
    if (itsNo) {
      user = await User.findOne({ itsNo }).select("+password");
      // Check if user exists before checking the school
      if (user) {
        // Check school status and isDeleted
        const school = await School.findOne({ _id: user.schoolId });
        if (!school || !school.status || school.isDeleted) {
          return next(
            new AppError("School is either inactive or deleted", 403)
          );
        }
      }
      errorMessage = "Incorrect ITS number or password";
    } else if (email) {
      user = await User.findOne({ email }).select("+password");
      errorMessage = "Incorrect email or password";
    }
    // 2) Check if user exists && password is correct
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError(errorMessage, 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  try {
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

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
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
    req.user = currentUser;
    next();
  } catch (error) {
    console.error(error);
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
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password");

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

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports.forgotPassword = async (req, res, next) => {
  const { itsNo } = req.body;

  try {
    // Find user by ITS number
    const user = await User.findOne({ itsNo });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found with this ITS number" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set password reset token and expiration in the database
    user.passwordResetToken = hashedToken;

    await user.save({ validateBeforeSave: false });

    // Send email with reset link
    const resetURL = `${process.env.BASE_URL}#/resetpassword/${resetToken}`;

    const mailOptions = {
      from: process.env.USERMAILSENDER,
      to: `${user.familyDetails.fatherEmail}, ${user.familyDetails.motherEmail}`,
      subject: "Password Reset Link",
      html: `<p>Please click the link below to reset your password:</p><a href="${resetURL}">${resetURL}</a>`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Password reset email sent", resetToken: resetToken });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Hash the token to match the stored hashed token in DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by token and check if token has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid" });
    }

    // Update user's password
    user.password = newPassword; //await bcrypt.hash(newPassword, 12); // Hash the new password
    user.passwordResetToken = undefined;

    await user.save();

    // Redirect to login or send response
    res.status(200).json({ message: "Password reset successful. Please login again." });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
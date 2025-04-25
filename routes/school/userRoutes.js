const express = require('express');
const userController = require('../../controllers/school/userController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/get-image', authController.getImage)
router.get('/manifest.json', authController.manifest)
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword/:id', authController.forgotPassword);
router.patch('/resetPassword/:token/:id', authController.resetPassword);
// Protect all routes after this middleware
router.use(authController.protect);
router.post('/logout', authController.logout);
router.get('/me', userController.getUser);
router.get('/school-admin', userController.getSchoolAdmin);
// router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', upload.single('photo'), userController.updateMe);
router.delete('/deleteMe/:id', userController.deleteMe);


router.use(authController.restrictTo('school-admin', 'student', 'user', 'teacher'));

router.get('/role-wise-user', catchAsync(userController.getRoleWiseUser));



router
  .route('/student')
  .get(catchAsync(userController.getAllUsers)) 
  .patch(catchAsync(userController.updateActive))
  .delete(catchAsync(userController.deletestudent))
  .post(upload.single('photo'), catchAsync(userController.createStudent));

router
  .route("/student/history/:id")
  .get(catchAsync(userController.getLoginHistory));

router
  .route('/student/:id')
  .get(catchAsync(userController.getStudents))


router
  .get('/get-user-birthday', userController.getUserBirthday)

router
  .route('/')
  .get(catchAsync(userController.getAllUsers))
  .post(catchAsync(userController.createUser));

router
  .route('/:id')
  .get(catchAsync(userController.getUser))
  .patch(upload.single('photo'), catchAsync(userController.updateUser))
  .delete(catchAsync(userController.deleteUser));

router
  .route('/surat/all')
  .get(catchAsync(userController.getAllSurats))


router
  .route('/import-students')
  .post(upload.single('file'), catchAsync(userController.ImportStudents))

router
  .route('/get/student-report')
  .get(catchAsync(userController.getStudentReport))



module.exports = router;

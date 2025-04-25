const express = require('express');
const behaviorController = require('../../controllers/school/behaviorController');
const authController = require('../../controllers/school/authController');
const catchAsync = require('../../utils/catchAsync');
const router = express.Router();
const moduleController = require('../../controllers/super-admin/modulesController')
router.use(authController.protect);
router.use(authController.restrictTo('student', 'teacher', 'school-admin'));


//-----------------------------------------CONDITIONS--------------------------------------
router
  .route('/conditions/')
  .get(catchAsync(behaviorController.getAllCondition))
  .post(catchAsync(behaviorController.createCondition))
  .patch(catchAsync(behaviorController.updateActiveCondition))
  .delete(catchAsync(behaviorController.deleteCondition));

router
  .route('/conditions/:id')
  .get(catchAsync(behaviorController.getCondition))
  .patch(catchAsync(behaviorController.updateCondition));

//------------------------------------------------------------------------------------------

//-----------------------------------------CATRGORIES--------------------------------------
router
  .route('/categories/')
  .get(catchAsync(behaviorController.getAllCategory))
  .post(catchAsync(behaviorController.createCategory))
  .delete(catchAsync(behaviorController.deleteCategory));

router
.route('/categories/mark-active-inactive')
.patch(catchAsync(behaviorController.updateActiveCategory))

router
  .route('/categories/:id')
  .get(catchAsync(behaviorController.getCategory))
  .patch(catchAsync(behaviorController.updateCategory));

//------------------------------------------------------------------------------------------

//-----------------------------------------COUPONS--------------------------------------
router
  .route('/coupons/')
  .get(catchAsync(behaviorController.getAllCoupon))
  .post(catchAsync(behaviorController.createCoupon))
  .delete(catchAsync(behaviorController.deleteCoupon));

router
  .route('/coupons/role')
  .get(catchAsync(behaviorController.getCouponByRole))

router
  .route('/coupons/:id')
  .get(catchAsync(behaviorController.getCoupon))
  .patch(catchAsync(behaviorController.updateCoupon));

//------------------------------------------------------------------------------------------


//-----------------------------------------Coupon Approval--------------------------------------
router
  .route('/coupon-approval/')
  .post(catchAsync(behaviorController.couponApprovalRequest))
  .get(catchAsync(behaviorController.getAllCouponApproval))
  .delete(catchAsync(behaviorController.deleteCouponApproval))

router
  .route('/coupon-approval/:id')
  .patch(catchAsync(behaviorController.updateCouponApproval))
  .get(catchAsync(behaviorController.getCouponApproval))
  .put(catchAsync(behaviorController.acceptCouponApproval))

router
  .route('/coupon-approval/user/:id')
  .get(catchAsync(behaviorController.getAllCouponApprovalForUser))

//------------------------------------------------------------------------------------------

//--------------------------------ASSIGN POINTS---------------------------------------
router
  .route('/assign-point')
  .post(catchAsync(behaviorController.assignBehaviorPoint))
router.get('/get-points-assign-by-user',catchAsync(behaviorController.getPointAssignedByUser))
router.get('/get-points-assign-to-user', catchAsync(behaviorController.getPointAssignedToUser))
router.get('/get-student-leaderboard',catchAsync(behaviorController.getStudentLeaderboard))
router.get('/get-assigned-points-by-student-id', catchAsync(behaviorController.getAssignedPointsForStudent))

router.get('/get-category-wise-assigned-points', catchAsync(behaviorController.getCategoryWisePoints))
router.post('/update-is-read/:id', catchAsync(behaviorController.updateIsRead))
router.get('/get-assigned-points-by-category-id', catchAsync(behaviorController.getAssignedPointsByCategory))

//--------------------------------------ASSIGNED POINTS-----------------------------------------
router.get('/get-total-points-count', catchAsync(behaviorController.totalPoints))
router.get('/get-report', catchAsync(behaviorController.report))

router.get('/get-giver-list', catchAsync(behaviorController.giverList))
router.get('/get-reciever-list', catchAsync(behaviorController.recieverList))

router.get('/modules',catchAsync(moduleController.getAllModule));

//----------------------------------------Monthly Report-----------------------------------------
router.get('/month-wise-student-report', catchAsync(behaviorController.monthWiseStudentReport))

module.exports = router;
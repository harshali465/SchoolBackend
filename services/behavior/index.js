const behaviorService = require("./behavior.service");

module.exports = {
  //-----------------CONDITIONS---------------------
  createConditions: behaviorService.createConditions,
  getCondition: behaviorService.getCondition,
  getAllCondition: behaviorService.getAllConditions,
  updateConditions: behaviorService.updateConditions,
  deleteCondition: behaviorService.deleteCondition,
  updateActiveCondition:behaviorService.updateActiveCondition,
  //------------------------------------------------

  //-----------------CATEGORIES---------------------
  createCategory: behaviorService.createCategory,
  getCategory: behaviorService.getCategory,
  getAllCategory: behaviorService.getAllCategory,
  updateCategory: behaviorService.updateCategory,
  deleteCategory: behaviorService.deleteCategory,
  updateActiveCategory:behaviorService.updateActiveCategory,
  //------------------------------------------------

  //-----------------COUPONS---------------------
  createCoupon: behaviorService.createCoupon,
  getCoupon: behaviorService.getCoupon,
  getAllCoupon: behaviorService.getAllCoupon,
  getCouponByRole: behaviorService.getCouponByRole,
  updateCoupon: behaviorService.updateCoupon,
  deleteCoupon: behaviorService.deleteCoupon,
  //------------------------------------------------

  //-----------------COUPON APPROVALS---------------------
  couponApprovalRequest: behaviorService.couponApprovalRequest,
  getAllCouponApproval: behaviorService.getAllCouponApproval,
  getCouponApproval: behaviorService.getCouponApproval,
  getAllCouponApprovalForUser : behaviorService.getAllCouponApprovalForUser,
  deleteCouponApproval: behaviorService.deleteCouponApproval,
  updateCouponApproval:behaviorService.updateCouponApproval,
  acceptCouponApproval: behaviorService.acceptCouponApproval,
  //--------------------------------------------------------

  //-------------------ASSIGN POINTS----------------------
  assignBehaviorPoint: behaviorService.assignBehaviorPoint,
  getPointAssignedByUser: behaviorService.getPointAssignedByUser,
  getPointAssignedToUser: behaviorService.getPointAssignedToUser,
  getStudentLeaderboard: behaviorService.getStudentLeaderboard,
  getAssignedPointsForStudent: behaviorService.getAssignedPointsForStudent,
  updateIsRead: behaviorService.updateIsRead,
  getCategoryWiseAssignedPoints: behaviorService.getCategoryWiseAssignedPoints,
  getAssignedPointsForCategory: behaviorService.getAssignedPointsForCategory,

  //----------------------ASSIGNED POINTS------------------------------
  totalPoints: behaviorService.totalPoints,
  report: behaviorService.report,
  giverList: behaviorService.giverList,
  recieverList: behaviorService.receiverList,

  //----------------------Monthly Report--------------------------
  monthWiseStudentReport : behaviorService.monthWiseStudentReport

};

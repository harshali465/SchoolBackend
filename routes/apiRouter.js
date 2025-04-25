const express = require('express');
const router = express.Router()
const AppError = require('./../utils/appError');

// Routes
const adminRouter = require('./super-admin/userRoutes')
const adminDashboardRouter = require('./super-admin/dashoboardRoutes')
const timeZone = require('./super-admin/timeZone.routes')
const adminSchoolRouter = require('./super-admin/userSchools')
const moduleRouter = require('./super-admin/moduleRoutes');
const userRouter = require('./school/userRoutes');
const categoryRouter = require('./school/categoryRoutes');
const aadatRouter = require('./school/aadatRoutes');
const aadatDataRouter = require('./school/aadatDataRoutes');
const miqaatRouter = require('./school/miqaatRoutes');
const dashboardRouter = require('./school/dashboardRoutes');
const whatsappRouter = require('./school/whatsappRoutes');
const siblingRouter = require('./school/siblingRoutes');
const teacherTypeRouter = require('./school/teacherTypeRoutes');
const stageGradeSectionRouter = require('./school/stageGradeSectionRoutes');
const allergyRouter = require('./school/allergyRoutes');
const houseRouter = require('./school/houseRoutes');
const teacherRouter = require('./school/teacherRoutes');
const termDatesRouter = require('./school/termDatesRoutes');
const whatsappTimeZoneRoutes = require('./school/whatsappTimezoneRoutes');
const notificationRouter = require('./school/notificationRoutes');
const notificationTemplateRouter = require('./school/notificationTemplateRoutes');
const behaviorRouter = require('./school/behaviorRoutes');
const attendanceRouter = require('./school/attendanceRoutes');
const academicsRouter = require('./school/academicsRoutes')
const timeTableRouter = require('./school/timetableRoutes')
const classworkRouter = require('./school/classwordRoutes')

// 3) ROUTES
router.use('/admin', adminRouter);
router.use('/admin/school', adminSchoolRouter);
router.use('/admin/dashboard', adminDashboardRouter);
router.use('/school/notification-template', notificationTemplateRouter)
router.use('/school/notification', notificationRouter)
router.use('/school', userRouter);
router.use('/users/siblings', siblingRouter);
router.use('/categories', categoryRouter);
router.use('/aadat', aadatRouter);
router.use('/aadatdata', aadatDataRouter);
router.use('/miqaat', miqaatRouter);
router.use('/dashboard', dashboardRouter);
router.use('/school/whatsapp', whatsappRouter);
router.use('/admin/modules', moduleRouter);
router.use('/teacherType', teacherTypeRouter);
router.use('/allergy', allergyRouter);
router.use('/house', houseRouter);
router.use('/stage-grade-section', stageGradeSectionRouter);
router.use('/teacher',teacherRouter);
router.use('/termDates',termDatesRouter);
router.use('/timeZone',timeZone)
router.use('/whatsappTimeZone',whatsappTimeZoneRoutes)
router.use('/behaviorpoint', behaviorRouter)
router.use('/attendance', attendanceRouter)
router.use('/academics', academicsRouter);
router.use('/time-table', timeTableRouter);
router.use('/class-work', classworkRouter);

router.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = router;
const express = require('express');
const dashboardController = require('../../controllers/super-admin/dashboardController');
const router = express.Router();

router.get('/count', dashboardController.getStudentCount);

module.exports = router;
const express = require('express');
const timeZoneController = require('../../controllers/super-admin/timeZoneController');
const authController = require('../../controllers/super-admin/authController');
const router = express.Router();

router.get('/',timeZoneController.getTimeZone)

module.exports = router;

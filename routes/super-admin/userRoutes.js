const express = require('express');
const authController = require('../../controllers/super-admin/authController');
const router = express.Router();

router.post('/login', authController.login);
router.put('/login', authController.updatePassword);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);


module.exports = router;

const express = require('express');
const whatsappController = require('../../controllers/school/whatsappController.js');
const catchAsync = require('../../utils/catchAsync.js');

const router = express.Router();


router
  .route('/get-qr')
  .get(catchAsync(whatsappController.getQr));

router
  .route('/check-connection')
  .get(catchAsync(whatsappController.checkConnection));


module.exports = router;
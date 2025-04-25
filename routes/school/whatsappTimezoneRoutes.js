const express = require("express");
const authController = require("../../controllers/school/authController");
const router = express.Router();
const timeZoneController = require("../../controllers/school/whatsappTimezoneController");
router.use(authController.protect);
router
  .route("/")
  .post(timeZoneController.createWhatsAppTimeZoneSetting)
  .get(timeZoneController.getAllWhatsAppTimeZoneSettings);

router
  .route("/:id")
  .get(timeZoneController.getWhatsAppTimeZoneSettingById)
  .put(timeZoneController.updateWhatsAppTimeZoneSetting)
  .delete(timeZoneController.deleteWhatsAppTimeZoneSetting);

router
  .post("/:id/add-number", timeZoneController.addWhatsAppNumber) // Add a WhatsApp number
  .post("/:id/remove-number", timeZoneController.removeWhatsAppNumber) // Remove a WhatsApp number
  .post("/:id/update-number-status",timeZoneController.updateWhatsAppNumberStatus); // Update WhatsApp number status

  module.exports = router;

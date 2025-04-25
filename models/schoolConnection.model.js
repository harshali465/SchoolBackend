const mongoose = require("mongoose");

const schoolConnectionSchema = new mongoose.Schema({
  schoolId: { type: String, required: true, unique: true },
  qrCodeData: { type: String, default: "" }, // Stores the QR code URL as a string
  connectionStatus: { type: Boolean, default: false }, // Connection status for the client
  sessionData: { type: String, default: "" } // Stores session data if needed
});

const SchoolConnection = mongoose.model("SchoolConnection", schoolConnectionSchema);
module.exports = SchoolConnection;

const mongoose = require('mongoose');

const whatsappTimeZoneSettingSchema = new mongoose.Schema({
  timeZone: {
    type: mongoose.Schema.ObjectId,
    ref: 'TimeZone',
    required: true,
  },
  notifications: {
    aadat:  String,
    weeklyNotification: String
  },
  whatsappNumbers: [
    {
      number: {
        type: String,
        required: true,
      },
      countryCode: {
        type: String,
        required: true, 
      },
      status : {
        type : Boolean,
        default : false
      }
    }
  ],
}, { timestamps: true });

// Create the model
const WhatsAppTimeZoneSetting = mongoose.model('WhatsAppTimeZoneSetting', whatsappTimeZoneSettingSchema);

module.exports = WhatsAppTimeZoneSetting;

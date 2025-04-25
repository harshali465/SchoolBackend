const mongoose = require('mongoose');

const timeZoneSchema = new mongoose.Schema({
    timezone: {
        type: String,
        required: true,
        unique: true, 
    }
});

const TimeZone = mongoose.model('TimeZone', timeZoneSchema);

module.exports = TimeZone;

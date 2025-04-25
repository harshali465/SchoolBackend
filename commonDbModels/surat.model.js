const mongoose = require('mongoose');

const suratSchema = new mongoose.Schema({
  suratName: { type: String, required: true },
  ayatNo: { type: Number, required: true },
  pageNumber: { type: Number, required: true },
  orderName : { type: Number, required: true }, 
});

const Surat = mongoose.model('Surat', suratSchema);

module.exports = Surat;
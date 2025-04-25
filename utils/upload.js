const multer = require('multer');
const uuid = require('uuid');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname)); // Save files with a unique name
  }
});

// Create multer instance with custom field handling
const upload = multer({ storage: storage }).any(); // Accept any field name

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};

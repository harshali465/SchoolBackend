const crypto = require('crypto');

const convertToMidnight = (dateString) => {
  const date = new Date(dateString);
  date.setUTCHours(0, 0, 0, 0); // Set UTC time to midnight

  return date.toISOString();
};

const generatePassword = async(length = 8, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => {
  const result = [];
  const charsetLength = charset.length;
  const randomValues = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result.push(charset[randomValues[i] % charsetLength]);
  }

  return result.join('');
}

module.exports = { convertToMidnight, generatePassword };

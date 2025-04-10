// staff.js
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  contact: String,
});

module.exports = mongoose.model('Staff', staffSchema);

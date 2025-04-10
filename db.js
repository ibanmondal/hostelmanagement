// db.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  year: String,
  department: String,
  gender: String,
  contact: String,
  roomNumber: String
});

module.exports = mongoose.model('Student', studentSchema);

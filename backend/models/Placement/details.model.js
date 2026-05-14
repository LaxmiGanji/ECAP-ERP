const mongoose = require("mongoose");

const placementDetails = new mongoose.Schema({
  employeeId: {
    type: Number,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
  },
  dob: {
    type: Date,
  },
  profile: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Placement Details", placementDetails);

const mongoose = require("mongoose");

const facultyBiometricSchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true, // One biometric profile per faculty
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    referencePhotoUrl: {
      type: String,
      required: true,
    },
    faceDescriptor: {
      type: [Number], // 128-dimensional Float32Array
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FacultyBiometric", facultyBiometricSchema);

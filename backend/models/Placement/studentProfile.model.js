const mongoose = require("mongoose");

const studentPlacementProfileSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student Credential", // referencing existing student credentials
    required: true,
    unique: true
  },
  enrollmentNo: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  resumeLink: {
    type: String,
  },
  tenthPercentage: {
    type: Number,
  },
  twelfthPercentage: {
    type: Number,
  },
  cgpa: {
    type: Number,
  },
  activeBacklogs: {
    type: Number,
    default: 0,
  },
  githubLink: {
    type: String,
  },
  linkedinLink: {
    type: String,
  },
  portfolioLink: {
    type: String,
  },
  photoLink: {
    type: String,
  },
  signatureLink: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Student Placement Profile", studentPlacementProfileSchema);

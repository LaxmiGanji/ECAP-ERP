const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  drive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Placement Drive",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student Detail", // Changed from "Student Credential" to "Student Detail"
    required: true,
  },
  status: {
    type: String,
    enum: ["Applied", "Shortlisted", "Selected", "Rejected", "Waitlisted"],
    default: "Applied",
  },
  offerLetterLink: {
    type: String,
  },
  feedback: {
    type: String,
  }
}, { timestamps: true });

// Prevent a student from applying multiple times to the same drive
applicationSchema.index({ drive: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Placement Application", applicationSchema);
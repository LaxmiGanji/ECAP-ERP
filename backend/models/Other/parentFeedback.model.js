const mongoose = require("mongoose");

const parentFeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student Detail", required: true },
  enrollmentNo: { type: String, required: true },
  parentName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  message: { type: String, required: true },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: String, default: null } // Mentor or HOD Name
}, { timestamps: true });

module.exports = mongoose.model("ParentFeedback", parentFeedbackSchema);

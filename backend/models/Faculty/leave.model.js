// models/Faculty/leave.model.js
const mongoose = require("mongoose");

const facultyLeaveSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
  },
  facultyName: {
    type: String,
    required: true,
  },
  dates: [{
    type: String,
    required: true,
  }],
  leaveType: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  substituteId: {
    type: String,
  },
  substituteName: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved_by_hod", "approved_by_principal", "rejected", "cancelled", "confirmed"],
    default: "pending",
  },
  branch: {
    type: String,
    required: true,
  },
  rejectionReason: {
    type: String,
  },
  hodApprovedAt: {
    type: Date,
  },
  hodApprovedBy: {
    type: String,
  },
  principalApprovedAt: {
    type: Date,
  },
  principalApprovedBy: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("FacultyLeave", facultyLeaveSchema);
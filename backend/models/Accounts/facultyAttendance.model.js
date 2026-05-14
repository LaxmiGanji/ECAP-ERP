const mongoose = require("mongoose");

const facultyAttendanceSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  presentDays: {
    type: Number,
    default: 0,
  },
  regularLeavesTaken: {
    type: Number,
    default: 0,
  },
  optionalLeavesUsed: {
    type: Number,
    default: 0,
  },
  optionalLeavesAvailable: {
    type: Number,
    default: 1, // Default 1 per month
  },
  carriedForwardFromPrevious: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

facultyAttendanceSchema.index({ facultyId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("FacultyAttendance", facultyAttendanceSchema);

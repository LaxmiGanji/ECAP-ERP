const mongoose = require("mongoose");

const attendanceConfigSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  totalWorkingDays: {
    type: Number,
    required: true,
  },
  globalHolidays: [{
    date: { type: String },
    reason: { type: String }
  }]
}, { timestamps: true });

// Ensure unique month-year combination
attendanceConfigSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("AttendanceConfig", attendanceConfigSchema);

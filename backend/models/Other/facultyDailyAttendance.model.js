const mongoose = require("mongoose");

const facultyDailyAttendanceSchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
      index: true,
    },
    day: {
      type: String, // Monday, Tuesday, etc.
      required: true,
    },
    checkInTime: {
      type: String, // HH:MM:SS format
      default: null,
    },
    checkOutTime: {
      type: String, // HH:MM:SS format
      default: null,
    },
    checkInPhotoUrl: {
      type: String,
      default: null,
    },
    checkOutPhotoUrl: {
      type: String,
      default: null,
    },
    checkInLocation: {
      latitude: Number,
      longitude: Number,
    },
    checkOutLocation: {
      latitude: Number,
      longitude: Number,
    },
    checkInDistance: {
      type: Number, // distance from geofence center in meters
      default: null,
    },
    checkOutDistance: {
      type: Number, // distance from geofence center in meters
      default: null,
    },
    status: {
      type: String,
      enum: ["Checked-In", "Completed", "Absent"],
      default: "Checked-In",
    },
  },
  { timestamps: true }
);

// One daily record per faculty member
facultyDailyAttendanceSchema.index({ facultyId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("FacultyDailyAttendance", facultyDailyAttendanceSchema);

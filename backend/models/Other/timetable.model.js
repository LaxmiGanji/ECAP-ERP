// timetable.model.js
const mongoose = require("mongoose");

const TimeTableSchema = new mongoose.Schema({
  branch: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  schedule: [{
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periods: [{
      periodNumber: {
        type: Number,
        required: true
      },
      subject: {
        type: String,
        required: true
      },
      faculty: {
        type: String,
        default: ""
      },
      facultyName: {
        type: String,
        default: ""
      },
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      timeSlot: {
        type: String,
        default: ""
      },
      regulation: {
        type: String,
        default: ""
      }
    }]
  }],
  metadata: {
    lectureHall: { type: String, default: "" },
    effectiveDate: { type: String, default: "" },
    classIncharge: { type: String, default: "" },
    theorySubjects: [{
      code: String,
      subject: String,
      faculty: String,
      facultyId: String,
      phone: String
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model("Timetable", TimeTableSchema);
//attendence.model.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    enrollmentNo: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    period: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    importMode: {
      type: String,
      enum: ["DAILY", "BULK"],
      default: "DAILY",
      index: true,
    },
    importBatchId: {
      type: String,
      default: null,
      index: true,
    },
    importedAt: {
      type: Date,
    },
    totalClassesSnapshot: {
      type: Number,
      default: null,
    },
    batchPresentCount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("Attendance", attendanceSchema);

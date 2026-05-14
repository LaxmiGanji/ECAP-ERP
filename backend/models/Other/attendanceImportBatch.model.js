const mongoose = require("mongoose");

const subjectGroupSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
    semester: { type: Number, required: true },
    subject: { type: String, required: true },
    section: { type: String, required: true },
    totalClasses: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
  },
  { _id: false }
);

const attendanceImportBatchSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true, index: true },
    summary: {
      totalStudents: { type: Number, default: 0 },
      totalRecords: { type: Number, default: 0 },
    },
    subjectGroups: [subjectGroupSchema],
    fileName: { type: String },
    importedAt: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

attendanceImportBatchSchema.pre("save", function (next) {
  this.lastSyncedAt = new Date();
  next();
});

module.exports = mongoose.model(
  "AttendanceImportBatch",
  attendanceImportBatchSchema
);


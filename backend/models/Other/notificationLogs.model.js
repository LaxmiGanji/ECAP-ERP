const mongoose = require("mongoose");

const notificationLogsSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student Detail", required: true },
  enrollmentNo: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientContact: { type: String, required: true }, // Phone or Email
  channel: { type: String, enum: ["SMS", "EMAIL", "WHATSAPP"], required: true },
  type: { type: String, enum: ["ABSENT_INSTANT", "ABSENT_DAILY", "RESULTS"], required: true },
  messageContent: { type: String, required: true },
  status: { type: String, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
  errorMessage: { type: String, default: null },
  referenceId: { type: String } // Subject code, date, or exam type for uniqueness
}, { timestamps: true });

// Index for performance and prevent duplicates
notificationLogsSchema.index({ enrollmentNo: 1, type: 1, referenceId: 1 });

module.exports = mongoose.model("NotificationLog", notificationLogsSchema);

const mongoose = require("mongoose");

const parentMessageSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student Detail", required: true },
  enrollmentNo: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  recipientType: { type: String, enum: ["Father", "Mother", "Both", "Primary"], default: "Primary" },
  recipientName: { type: String },
  recipientPhone: { type: String },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ["Faculty", "Admin", "HOD", "Principal"], required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["General", "Attendance", "Academic", "Discipline", "Fee", "Emergency"], 
    default: "General" 
  },
  sentVia: [{ type: String }],
  parentPortalLink: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("ParentMessage", parentMessageSchema);

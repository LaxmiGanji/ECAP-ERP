// models/Faculty/leaveQuota.model.js
const mongoose = require("mongoose");

const leaveQuotaSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true // Quotas are set per year
  },
  quotas: {
    "Casual Leave": { type: Number, default: 0 },
    "Earned Leave": { type: Number, default: 0 },
    "Medical Leave": { type: Number, default: 0 },
    "Sick Leave": { type: Number, default: 0 },
    "Vacation Leave": { type: Number, default: 0 },
    "Commuted Leave (Half Pay Leave)": { type: Number, default: 0 },
    "Maternity Leave": { type: Number, default: 0 },
    "Study Leave": { type: Number, default: 0 },
    "Sabbatical Leave": { type: Number, default: 0 },
    "Overseas Assignment Leave": { type: Number, default: 0 },
    "Half Day Leave": { type: Number, default: 0 },
    "Optional Leave": { type: Number, default: 0 },
    "Paternity Leave": { type: Number, default: 0 },
    "Duty Leave": { type: Number, default: 0 }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("LeaveQuota", leaveQuotaSchema);

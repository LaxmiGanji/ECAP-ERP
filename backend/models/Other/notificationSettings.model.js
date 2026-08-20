const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema({
  // Status Toggles
  smsEnabled: { type: Boolean, default: false },
  emailEnabled: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: false },
  
  // Triggers
  autoAbsentAlert: { type: Boolean, default: true },
  absentAlertMode: { type: String, enum: ["INSTANT", "DAILY_CONSOLIDATED"], default: "DAILY_CONSOLIDATED" },
  autoResultAlert: { type: Boolean, default: true },

  // API Credentials
  smsGatewayUrl: { type: String, default: "" },
  smsApiKey: { type: String, default: "" },
  twilioSid: { type: String, default: "" },
  twilioToken: { type: String, default: "" },
  twilioFromNumber: { type: String, default: "" },
  
  whatsappToken: { type: String, default: "" },
  whatsappPhoneNumberId: { type: String, default: "" },

  smtpHost: { type: String, default: "" },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String, default: "" },
  smtpPass: { type: String, default: "" },
  smtpFrom: { type: String, default: "" },
  emailApiKey: { type: String, default: "" },

  // Message Templates
  absentInstantTemplate: { 
    type: String, 
    default: "Dear Parent, your ward {student_name} was ABSENT for Period {period} ({subject}) on {date}. View details: {portal_link}" 
  },
  absentConsolidatedTemplate: { 
    type: String, 
    default: "Dear Parent, your ward {student_name} was absent for {absent_count} period(s) today ({date}). Details: {portal_link}" 
  },
  resultsTemplate: { 
    type: String, 
    default: "Dear Parent, the results of {exam_type} for {student_name} have been published. Marks: {marks_summary}. View full report card: {portal_link}" 
  }
}, { timestamps: true });

module.exports = mongoose.model("NotificationSettings", notificationSettingsSchema);

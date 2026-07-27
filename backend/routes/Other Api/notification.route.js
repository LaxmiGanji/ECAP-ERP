const express = require("express");
const router = express.Router();
const NotificationSettings = require("../../models/Other/notificationSettings.model");
const NotificationLog = require("../../models/Other/notificationLogs.model");
const NotificationService = require("../../services/notification.service");

// GET current settings
router.get("/settings", async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      settings = new NotificationSettings();
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE settings
router.post("/settings/update", async (req, res) => {
  try {
    const settings = await NotificationSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json({ success: true, message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET delivery logs
router.get("/logs", async (req, res) => {
  try {
    const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// TEST EMAIL dispatch
router.post("/test-email", async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: "Target email address is required" });
    }
    const settings = await NotificationService.getSettings();
    await NotificationService.dispatchEmail(
      targetEmail,
      "ECAP Test Notification - Mail Gateway Working",
      "Hello! This is a test email sent from your Sphoorthy Engineering College ECAP Notification System.\nIf you received this, your Nodemailer SMTP email configuration is working perfectly!",
      settings
    );
    res.json({ success: true, message: `Test email successfully sent to ${targetEmail}` });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// TEST SMS dispatch
router.post("/test-sms", async (req, res) => {
  try {
    const { targetPhone } = req.body;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: "Target phone number is required" });
    }
    const settings = await NotificationService.getSettings();
    await NotificationService.dispatchSMS(
      targetPhone,
      "ECAP Test SMS: Your SMS Gateway configuration is working successfully!",
      settings
    );
    res.json({ success: true, message: `Test SMS successfully dispatched to ${targetPhone}` });
  } catch (error) {
    console.error("Test SMS error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

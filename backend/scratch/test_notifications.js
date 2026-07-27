const connectToMongo = require("../Database/db");
const mongoose = require("mongoose");
const StudentDetails = require("../models/Students/details.model");
const NotificationService = require("../services/notification.service");
const NotificationSettings = require("../models/Other/notificationSettings.model");
const NotificationLog = require("../models/Other/notificationLogs.model");

// Initialize MongoDB connection
connectToMongo();

const runTest = async () => {
  console.log("Starting Notification System Verification tests...");
  try {
    // 1. Wait a brief moment for database connection to be established
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. Fetch or create a test student details record
    let student = await StudentDetails.findOne({});
    if (!student) {
      console.log("No student found in DB. Creating a dummy student for verification...");
      student = new StudentDetails({
        enrollmentNo: "TEST12345",
        firstName: "Test",
        lastName: "Student",
        phoneNumber: "9999999999",
        FatherName: "Test Father",
        FatherPhoneNumber: "9999999999",
        semester: 1,
        branch: "Computer Science",
        batch: 2026,
        regulation: "R22",
        section: "A"
      });
      await student.save();
    }
    
    console.log(`Using test student: ${student.firstName} ${student.lastName} (${student.enrollmentNo})`);

    // 3. Test secure token and link generation
    const parentLink = NotificationService.generateParentLink(student.enrollmentNo);
    console.log("Generated Secure Parent Portal Link:", parentLink);
    if (!parentLink.includes("/parent/dashboard/")) {
      throw new Error("Parent Portal link format is incorrect");
    }
    console.log("✅ Secure Token & Link Generation passed");

    // 4. Test Notification settings retrieval/initialization
    const settings = await NotificationService.getSettings();
    console.log("Fetched Notification Settings:", {
      smsEnabled: settings.smsEnabled,
      whatsappEnabled: settings.whatsappEnabled,
      emailEnabled: settings.emailEnabled,
      absentAlertMode: settings.absentAlertMode
    });
    console.log("✅ Settings Fetch passed");

    // 5. Test mock notification log creation by directly calling sendAlert
    // Since gateways are not fully configured with live tokens, we'll temporarily mock the dispatch methods
    console.log("Mocking dispatch methods to verify service logic and log creation...");
    
    const originalDispatchSMS = NotificationService.dispatchSMS;
    const originalDispatchEmail = NotificationService.dispatchEmail;
    const originalDispatchWhatsApp = NotificationService.dispatchWhatsApp;

    NotificationService.dispatchSMS = async (phone, text) => {
      console.log(`[MOCK SMS SEND] To: ${phone}, Text: "${text}"`);
      return { success: true };
    };
    NotificationService.dispatchEmail = async (email, subject, text) => {
      console.log(`[MOCK EMAIL SEND] To: ${email}, Subject: "${subject}", Text: "${text}"`);
      return { success: true };
    };
    NotificationService.dispatchWhatsApp = async (phone, text) => {
      console.log(`[MOCK WHATSAPP SEND] To: ${phone}, Text: "${text}"`);
      return { success: true };
    };

    // Temporarily enable channels in settings for the test
    const oldSmsEnabled = settings.smsEnabled;
    const oldEmailEnabled = settings.emailEnabled;
    const oldWhatsappEnabled = settings.whatsappEnabled;

    settings.smsEnabled = true;
    settings.emailEnabled = true;
    settings.whatsappEnabled = true;
    await settings.save();

    console.log("Triggering test alerts...");
    const textContent = settings.absentInstantTemplate
      .replace(/{student_name}/g, `${student.firstName} ${student.lastName}`)
      .replace(/{period}/g, "1")
      .replace(/{subject}/g, "Mathematics")
      .replace(/{date}/g, new Date().toLocaleDateString())
      .replace(/{portal_link}/g, parentLink);

    const testRef = `TEST_REF_${Date.now()}`;

    // Dispatch SMS Alert
    await NotificationService.sendAlert({
      student,
      type: "ABSENT_INSTANT",
      content: textContent,
      channel: "SMS",
      referenceId: testRef
    });

    // Dispatch Email Alert
    await NotificationService.sendAlert({
      student,
      type: "ABSENT_INSTANT",
      content: textContent,
      channel: "EMAIL",
      referenceId: testRef
    });

    // 6. Restore original dispatches and settings
    NotificationService.dispatchSMS = originalDispatchSMS;
    NotificationService.dispatchEmail = originalDispatchEmail;
    NotificationService.dispatchWhatsApp = originalDispatchWhatsApp;

    settings.smsEnabled = oldSmsEnabled;
    settings.emailEnabled = oldEmailEnabled;
    settings.whatsappEnabled = oldWhatsappEnabled;
    await settings.save();

    // 7. Verify Log entries in Database
    const logs = await NotificationLog.find({ referenceId: testRef });
    console.log(`Found ${logs.length} log records for reference: ${testRef}`);
    
    if (logs.length !== 2) {
      throw new Error(`Expected 2 logs, found ${logs.length}`);
    }

    logs.forEach(log => {
      console.log(`Log - Channel: ${log.channel}, Status: ${log.status}, Recipient: ${log.recipientContact}`);
      if (log.status !== "SENT") {
        throw new Error(`Expected status to be SENT, got ${log.status}`);
      }
    });

    console.log("✅ End-to-End Service & Logging test passed successfully!");
    
  } catch (err) {
    console.error("❌ Verification test failed:", err.message);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed. Test run complete.");
    process.exit(0);
  }
};

runTest();

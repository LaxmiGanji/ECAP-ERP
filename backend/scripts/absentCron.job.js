const cron = require("node-cron");
const StudentDetails = require("../models/Students/details.model");
const Attendance = require("../models/Other/attedence.model");
const NotificationService = require("../services/notification.service");
const NotificationLog = require("../models/Other/notificationLogs.model");

// Run every day from Monday to Saturday at 17:00 (5:00 PM)
const initAbsentCron = () => {
  console.log("Initializing Automated Absentee Daily Consolidated Cron Job (scheduled for 5:00 PM Mon-Sat)...");
  
  cron.schedule("0 17 * * 1-6", async () => {
    console.log("Running scheduled daily consolidated attendance notification cron job...");
    try {
      const settings = await NotificationService.getSettings();
      if (!settings.autoAbsentAlert || settings.absentAlertMode !== "DAILY_CONSOLIDATED") {
        console.log("Daily consolidated absent alerts are disabled in settings.");
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 1. Find all attendance logs recorded today to know which classes were held
      const activeClasses = await Attendance.aggregate([
        { $match: { date: { $gte: todayStart, $lte: todayEnd } } },
        { 
          $group: { 
            _id: { 
              branch: "$branch", 
              semester: "$semester", 
              section: "$section", 
              subject: "$subject", 
              period: "$period" 
            } 
          } 
        }
      ]);

      if (activeClasses.length === 0) {
        console.log("No attendance was marked in the system today. Skipping notification checks.");
        return;
      }

      // Group active periods by branch_semester_section key
      const classMap = {};
      activeClasses.forEach(c => {
        const key = `${c._id.branch}_${c._id.semester}_${c._id.section}`;
        if (!classMap[key]) classMap[key] = [];
        classMap[key].push({ subject: c._id.subject, period: c._id.period });
      });

      // 2. Fetch all students who might have been absent
      const students = await StudentDetails.find({});
      let alertCount = 0;

      for (const student of students) {
        const key = `${student.branch}_${student.semester}_${student.section}`;
        const periodsHeld = classMap[key];
        if (!periodsHeld || periodsHeld.length === 0) continue;

        // Find student present records today
        const presentRecords = await Attendance.find({
          enrollmentNo: student.enrollmentNo,
          date: { $gte: todayStart, $lte: todayEnd }
        });

        const presentPeriods = presentRecords.map(r => r.period);
        const absentPeriods = periodsHeld.filter(ph => !presentPeriods.includes(ph.period));

        if (absentPeriods.length > 0) {
          const parentLink = NotificationService.generateParentLink(student.enrollmentNo);
          const absentDetails = absentPeriods.map(ap => `Period ${ap.period} (${ap.subject})`).join(", ");
          
          const text = settings.absentConsolidatedTemplate
            .replace("{student_name}", `${student.firstName || ''} ${student.lastName || ''}`.trim())
            .replace("{absent_count}", absentPeriods.length)
            .replace("{date}", todayStart.toLocaleDateString())
            .replace("{portal_link}", parentLink) + ` (${absentDetails})`;

          const referenceId = `DAILY_${todayStart.toISOString().split('T')[0]}`;

          // Avoid duplicate daily consolidated message sends
          const alreadySentLog = await NotificationLog.findOne({
            enrollmentNo: student.enrollmentNo,
            referenceId,
            status: "SENT"
          });

          if (!alreadySentLog) {
            // Dispatch in parallel
            if (settings.smsEnabled) {
              NotificationService.sendAlert({ student, type: "ABSENT_DAILY", content: text, channel: "SMS", referenceId });
            }
            if (settings.whatsappEnabled) {
              NotificationService.sendAlert({ student, type: "ABSENT_DAILY", content: text, channel: "WHATSAPP", referenceId });
            }
            if (settings.emailEnabled) {
              NotificationService.sendAlert({ student, type: "ABSENT_DAILY", content: text, channel: "EMAIL", referenceId });
            }
            alertCount++;
          }
        }
      }
      console.log(`Daily consolidated attendance cron completed. Dispatched alerts for ${alertCount} students.`);
    } catch (err) {
      console.error("Error in daily consolidated attendance notification cron job:", err);
    }
  });
};

module.exports = { initAbsentCron };

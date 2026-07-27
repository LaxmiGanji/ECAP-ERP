const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const StudentDetails = require("../../models/Students/details.model");
const Attendance = require("../../models/Other/attedence.model");
const Subject = require("../../models/Other/subject.model");
const Marks = require("../../models/Other/marks.model");
const ParentFeedback = require("../../models/Other/parentFeedback.model");
const ParentMessage = require("../../models/Other/parentMessage.model");

const JWT_SECRET = process.env.JWT_SECRET || "ecap_parent_secure_portal_key_2026";

// Middleware to verify the parent's temporary access token
const verifyParentToken = (req, res, next) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.enrollmentNo = decoded.enrollmentNo;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired Parent Portal link. Please contact the administrator." });
  }
};

// GET parent dashboard data
router.get("/dashboard/:token", verifyParentToken, async (req, res) => {
  try {
    // 1. Fetch Student details
    const student = await StudentDetails.findOne({ enrollmentNo: req.enrollmentNo })
      .select("enrollmentNo firstName middleName lastName branch semester section FatherName MotherName FatherPhoneNumber MotherPhoneNumber email");
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found in system." });
    }

    // 2. Fetch all subjects for the student's branch and semester
    const subjects = await Subject.find({
      "branch.name": student.branch,
      semester: Number(student.semester)
    });

    // 3. Fetch attendance records for this student
    const attendanceRecords = await Attendance.find({ 
      enrollmentNo: req.enrollmentNo,
      semester: Number(student.semester)
    });

    // 4. Group attendance by subject and calculate percentages using section totals
    const attendanceSummary = {};
    subjects.forEach(sub => {
      // Find total classes for student's section
      const sectionTotal = sub.sectionTotals 
        ? (sub.sectionTotals.find(s => s.section === student.section)?.total || 0)
        : 0;

      // Count classes attended (matching subject name)
      const attendedCount = attendanceRecords.filter(r => r.subject === sub.name).length;

      attendanceSummary[sub.name] = {
        subjectName: sub.name,
        code: sub.code,
        attended: attendedCount,
        total: sectionTotal,
        percentage: sectionTotal > 0 ? Number(((attendedCount / sectionTotal) * 100).toFixed(2)) : 0
      };
    });

    // 5. Fetch marks (both internal and external)
    const marksData = await Marks.findOne({ enrollmentNo: req.enrollmentNo }) || { internal: {}, external: {} };

    // 6. Fetch Direct Messages from Faculty & Admin to Parent
    const parentMessages = await ParentMessage.find({ enrollmentNo: req.enrollmentNo }).sort({ createdAt: -1 });

    res.json({
      success: true,
      student,
      attendanceSummary: Object.values(attendanceSummary),
      attendanceRecords: attendanceRecords.map(r => ({
        date: r.date,
        subject: r.subject,
        period: r.period
      })),
      marks: {
        internal: marksData.internal || {},
        external: marksData.external || {}
      },
      parentMessages
    });
  } catch (error) {
    console.error("Parent Portal Fetch Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// POST feedback from parent
router.post("/feedback/:token", verifyParentToken, async (req, res) => {
  try {
    const { parentName, contactNumber, message } = req.body;
    
    if (!parentName || !contactNumber || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const student = await StudentDetails.findOne({ enrollmentNo: req.enrollmentNo });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const feedback = new ParentFeedback({
      studentId: student._id,
      enrollmentNo: req.enrollmentNo,
      parentName,
      contactNumber,
      message
    });
    await feedback.save();

    res.json({ 
      success: true, 
      message: "Feedback submitted successfully! Your HOD and Class Mentor have been notified." 
    });
  } catch (error) {
    console.error("Parent Portal Feedback Error:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;

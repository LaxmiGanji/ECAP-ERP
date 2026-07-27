// routes/Other Api/ai.route.js
const express = require("express");
const router = express.Router();
const {
  predictStudentRisk,
  detectAttendanceAnomalies,
  detectSectionAnomalies,
  getSectionRiskSummary,
  chatCampusQuery
} = require("../../controllers/Other/ai.controller");

// Chatbot endpoint
router.post("/chat", chatCampusQuery);

// Student risk prediction
router.get("/risk/:enrollmentNo", predictStudentRisk);

// Student attendance anomalies
router.get("/anomalies/:enrollmentNo", detectAttendanceAnomalies);

// Section attendance anomalies (for HOD / Faculty)
router.get("/anomalies-section", detectSectionAnomalies);

// Section risk summary (for HOD / Faculty)
router.get("/section-risk", getSectionRiskSummary);

module.exports = router;

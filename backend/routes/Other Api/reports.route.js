const express = require("express");
const router = express.Router();
const {
  generateStudentReport,
  generateFacultyAttendanceReport,
  generateAlumniReport,
  generateObeAttainmentReport,
} = require("../../controllers/Other/reports.controller");

router.get("/students", generateStudentReport);
router.get("/faculty-attendance", generateFacultyAttendanceReport);
router.get("/alumni", generateAlumniReport);
router.get("/obe-attainment", generateObeAttainmentReport);

module.exports = router;

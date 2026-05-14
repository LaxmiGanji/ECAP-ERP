const express = require("express");
const router = express.Router();
const {
  setMonthlyConfig,
  getMonthlyConfig,
  updateFacultyAttendance,
  getAllFacultyAttendance,
  getFacultyAttendanceStats
} = require("../../controllers/Accounts/attendance.controller.js");

router.post("/config", setMonthlyConfig);
router.get("/config", getMonthlyConfig);
router.post("/update", updateFacultyAttendance);
router.get("/all", getAllFacultyAttendance);
router.get("/stats/:facultyId", getFacultyAttendanceStats);

module.exports = router;

//attendence.routes.js
const express = require("express");
const router = express.Router();
const Attendance = require("../../models/Other/attedence.model");
const { 
  addAttendance,
  addBulkAttendance,
  removeAttendance,
  removeBulkAttendance, 
  getAllAttendance,
  getStudentAttendance,
  deleteAttendanceById,
  getAttendanceByDate,
  checkAttendanceExists,
  getExistingAttendance
} = require("../../controllers/Other/attedence.controller");


// Routes
router.post("/add", addAttendance);
router.post('/addBulk', addBulkAttendance);
router.post("/remove", removeAttendance);
router.post('/removeBulk', removeBulkAttendance);
router.get("/getAll", getAllAttendance);
router.get("/getByDate", getAttendanceByDate);  // Renamed from getAllByDate for consistency
router.get("/getStudentAttendance/:enrollmentNo", getStudentAttendance);
router.delete("/delete/:id", deleteAttendanceById);  // New route for deletion by ID
router.get("/checkExists", checkAttendanceExists);  // Check if attendance exists for specific filters
router.get("/getExisting", getExistingAttendance);  // Get existing attendance records for specific filters





module.exports = router;
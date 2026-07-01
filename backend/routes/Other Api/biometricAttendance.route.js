const express = require("express");
const router = express.Router();
const {
  getGeofence,
  saveGeofence,
  getBiometricStatus,
  registerBiometric,
  markDailyAttendance,
  getDailyAttendanceLogs,
  getMyAttendanceLogs,
} = require("../../controllers/Other/biometricAttendance.controller.js");
const { requireAdmin } = require("../../middlewares/role.middleware.js");

// Geofence configuration
router.get("/geofence", getGeofence);
router.post("/geofence", requireAdmin, saveGeofence);

// Biometric status & registration (Faculty)
router.get("/biometric-status", getBiometricStatus);
router.post("/register-biometric", registerBiometric);
router.post("/register", registerBiometric);
router.get("/my-logs", getMyAttendanceLogs);

// Mark daily attendance (Faculty check-in / check-out)
router.post("/mark-attendance", markDailyAttendance);

// View logs (Admin & HOD)
router.get("/logs", getDailyAttendanceLogs);

module.exports = router;

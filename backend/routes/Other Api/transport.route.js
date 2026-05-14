const express = require("express");
const router = express.Router();
const transportController = require("../../controllers/Other/transport.controller");
const attendanceController = require("../../controllers/Other/attendance.controller");

// Existing routes...
router.post("/routes/create", transportController.createTransportRoute);
router.put("/routes/:id", transportController.updateTransportRoute);
router.delete("/routes/:id", transportController.deleteTransportRoute);
router.get("/routes", transportController.listTransportRoutes);
router.post("/enroll", transportController.enrollStudentToTransport);
router.get("/student/:enrollmentNo", transportController.getStudentTransportDetails);
router.get("/routes/:routeId/allocations", transportController.getRouteAllocations);
router.get("/routes/summaries", transportController.getAllRouteSummaries);
router.get("/routes/:routeId/seatmap", transportController.getSeatMap);
router.post("/routes/assign-seat", transportController.assignSeatToStudent);
router.post("/routes/:routeId/auto-assign", transportController.autoAssignSeats);
router.put("/routes/:routeId/seat-config", transportController.updateSeatConfiguration);
router.post("/routes/remove-seat", transportController.removeSeatAssignment);

// New Attendance Routes
router.get("/attendance/qr/:enrollmentNo", attendanceController.generateQRData);
router.post("/attendance/scan", attendanceController.scanQR);
router.post("/attendance/manual", attendanceController.manualAttendance);
router.get("/attendance/today/:routeId", attendanceController.getTodaysAttendance);
router.get("/attendance/report/:routeId/:startDate/:endDate", attendanceController.getAttendanceReport);
router.get("/attendance/history/:enrollmentNo", attendanceController.getStudentAttendanceHistory);
router.post("/attendance/bulk", attendanceController.bulkAttendance);

module.exports = router;
// routes/Faculty Api/leave.route.js
const express = require("express");
const router = express.Router();
const {
  requestLeave,
  getFacultyLeaves,
  cancelLeave,
  getPendingLeavesByBranch,
  getPendingLeavesForPrincipal,
  approveLeaveByPrincipal,
  rejectLeaveByPrincipal,
  approveLeave,
  rejectLeave,
  assignSubstitute,
  getAllLeaves,
} = require("../../controllers/Faculty/leave.controller.js");

// Request leave (pending)
router.post("/request", requestLeave);

// Get leave history for a faculty
router.get("/getLeaves/:facultyId", getFacultyLeaves);

// HOD: Approve/Reject leave
router.put("/approve/:leaveId", approveLeave);
router.put("/reject/:leaveId", rejectLeave);

// Principal: Approve/Reject leave
router.put("/principal/approve/:leaveId", approveLeaveByPrincipal);
router.put("/principal/reject/:leaveId", rejectLeaveByPrincipal);

// Faculty: Assign substitute after approval
router.put("/assignSubstitute/:leaveId", assignSubstitute);

// Cancel a leave request
router.put("/cancel/:leaveId", cancelLeave);

// Get pending leaves for a branch (HOD)
router.get("/pending/:branch", getPendingLeavesByBranch);

// Get pending leaves for Principal (All branches)
router.get("/principal/pending", getPendingLeavesForPrincipal);

// Get all leaves (Admin/Accounts)
router.get("/all", getAllLeaves);

module.exports = router;
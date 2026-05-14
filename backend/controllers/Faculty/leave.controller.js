// controllers/Faculty/leave.controller.js
const FacultyLeave = require("../../models/Faculty/leave.model.js");
const FacultyDetail = require("../../models/Faculty/details.model.js");
const FacultyAttendance = require("../../models/Accounts/facultyAttendance.model.js");
const AttendanceConfig = require("../../models/Accounts/attendanceConfig.model.js");

// Request leave - initially pending
const requestLeave = async (req, res) => {
  try {
    const { facultyId, facultyName, dates, leaveType, startDate, endDate, reason } = req.body;

    // Get faculty branch/department
    const faculty = await FacultyDetail.findOne({ employeeId: facultyId });
    if (!faculty || !faculty.department) {
      return res.status(404).json({ success: false, message: "Faculty department not found. Please update profile details." });
    }

    // Check if leave already exists for these dates
    const existingLeave = await FacultyLeave.findOne({
      facultyId,
      dates: { $in: dates },
      status: { $in: ["pending", "approved_by_hod", "confirmed"] }
    });

    if (existingLeave) {
      return res.status(400).json({
        success: false,
        message: "Leave already exists for some of these dates",
      });
    }

    const leave = await FacultyLeave.create({
      facultyId,
      facultyName,
      dates,
      leaveType,
      startDate,
      endDate,
      reason,
      branch: faculty.department,
      status: "pending"
    });

    res.json({
      success: true,
      message: "Leave request submitted successfully! Pending HOD approval.",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// HOD Approve leave - now just sets status for Principal approval
const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { approvedBy } = req.body;

    const leave = await FacultyLeave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    leave.status = "approved_by_hod";
    leave.hodApprovedAt = new Date();
    leave.hodApprovedBy = approvedBy;
    await leave.save();

    res.json({
      success: true,
      message: "Leave approved by HOD! Pending Principal approval.",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// HOD Reject leave
const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason, rejectedBy } = req.body;

    const leave = await FacultyLeave.findByIdAndUpdate(
      leaveId,
      { 
        status: "rejected",
        rejectionReason,
        hodApprovedBy: rejectedBy // Reusing this field
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    res.json({
      success: true,
      message: "Leave rejected by HOD",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Principal Approve leave - Final step, updates attendance
const approveLeaveByPrincipal = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { approvedBy } = req.body;

    const leave = await FacultyLeave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    if (leave.status !== "approved_by_hod") {
      return res.status(400).json({ success: false, message: "Leave must be approved by HOD first" });
    }

    const normalizedId = leave.facultyId.trim().toUpperCase();
    leave.status = "approved_by_principal";
    leave.principalApprovedAt = new Date();
    leave.principalApprovedBy = approvedBy;
    await leave.save();

    // Update Attendance Stats automatically on Principal approval
    const leaveDate = new Date(leave.dates[0]);
    const month = leaveDate.getMonth() + 1;
    const year = leaveDate.getFullYear();

    let attendance = await FacultyAttendance.findOne({ 
      facultyId: normalizedId, 
      month, 
      year 
    });

    if (!attendance) {
      attendance = new FacultyAttendance({
        facultyId: leave.facultyId,
        month,
        year,
        presentDays: 25,
        optionalLeavesUsed: 0,
        optionalLeavesAvailable: 1
      });
    }

    // Calculate Optional Leaves Availability (Cumulative from January)
    let totalUsedThisYear = 0;
    for (let m = 1; m < month; m++) {
      const prevAtt = await FacultyAttendance.findOne({ facultyId: normalizedId, month: m, year });
      if (prevAtt) totalUsedThisYear += (prevAtt.optionalLeavesUsed || 0);
    }
    
    const totalAvailableToDate = month; // 1 per month
    const currentAvailable = Math.max(1, totalAvailableToDate - totalUsedThisYear);

    if (leave.leaveType === "Optional Leave") {
      attendance.optionalLeavesUsed += leave.dates.length;
    } else {
      attendance.regularLeavesTaken += leave.dates.length;
    }
    
    attendance.optionalLeavesAvailable = currentAvailable;
    
    // Recalculate presentDays
    const config = await AttendanceConfig.findOne({ month, year });
    const totalWorking = config ? config.totalWorkingDays : 25;
    attendance.presentDays = Math.max(0, totalWorking - attendance.regularLeavesTaken);

    await attendance.save();

    res.json({
      success: true,
      message: "Leave fully approved by Principal and attendance stats updated!",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Principal Reject leave
const rejectLeaveByPrincipal = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { rejectionReason, rejectedBy } = req.body;

    const leave = await FacultyLeave.findByIdAndUpdate(
      leaveId,
      { 
        status: "rejected",
        rejectionReason,
        principalApprovedBy: rejectedBy
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    res.json({
      success: true,
      message: "Leave rejected by Principal",
      leave,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get pending leaves for Principal (all branches)
const getPendingLeavesForPrincipal = async (req, res) => {
  try {
    const leaves = await FacultyLeave.find({ 
      status: "approved_by_hod" 
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Faculty Assign Substitute - Just confirmation
const assignSubstitute = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { substituteId, substituteName } = req.body;

    const leave = await FacultyLeave.findByIdAndUpdate(
      leaveId,
      { 
        substituteId,
        substituteName,
        status: "confirmed"
      },
      { new: true }
    );

    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    res.json({
      success: true,
      message: "Substitute assigned and leave confirmed!",
      leave,
    });
  } catch (error) {
    console.error("Error in assignSubstitute:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get leaves for a faculty
const getFacultyLeaves = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const normalizedId = facultyId.trim().toUpperCase();
    const leaves = await FacultyLeave.find({ facultyId: normalizedId }).sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get pending leaves for HOD (branch-wise)
const getPendingLeavesByBranch = async (req, res) => {
  try {
    const { branch } = req.params;
    const leaves = await FacultyLeave.find({ 
      branch: { $regex: new RegExp(`^${branch}$`, 'i') }, 
      status: "pending" 
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all leaves (for Admin/Accounts)
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await FacultyLeave.find().sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Cancel leave - restore attendance
const cancelLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const leave = await FacultyLeave.findById(leaveId);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

    const normalizedId = leave.facultyId.trim().toUpperCase();
    
    // If it was already approved, we need to revert the attendance change
    if (leave.status === "approved_by_hod" || leave.status === "approved_by_principal" || leave.status === "confirmed") {
      const leaveDate = new Date(leave.dates[0]);
      const month = leaveDate.getMonth() + 1;
      const year = leaveDate.getFullYear();

      const attendance = await FacultyAttendance.findOne({ 
        facultyId: normalizedId, 
        month, 
        year 
      });

      if (attendance) {
        if (leave.leaveType === "Optional Leave") {
          attendance.optionalLeavesUsed = Math.max(0, attendance.optionalLeavesUsed - leave.dates.length);
        } else {
          attendance.regularLeavesTaken = Math.max(0, attendance.regularLeavesTaken - leave.dates.length);
        }
        
        // Recalculate presentDays
        const config = await AttendanceConfig.findOne({ month, year });
        const totalWorking = config ? config.totalWorkingDays : 25;
        attendance.presentDays = Math.max(0, totalWorking - attendance.regularLeavesTaken);
        
        await attendance.save();
      }
    }

    leave.status = "cancelled";
    await leave.save();
    
    res.json({ success: true, message: "Leave cancelled and attendance restored", leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  requestLeave,
  approveLeave,
  rejectLeave,
  assignSubstitute,
  getFacultyLeaves,
  getPendingLeavesByBranch,
  getPendingLeavesForPrincipal,
  approveLeaveByPrincipal,
  rejectLeaveByPrincipal,
  getAllLeaves,
  cancelLeave,
};
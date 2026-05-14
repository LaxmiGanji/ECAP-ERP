const AttendanceConfig = require("../../models/Accounts/attendanceConfig.model.js");
const FacultyAttendance = require("../../models/Accounts/facultyAttendance.model.js");
const FacultyDetail = require("../../models/Faculty/details.model.js");
const FacultyLeave = require("../../models/Faculty/leave.model.js");

// Set Working Days for Month
const setMonthlyConfig = async (req, res) => {
  try {
    const { month, year, totalWorkingDays, globalHolidays } = req.body;
    
    const config = await AttendanceConfig.findOneAndUpdate(
      { month, year },
      { totalWorkingDays, globalHolidays },
      { upsert: true, new: true }
    );
    
    // Get holiday dates for easier comparison
    const holidayDates = (globalHolidays || []).map(h => h.date);

    // EXHAUSTIVE RECALCULATION:
    const allFaculties = await FacultyDetail.find();
    
    for (const faculty of allFaculties) {
      const normalizedId = faculty.employeeId.trim().toUpperCase();
      
      // 1. Count approved regular leaves for this month


      const leaves = await FacultyLeave.find({
        facultyId: normalizedId,
        status: { $in: ["approved_by_hod", "approved_by_principal", "confirmed"] },
        leaveType: { $ne: "Optional Leave" }
      });

      let totalLeavesCount = 0;
      leaves.forEach(l => {
        l.dates.forEach(dateStr => {
          const d = new Date(dateStr);
          if (
            d.getMonth() + 1 === parseInt(month) && 
            d.getFullYear() === parseInt(year) &&
            !holidayDates.includes(dateStr)
          ) {
            totalLeavesCount++;
          }
        });
      });

      // 2. Count optional leaves
      const optionalLeaves = await FacultyLeave.find({
        facultyId: normalizedId,
        status: { $in: ["approved_by_hod", "approved_by_principal", "confirmed"] },
        leaveType: "Optional Leave"
      });

      let usedOptional = 0;
      optionalLeaves.forEach(l => {
        l.dates.forEach(dateStr => {
          const d = new Date(dateStr);
          if (
            d.getMonth() + 1 === parseInt(month) && 
            d.getFullYear() === parseInt(year) &&
            !holidayDates.includes(dateStr)
          ) {
            usedOptional++;
          }
        });
      });

      // 3. Find or Create attendance record
      await FacultyAttendance.findOneAndUpdate(
        { facultyId: normalizedId, month, year },
        { 
          regularLeavesTaken: totalLeavesCount,
          presentDays: Math.max(0, totalWorkingDays - totalLeavesCount),
          optionalLeavesUsed: usedOptional
        },
        { upsert: true, new: true }
      );
    }
    
    res.json({ success: true, message: "Attendance recalculated for all faculty members based on leave history", config });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Monthly Config
const getMonthlyConfig = async (req, res) => {
  try {
    const { month, year } = req.query;
    const config = await AttendanceConfig.findOne({ month, year });
    res.json({ success: true, config });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Track/Update Faculty Attendance
const updateFacultyAttendance = async (req, res) => {
  try {
    const { facultyId, month, year, presentDays, optionalLeavesUsed } = req.body;
    
    // Get previous month's balance for carry forward
    // Optional Leave Carry Forward Logic (Start from Jan of current year)
    const currentYear = year;
    let totalUsedThisYear = 0;
    for (let m = 1; m < month; m++) {
      const prevAtt = await FacultyAttendance.findOne({ facultyId, month: m, year: currentYear });
      if (prevAtt) totalUsedThisYear += (prevAtt.optionalLeavesUsed || 0);
    }
    
    const totalAvailableToDate = month; // 1 per month (Jan to current month)
    const currentAvailable = Math.max(1, totalAvailableToDate - totalUsedThisYear);
    
    const config = await AttendanceConfig.findOne({ month, year });
    const totalWorking = config ? config.totalWorkingDays : 25;
    const regLeaves = Math.max(0, totalWorking - presentDays);

    const attendance = await FacultyAttendance.findOneAndUpdate(
      { facultyId, month, year },
      { 
        presentDays, 
        regularLeavesTaken: regLeaves,
        optionalLeavesUsed, 
        optionalLeavesAvailable: currentAvailable,
        carriedForwardFromPrevious: totalAvailableToDate - 1 - totalUsedThisYear
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, message: "Attendance updated", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get All Faculty Attendance for a month
const getAllFacultyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month);
    const y = parseInt(year);
    const attendance = await FacultyAttendance.find({ month: m, year: y });
    
    // Enrich with cumulative optional leave info
    const enrichedAttendance = await Promise.all(attendance.map(async (att) => {
      let totalUsedThisYear = 0;
      for (let prevM = 1; prevM < m; prevM++) {
        const prev = await FacultyAttendance.findOne({ facultyId: att.facultyId, month: prevM, year: y });
        if (prev) totalUsedThisYear += (prev.optionalLeavesUsed || 0);
      }
      
      return {
        ...att._doc,
        optionalLeavesAvailable: m, // Cumulative: 1 per month
        optionalLeavesUsedTotal: totalUsedThisYear + att.optionalLeavesUsed
      };
    }));

    res.json({ success: true, attendance: enrichedAttendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get Attendance Stats for a specific faculty (last 6 months)
const getFacultyAttendanceStats = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const normalizedId = facultyId.trim().toUpperCase();
    const now = new Date();
    const stats = [];
    
    // Get last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 6; i++) {
      let m = now.getMonth() + 1 - i;
      let y = now.getFullYear();
      if (m <= 0) {
        m += 12;
        y -= 1;
      }
      
      const att = await FacultyAttendance.findOne({ facultyId: normalizedId, month: m, year: y });
      const config = await AttendanceConfig.findOne({ month: m, year: y });
      
      let totalDays = config ? config.totalWorkingDays : 25;
      let presentDays = 0;
      let percentage = 0;

      if (att) {
        presentDays = att.presentDays;
        percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      } else {
        // Default to 100% if no attendance record (assume they were present)
        presentDays = totalDays;
        percentage = 100;
      }
      
      stats.unshift({
        month: monthNames[m - 1],
        percentage: Math.min(100, Math.round(percentage)),
        presentDays,
        totalDays
      });
    }

    // Get current year's optional leave balance (Cumulative from January)
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    let totalUsedThisYear = 0;
    // Iterate from Jan (1) to current month
    for (let m = 1; m <= currentMonth; m++) {
      const att = await FacultyAttendance.findOne({ facultyId: normalizedId, month: m, year: currentYear });
      if (att) totalUsedThisYear += (att.optionalLeavesUsed || 0);
    }
    
    const optionalLeave = {
      used: totalUsedThisYear,
      available: currentMonth, // 1 per month since Jan
      percentage: Math.min(100, Math.round((totalUsedThisYear / currentMonth) * 100))
    };

    res.json({ success: true, stats, optionalLeave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  setMonthlyConfig,
  getMonthlyConfig,
  updateFacultyAttendance,
  getAllFacultyAttendance,
  getFacultyAttendanceStats
};

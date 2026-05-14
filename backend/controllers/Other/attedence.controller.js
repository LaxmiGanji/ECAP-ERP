//attendence.controller.js
const Attendance = require("../../models/Other/attedence.model");

const addAttendance = async (req, res) => {
  try {
    const { enrollmentNo, name, branch, semester, subject, period, section, date } = req.body;

    // Create a new attendance record
    const attendance = new Attendance({
      enrollmentNo,
      name,
      branch,
      subject,
      semester,
      period,
      section,
      date: date ? new Date(date) : Date.now() // Use provided date or current date
    });

    await attendance.save();
    res.status(200).json({ success: true, message: "Attendance added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add attendance", error });
  }
};

const addBulkAttendance = async (req, res) => {
  try {
    const attendanceRecords = req.body.map(record => ({
      enrollmentNo: record.enrollmentNo,
      name: record.name,
      branch: record.branch,
      subject: record.subject,
      semester: record.semester,
      period: record.period,
      section: record.section,
      date: record.date ? new Date(record.date) : Date.now() // Use provided date or current date
    }));


    // Check for existing attendance records to prevent duplicates
    const existingRecords = await Attendance.find({
      $or: attendanceRecords.map(record => ({
        enrollmentNo: record.enrollmentNo,
        subject: record.subject,
        semester: record.semester,
        period: record.period,
        section: record.section,
        date: {
          $gte: new Date(record.date).setHours(0, 0, 0, 0),
          $lt: new Date(record.date).setHours(23, 59, 59, 999)
        }
      }))
    });

    if (existingRecords.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Some attendance records already exist for the selected date/subject/period/section",
        existingRecords: existingRecords.map(record => ({
          enrollmentNo: record.enrollmentNo,
          name: record.name,
          subject: record.subject,
          period: record.period,
          section: record.section,
          date: record.date
        }))
      });
    }

    await Attendance.insertMany(attendanceRecords);
    res.status(200).json({ success: true, message: "Bulk attendance added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add bulk attendance", error });
  }
};

const removeAttendance = async (req, res) => {
  try {
    const { enrollmentNo, branch, subject, semester, period, section, date } = req.body;

    // Build the query object
    const query = {
      enrollmentNo,
      branch,
      subject,
      semester,
      period,
      section,
    };

    // Add date to query if provided
    if (date) {
      query.date = new Date(date);
    }

    console.log('Remove attendance query:', query); // For debugging

    // Find and remove attendance record based on criteria
    const result = await Attendance.findOneAndDelete(query);

    if (result) {
      res.status(200).json({ success: true, message: "Attendance removed successfully" });
    } else {
      res.status(404).json({ success: false, message: "Attendance record not found" });
    }
  } catch (error) {
    console.error('Remove attendance error:', error);
    res.status(500).json({ success: false, message: "Failed to remove attendance", error: error.message });
  }
};

const removeBulkAttendance = async (req, res) => {
  try {
    const attendanceRecords = req.body;

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid attendance data format" 
      });
    }

    // Create delete operations for each record
    const deleteOperations = attendanceRecords.map(record => {
      const filter = {
        enrollmentNo: record.enrollmentNo,
        subject: record.subject,
        semester: record.semester,  
        period: record.period,
        section: record.section,
      };
      
      // Add date to filter if provided
      if (record.date) {
        filter.date = new Date(record.date);
      }
      
      return {
        deleteMany: { filter }
      };
    });

    // Execute bulk delete operation
    const result = await Attendance.bulkWrite(deleteOperations);

    res.status(200).json({ 
      success: true, 
      message: "Bulk attendance removed successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error removing bulk attendance:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to remove bulk attendance",
      error: error.message 
    });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ date: -1 });
    res.status(200).json({
      success: true,
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance records",
      error
    });
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const { subject, startDate, endDate } = req.query;
    
    let query = {};
    
    if (subject) {
      query.subject = subject;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendance = await Attendance.find(query).sort({ date: -1 });
    
    res.status(200).json({ success: true, attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getStudentAttendance = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    const { semester } = req.query;

    const query = { enrollmentNo };
    if (semester) {
      query.semester = Number(semester);
    }

    // Find all attendance records for the given student
    const attendanceRecords = await Attendance.find(query);

    // Calculate total attendance
    const totalAttendance = attendanceRecords.length;

    res.status(200).json({
      success: true,
      message: "Attendance fetched successfully",
      totalAttendance,
      attendanceRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch student attendance",
      error,
    });
  }
};

const mongoose = require('mongoose'); // Add this at the top

const deleteAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if ID is a valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid attendance ID format" 
      });
    }

    const deletedAttendance = await Attendance.findByIdAndDelete(id);

    if (!deletedAttendance) {
      return res.status(404).json({ 
        success: false, 
        message: "Attendance record not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Attendance deleted successfully",
      data: deletedAttendance 
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attendance",
      error: error.message // Send the actual error message
    });
  }
};

// Check if attendance exists for specific date/branch/semester/period/section
const checkAttendanceExists = async (req, res) => {
  try {
    const { branch, semester, period, section, subject, date } = req.query;

    if (!branch || !semester || !period || !section || !subject || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: branch, semester, period, section, subject, date"
      });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.find({
      branch,
      semester: Number(semester),
      period,
      section,
      subject,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('enrollmentNo name');

    res.status(200).json({
      success: true,
      exists: existingAttendance.length > 0,
      count: existingAttendance.length,
      attendanceRecords: existingAttendance
    });
  } catch (error) {
    console.error('Check attendance exists error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to check attendance existence",
      error: error.message
    });
  }
};

// Get existing attendance records for specific filters
const getExistingAttendance = async (req, res) => {
  try {
    const { branch, semester, period, section, subject, date } = req.query;

    if (!branch || !semester || !period || !section || !subject || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: branch, semester, period, section, subject, date"
      });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.find({
      branch,
      semester: Number(semester),
      period,
      section,
      subject,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).select('enrollmentNo name branch section subject period semester date');

    res.status(200).json({
      success: true,
      attendanceRecords: existingAttendance,
      count: existingAttendance.length
    });
  } catch (error) {
    console.error('Get existing attendance error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get existing attendance",
      error: error.message
    });
  }
};

module.exports = { 
  addAttendance,
  addBulkAttendance, 
  removeAttendance,
  removeBulkAttendance, 
  getAllAttendance, 
  getStudentAttendance,
  getAttendanceByDate,
  deleteAttendanceById,
  checkAttendanceExists,
  getExistingAttendance
  
};
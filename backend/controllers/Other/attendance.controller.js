const TransportAttendance = require("../../models/Other/transportAttendance.model");
const StudentDetails = require("../../models/Students/details.model");
const TransportRoute = require("../../models/Other/transport.model");

// Generate QR data for student
const generateQRData = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    
    const student = await StudentDetails.findOne({ enrollmentNo })
      .select("enrollmentNo firstName lastName branch semester transport");
    
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (!student.transport || student.transport.status !== "active") {
      return res.status(400).json({ 
        success: false, 
        message: "Student does not have an active transport pass" 
      });
    }

    // Get route details
    const route = await TransportRoute.findById(student.transport.routeId)
      .select("busNumber routeName driverName driverPhone");

    // Prepare QR data
    const qrData = {
      studentId: student._id,
      enrollmentNo: student.enrollmentNo,
      name: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      branch: student.branch,
      semester: student.semester,
      busNumber: student.transport.busNumber,
      routeName: student.transport.routeName,
      seatNumber: student.transport.seatNumber,
      stopName: student.transport.stopName,
      // Include timestamp to make QR unique
      timestamp: Date.now(),
      // Verification token (simple hash)
      token: Buffer.from(`${student.enrollmentNo}:${Date.now()}`).toString("base64").slice(0, 32)
    };

    res.json({
      success: true,
      qrData,
      student: {
        name: qrData.name,
        enrollmentNo: qrData.enrollmentNo,
        branch: qrData.branch,
        semester: qrData.semester,
        busNumber: qrData.busNumber,
        seatNumber: qrData.seatNumber,
        routeName: qrData.routeName
      },
      // For QR code generation on frontend
      qrString: JSON.stringify(qrData)
    });
  } catch (error) {
    console.error("Generate QR error:", error);
    res.status(500).json({ success: false, message: "Unable to generate QR data" });
  }
};

// Scan QR and record attendance
const scanQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    const scannerId = req.user?._id; // Assuming user authentication middleware
    const scannerName = req.user?.name || "Transport Staff";

    if (!qrData) {
      return res.status(400).json({ success: false, message: "QR data is required" });
    }

    let parsedData;
    try {
      parsedData = typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch (parseError) {
      return res.status(400).json({ success: false, message: "Invalid QR data format" });
    }

    // Validate required fields
    if (!parsedData.enrollmentNo || !parsedData.studentId) {
      return res.status(400).json({ success: false, message: "Invalid QR data" });
    }

    // Check if student exists and has active transport
    const student = await StudentDetails.findById(parsedData.studentId)
      .select("enrollmentNo firstName lastName branch semester transport");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (!student.transport || student.transport.status !== "active") {
      return res.status(400).json({ 
        success: false, 
        message: "Student does not have an active transport pass" 
      });
    }

    // Check if already scanned today (boarding)
    const today = new Date().toISOString().split("T")[0];
    const existingScan = await TransportAttendance.findOne({
      enrollmentNo: student.enrollmentNo,
      attendanceDate: today,
      scanType: "boarding"
    });

    if (existingScan) {
      return res.json({
        success: true,
        message: "Attendance already recorded for today",
        attendance: existingScan,
        isDuplicate: true
      });
    }

    // Get route details
    const route = await TransportRoute.findById(student.transport.routeId);

    // Create attendance record
    const attendance = await TransportAttendance.create({
      studentId: student._id,
      enrollmentNo: student.enrollmentNo,
      routeId: student.transport.routeId,
      busNumber: student.transport.busNumber,
      seatNumber: student.transport.seatNumber,
      studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      branch: student.branch,
      semester: student.semester,
      date: new Date(),
      attendanceDate: today,
      scanType: "boarding",
      location: "College",
      scannedBy: scannerId,
      scannerName: scannerName,
      deviceInfo: {
        userAgent: req.headers["user-agent"],
        platform: req.headers["sec-ch-ua-platform"] || "Unknown",
        ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress
      }
    });

    // Update student's transport attendance record
    await StudentDetails.findByIdAndUpdate(student._id, {
      $push: {
        "transport.seatAttendance": {
          date: new Date(),
          present: true,
          markedBy: scannerName,
          notes: "QR Scan Attendance"
        }
      }
    });

    res.json({
      success: true,
      message: "Attendance recorded successfully",
      attendance,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        enrollmentNo: student.enrollmentNo,
        branch: student.branch,
        semester: student.semester,
        busNumber: student.transport.busNumber,
        seatNumber: student.transport.seatNumber,
        stopName: student.transport.stopName
      }
    });
  } catch (error) {
    console.error("Scan QR error:", error);
    res.status(500).json({ success: false, message: "Unable to scan QR code" });
  }
};

// Manual attendance entry
const manualAttendance = async (req, res) => {
  try {
    const { enrollmentNo, date, status, notes } = req.body;
    const scannerId = req.user?._id;
    const scannerName = req.user?.name || "Transport Staff";

    if (!enrollmentNo) {
      return res.status(400).json({ success: false, message: "Enrollment number is required" });
    }

    const student = await StudentDetails.findOne({ enrollmentNo })
      .select("enrollmentNo firstName lastName branch semester transport");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (!student.transport || student.transport.status !== "active") {
      return res.status(400).json({ 
        success: false, 
        message: "Student does not have an active transport pass" 
      });
    }

    const attendanceDate = date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    const scanDate = date ? new Date(date) : new Date();

    // Create attendance record
    const attendance = await TransportAttendance.create({
      studentId: student._id,
      enrollmentNo: student.enrollmentNo,
      routeId: student.transport.routeId,
      busNumber: student.transport.busNumber,
      seatNumber: student.transport.seatNumber,
      studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      branch: student.branch,
      semester: student.semester,
      date: scanDate,
      attendanceDate: attendanceDate,
      scanType: "boarding",
      location: "College",
      scannedBy: scannerId,
      scannerName: scannerName,
      verificationMethod: "manual",
      notes: notes || "Manual attendance entry",
      status: status || "present",
      deviceInfo: {
        userAgent: req.headers["user-agent"],
        platform: req.headers["sec-ch-ua-platform"] || "Unknown",
        ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress
      }
    });

    // Update student's transport attendance
    await StudentDetails.findByIdAndUpdate(student._id, {
      $push: {
        "transport.seatAttendance": {
          date: scanDate,
          present: status === "present" || status === "late",
          markedBy: scannerName,
          notes: notes || "Manual attendance"
        }
      }
    });

    res.json({
      success: true,
      message: "Manual attendance recorded successfully",
      attendance
    });
  } catch (error) {
    console.error("Manual attendance error:", error);
    res.status(500).json({ success: false, message: "Unable to record manual attendance" });
  }
};

// Get today's attendance for a route
const getTodaysAttendance = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    const route = await TransportRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const today = new Date().toISOString().split("T")[0];
    
    // Get all allocations for this route
    const allocations = route.allocations || [];
    
    // Get today's attendance records
    const attendanceRecords = await TransportAttendance.find({
      routeId: routeId,
      attendanceDate: today,
      scanType: "boarding"
    });

    // Create map of enrolled students with attendance status
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      attendanceMap.set(record.enrollmentNo, record);
    });

    // Prepare response with all students and their attendance status
    const attendanceList = await Promise.all(allocations.map(async (alloc) => {
      const student = await StudentDetails.findOne({ enrollmentNo: alloc.enrollmentNo })
        .select("firstName lastName gender phoneNumber");
      
      const attendance = attendanceMap.get(alloc.enrollmentNo);
      
      return {
        enrollmentNo: alloc.enrollmentNo,
        name: student ? `${student.firstName || ""} ${student.lastName || ""}`.trim() : alloc.enrollmentNo,
        gender: student?.gender,
        phoneNumber: student?.phoneNumber,
        stopName: alloc.stopName,
        seatNumber: alloc.seatNumber,
        farePaid: alloc.farePaid,
        present: !!attendance,
        status: attendance?.status || "absent",
        scanTime: attendance?.date,
        minutesLate: attendance?.minutesLate || 0,
        scannedBy: attendance?.scannerName
      };
    }));

    // Calculate statistics
    const presentCount = attendanceList.filter(s => s.present).length;
    const lateCount = attendanceList.filter(s => s.status === "late").length;
    const absentCount = attendanceList.filter(s => !s.present).length;

    res.json({
      success: true,
      date: today,
      route: {
        _id: route._id,
        busNumber: route.busNumber,
        routeName: route.routeName,
        capacity: route.capacity,
        allocatedSeats: route.allocatedSeats
      },
      statistics: {
        totalStudents: attendanceList.length,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendancePercentage: attendanceList.length > 0 ? 
          Math.round((presentCount / attendanceList.length) * 100) : 0
      },
      attendance: attendanceList.sort((a, b) => {
        // Sort by seat number if available
        if (a.seatNumber && b.seatNumber) {
          return a.seatNumber.localeCompare(b.seatNumber);
        }
        return a.enrollmentNo.localeCompare(b.enrollmentNo);
      })
    });
  } catch (error) {
    console.error("Get today's attendance error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch attendance" });
  }
};

// Get attendance report for date range
const getAttendanceReport = async (req, res) => {
  try {
    const { routeId, startDate, endDate } = req.params;
    
    const route = await TransportRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const report = await TransportAttendance.getAttendanceSummary(routeId, startDate, endDate);
    
    res.json({
      success: true,
      route: {
        busNumber: route.busNumber,
        routeName: route.routeName
      },
      period: { startDate, endDate },
      report
    });
  } catch (error) {
    console.error("Attendance report error:", error);
    res.status(500).json({ success: false, message: "Unable to generate report" });
  }
};

// Get student attendance history
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    const { month, year } = req.query;
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const targetYear = year || currentYear;
    const targetMonth = month || currentMonth;
    
    const history = await TransportAttendance.getStudentMonthlyAttendance(
      enrollmentNo, 
      targetYear, 
      targetMonth
    );

    // Get student details
    const student = await StudentDetails.findOne({ enrollmentNo })
      .select("firstName lastName branch semester transport");

    res.json({
      success: true,
      student: {
        name: student ? `${student.firstName} ${student.lastName}`.trim() : enrollmentNo,
        enrollmentNo: enrollmentNo,
        branch: student?.branch,
        semester: student?.semester,
        busNumber: student?.transport?.busNumber,
        seatNumber: student?.transport?.seatNumber
      },
      month: targetMonth,
      year: targetYear,
      attendanceHistory: history
    });
  } catch (error) {
    console.error("Student attendance history error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch attendance history" });
  }
};

// Mark multiple students as present/absent
const bulkAttendance = async (req, res) => {
  try {
    const { routeId, date, attendanceList } = req.body;
    const scannerId = req.user?._id;
    const scannerName = req.user?.name || "Transport Staff";

    if (!routeId || !date || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({ 
        success: false, 
        message: "Route ID, date, and attendance list are required" 
      });
    }

    const route = await TransportRoute.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const attendanceDate = new Date(date).toISOString().split("T")[0];
    const results = [];
    const errors = [];

    for (const item of attendanceList) {
      try {
        const student = await StudentDetails.findOne({ enrollmentNo: item.enrollmentNo });
        
        if (!student) {
          errors.push(`${item.enrollmentNo}: Student not found`);
          continue;
        }

        // Check if already has attendance for this date
        const existing = await TransportAttendance.findOne({
          enrollmentNo: item.enrollmentNo,
          attendanceDate: attendanceDate,
          scanType: "boarding"
        });

        if (existing) {
          // Update existing record
          existing.status = item.status || "present";
          existing.notes = item.notes || "Bulk update";
          await existing.save();
          results.push({
            enrollmentNo: item.enrollmentNo,
            action: "updated",
            status: existing.status
          });
        } else {
          // Create new record
          const attendance = await TransportAttendance.create({
            studentId: student._id,
            enrollmentNo: student.enrollmentNo,
            routeId: routeId,
            busNumber: route.busNumber,
            seatNumber: student.transport?.seatNumber,
            studentName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
            branch: student.branch,
            semester: student.semester,
            date: new Date(date),
            attendanceDate: attendanceDate,
            scanType: "boarding",
            location: "College",
            scannedBy: scannerId,
            scannerName: scannerName,
            verificationMethod: "manual",
            notes: item.notes || "Bulk attendance",
            status: item.status || "present"
          });
          
          results.push({
            enrollmentNo: item.enrollmentNo,
            action: "created",
            status: attendance.status
          });
        }

        // Update student's attendance record
        await StudentDetails.findByIdAndUpdate(student._id, {
          $push: {
            "transport.seatAttendance": {
              date: new Date(date),
              present: item.status === "present" || item.status === "late",
              markedBy: scannerName,
              notes: item.notes || "Bulk attendance"
            }
          }
        });

      } catch (error) {
        errors.push(`${item.enrollmentNo}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} attendance records`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    res.status(500).json({ success: false, message: "Unable to process bulk attendance" });
  }
};

module.exports = {
  generateQRData,
  scanQR,
  manualAttendance,
  getTodaysAttendance,
  getAttendanceReport,
  getStudentAttendanceHistory,
  bulkAttendance
};
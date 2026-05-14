const mongoose = require("mongoose");

const transportAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student Detail",
      required: true,
      index: true
    },
    enrollmentNo: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportRoute",
      required: true,
      index: true
    },
    busNumber: {
      type: String,
      required: true,
      trim: true
    },
    seatNumber: {
      type: String,
      trim: true
    },
    // Student details at time of scanning
    studentName: {
      type: String,
      trim: true
    },
    branch: {
      type: String,
      trim: true
    },
    semester: {
      type: Number
    },
    // Attendance details
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    attendanceDate: {
      type: String, // Format: YYYY-MM-DD for easier querying
      required: true,
      index: true
    },
    scanType: {
      type: String,
      enum: ["boarding", "departure", "lunch_break", "other"],
      default: "boarding"
    },
    location: {
      type: String,
      trim: true,
      default: "College"
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportDetail", // Transport incharge/admin who scanned
      index: true
    },
    scannerName: {
      type: String,
      trim: true
    },
    // GPS coordinates if available
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    // Verification flags
    isVerified: {
      type: Boolean,
      default: true
    },
    verificationMethod: {
      type: String,
      enum: ["qr_scan", "manual", "rfid", "biometric"],
      default: "qr_scan"
    },
    notes: {
      type: String,
      trim: true
    },
    // Metadata
    deviceInfo: {
      userAgent: String,
      platform: String,
      ipAddress: String
    },
    // Status tracking
    status: {
      type: String,
      enum: ["present", "late", "absent", "excused", "early_departure"],
      default: "present"
    },
    // Late arrival tracking (in minutes)
    minutesLate: {
      type: Number,
      min: 0,
      default: 0
    },
    // Early departure tracking
    departedEarly: {
      type: Boolean,
      default: false
    },
    earlyDepartureTime: {
      type: Date
    }
  },
  {
    timestamps: true,
    // Create compound indexes for common queries
    indexes: [
      { enrollmentNo: 1, attendanceDate: 1 },
      { routeId: 1, attendanceDate: 1 },
      { busNumber: 1, attendanceDate: 1 },
      { scanType: 1, attendanceDate: 1 }
    ]
  }
);

// Pre-save middleware to format attendance date
transportAttendanceSchema.pre("save", function(next) {
  if (!this.attendanceDate) {
    const now = new Date();
    this.attendanceDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
  }
  
  // Calculate if student is late (if scan is after 8:30 AM for boarding)
  if (this.scanType === "boarding") {
    const scanTime = new Date(this.date);
    const lateThreshold = new Date(scanTime);
    lateThreshold.setHours(8, 30, 0, 0); // 8:30 AM
    
    if (scanTime > lateThreshold) {
      this.status = "late";
      this.minutesLate = Math.round((scanTime - lateThreshold) / (1000 * 60));
    }
  }
  
  next();
});

// Virtual for formatted date
transportAttendanceSchema.virtual("formattedDate").get(function() {
  return new Date(this.date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
});

// Virtual for formatted time
transportAttendanceSchema.virtual("formattedTime").get(function() {
  return new Date(this.date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
});

// Static method to get today's attendance for a route
transportAttendanceSchema.statics.getTodaysAttendance = async function(routeId) {
  const today = new Date().toISOString().split("T")[0];
  return this.aggregate([
    {
      $match: {
        routeId: mongoose.Types.ObjectId(routeId),
        attendanceDate: today
      }
    },
    {
      $group: {
        _id: "$enrollmentNo",
        lastScan: { $max: "$date" },
        firstScan: { $min: "$date" },
        totalScans: { $sum: 1 },
        student: { $first: "$$ROOT" }
      }
    },
    {
      $project: {
        _id: 0,
        enrollmentNo: "$_id",
        studentName: "$student.studentName",
        seatNumber: "$student.seatNumber",
        lastScanTime: "$lastScan",
        firstScanTime: "$firstScan",
        totalScans: 1,
        status: "$student.status",
        minutesLate: "$student.minutesLate"
      }
    },
    {
      $sort: { seatNumber: 1 }
    }
  ]);
};

// Static method to get attendance summary for a date range
transportAttendanceSchema.statics.getAttendanceSummary = async function(routeId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        routeId: mongoose.Types.ObjectId(routeId),
        attendanceDate: { $gte: startDate, $lte: endDate },
        scanType: "boarding"
      }
    },
    {
      $group: {
        _id: "$attendanceDate",
        totalStudents: { $addToSet: "$enrollmentNo" },
        presentCount: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0]
          }
        },
        lateCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "late"] }, 1, 0]
          }
        },
        absentCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "absent"] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        totalStudents: { $size: "$totalStudents" },
        presentCount: 1,
        lateCount: 1,
        absentCount: 1,
        attendancePercentage: {
          $multiply: [
            { $divide: ["$presentCount", { $size: "$totalStudents" }] },
            100
          ]
        }
      }
    },
    {
      $sort: { date: -1 }
    }
  ]);
};

// Static method to get student's monthly attendance
transportAttendanceSchema.statics.getStudentMonthlyAttendance = async function(enrollmentNo, year, month) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
  
  return this.aggregate([
    {
      $match: {
        enrollmentNo: enrollmentNo,
        attendanceDate: { $gte: startDate, $lte: endDate },
        scanType: "boarding"
      }
    },
    {
      $group: {
        _id: "$attendanceDate",
        attendance: { $push: "$$ROOT" }
      }
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        status: { $arrayElemAt: ["$attendance.status", 0] },
        time: { $arrayElemAt: ["$attendance.date", 0] },
        minutesLate: { $arrayElemAt: ["$attendance.minutesLate", 0] },
        scannedBy: { $arrayElemAt: ["$attendance.scannerName", 0] }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

module.exports = mongoose.model("TransportAttendance", transportAttendanceSchema);
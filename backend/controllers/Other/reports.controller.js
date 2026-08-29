const studentDetails = require("../../models/Students/details.model");
const facultyDetails = require("../../models/Faculty/details.model");
const attendanceModel = require("../../models/Other/attedence.model");
const facultyDailyAttendanceModel = require("../../models/Other/facultyDailyAttendance.model");
const markModel = require("../../models/Other/marks.model");
const coattainmentModel = require("../../models/Other/coattainment.model");

const getJntuRank = (s) => {
  const str = (typeof s === "object" ? (s?.enrollmentNo || s?.enrollment || s?.rollNo || s?.loginid || "") : (s || "")).toString().trim().toUpperCase();
  if (!str) return { prefix: "", rank: 0 };
  if (str.length < 3) return { prefix: str, rank: 0 };

  const prefix = str.substring(0, str.length - 2);
  const suff = str.substring(str.length - 2);

  if (/^\d{2}$/.test(suff)) return { prefix, rank: parseInt(suff, 10) };
  if (/^[A-Z]\d$/.test(suff)) {
    const charCode = suff.charCodeAt(0) - 65;
    const digit = parseInt(suff[1], 10);
    return { prefix, rank: 100 + charCode * 10 + digit };
  }
  return { prefix, rank: 9999 };
};

const sortEnrollmentNo = (a, b) => {
  const rA = getJntuRank(a);
  const rB = getJntuRank(b);

  if (rA.prefix !== rB.prefix) {
    return rA.prefix.localeCompare(rB.prefix, undefined, { numeric: true, sensitivity: "base" });
  }

  return rA.rank - rB.rank;
};

/**
 * 1. Generate Student Report Data (Attendance, CGPA, Backlogs, Details)
 * GET /api/reports/students
 */
const generateStudentReport = async (req, res) => {
  try {
    const { branch, batch, regulation, semester } = req.query;
    const query = {};

    if (branch && branch !== "All" && branch !== "-- Select --") query.branch = branch;
    if (batch && batch !== "All") query.batch = Number(batch);
    if (regulation && regulation !== "All") query.regulation = new RegExp(`^${regulation}$`, "i");
    if (semester && semester !== "All") query.semester = Number(semester);

    const students = await studentDetails.find(query).lean();

    const reportData = students.map((s) => ({
      enrollmentNo: s.enrollmentNo,
      name: `${s.firstName || ""} ${s.middleName || ""} ${s.lastName || ""}`.trim(),
      branch: s.branch,
      batch: s.batch || "N/A",
      regulation: s.regulation ? s.regulation.toUpperCase() : "N/A",
      semester: s.semester,
      section: s.section || "A",
      email: s.email || "N/A",
      phoneNumber: s.phoneNumber || "N/A",
      activeBacklogs: s.activeBacklogs || 0,
      isGraduated: s.isGraduated ? "Yes" : "No",
      graduationYear: s.graduationYear || "N/A",
    }));

    reportData.sort(sortEnrollmentNo);

    return res.json({
      success: true,
      count: reportData.length,
      timestamp: new Date().toISOString(),
      reportTitle: "Student Master Record & Academic Report",
      filtersApplied: { branch: branch || "All", batch: batch || "All", regulation: regulation || "All", semester: semester || "All" },
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating student report:", error);
    res.status(500).json({ success: false, message: "Error generating student report", error: error.message });
  }
};

/**
 * 2. Generate Faculty Daily & Biometric Attendance Report
 * GET /api/reports/faculty-attendance
 */
const generateFacultyAttendanceReport = async (req, res) => {
  try {
    const { department, date } = req.query;
    const targetDate = date || new Date().toISOString().split("T")[0];

    const facultyQuery = {};
    if (department && department !== "All") facultyQuery.department = department;

    const faculties = await facultyDetails.find(facultyQuery).lean();
    const attendanceLogs = await facultyDailyAttendanceModel.find({ date: targetDate }).lean();

    const logMap = {};
    attendanceLogs.forEach((log) => {
      logMap[log.employeeId] = log;
    });

    const reportData = faculties.map((f) => {
      const log = logMap[f.employeeId];
      return {
        employeeId: f.employeeId,
        name: `${f.firstName || ""} ${f.middleName || ""} ${f.lastName || ""}`.trim(),
        department: f.department,
        designation: f.post || "Faculty",
        date: targetDate,
        status: log ? log.status : "Absent",
        checkInTime: log && log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString() : "--:--",
        checkOutTime: log && log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : "--:--",
        verificationMethod: log ? log.verificationMethod || "Biometric" : "N/A",
        workHours: log && log.workHours ? log.workHours : 0,
      };
    });

    return res.json({
      success: true,
      count: reportData.length,
      timestamp: new Date().toISOString(),
      reportTitle: `Faculty Attendance & Biometric Log (${targetDate})`,
      filtersApplied: { department: department || "All", date: targetDate },
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating faculty attendance report:", error);
    res.status(500).json({ success: false, message: "Error generating faculty attendance report", error: error.message });
  }
};

/**
 * 3. Generate Graduated Alumni Registry Report
 * GET /api/reports/alumni
 */
const generateAlumniReport = async (req, res) => {
  try {
    const { branch, batch, regulation } = req.query;
    const query = { isGraduated: true };

    if (branch && branch !== "All" && branch !== "-- Select --") query.branch = branch;
    if (batch && batch !== "All") query.batch = Number(batch);
    if (regulation && regulation !== "All") query.regulation = new RegExp(`^${regulation}$`, "i");

    const alumni = await studentDetails.find(query).lean();

    const reportData = alumni.map((a) => ({
      enrollmentNo: a.enrollmentNo,
      name: `${a.firstName || ""} ${a.middleName || ""} ${a.lastName || ""}`.trim(),
      branch: a.branch,
      batch: a.batch || "N/A",
      regulation: a.regulation ? a.regulation.toUpperCase() : "N/A",
      graduationYear: a.graduationYear || new Date().getFullYear().toString(),
      email: a.email || "N/A",
      phoneNumber: a.phoneNumber || "N/A",
      alumniCredentialStatus: "Active",
    }));

    reportData.sort(sortEnrollmentNo);

    return res.json({
      success: true,
      count: reportData.length,
      timestamp: new Date().toISOString(),
      reportTitle: "Graduated Alumni Directory & Institutional Registry",
      filtersApplied: { branch: branch || "All", batch: batch || "All", regulation: regulation || "All" },
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating alumni report:", error);
    res.status(500).json({ success: false, message: "Error generating alumni report", error: error.message });
  }
};

/**
 * 4. Generate OBE Attainment Matrix Report
 * GET /api/reports/obe-attainment
 */
const generateObeAttainmentReport = async (req, res) => {
  try {
    const { branch, academicYear, semester } = req.query;
    const query = {};

    if (branch && branch !== "All") query.branch = branch;
    if (academicYear && academicYear !== "All") query.academicYear = academicYear;
    if (semester && semester !== "All") query.semester = Number(semester);

    const attainments = await coattainmentModel.find(query).lean();

    const reportData = attainments.map((att) => ({
      subjectCode: att.subjectCode,
      subjectName: att.subjectName || att.subjectCode,
      branch: att.branch,
      semester: att.semester,
      academicYear: att.academicYear || "N/A",
      directAttainmentPct: att.directAttainmentPercentage || 0,
      indirectAttainmentPct: att.indirectAttainmentPercentage || 0,
      finalCoAttainmentPct: att.finalCoAttainmentPercentage || 0,
      targetLevelMet: att.finalCoAttainmentPercentage >= 60 ? "YES" : "NO",
    }));

    return res.json({
      success: true,
      count: reportData.length,
      timestamp: new Date().toISOString(),
      reportTitle: "Outcome-Based Education (OBE) CO-PO Attainment Report",
      filtersApplied: { branch: branch || "All", academicYear: academicYear || "All", semester: semester || "All" },
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating OBE report:", error);
    res.status(500).json({ success: false, message: "Error generating OBE report", error: error.message });
  }
};

module.exports = {
  generateStudentReport,
  generateFacultyAttendanceReport,
  generateAlumniReport,
  generateObeAttainmentReport,
};

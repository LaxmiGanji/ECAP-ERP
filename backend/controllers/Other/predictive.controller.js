const studentDetails = require("../../models/Students/details.model");
const markModel = require("../../models/Other/marks.model");
const attendanceModel = require("../../models/Other/attedence.model");
const studentPlacementProfile = require("../../models/Placement/studentProfile.model");

const sortEnrollmentNo = (a, b) => {
  const sA = (a?.enrollmentNo || "").toString().trim();
  const sB = (b?.enrollmentNo || "").toString().trim();
  if (!sA) return 1;
  if (!sB) return -1;
  const pA = sA.length >= 2 ? sA.slice(0, -2) : sA;
  const pB = sB.length >= 2 ? sB.slice(0, -2) : sB;
  if (pA !== pB) return pA.localeCompare(pB, undefined, { numeric: true, sensitivity: "base" });
  const suffA = sA.slice(-2);
  const suffB = sB.slice(-2);
  const isNumA = /^\d+$/.test(suffA);
  const isNumB = /^\d+$/.test(suffB);
  if (isNumA && !isNumB) return -1;
  if (!isNumA && isNumB) return 1;
  if (isNumA && isNumB) return parseInt(suffA, 10) - parseInt(suffB, 10);
  return suffA.localeCompare(suffB, undefined, { numeric: true, sensitivity: "base" });
};

/**
 * 1. Batch & Branch Predictive Academic/Attendance Risk Analytics
 * GET /api/predictive/batch-risk
 */
const getBatchPredictiveRisk = async (req, res) => {
  try {
    const { branch, batch, regulation } = req.query;
    const query = {};

    if (branch && branch !== "All" && branch !== "-- Select --") query.branch = branch;
    if (batch && batch !== "All") query.batch = Number(batch);
    if (regulation && regulation !== "All") query.regulation = new RegExp(`^${regulation}$`, "i");

    const students = await studentDetails.find(query).lean();

    if (!students || students.length === 0) {
      return res.json({
        success: true,
        summary: { totalStudents: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, avgAttendance: "N/A" },
        students: [],
      });
    }

    const enrollmentNos = students.map((s) => s.enrollmentNo);

    // Aggregate attendance per student
    const attendanceRecords = await attendanceModel.find({ enrollmentNo: { $in: enrollmentNos } }).lean();

    const attendanceStats = {};
    attendanceRecords.forEach((rec) => {
      if (!attendanceStats[rec.enrollmentNo]) {
        attendanceStats[rec.enrollmentNo] = { total: 0, present: 0 };
      }
      attendanceStats[rec.enrollmentNo].total += 1;
      if (rec.status === "Present" || rec.status === "p" || rec.status === "P") {
        attendanceStats[rec.enrollmentNo].present += 1;
      }
    });

    // Aggregate marks per student
    const markRecords = await markModel.find({ enrollmentNo: { $in: enrollmentNos } }).lean();

    const markStats = {};
    markRecords.forEach((rec) => {
      if (!markStats[rec.enrollmentNo]) {
        markStats[rec.enrollmentNo] = { totalObtained: 0, totalMax: 0, count: 0 };
      }
      if (rec.marksObtained !== undefined && rec.maxMarks) {
        markStats[rec.enrollmentNo].totalObtained += Number(rec.marksObtained);
        markStats[rec.enrollmentNo].totalMax += Number(rec.maxMarks);
        markStats[rec.enrollmentNo].count += 1;
      }
    });

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let sumAttendancePct = 0;

    const studentPredictions = students.map((student) => {
      const att = attendanceStats[student.enrollmentNo];
      const hasAttendanceRecords = !!(att && att.total > 0);
      const attPct = hasAttendanceRecords ? (att.present / att.total) * 100 : 0;
      sumAttendancePct += attPct;

      const marks = markStats[student.enrollmentNo];
      const marksPct = marks && marks.totalMax > 0 ? (marks.totalObtained / marks.totalMax) * 100 : null;

      const backlogs = student.activeBacklogs || 0;

      // Risk score calculation (0 - 100, where 100 = Critical Risk)
      let riskScore = 0;
      const riskDrivers = [];

      if (!hasAttendanceRecords) {
        riskDrivers.push("No Attendance Data Logged");
      } else {
        if (attPct < 65) {
          riskScore += 45;
          riskDrivers.push(`Critical Attendance (${attPct.toFixed(1)}%)`);
        } else if (attPct < 75) {
          riskScore += 25;
          riskDrivers.push(`Low Attendance (${attPct.toFixed(1)}%)`);
        }
      }

      if (marksPct !== null) {
        if (marksPct < 40) {
          riskScore += 35;
          riskDrivers.push(`Low Internal Score (${marksPct.toFixed(1)}%)`);
        } else if (marksPct < 60) {
          riskScore += 15;
          riskDrivers.push(`Moderate Internal Score (${marksPct.toFixed(1)}%)`);
        }
      }

      if (backlogs > 2) {
        riskScore += 25;
        riskDrivers.push(`${backlogs} Active Backlogs`);
      } else if (backlogs > 0) {
        riskScore += 10;
        riskDrivers.push(`${backlogs} Active Backlog`);
      }

      riskScore = Math.min(Math.round(riskScore), 100);

      let riskLevel = "Low Risk";
      if (riskScore >= 60) {
        riskLevel = "High Risk";
        highRiskCount++;
      } else if (riskScore >= 30) {
        riskLevel = "Medium Risk";
        mediumRiskCount++;
      } else {
        lowRiskCount++;
      }

      return {
        _id: student._id,
        enrollmentNo: student.enrollmentNo,
        name: `${student.firstName || ""} ${student.middleName || ""} ${student.lastName || ""}`.trim(),
        branch: student.branch,
        batch: student.batch || "N/A",
        regulation: student.regulation ? student.regulation.toUpperCase() : "N/A",
        semester: student.semester,
        attendancePct: hasAttendanceRecords ? `${attPct.toFixed(1)}%` : "N/A",
        marksPct: marksPct !== null ? `${marksPct.toFixed(1)}%` : "N/A",
        activeBacklogs: backlogs,
        riskScore,
        riskLevel,
        riskDrivers: riskDrivers.length > 0 ? riskDrivers : ["Satisfactory Academic Standing"],
      };
    });

    const avgAttendance = students.length > 0 ? `${(sumAttendancePct / students.length).toFixed(1)}%` : "N/A";

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalStudents: students.length,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        avgAttendance: avgAttendance,
        overallHealth: highRiskCount > students.length * 0.25 ? "Needs Attention" : "Good",
      },
      students: studentPredictions.sort(sortEnrollmentNo),
    });
  } catch (error) {
    console.error("Error in getBatchPredictiveRisk:", error);
    res.status(500).json({ success: false, message: "Error calculating predictive risk", error: error.message });
  }
};

/**
 * 2. Placement Readiness & Success Prediction Model
 * GET /api/predictive/placement-readiness
 */
const getPlacementReadinessPrediction = async (req, res) => {
  try {
    const { branch, batch, regulation } = req.query;
    const query = {};

    if (branch && branch !== "All" && branch !== "-- Select --") query.branch = branch;
    if (batch && batch !== "All") query.batch = Number(batch);
    if (regulation && regulation !== "All") query.regulation = new RegExp(`^${regulation}$`, "i");

    const students = await studentDetails.find(query).lean();
    const placementProfiles = await studentPlacementProfile.find().lean();

    const profileMap = {};
    placementProfiles.forEach((p) => {
      if (p.enrollmentNo) profileMap[p.enrollmentNo] = p;
    });

    let readyCount = 0;
    let moderateCount = 0;
    let atRiskCount = 0;
    let pendingProfileCount = 0;

    const readinessData = students.map((s) => {
      const pProfile = profileMap[s.enrollmentNo] || {};

      const rawCgpa = s.cgpa !== undefined && s.cgpa !== null ? s.cgpa : pProfile.cgpa;
      const rawTenth = s.tenthPercentage !== undefined && s.tenthPercentage !== null ? s.tenthPercentage : pProfile.tenthPercentage;
      const rawTwelfth = s.twelfthPercentage !== undefined && s.twelfthPercentage !== null ? s.twelfthPercentage : pProfile.twelfthPercentage;
      const rawResume = s.resumeLink || pProfile.resumeLink;

      const hasProfile = (rawCgpa !== undefined && rawCgpa !== null) || (rawTenth !== undefined && rawTenth !== null) || (rawTwelfth !== undefined && rawTwelfth !== null);

      const cgpaStr = rawCgpa !== undefined && rawCgpa !== null && rawCgpa !== "" ? `${rawCgpa}` : "N/A";
      const tenthStr = rawTenth !== undefined && rawTenth !== null && rawTenth !== "" ? `${rawTenth}%` : "N/A";
      const twelfthStr = rawTwelfth !== undefined && rawTwelfth !== null && rawTwelfth !== "" ? `${rawTwelfth}%` : "N/A";
      const backlogs = s.activeBacklogs || pProfile.activeBacklogs || 0;
      const hasResume = !!rawResume;

      if (!hasProfile) {
        pendingProfileCount++;
        return {
          enrollmentNo: s.enrollmentNo,
          name: `${s.firstName || ""} ${s.middleName || ""} ${s.lastName || ""}`.trim(),
          branch: s.branch,
          batch: s.batch || "N/A",
          cgpa: "N/A",
          tenthPct: "N/A",
          twelfthPct: "N/A",
          activeBacklogs: backlogs,
          readinessScore: "N/A",
          placementStatus: "Pending Profile Update",
          predictedCtc: "Pending Data",
          resumeUploaded: false,
          hasProfileData: false,
        };
      }

      const cgpa = Number(rawCgpa) || 0;

      let readinessScore = 0;
      readinessScore += Math.min(cgpa * 7, 70);

      if (hasResume) readinessScore += 15;
      if (backlogs === 0) readinessScore += 15;
      else if (backlogs === 1) readinessScore += 5;

      readinessScore = Math.min(Math.round(readinessScore), 100);

      let placementStatus = "High Likelihood";
      let predictedCtc = "6.5 - 12.0 LPA";

      if (readinessScore >= 75 && backlogs === 0) {
        placementStatus = "High Likelihood";
        readyCount++;
      } else if (readinessScore >= 55) {
        placementStatus = "Moderate Likelihood";
        predictedCtc = "4.0 - 6.5 LPA";
        moderateCount++;
      } else {
        placementStatus = "Needs Enhancement";
        predictedCtc = "< 4.0 LPA";
        atRiskCount++;
      }

      return {
        enrollmentNo: s.enrollmentNo,
        name: `${s.firstName || ""} ${s.middleName || ""} ${s.lastName || ""}`.trim(),
        branch: s.branch,
        batch: s.batch || "N/A",
        cgpa: cgpaStr,
        tenthPct: tenthStr,
        twelfthPct: twelfthStr,
        activeBacklogs: backlogs,
        readinessScore: `${readinessScore}/100`,
        placementStatus: placementStatus,
        predictedCtc: predictedCtc,
        resumeUploaded: hasResume,
        hasProfileData: true,
      };
    });

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalEvaluated: students.length,
        highLikelihood: readyCount,
        moderateLikelihood: moderateCount,
        needsEnhancement: atRiskCount,
        pendingProfileUpdate: pendingProfileCount,
      },
      predictions: readinessData.sort(sortEnrollmentNo),
    });
  } catch (error) {
    console.error("Error in getPlacementReadinessPrediction:", error);
    res.status(500).json({ success: false, message: "Error calculating placement predictions", error: error.message });
  }
};

module.exports = {
  getBatchPredictiveRisk,
  getPlacementReadinessPrediction,
};

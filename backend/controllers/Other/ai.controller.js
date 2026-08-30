// controllers/Other/ai.controller.js
const mongoose = require("mongoose");
const StudentDetail = require("../../models/Students/details.model");
const Attendance = require("../../models/Other/attedence.model");
const Mark = require("../../models/Other/marks.model");
const Timetable = require("../../models/Other/timetable.model");
const Subject = require("../../models/Other/subject.model");
const Branch = require("../../models/Other/branch.model");

// Lazy load Google Generative AI
let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
} catch (error) {
  console.log("generative-ai package not loaded yet");
}

// Helper: Get subjects matching student branch (by name or ID) and semester
const getStudentSubjects = async (branchName, semester) => {
  try {
    let branch = await Branch.findOne({
      name: { $regex: new RegExp(`^${branchName}$`, "i") }
    });
    
    let query = {};
    if (branch) {
      query.branch = branch._id;
    } else {
      branch = await Branch.findOne({
        name: { $regex: new RegExp(branchName, "i") }
      });
      if (branch) query.branch = branch._id;
    }
    
    if (semester) {
      query.semester = Number(semester);
    }
    
    let subjects = await Subject.find(query).populate("branch", "name");
    
    // Fallback: if no subjects found by branch, find by semester only
    if ((!subjects || subjects.length === 0) && semester) {
      subjects = await Subject.find({ semester: Number(semester) }).populate("branch", "name");
    }
    
    return subjects;
  } catch (error) {
    console.error("Error in getStudentSubjects helper:", error);
    return [];
  }
};

// Helper: Calculate attendance details for a student
const calculateStudentAttendanceStats = async (student, subjects) => {
  try {
    const attendanceRecords = await Attendance.find({
      enrollmentNo: student.enrollmentNo,
      semester: student.semester
    });

    const attendanceGrouped = attendanceRecords.reduce((acc, record) => {
      if (!acc[record.subject]) acc[record.subject] = [];
      acc[record.subject].push(record);
      return acc;
    }, {});

    let totalClassesAttended = 0;
    let totalClassesAvailable = 0;
    const subjectBreakdown = [];

    subjects.forEach((subject) => {
      // Find section total for student's section
      const sectionData = subject.sectionTotals?.find(s => s.section === student.section);
      const sectionTotal = sectionData ? sectionData.total : 0;
      
      const attended = attendanceGrouped[subject.name]?.length || 0;
      
      if (sectionTotal > 0) {
        totalClassesAttended += attended;
        totalClassesAvailable += sectionTotal;
      }
      
      subjectBreakdown.push({
        subjectName: subject.name,
        subjectCode: subject.code,
        attended,
        totalClasses: sectionTotal,
        percentage: sectionTotal > 0 ? ((attended / sectionTotal) * 100).toFixed(2) : "N/A"
      });
    });

    const overallPercentage = totalClassesAvailable > 0
      ? ((totalClassesAttended / totalClassesAvailable) * 100).toFixed(2)
      : "N/A";

    return {
      overallPercentage,
      totalClassesAttended,
      totalClassesAvailable,
      subjectBreakdown
    };
  } catch (error) {
    console.error("Error calculating attendance stats:", error);
    return {
      overallPercentage: "N/A",
      totalClassesAttended: 0,
      totalClassesAvailable: 0,
      subjectBreakdown: []
    };
  }
};

/**
 * 1. Predict Student Risk
 * GET /api/ai/risk/:enrollmentNo
 */
const predictStudentRisk = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    
    // 1. Fetch student detail
    const student = await StudentDetail.findOne({ enrollmentNo }).populate("books.bookId");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student details not found." });
    }

    // 2. Fetch subjects and marks
    const subjects = await getStudentSubjects(student.branch, student.semester);
    const marksData = await Mark.findOne({ enrollmentNo });

    // 3. Fetch attendance stats
    const attendanceStats = await calculateStudentAttendanceStats(student, subjects);

    // 4. Calculate local risk parameters
    let attendanceRiskScore = 0;
    const lowAttendanceSubjects = [];
    if (attendanceStats.overallPercentage !== "N/A") {
      const pct = parseFloat(attendanceStats.overallPercentage);
      if (pct < 75) {
        attendanceRiskScore = 90; // Critical
      } else if (pct < 80) {
        attendanceRiskScore = 50; // Moderate
      } else {
        attendanceRiskScore = 10; // Low
      }
    }
    
    attendanceStats.subjectBreakdown.forEach((sub) => {
      if (sub.percentage !== "N/A" && parseFloat(sub.percentage) < 75) {
        lowAttendanceSubjects.push(`${sub.subjectName} (${sub.percentage}%)`);
      }
    });

    let academicRiskScore = 0;
    const failingSubjects = [];
    const lowPerformingSubjects = [];
    
    if (marksData) {
      // Check internal and external marks
      const checkMarksRisk = (marksObj, type) => {
        if (!marksObj) return;
        Object.keys(marksObj).forEach((subj) => {
          const score = Number(marksObj[subj]);
          // Let's assume standard passing marks is 40% of max internal or absolute marks
          if (score < 15 && type === "internal") {
            failingSubjects.push(`${subj} (${type}: ${score}/30)`);
          } else if (score < 20 && type === "internal") {
            lowPerformingSubjects.push(`${subj} (${type}: ${score}/30)`);
          }
        });
      };
      
      checkMarksRisk(marksData.internal, "internal");
      checkMarksRisk(marksData.external, "external");

      if (failingSubjects.length > 0) {
        academicRiskScore = 80;
      } else if (lowPerformingSubjects.length > 0) {
        academicRiskScore = 40;
      } else {
        academicRiskScore = 15;
      }
    }

    // Overall local risk calculation
    const overallRiskScore = Math.max(attendanceRiskScore, academicRiskScore);
    let riskLevel = "Low";
    if (overallRiskScore >= 75) {
      riskLevel = "High";
    } else if (overallRiskScore >= 40) {
      riskLevel = "Medium";
    }

    // Default summaries and recommendations (Fallback Mode)
    let summary = `Student is performing in the ${riskLevel} Risk category.`;
    const details = [];
    const recommendations = [];

    if (attendanceStats.overallPercentage !== "N/A" && parseFloat(attendanceStats.overallPercentage) < 75) {
      details.push(`Overall attendance is ${attendanceStats.overallPercentage}%, which is below the required 75% threshold.`);
      recommendations.push("Prioritize attending next lectures to recover the attendance threshold.");
    }
    if (lowAttendanceSubjects.length > 0) {
      details.push(`Low attendance in subjects: ${lowAttendanceSubjects.join(", ")}.`);
      recommendations.push("Schedule remedial sessions or request extra classes for low attendance subjects.");
    }
    if (failingSubjects.length > 0) {
      details.push(`Sub-optimal performance in: ${failingSubjects.join(", ")}.`);
      recommendations.push("Contact course instructors for guidance or tutor assistance in failing subjects.");
    }
    if (lowPerformingSubjects.length > 0) {
      details.push(`Marginal score in: ${lowPerformingSubjects.join(", ")}.`);
      recommendations.push("Revise internal exam topics and review performance metrics.");
    }

    if (details.length === 0) {
      details.push("Academic performance and attendance are satisfactory.");
      recommendations.push("Continue maintaining current attendance and exam preparation standards.");
    }

    // Call Gemini if API Key is configured
    if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
          Analyze the academic risk for the following student profile:
          Name: ${student.firstName} ${student.lastName}
          Branch: ${student.branch} | Semester: ${student.semester}
          Overall Attendance: ${attendanceStats.overallPercentage}%
          Subject Attendance Breakdown: ${JSON.stringify(attendanceStats.subjectBreakdown)}
          Marks Record (Internal/External): ${JSON.stringify(marksData || "No marks recorded")}

          Perform a structured risk analysis (Low, Medium, High). Predict if the student is at risk of failing, dropping attendance, or underperforming.
          Return ONLY a JSON object (no markdown, no backticks, no wrap) matching the structure below:
          {
            "riskLevel": "High" | "Medium" | "Low",
            "riskScore": <integer 0-100>,
            "summary": "<one sentence overview of the student's status>",
            "details": ["<detail 1>", "<detail 2>"],
            "recommendations": ["<recommendation 1>", "<recommendation 2>"]
          }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        // Clean up markdown block wraps if model wraps JSON
        const jsonText = text.replace(/```json|```/g, "").trim();
        const aiResponse = JSON.parse(jsonText);
        
        return res.json({
          success: true,
          mode: "AI",
          data: aiResponse
        });
      } catch (err) {
        console.error("Gemini API error (Risk Prediction):", err);
        // Fall back to rule-based response
      }
    }

    // Send local rule-based response
    return res.json({
      success: true,
      mode: "Standard",
      data: {
        riskLevel,
        riskScore: overallRiskScore,
        summary,
        details,
        recommendations
      }
    });

  } catch (error) {
    console.error("Error in predictStudentRisk:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * 2. Detect Attendance Anomalies
 * GET /api/ai/anomalies/:enrollmentNo
 */
const detectAttendanceAnomalies = async (req, res) => {
  try {
    const { enrollmentNo } = req.params;
    
    const student = await StudentDetail.findOne({ enrollmentNo });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // 1. Fetch attendance records for this student
    const studentAttendance = await Attendance.find({
      enrollmentNo,
      semester: student.semester
    }).sort({ date: 1 });

    // 2. Fetch all attendance records in student's section to determine when classes were held
    const sectionAttendance = await Attendance.find({
      branch: student.branch,
      semester: student.semester,
      section: student.section
    }).sort({ date: 1 });

    const anomalies = runAnomalyRules(student, studentAttendance, sectionAttendance);

    res.json({
      success: true,
      studentName: `${student.firstName} ${student.lastName}`,
      enrollmentNo,
      anomalies
    });
  } catch (error) {
    console.error("Error in detectAttendanceAnomalies:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/ai/anomalies-section
 * Query params: branch, semester, section
 */
const detectSectionAnomalies = async (req, res) => {
  try {
    const { branch, semester, section } = req.query;

    if (!branch || !semester || !section) {
      return res.status(400).json({ success: false, message: "branch, semester, and section are required parameters." });
    }

    // 1. Get all students in this section
    const students = await StudentDetail.find({
      branch,
      semester: Number(semester),
      section
    });

    if (!students || students.length === 0) {
      return res.json({ success: true, anomalies: [] });
    }

    // 2. Get all attendance in this section
    const sectionAttendance = await Attendance.find({
      branch,
      semester: Number(semester),
      section
    }).sort({ date: 1 });

    // 3. Detect anomalies for each student
    const allAnomalies = [];
    for (const student of students) {
      const studentAttendance = sectionAttendance.filter(a => a.enrollmentNo === student.enrollmentNo);
      const studentAnomalies = runAnomalyRules(student, studentAttendance, sectionAttendance);
      
      studentAnomalies.forEach((anomaly) => {
        allAnomalies.push({
          enrollmentNo: student.enrollmentNo,
          studentName: `${student.firstName} ${student.lastName}`,
          ...anomaly
        });
      });
    }

    res.json({
      success: true,
      anomalies: allAnomalies
    });
  } catch (error) {
    console.error("Error in detectSectionAnomalies:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Helper: Run mathematical/rules anomaly checks on student attendance records
function runAnomalyRules(student, studentAttendance, sectionAttendance) {
  const anomalies = [];
  
  if (sectionAttendance.length === 0) return anomalies;

  // Group all section attendance by Date string and Period
  // This tells us exactly what classes/periods were conducted for this section
  const classesConducted = {};
  sectionAttendance.forEach((rec) => {
    const dateStr = new Date(rec.date).toISOString().split("T")[0];
    if (!classesConducted[dateStr]) classesConducted[dateStr] = new Set();
    classesConducted[dateStr].add(rec.period);
  });

  // Group student's attendance by Date string and Period
  const studentPresent = {};
  studentAttendance.forEach((rec) => {
    const dateStr = new Date(rec.date).toISOString().split("T")[0];
    if (!studentPresent[dateStr]) studentPresent[dateStr] = new Set();
    studentPresent[dateStr].add(rec.period);
  });

  const datesConducted = Object.keys(classesConducted).sort();

  // RULE 1: Period Skipping
  // Student is present on a day, but missed one or more periods in the middle
  datesConducted.forEach((dateStr) => {
    const periodsConductedOnDay = Array.from(classesConducted[dateStr]).sort((a, b) => Number(a) - Number(b));
    const studentPresentPeriods = studentPresent[dateStr] ? Array.from(studentPresent[dateStr]).map(Number) : [];

    if (studentPresentPeriods.length > 0) {
      // Find the min and max periods attended on this day
      const minAttended = Math.min(...studentPresentPeriods);
      const maxAttended = Math.max(...studentPresentPeriods);

      // Check if there are any periods conducted between min and max that the student missed
      periodsConductedOnDay.forEach((p) => {
        const pNum = Number(p);
        if (pNum > minAttended && pNum < maxAttended && !studentPresent[dateStr].has(p)) {
          anomalies.push({
            anomalyType: "Period Skipping",
            severity: "High",
            date: dateStr,
            details: `Present in Period ${minAttended} and Period ${maxAttended}, but skipped Period ${p} on ${dateStr}.`
          });
        }
      });
    }
  });

  // RULE 2: Monday/Friday Absenteeism Pattern
  // Check if they are absent significantly more on Mondays or Fridays than other days
  let mondayAbsences = 0, mondayTotal = 0;
  let fridayAbsences = 0, fridayTotal = 0;
  let midWeekAbsences = 0, midWeekTotal = 0; // Tues, Wed, Thurs

  datesConducted.forEach((dateStr) => {
    const dayOfWeek = new Date(dateStr).getDay(); // 0 = Sun, 1 = Mon, 5 = Fri
    const isStudentPresent = !!studentPresent[dateStr];

    if (dayOfWeek === 1) {
      mondayTotal++;
      if (!isStudentPresent) mondayAbsences++;
    } else if (dayOfWeek === 5) {
      fridayTotal++;
      if (!isStudentPresent) fridayAbsences++;
    } else if (dayOfWeek >= 2 && dayOfWeek <= 4) {
      midWeekTotal++;
      if (!isStudentPresent) midWeekAbsences++;
    }
  });

  const monRate = mondayTotal > 0 ? (mondayAbsences / mondayTotal) : 0;
  const friRate = fridayTotal > 0 ? (fridayAbsences / fridayTotal) : 0;
  const midRate = midWeekTotal > 0 ? (midWeekAbsences / midWeekTotal) : 0;

  if (monRate > 0.4 && monRate > midRate + 0.2 && mondayTotal >= 3) {
    anomalies.push({
      anomalyType: "Day-of-Week Pattern",
      severity: "Medium",
      details: `High absentee rate on Mondays (${(monRate * 100).toFixed(0)}% absence compared to ${(midRate * 100).toFixed(0)}% mid-week).`
    });
  }
  if (friRate > 0.4 && friRate > midRate + 0.2 && fridayTotal >= 3) {
    anomalies.push({
      anomalyType: "Day-of-Week Pattern",
      severity: "Medium",
      details: `High absentee rate on Fridays (${(friRate * 100).toFixed(0)}% absence compared to ${(midRate * 100).toFixed(0)}% mid-week).`
    });
  }

  // RULE 3: Consecutive Absences (3 or more consecutive conducted days)
  let consecutiveAbsCount = 0;
  let consecStart = null;

  datesConducted.forEach((dateStr) => {
    const isPresent = !!studentPresent[dateStr];
    if (!isPresent) {
      if (consecutiveAbsCount === 0) consecStart = dateStr;
      consecutiveAbsCount++;
    } else {
      if (consecutiveAbsCount >= 3) {
        anomalies.push({
          anomalyType: "Consecutive Absences",
          severity: "High",
          date: consecStart,
          details: `Absent for ${consecutiveAbsCount} consecutive class days from ${consecStart} to ${dateStr}.`
        });
      }
      consecutiveAbsCount = 0;
      consecStart = null;
    }
  });
  // Check end condition
  if (consecutiveAbsCount >= 3) {
    anomalies.push({
      anomalyType: "Consecutive Absences",
      severity: "High",
      date: consecStart,
      details: `Absent for ${consecutiveAbsCount} consecutive class days starting from ${consecStart}.`
    });
  }

  // RULE 4: Sudden Drop in Attendance (Recent vs Overall)
  // Compare the attendance in the last 5 active class days to overall attendance
  if (datesConducted.length >= 8) {
    const recentDates = datesConducted.slice(-5);
    const olderDates = datesConducted.slice(0, -5);
    
    const countPresent = (dates) => dates.filter(d => !!studentPresent[d]).length;
    
    const recentPresent = countPresent(recentDates);
    const olderPresent = countPresent(olderDates);
    
    const recentPct = (recentPresent / 5) * 100;
    const olderPct = (olderPresent / olderDates.length) * 100;

    if (olderPct > 70 && recentPct < olderPct - 30) {
      anomalies.push({
        anomalyType: "Sudden Drop",
        severity: "High",
        details: `Attendance dropped sharply to ${recentPct.toFixed(0)}% in the last 5 classes (was ${olderPct.toFixed(0)}% previously).`
      });
    }
  }

  return anomalies;
}

/**
 * 3. AI Chatbot for Campus Queries
 * POST /api/ai/chat
 */
const chatCampusQuery = async (req, res) => {
  try {
    const { message, history, file } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: "message parameter is required." });
    }

    const userRole = (req.user?.role || req.headers["x-user-role"] || "student").toLowerCase();
    const userId = req.user?.id || "";
    const userLoginId = req.user?.loginid || userId;

    // Fetch context based on who is logged in
    let userContextText = "";
    let chatbotTargetName = "User";

    if (userRole === "student") {
      // 1. Fetch Student Details (Robust Lookup)
      let student = null;
      if (userLoginId || userId) {
        const queryConds = [
          { enrollmentNo: userLoginId },
          { enrollmentNo: userId },
          { email: userLoginId }
        ];
        if (mongoose.Types.ObjectId.isValid(userId)) queryConds.push({ _id: userId });
        student = await StudentDetail.findOne({ $or: queryConds }).populate("books.bookId");
      }
      if (!student) {
        student = await StudentDetail.findOne().populate("books.bookId");
      }

      if (student) {
        chatbotTargetName = student.firstName;
        
        // 2. Fetch Attendance
        const subjects = await getStudentSubjects(student.branch, student.semester);
        const attendanceStats = await calculateStudentAttendanceStats(student, subjects);

        // 3. Fetch Marks
        const marks = await Mark.findOne({ enrollmentNo: student.enrollmentNo });

        // 4. Fetch Timetable
        const timetable = await Timetable.findOne({
          branch: student.branch,
          semester: student.semester,
          section: student.section
        });

        // Format Timetable to text (Target day & working periods only)
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDayName = daysOfWeek[new Date().getDay()];
        const messageLower = message.toLowerCase();
        let targetDay = daysOfWeek.find(d => messageLower.includes(d.toLowerCase()));
        if (!targetDay) {
          if (messageLower.includes("tomorrow")) {
            targetDay = daysOfWeek[(new Date().getDay() + 1) % 7];
          } else {
            targetDay = todayDayName;
          }
        }

        let timetableText = "No timetable available.";
        if (timetable && timetable.schedule) {
          const daySchedule = timetable.schedule.find(d => d.day.toLowerCase() === targetDay.toLowerCase());
          if (daySchedule && daySchedule.periods) {
            const activeClasses = daySchedule.periods.filter(p => p.subject && !p.subject.toLowerCase().includes("break") && p.subject.trim() !== "");
            if (activeClasses.length > 0) {
              timetableText = `**Student Classes for ${targetDay}:**\n` + activeClasses.map(p => `• **${p.startTime}-${p.endTime}:** ${p.subject} (Period ${p.periodNumber})`).join("\n");
            } else {
              timetableText = `No active classes scheduled for ${targetDay}.`;
            }
          } else {
            timetableText = `No classes scheduled for ${targetDay}.`;
          }
        }

        // Format Books
        const issuedBooks = student.books
          ? student.books.filter(b => b.status === "issued").map(b => b.bookId ? `${b.bookId.bookname} (Author: ${b.bookId.authorname}, Return Date: ${b.returnDate ? new Date(b.returnDate).toLocaleDateString() : "N/A"})` : "Book").join(", ")
          : "";

        // 5. Fetch Study Materials & Question Papers from Database
        let materialsText = "No study materials currently listed.";
        try {
          const Material = require("../../models/Other/material.model");
          const materialsList = await Material.find({
            $or: [
              { branch: new RegExp(student.branch, "i") },
              { semester: student.semester }
            ]
          }).sort({ createdAt: -1 }).limit(10);
          if (materialsList && materialsList.length > 0) {
            materialsText = materialsList.map(m => `- **${m.title}** (${m.subject} - Faculty: ${m.faculty}, Sem ${m.semester}): [Download PDF](${m.link})`).join("\n");
          }
        } catch (mErr) {
          console.warn("Materials fetch notice:", mErr.message);
        }

        userContextText = `
          Student Name: ${student.firstName} ${student.lastName}
          Enrollment No: ${student.enrollmentNo}
          Branch: ${student.branch} | Semester: ${student.semester} | Section: ${student.section}
          Email: ${student.email} | Phone: ${student.phoneNumber}
          
          --- ATTENDANCE SUMMARY ---
          Overall Attendance Rate: ${attendanceStats.overallPercentage}%
          Total Attended: ${attendanceStats.totalClassesAttended} classes
          Total Available: ${attendanceStats.totalClassesAvailable} classes
          Subject Breakdown:
          ${attendanceStats.subjectBreakdown.map(s => `- ${s.subjectName} (${s.subjectCode}): Attended ${s.attended}/${s.totalClasses} lectures (${s.percentage}%)`).join("\n")}
          
          --- MARKS DATA ---
          Internals/Externals scores:
          - Internals: ${marks && marks.internal ? JSON.stringify(marks.internal) : "None recorded"}
          - Externals: ${marks && marks.external ? JSON.stringify(marks.external) : "None recorded"}
          
          --- TIMETABLE SCHEDULE ---
          ${timetableText}

          --- LIBRARY ISSUED BOOKS ---
          ${issuedBooks || "No books currently issued."}

          --- DATABASE STUDY MATERIALS & QUESTION PAPERS ---
          ${materialsText}

          --- LEAVE APPLICATION FORMAT ---
          Write an application to the HOD of ${student.branch} department requesting leave. Include enrollment no (${student.enrollmentNo}), reason, and dates.
        `;
      }
    } else if (userRole === "faculty" || userRole === "professor") {
      // Fetch faculty details & database context (Strict & Accurate Lookup)
      const FacultyDetail = mongoose.model("Faculty Detail");
      let faculty = null;
      if (userLoginId || userId) {
        const cleanLogin = userLoginId.trim();
        const cleanId = userId.trim();
        const queryConds = [
          { employeeId: new RegExp(`^${cleanLogin}$`, "i") },
          { employeeId: new RegExp(`^${cleanId}$`, "i") },
          { email: new RegExp(`^${cleanLogin}$`, "i") }
        ];
        if (mongoose.Types.ObjectId.isValid(cleanId)) queryConds.push({ _id: cleanId });
        faculty = await FacultyDetail.findOne({ $or: queryConds });
      }

      if (faculty) {
        chatbotTargetName = `${faculty.firstName} ${faculty.lastName}`;

        // 1. Build Full Weekly Faculty Timetable Context (All 7 Days)
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        let fullWeeklyScheduleText = "";

        if (faculty.timetable && faculty.timetable.length > 0) {
          fullWeeklyScheduleText = faculty.timetable.map(d => {
            const activePeriods = d.periods ? d.periods.filter(p => p.subject && !p.subject.toLowerCase().includes("break") && p.subject.trim() !== "") : [];
            if (activePeriods.length > 0) {
              const pList = activePeriods.map(p => `• ${p.startTime}-${p.endTime}: ${p.subject} (Branch: ${p.branch}, Sem ${p.semester}, Sec ${p.section})`).join("\n");
              return `**${d.day}:**\n${pList}`;
            } else {
              return `**${d.day}:** No active classes scheduled.`;
            }
          }).join("\n\n");
        } else {
          try {
            const ttList = await Timetable.find({
              "schedule.periods.faculty": new RegExp(faculty.firstName, "i")
            });
            if (ttList && ttList.length > 0) {
              const dayMap = {};
              ttList.forEach(t => {
                t.schedule.forEach(d => {
                  if (!dayMap[d.day]) dayMap[d.day] = [];
                  if (d.periods) {
                    d.periods.forEach(p => {
                      if (p.faculty && p.faculty.toLowerCase().includes(faculty.firstName.toLowerCase()) && !p.subject.toLowerCase().includes("break")) {
                        dayMap[d.day].push(`• ${p.startTime || "P" + p.periodNumber}: ${p.subject} (Branch: ${t.branch}, Sem ${t.semester}, Sec ${t.section})`);
                      }
                    });
                  }
                });
              });

              fullWeeklyScheduleText = daysOfWeek.map(dName => {
                if (dayMap[dName] && dayMap[dName].length > 0) {
                  return `**${dName}:**\n${dayMap[dName].join("\n")}`;
                }
                return `**${dName}:** No active classes scheduled.`;
              }).join("\n\n");
            } else {
              fullWeeklyScheduleText = "No teaching classes assigned in the weekly schedule.";
            }
          } catch (ttErr) {
            fullWeeklyScheduleText = "No assigned schedule found.";
          }
        }

        // 2. Fetch Faculty Leave Applications from Database
        let leaveText = "No leave applications submitted yet.";
        try {
          const FacultyLeave = require("../../models/Faculty/leave.model");
          const leaveApps = await FacultyLeave.find({
            $or: [
              { facultyId: faculty.employeeId },
              { facultyId: String(faculty._id) },
              { facultyName: new RegExp(`${faculty.firstName}`, "i") }
            ]
          }).sort({ createdAt: -1 });

          if (leaveApps && leaveApps.length > 0) {
            leaveText = leaveApps.map(l => 
              `- Leave Type: **${l.leaveType}** | Dates: ${l.startDate} to ${l.endDate} | Status: **${l.status.toUpperCase().replace(/_/g, " ")}** | Reason: "${l.reason}"${l.substituteName ? ` | Substitute: ${l.substituteName}` : ""}${l.rejectionReason ? ` | Rejection Reason: "${l.rejectionReason}"` : ""}`
            ).join("\n");
          }
        } catch (lErr) {}

        // 3. Fetch Faculty Uploaded Study Materials
        let facultyMatText = "No materials uploaded yet.";
        try {
          const Material = require("../../models/Other/material.model");
          const mats = await Material.find({
            $or: [
              { faculty: new RegExp(faculty.firstName, "i") },
              { faculty: faculty.employeeId }
            ]
          }).sort({ createdAt: -1 });
          if (mats && mats.length > 0) {
            facultyMatText = mats.map(m => `- **${m.title}** (${m.subject}, Sem ${m.semester}): [Download PDF](${m.link})`).join("\n");
          }
        } catch (mErr) {}

        // 4. Fetch Department Students Overview
        let deptStudentsCount = 0;
        try {
          deptStudentsCount = await StudentDetail.countDocuments({ branch: new RegExp(faculty.department, "i") });
        } catch (dErr) {}

        userContextText = `
          Faculty Name: ${faculty.firstName} ${faculty.lastName}
          Department: ${faculty.department} | Employee ID: ${faculty.employeeId} | JNTU ID: ${faculty.jntuId || "N/A"}
          Email: ${faculty.email} | Phone: ${faculty.phoneNumber || "N/A"} | Designation: ${faculty.post || "Professor"}
          
          --- YOUR TEACHING TIMETABLE SCHEDULE (ALL DAYS) ---
          ${fullWeeklyScheduleText}

          --- YOUR FACULTY LEAVE APPLICATIONS ---
          ${leaveText}

          --- YOUR UPLOADED STUDY MATERIALS ---
          ${facultyMatText}

          --- DEPARTMENT OVERVIEW ---
          Total Students in ${faculty.department} Department: ${deptStudentsCount}
        `;
      } else {
        chatbotTargetName = userLoginId || "Faculty";
        userContextText = `Faculty profile not found for Employee ID: ${userLoginId}. Please check login credentials.`;
      }
    } else if (userRole === "hod") {
      const FacultyDetail = mongoose.model("Faculty Detail");
      let hod = null;
      if (userLoginId || userId) {
        const hodQuery = {
          $or: [
            { employeeId: userLoginId },
            { employeeId: userId },
            { email: new RegExp(userLoginId, "i") }
          ]
        };
        if (mongoose.Types.ObjectId.isValid(userId)) hodQuery.$or.push({ _id: userId });
        hod = await FacultyDetail.findOne(hodQuery);
      }
      if (!hod) {
        hod = await FacultyDetail.findOne({ post: /hod/i }) || await FacultyDetail.findOne();
      }

      if (hod) {
        chatbotTargetName = `${hod.firstName} ${hod.lastName} (HOD)`;

        let pendingLeavesText = "No pending faculty leave applications requiring HOD approval.";
        try {
          const FacultyLeave = require("../../models/Faculty/leave.model");
          const pendingLeaves = await FacultyLeave.find({
            branch: new RegExp(hod.department || hod.branch, "i"),
            status: "pending"
          });
          if (pendingLeaves && pendingLeaves.length > 0) {
            pendingLeavesText = pendingLeaves.map(l => 
              `- Faculty: **${l.facultyName}** (${l.leaveType}) | Dates: ${l.startDate} to ${l.endDate} | Reason: "${l.reason}" | Substitute: ${l.substituteName || "None"}`
            ).join("\n");
          }
        } catch (hErr) {}

        userContextText = `
          HOD Name: ${hod.firstName} ${hod.lastName}
          Department: ${hod.department || hod.branch}
          
          --- PENDING FACULTY LEAVE APPROVALS IN YOUR DEPARTMENT ---
          ${pendingLeavesText}
        `;
      }
    } else if (userRole === "admin" || userRole === "principal") {
      chatbotTargetName = userRole === "principal" ? "Principal" : "Admin";

      let totalStudents = 0, totalFaculty = 0, totalMaterials = 0, pendingLeavesCount = 0;
      try {
        totalStudents = await StudentDetail.countDocuments();
        const FacultyDetail = mongoose.model("Faculty Detail");
        totalFaculty = await FacultyDetail.countDocuments();
        const Material = require("../../models/Other/material.model");
        totalMaterials = await Material.countDocuments();
        const FacultyLeave = require("../../models/Faculty/leave.model");
        pendingLeavesCount = await FacultyLeave.countDocuments({ status: { $in: ["pending", "approved_by_hod"] } });
      } catch (aErr) {}

      userContextText = `
        User Role: ${userRole.toUpperCase()}
        
        --- COLLEGE-WIDE EXECUTIVE DATA SUMMARY ---
        Total Enrolled Students: ${totalStudents}
        Total Faculty Members: ${totalFaculty}
        Total Study Materials Uploaded: ${totalMaterials}
        Pending Leave Applications Needing Executive Approval: ${pendingLeavesCount}
      `;
    } else {
      userContextText = `
        User Role: ${userRole}
        Welcome to ECAP campus AI assistant. You can assist with queries about college management, study materials, library books, and section statistics.
      `;
    }

    // Call Gemini if API Key is configured
    if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build history string
        let historyPrompt = "";
        if (history && Array.isArray(history)) {
          historyPrompt = history.slice(-8).map(h => {
            return `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`;
          }).join("\n");
        }

        const systemInstruction = `
          You are the ECAP Campus AI Assistant.
          Help the user with their queries. You can answer general knowledge, coding, writing, math, or other general questions outside of the college system as well, just like a regular assistant.
          If the question is about the current student/user or campus details, read from the provided context below:
          
          --- LOGGED IN USER CONTEXT ---
          ${userContextText}
          
          Guidelines:
          - Answer general queries directly, helpful, and accurately.
          - If asked about attendance, timetable, marks, or books, read from the user context provided.
          - When outputting timetable or schedule, provide ONLY the target day's active working periods. Do NOT output break periods or the entire week unless explicitly asked for the full weekly schedule.
          - When recommending or listing study materials, ALWAYS include the exact material title uploaded by faculty in bold, e.g.: **Material Title**: [Download PDF](link).
          - Be encouraging. Warn them if their attendance is below 75%.
          - Keep answers clear, readable, and formatted in Markdown.
          - If the user attaches an image or document (PDF, Text), analyze it carefully to answer their questions.
        `;

        const finalPrompt = `
          System instructions: ${systemInstruction}
          
          Chat History:
          ${historyPrompt}
          
          User Query: ${message}
        `;

        const parts = [{ text: finalPrompt }];

        // Check if file is provided (base64 and mimeType)
        if (file && file.base64 && file.mimeType) {
          parts.push({
            inlineData: {
              data: file.base64,
              mimeType: file.mimeType
            }
          });
        }

        const result = await model.generateContent(parts);
        const text = result.response.text();

        return res.json({
          success: true,
          mode: "AI",
          reply: text
        });
      } catch (err) {
        console.error("Gemini API error (Chatbot):", err);
        // Fall back to rule-based parser
      }
    }

    // Fallback Mode (Standard keyword-based parser)
    let reply = "";
    const cleanMsg = message.toLowerCase();

    if (cleanMsg.includes("attendance") || cleanMsg.includes("present") || cleanMsg.includes("absent")) {
      if (userRole === "student") {
        const match = userContextText.match(/--- ATTENDANCE SUMMARY ---[\s\S]+?--- MARKS DATA ---/);
        const summaryText = match ? match[0].replace("--- MARKS DATA ---", "").trim() : "Unable to retrieve attendance details.";
        reply = `**Your Attendance Details:**\n\n${summaryText}\n\n*Note: To keep this data up-to-date, ensure faculty has submitted daily biometric/period marks.*`;
      } else {
        reply = "You can view student attendance and anomaly reports in the main 'AI Analytics' tab in your dashboard.";
      }
    } else if (cleanMsg.includes("timetable") || cleanMsg.includes("schedule") || cleanMsg.includes("periods") || cleanMsg.includes("class")) {
      if (userRole === "student") {
        const match = userContextText.match(/--- TIMETABLE SCHEDULE ---[\s\S]+?--- LIBRARY ISSUED BOOKS ---/);
        const ttText = match ? match[0].replace("--- LIBRARY ISSUED BOOKS ---", "").trim() : "Unable to retrieve timetable.";
        reply = `**Your Student Timetable:**\n\n${ttText}`;
      } else if (userRole === "faculty" || userRole === "professor") {
        const match = userContextText.match(/--- YOUR TEACHING TIMETABLE SCHEDULE \(ALL DAYS\) ---[\s\S]+?--- YOUR FACULTY LEAVE APPLICATIONS ---/);
        let ttText = match ? match[0].replace("--- YOUR FACULTY LEAVE APPLICATIONS ---", "").trim() : "No assigned teaching schedule found.";

        // Target day extraction in fallback mode
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDayName = daysOfWeek[new Date().getDay()];
        let targetDay = daysOfWeek.find(d => cleanMsg.includes(d.toLowerCase()));
        if (!targetDay) {
          if (cleanMsg.includes("tomorrow") || cleanMsg.includes("tmr")) {
            targetDay = daysOfWeek[(new Date().getDay() + 1) % 7];
          } else if (cleanMsg.includes("today")) {
            targetDay = todayDayName;
          }
        }

        if (targetDay) {
          const dayRegex = new RegExp(`\\*\\*${targetDay}:\\*\\*[\\s\\S]+?(?=\\n\\n\\*\\*|$)`, "i");
          const dayMatch = ttText.match(dayRegex);
          if (dayMatch) {
            ttText = dayMatch[0].trim();
          }
        }

        reply = `**Your Faculty Teaching Timetable (${targetDay || "Weekly Overview"}):**\n\n${ttText}`;
      } else {
        reply = "You can view your teaching timetable in the 'MyFacultyTimeTable' tab in the sidebar menu.";
      }
    } else if (cleanMsg.includes("marks") || cleanMsg.includes("score") || cleanMsg.includes("result") || cleanMsg.includes("exam")) {
      if (userRole === "student") {
        const match = userContextText.match(/--- MARKS DATA ---[\s\S]+?--- TIMETABLE SCHEDULE ---/);
        const marksText = match ? match[0].replace("--- TIMETABLE SCHEDULE ---", "").trim() : "No marks records found.";
        reply = `**Your Academic Results:**\n\n${marksText}`;
      } else {
        reply = "You can view and upload student marks from the 'Upload Marks' tab.";
      }
    } else if (cleanMsg.includes("book") || cleanMsg.includes("library") || cleanMsg.includes("issued")) {
      if (userRole === "student") {
        const match = userContextText.match(/--- LIBRARY ISSUED BOOKS ---[\s\S]+?--- LEAVE APPLICATION FORMAT ---/);
        const bookText = match ? match[0].replace("--- LEAVE APPLICATION FORMAT ---", "").trim() : "No issued books found.";
        reply = `**Library Issued Books:**\n\n${bookText}`;
      } else {
        reply = "Library book records can be checked directly from the principal or library dashboard.";
      }
    } else if (cleanMsg.includes("leave") || cleanMsg.includes("apply") || cleanMsg.includes("status")) {
      if (userRole === "student") {
        reply = `**Applying for Leave:**\n\nHere is the format you can use to write an application to your HOD:\n\n\`\`\`\nTo,\nThe HOD,\n[Department Name] Department\n\nSubject: Leave Application\n\nRespected Sir/Madam,\nI (${chatbotTargetName}, Enrollment: ${req.user?.id || "Your ID"}) request leave from [Start Date] to [End Date] due to [Reason].\n\nThanking you,\nYours obediently,\n${chatbotTargetName}\n\`\`\``;
      } else if (userRole === "faculty" || userRole === "professor") {
        const match = userContextText.match(/--- YOUR FACULTY LEAVE APPLICATIONS ---[\s\S]+?--- YOUR UPLOADED STUDY MATERIALS ---/);
        const leaveStatusText = match ? match[0].replace("--- YOUR UPLOADED STUDY MATERIALS ---", "").trim() : "No leave records found.";
        reply = `**Your Faculty Leave Applications:**\n\n${leaveStatusText}`;
      } else if (userRole === "hod") {
        const match = userContextText.match(/--- PENDING FACULTY LEAVE APPROVALS IN YOUR DEPARTMENT ---[\s\S]+/);
        const pendingText = match ? match[0] : "No pending approvals.";
        reply = `**Pending Department Faculty Leaves:**\n\n${pendingText}`;
      } else {
        reply = "You can view and process leave applications in your dashboard under Leave Management.";
      }
    } else {
      reply = `Hello ${chatbotTargetName}! I am running in **Standard Mode**.\n\nI can answer queries related to:\n- **Attendance** (e.g., "What is my attendance?")\n- **Timetable** (e.g., "Show my schedule")\n- **Marks** (e.g., "What are my marks?")\n- **Library Books** (e.g., "Do I have any books?")\n- **Leave applications** (e.g., "How to apply for leave?")\n\n*Tip: To unlock advanced chat, ask your admin to add the ` + "`GEMINI_API_KEY`" + ` to the backend environment.*`;
    }

    res.json({
      success: true,
      mode: "Standard",
      reply
    });

  } catch (error) {
    console.error("Error in chatCampusQuery:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getSectionRiskSummary = async (req, res) => {
  try {
    const { branch, semester, section } = req.query;

    if (!branch || !semester || !section) {
      return res.status(400).json({ success: false, message: "branch, semester, and section are required parameters." });
    }

    // 1. Get all students in this section
    const students = await StudentDetail.find({
      branch,
      semester: Number(semester),
      section
    });

    if (!students || students.length === 0) {
      return res.json({ success: true, summary: [] });
    }

    // 2. Fetch all subjects for this branch/semester
    const subjects = await getStudentSubjects(branch, semester);

    // 3. Fetch all attendance in this section
    const sectionAttendance = await Attendance.find({
      branch,
      semester: Number(semester),
      section
    });

    // 4. Fetch all marks in this section
    const enrollments = students.map(s => s.enrollmentNo);
    const marksList = await Mark.find({ enrollmentNo: { $in: enrollments } });
    const marksMap = marksList.reduce((acc, m) => {
      acc[m.enrollmentNo] = m;
      return acc;
    }, {});

    const summary = [];

    // 5. Calculate attendance rate & local risk for each student
    for (const student of students) {
      const studentAttendance = sectionAttendance.filter(a => a.enrollmentNo === student.enrollmentNo);
      
      // Calculate overall attendance
      const attendanceGrouped = studentAttendance.reduce((acc, record) => {
        if (!acc[record.subject]) acc[record.subject] = [];
        acc[record.subject].push(record);
        return acc;
      }, {});

      let totalClassesAttended = 0;
      let totalClassesAvailable = 0;

      subjects.forEach((subject) => {
        const sectionData = subject.sectionTotals?.find(s => s.section === student.section);
        const sectionTotal = sectionData ? sectionData.total : 0;
        const attended = attendanceGrouped[subject.name]?.length || 0;
        
        if (sectionTotal > 0) {
          totalClassesAttended += attended;
          totalClassesAvailable += sectionTotal;
        }
      });

      const overallPercentage = totalClassesAvailable > 0
        ? parseFloat(((totalClassesAttended / totalClassesAvailable) * 100).toFixed(2))
        : null;

      // Rule-based quick risk assessment
      let attendanceRisk = 0;
      if (overallPercentage !== null) {
        if (overallPercentage < 75) attendanceRisk = 90;
        else if (overallPercentage < 80) attendanceRisk = 50;
      }

      let academicRisk = 0;
      const mData = marksMap[student.enrollmentNo];
      if (mData) {
        const checkFailed = (mObj) => {
          if (!mObj) return false;
          return Object.values(mObj).some(score => Number(score) < 15);
        };
        if (checkFailed(mData.internal)) {
          academicRisk = 80;
        }
      }

      const riskScore = Math.max(attendanceRisk, academicRisk);
      let riskLevel = "Low";
      if (riskScore >= 75) riskLevel = "High";
      else if (riskScore >= 40) riskLevel = "Medium";

      summary.push({
        enrollmentNo: student.enrollmentNo,
        name: `${student.firstName} ${student.lastName}`,
        attendancePercentage: overallPercentage !== null ? overallPercentage : "N/A",
        riskScore,
        riskLevel
      });
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error("Error in getSectionRiskSummary:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  predictStudentRisk,
  detectAttendanceAnomalies,
  detectSectionAnomalies,
  getSectionRiskSummary,
  chatCampusQuery
};

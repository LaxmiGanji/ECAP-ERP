import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { FiCheckCircle, FiUser, FiPercent, FiBookOpen } from "react-icons/fi";

const ViewAttendance = () => {
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [subjectTotals, setSubjectTotals] = useState({});
  const [attendanceBySubject, setAttendanceBySubject] = useState({});
  const [overallAttendancePercentage, setOverallAttendancePercentage] = useState("N/A");
  const router = useLocation();

  // Fetch student data including section
  useEffect(() => {
    const headers = { "Content-Type": "application/json" };

    axios
      .post(
        `${baseApiURL()}/${router.state.type}/details/getDetails`,
        { enrollmentNo: router.state.loginid },
        { headers: headers }
      )
      .then((response) => {
        if (response.data?.success) {
          const student = response.data.user?.[0];
          setStudentData(student);
          setEnrollmentNo(student?.enrollmentNo || "");
        }
      })
      .catch(() => {});
  }, [router.state.type, router.state.loginid]);

  // Fetch subject totals with section-specific data
  useEffect(() => {
    const fetchSubjectTotals = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/subject/getSubject`);
        if (response.data?.success) {
          setSubjectTotals(response.data.subject);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjectTotals();
  }, []);

  // Fetch attendance and calculate stats
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!enrollmentNo || !studentData) return;

      try {
        const response = await axios.get(
          `${baseApiURL()}/attendence/getStudentAttendance/${enrollmentNo}?semester=${studentData.semester}`
        );
        if (response.data?.success) {
          const attendanceData = response.data.attendance;

          // Group attendance by subject
          const groupedBySubject = attendanceData.reduce((acc, curr) => {
            const subjectName = curr.subjectId?.name || "Unknown";
            if (!acc[subjectName]) acc[subjectName] = [];
            acc[subjectName].push(curr);
            return acc;
          }, {});

          setAttendanceBySubject(groupedBySubject);

          // Calculate overall attendance with section-specific totals
          let totalClassesOverall = 0;
          let totalAttendedOverall = 0;

          Object.keys(groupedBySubject).forEach((subjName) => {
            const attendedCount = groupedBySubject[subjName].length;
            const subjectTotal = getSectionTotal(subjName, studentData.section);

            totalAttendedOverall += attendedCount;
            totalClassesOverall += subjectTotal;
          });

          if (totalClassesOverall > 0) {
            setOverallAttendancePercentage(
              ((totalAttendedOverall / totalClassesOverall) * 100).toFixed(2)
            );
          } else {
            setOverallAttendancePercentage("N/A");
          }
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchAttendance();
  }, [enrollmentNo, studentData, subjectTotals]);

  // Function to get section-specific total classes for a subject
  const getSectionTotal = (subjectName, studentSection) => {
    if (!subjectTotals || !Array.isArray(subjectTotals)) return 0;
    
    const subject = subjectTotals.find(s => s.name === subjectName);
    if (!subject) return 0;

    if (subject.sectionTotals && typeof subject.sectionTotals === 'object') {
      const sectionKey = studentSection || 'A';
      return subject.sectionTotals[sectionKey] || subject.totalClasses || 0;
    }
    
    return subject.totalClasses || 0;
  };

  // Function to calculate subject-specific attendance percentage with section-specific totals
  const calculatePercentage = (subjectName) => {
    if (!studentData) return "N/A";
    
    const totalClasses = getSectionTotal(subjectName, studentData.section);
    const attendedClasses = attendanceBySubject[subjectName]?.length || 0;
    return totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : "N/A";
  };

  const getTotalClasses = (subjectName) => {
    if (!studentData) return 0;
    return getSectionTotal(subjectName, studentData.section);
  };

  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900">
            <FiCheckCircle className="text-emerald-600" />
            <span>Attendance Records</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Section-specific attendance tracking and class percentage summary</p>
        </div>
      </div>

      {/* 📊 Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Info Card */}
        {studentData && (
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <FiUser className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Student Profile</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
              <div>
                <span className="text-slate-500 font-medium block">Enrollment No</span>
                <span className="font-bold text-slate-900 text-sm">{studentData.enrollmentNo}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Branch</span>
                <span className="font-bold text-slate-900 text-sm">{studentData.branch}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Semester</span>
                <span className="font-bold text-slate-900 text-sm">Sem {studentData.semester}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Section</span>
                <span className="font-bold text-slate-900 text-sm">Section {studentData.section || 'A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Overall Percentage Card */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Overall Attendance</span>
            <p className={`text-3xl font-black mt-1 ${
              overallAttendancePercentage !== "N/A" && parseFloat(overallAttendancePercentage) >= 75
                ? "text-emerald-600"
                : "text-rose-600"
            }`}>
              {overallAttendancePercentage}%
            </p>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">Min 75% required for exams</span>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
            overallAttendancePercentage !== "N/A" && parseFloat(overallAttendancePercentage) >= 75
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-100"
          }`}>
            <FiPercent className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* 📋 Subject-Wise Attendance Breakdown Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
        <table className="min-w-[900px] w-full text-left">
          <thead>
            <tr>
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">Attended Classes</th>
              <th className="py-3 px-4">Total Classes Held</th>
              <th className="py-3 px-4">Attendance Percentage</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(attendanceBySubject).length > 0 ? (
              Object.keys(attendanceBySubject).map((subject, index) => {
                const pct = calculatePercentage(subject);
                const isShortage = pct !== "N/A" && parseFloat(pct) < 75;
                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="font-bold text-sm text-slate-900 py-3.5 px-4">{subject}</td>
                    <td className="text-sm font-semibold text-slate-700 py-3.5 px-4">
                      {attendanceBySubject[subject].length}
                    </td>
                    <td className="text-sm font-semibold text-slate-700 py-3.5 px-4">
                      {getTotalClasses(subject)}
                    </td>
                    <td className="text-sm font-bold text-slate-900 py-3.5 px-4">
                      {pct}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isShortage
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {isShortage ? "Shortage (<75%)" : "Sufficient"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-500 text-sm">
                  No attendance records logged for your current semester yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewAttendance;
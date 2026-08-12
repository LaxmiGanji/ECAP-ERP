import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";

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
          // Store the entire subject data for section-specific calculations
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
          const sortedRecords = response.data.attendanceRecords.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );

          // Group attendance by subject
          const attendanceGrouped = sortedRecords.reduce((acc, record) => {
            if (!acc[record.subject]) acc[record.subject] = [];
            acc[record.subject].push(record);
            return acc;
          }, {});
          setAttendanceBySubject(attendanceGrouped);

          // Calculate overall attendance percentage after subject totals are fetched
          if (subjectTotals.length > 0) {
            calculateOverallAttendance(attendanceGrouped, subjectTotals, studentData.section);
          }
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchAttendance();
  }, [enrollmentNo, studentData, subjectTotals]);

  // Function to get section-specific total for a subject
  const getSectionTotal = (subjectName, studentSection) => {
    if (!subjectTotals || !Array.isArray(subjectTotals)) return 0;
    
    const subject = subjectTotals.find(sub => 
      sub.name === subjectName
    );
    
    if (!subject || !subject.sectionTotals) return 0;
    
    const sectionData = subject.sectionTotals.find(s => s.section === studentSection);
    return sectionData ? sectionData.total : 0;
  };

  // Function to calculate overall attendance percentage with section-specific totals
  const calculateOverallAttendance = (attendanceGrouped, subjects, studentSection) => {
    let totalClassesAttended = 0;
    let totalClassesAvailable = 0;

    Object.keys(attendanceGrouped).forEach((subjectName) => {
      const sectionTotal = getSectionTotal(subjectName, studentSection);
      if (sectionTotal > 0) {
        totalClassesAttended += attendanceGrouped[subjectName].length;
        totalClassesAvailable += sectionTotal;
      }
    });

    const overallPercentage =
      totalClassesAvailable > 0
        ? ((totalClassesAttended / totalClassesAvailable) * 100).toFixed(2)
        : "N/A";

    setOverallAttendancePercentage(overallPercentage);
  };

  // Function to calculate subject-specific attendance percentage with section-specific totals
  const calculatePercentage = (subjectName) => {
    if (!studentData) return "N/A";
    
    const totalClasses = getSectionTotal(subjectName, studentData.section);
    const attendedClasses = attendanceBySubject[subjectName]?.length || 0;
    return totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : "N/A";
  };

  // Function to get total classes for a subject (section-specific)
  const getTotalClasses = (subjectName) => {
    if (!studentData) return 0;
    return getSectionTotal(subjectName, studentData.section);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Your Attendance</h2>
      
      {/* Student Information */}
      {studentData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Student Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Enrollment No:</span> {studentData.enrollmentNo}
            </div>
            <div>
              <span className="font-medium">Name:</span> {studentData.firstName} {studentData.middleName} {studentData.lastName}
            </div>
            <div>
              <span className="font-medium">Branch:</span> {studentData.branch}
            </div>
            <div>
              <span className="font-medium">Section:</span> {studentData.section}
            </div>
            <div>
              <span className="font-medium">Semester:</span> {studentData.semester}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Overall Attendance Summary</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overall Attendance Percentage</p>
            <p className="text-3xl font-bold text-green-600">
              {overallAttendancePercentage}%
            </p>
          </div>
          {overallAttendancePercentage !== "N/A" && (
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Based on section-specific totals for {studentData?.section || 'your section'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <h3 className="text-xl font-semibold mb-4">Subject-wise Attendance</h3>
      {Object.keys(attendanceBySubject).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-gray-300 px-4 py-3 text-left">Subject</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Attended Classes</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Total Classes</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Percentage</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(attendanceBySubject).map((subject, index) => {
                const attendedClasses = attendanceBySubject[subject]?.length || 0;
                const totalClasses = getTotalClasses(subject);
                const percentage = calculatePercentage(subject);
                const percentageValue = parseFloat(percentage);
                
                // Determine status based on percentage
                let status = "Unknown";
                let statusColor = "gray";
                
                if (!isNaN(percentageValue)) {
                  if (percentageValue >= 75) {
                    status = "Good";
                    statusColor = "green";
                  } else if (percentageValue >= 65) {
                    status = "Average";
                    statusColor = "orange";
                  } else {
                    status = "Low";
                    statusColor = "red";
                  }
                }

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-medium">{subject}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{attendedClasses}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{totalClasses}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      {percentage}%
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No attendance records found.</p>
          <p className="text-gray-400 text-sm mt-2">
            Your attendance will appear here once your faculty marks it.
          </p>
        </div>
      )}

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
          <li>Attendance percentages are calculated using section-specific total classes</li>
          <li>Total classes shown are specific to your section ({studentData?.section || 'current section'})</li>
          <li>75% or above: Good attendance</li>
          <li>65% to 74%: Average attendance (needs improvement)</li>
          <li>Below 65%: Low attendance (requires immediate attention)</li>
        </ul>
      </div>
    </div>
  );
};

export default ViewAttendance;
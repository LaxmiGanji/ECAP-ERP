import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { baseApiURL } from "../../baseUrl";
import { sortEnrollmentNo } from "../../utils/enrollmentSorter";
import { FiAlertCircle } from "react-icons/fi";

const ViewTotalAttendance = ({ branch: lockedBranch }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [noStudentsMessage, setNoStudentsMessage] = useState("");
  const [enrollmentNumbers, setEnrollmentNumbers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]); // Added to get student section data

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [studentRegulations, setStudentRegulations] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sections, setSections] = useState(['A', 'B', 'C', 'D']);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        let params = {};
        if (selectedBranch && selectedBranch !== "-- Select --") params.branch = selectedBranch;
        if (selectedSemester && selectedSemester !== "-- Select --") params.semester = selectedSemester;
        const res = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, { params });
        if (res.data.success && res.data.sections?.length > 0) {
          setSections(res.data.sections);
        }
      } catch (err) {
        console.error("Error fetching dynamic sections:", err);
      }
    };
    fetchSections();
  }, [selectedBranch, selectedSemester]);

  useEffect(() => {
    const fetchStudentRegulations = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/student/details/getRegulations`);
        if (response.data.success) {
          setStudentRegulations(response.data.regulations || []);
        }
      } catch (error) {
        console.error("Error fetching student regulations:", error);
      }
    };
    fetchStudentRegulations();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/attendence/getAll`);
        if (response.data.success) {
          setAttendanceRecords(response.data.attendance);

          const uniqueEnrollments = [
            ...new Set(response.data.attendance.map((item) => item.enrollmentNo)),
          ];
          
          uniqueEnrollments.sort(sortEnrollmentNo);
          
          setEnrollmentNumbers(uniqueEnrollments);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError("Failed to fetch attendance records. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/branch/getBranch`);
        if (response.data.success) {
          const branchNames = response.data.branches.map((b) => b.name);
          setBranches(branchNames);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
        if (response.data.success) {
          setStudents(response.data.students);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchAttendance();
    fetchBranches();
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/subject/getSubject`);
        if (response.data && response.data.success) {
          setAllSubjects(response.data.subject);
        }
      } catch (error) {
        console.error("Error fetching subject totals:", error);
      }
    };
    fetchSubjectData();
  }, []);

  useEffect(() => {
    const filterSubjectsByStudentRegulation = async () => {
      if (selectedBranch && selectedSemester) {
        let studentReg = null;
        let hasStudents = false;
        try {
          const studentRes = await axios.post(`${baseApiURL()}/student/details/getDetails`, {
            branch: selectedBranch,
            semester: Number(selectedSemester)
          });
          if (studentRes.data.success && studentRes.data.user && studentRes.data.user.length > 0) {
            hasStudents = true;
            studentReg = studentRes.data.user[0].regulation;
          }
        } catch (err) {
          console.warn("Could not fetch students for regulation check:", err);
        }

        if (!hasStudents) {
          setFilteredSubjects([]);
          setNoStudentsMessage("no students are there for that semester");
          return;
        }

        setNoStudentsMessage("");

        const filtered = allSubjects.filter(
          (subject) =>
            (subject.branch?.name === selectedBranch || subject.branch === selectedBranch) &&
            String(subject.semester) === String(selectedSemester) &&
            (!studentReg || subject.regulation?.toUpperCase() === studentReg.toUpperCase())
        );
        setFilteredSubjects(filtered);
      } else {
        setFilteredSubjects([]);
        setNoStudentsMessage("");
      }
    };
    filterSubjectsByStudentRegulation();
  }, [selectedBranch, selectedSemester, allSubjects]);

  // Function to get section-specific total for a subject
  const getSectionTotal = (subjectName, studentSection) => {
    if (!allSubjects || !Array.isArray(allSubjects)) return 0;
    
    const subject = allSubjects.find(sub => 
      sub.name === subjectName
    );
    
    if (!subject || !subject.sectionTotals) return 0;
    
    const sectionData = subject.sectionTotals.find(s => s.section === studentSection);
    return sectionData ? sectionData.total : 0;
  };

  // Function to get student section from student data
  const getStudentSection = (enrollmentNo) => {
    const student = students.find(s => s.enrollmentNo === enrollmentNo);
    return student ? student.section : '';
  };

  // Calculate student subject summary with section-specific totals
  const calculateStudentSummary = () => {
    if (attendanceRecords.length === 0 || allSubjects.length === 0) {
      return {};
    }

    const summary = {};

    attendanceRecords.forEach((record) => {
      const { enrollmentNo, subject, branch, semester, section } = record;
      const student = students.find(s => s.enrollmentNo === enrollmentNo);
      const studentSection = student ? student.section : '';
      const studentSemester = student ? student.semester : '';
      
      // Ignore attendance records that do not match the student's current semester
      if (studentSemester && String(semester) !== String(studentSemester)) {
        return;
      }
      
      if (
        (!selectedBranch || branch === selectedBranch) &&
        (!selectedSemester || String(semester) === String(selectedSemester)) &&
        (!selectedSection || section === selectedSection) &&
        (!selectedSection || studentSection === selectedSection) // Filter by student's actual section
      ) {
        if (!summary[enrollmentNo]) {
          summary[enrollmentNo] = {
            branch: branch,
            semester: semester,
            section: studentSection, // Use student's actual section
            subjects: {}
          };
        }
        
        if (!summary[enrollmentNo].subjects[subject]) {
          summary[enrollmentNo].subjects[subject] = 0;
        }
        summary[enrollmentNo].subjects[subject] += 1;
      }
    });

    // Calculate percentages with section-specific totals
    Object.keys(summary).forEach((enrollmentNo) => {
      const studentData = summary[enrollmentNo];
      let totalAttendedAllSubjects = 0;
      let totalClassesAllSubjects = 0;

      Object.keys(studentData.subjects).forEach((subject) => {
        const attended = studentData.subjects[subject];
        // Use section-specific total
        const total = getSectionTotal(subject, studentData.section);
        const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;

        totalAttendedAllSubjects += attended;
        totalClassesAllSubjects += total;

        studentData.subjects[subject] = {
          attended,
          total,
          percentage,
        };
      });

      studentData.overallTotal = {
        attended: totalAttendedAllSubjects,
        total: totalClassesAllSubjects,
        percentage:
          totalClassesAllSubjects > 0
            ? ((totalAttendedAllSubjects / totalClassesAllSubjects) * 100).toFixed(2)
            : 0,
      };
    });

    return summary;
  };

  const studentSubjectSummary = calculateStudentSummary();

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
    setSelectedSubject(""); // Reset subject when branch changes
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
    setSelectedSubject(""); // Reset subject when semester changes
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const handleExportToExcel = () => {
    const dataToExport = [];

    Object.entries(studentSubjectSummary).forEach(([enrollmentNo, studentData]) => {
      const { branch, semester, section, subjects, overallTotal } = studentData;

      // Add subject-wise records
      Object.entries(subjects).forEach(([subject, data]) => {
        dataToExport.push({
          "Enrollment No": enrollmentNo,
          "Branch": branch,
          "Semester": semester,
          "Section": section,
          "Subject": subject,
          "Attended Classes": data.attended,
          "Total Classes": data.total,
          "Subject Percentage": `${data.percentage}%`,
          "Total Attendance Percentage": "N/A",
        });
      });

      // Add overall total record
      if (overallTotal) {
        dataToExport.push({
          "Enrollment No": enrollmentNo,
          "Branch": branch,
          "Semester": semester,
          "Section": section,
          "Subject": "TOTAL",
          "Attended Classes": overallTotal.attended,
          "Total Classes": overallTotal.total,
          "Subject Percentage": "N/A",
          "Total Attendance Percentage": `${overallTotal.percentage}%`,
        });
      }
    });

    const filteredData = dataToExport
      .filter(
        (item) =>
          (selectedSubject ? item.Subject === selectedSubject : true) &&
          (enrollmentSearch
            ? item["Enrollment No"].toLowerCase().includes(enrollmentSearch.toLowerCase())
            : true) &&
          (selectedBranch ? item.Branch === selectedBranch : true) &&
          (selectedSemester ? item.Semester === parseInt(selectedSemester) : true) &&
          (selectedSection ? item.Section === selectedSection : true)
      )
      .sort(sortEnrollmentNo);

    if (filteredData.length === 0) {
      alert("No data to export for the selected filters.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    
    // Create filename with filter information
    let filename = "Attendance_Report";
    if (selectedBranch) filename += `_${selectedBranch}`;
    if (selectedSemester) filename += `_Sem${selectedSemester}`;
    if (selectedSection) filename += `_Sec${selectedSection}`;
    filename += ".xlsx";
    
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Attendance Records</h1>
      
      {/* Information Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-blue-700 text-sm">
            <strong>Note:</strong> Total classes are now section-specific. Each section has its own total class count.
          </p>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={handleBranchChange}
              disabled={!!lockedBranch}
              className={`w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regulation</label>
            <input
              type="text"
              value={selectedRegulation}
              readOnly
              placeholder="Auto-fetched..."
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed font-semibold text-blue-700"
            />
            <p className="text-[10px] text-gray-500 mt-1">Auto-fetched from student details</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedBranch || !selectedSemester}
            >
              <option value="">All Subjects</option>
              {filteredSubjects.map((subject) => (
                <option key={subject._id} value={subject.name}>
                  {subject.name} {subject.code ? `(${subject.code})` : ''} {subject.regulation ? `[${subject.regulation}]` : ''}
                </option>
              ))}
            </select>
            {noStudentsMessage ? (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center space-x-1">
                <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{noStudentsMessage}</span>
              </div>
            ) : (!selectedBranch || !selectedSemester) && (
              <p className="text-xs text-gray-500 mt-1">Select branch and semester first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
            <input
              type="text"
              value={enrollmentSearch}
              onChange={(e) => setEnrollmentSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search enrollment"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExportToExcel}
              disabled={Object.keys(studentSubjectSummary).length === 0}
              className={`w-full font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center ${
                Object.keys(studentSubjectSummary).length === 0
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Enrollment No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Attended</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Overall %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(studentSubjectSummary)
                .flatMap(([enrollmentNo, studentData]) => {
                  const { branch, semester, section, subjects, overallTotal } = studentData;
                  const rows = [];
                  
                  // Add subject rows
                  Object.entries(subjects).forEach(([subject, data]) => {
                    rows.push({
                      enrollmentNo,
                      branch,
                      semester,
                      section,
                      subject,
                      attended: data.attended,
                      total: data.total,
                      subjectPercentage: data.percentage,
                      totalAttendancePercentage: "N/A",
                      isTotalRow: false,
                    });
                  });

                  // Add total row
                  if (overallTotal) {
                    rows.push({
                      enrollmentNo,
                      branch,
                      semester,
                      section,
                      subject: "TOTAL",
                      attended: overallTotal.attended,
                      total: overallTotal.total,
                      subjectPercentage: "N/A",
                      totalAttendancePercentage: overallTotal.percentage,
                      isTotalRow: true,
                    });
                  }
                  
                  return rows;
                })
                .filter(
                  (item) =>
                    (selectedSubject ? item.subject === selectedSubject : true) &&
                    (enrollmentSearch
                      ? item.enrollmentNo.toLowerCase().includes(enrollmentSearch.toLowerCase())
                      : true) &&
                    (selectedBranch ? item.branch === selectedBranch : true) &&
                    (selectedSemester ? item.semester === parseInt(selectedSemester) : true) &&
                    (selectedSection ? item.section === selectedSection : true)
                )
                .sort((a, b) => {
                  // Primary sort by enrollment number
                  const enrollmentCompare = sortEnrollmentNo(a.enrollmentNo, b.enrollmentNo);
                  if (enrollmentCompare !== 0) return enrollmentCompare;

                  // Secondary sort: total rows come last
                  if (a.isTotalRow !== b.isTotalRow) {
                    return a.isTotalRow ? 1 : -1;
                  }

                  // Tertiary sort by subject name
                  return a.subject.localeCompare(b.subject);
                })
                .map((item, index) => (
                  <tr
                    key={index}
                    className={item.isTotalRow ? "bg-blue-50 font-semibold" : index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.enrollmentNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.semester}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.attended}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.subjectPercentage !== "N/A" ? `${item.subjectPercentage}%` : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {item.totalAttendancePercentage !== "N/A" ? `${item.totalAttendancePercentage}%` : "N/A"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        {Object.keys(studentSubjectSummary).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No attendance records found for the selected filters.
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {Object.keys(studentSubjectSummary).length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(studentSubjectSummary).length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-green-600">
              {new Set(Object.values(studentSubjectSummary).map(s => s.branch)).size}
            </div>
            <div className="text-sm text-gray-600">Branches</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(Object.entries(studentSubjectSummary).flatMap(([_, data]) => 
                Object.keys(data.subjects)
              )).size}
            </div>
            <div className="text-sm text-gray-600">Subjects</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTotalAttendance;
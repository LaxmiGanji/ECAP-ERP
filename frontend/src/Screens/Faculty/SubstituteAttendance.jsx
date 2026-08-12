// SubstituteAttendance.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const SubstituteAttendance = ({ onClose }) => {
  const router = useLocation();
  const [assignedLeaves, setAssignedLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facultyData, setFacultyData] = useState(null);
  const [absentFacultyData, setAbsentFacultyData] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [attendanceMode, setAttendanceMode] = useState("self");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [absenteesInput, setAbsenteesInput] = useState("");
  const [presenteesInput, setPresenteesInput] = useState("");
  const [timetableEntry, setTimetableEntry] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalClasses, setTotalClasses] = useState("");
  const [canAddAttendance, setCanAddAttendance] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (router.state?.loginid) {
      console.log("Current Faculty ID:", router.state.loginid);
      fetchAssignedLeaves();
      fetchCurrentFaculty();
      fetchStudents();
    } else {
      toast.error("Faculty ID not found. Please login again.");
    }
  }, []);

  const fetchAssignedLeaves = async () => {
    if (!router.state?.loginid) return;

    setLoading(true);
    try {
      console.log("Fetching leaves for substitute:", router.state.loginid);
      const response = await axios.get(
        `${baseApiURL()}/faculty/leave/getBySubstitute/${router.state.loginid}`
      );
      console.log("Leaves response:", response.data);
      
      if (response.data.success) {
        // Show approved leaves only
        const activeLeaves = response.data.leaves.filter(
          leave => leave.status === "approved"
        );
        setAssignedLeaves(activeLeaves);
        console.log("Active leaves found:", activeLeaves);
      }
    } catch (error) {
      console.error("Error fetching assigned leaves:", error);
      toast.error("Failed to fetch assigned leaves");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentFaculty = async () => {
    if (!router.state?.loginid) return;

    try {
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/getDetails`,
        { employeeId: router.state.loginid }
      );

      if (response.data.success) {
        setFacultyData(response.data.user[0]);
        console.log("Current faculty data:", response.data.user[0]);
      }
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    }
  };

  const fetchAbsentFacultyData = async (employeeId) => {
    try {
      console.log("Fetching absent faculty data for:", employeeId);
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/getDetails`,
        { employeeId }
      );

      if (response.data.success) {
        setAbsentFacultyData(response.data.user[0]);
        console.log("Absent faculty timetable:", response.data.user[0].timetable);
      }
    } catch (error) {
      console.error("Error fetching absent faculty data:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
      if (response.data.success) {
        setStudents(response.data.students);
        console.log("Students loaded:", response.data.students.length);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const handleLeaveSelect = async (leave) => {
    console.log("Selected leave:", leave);
    setSelectedLeave(leave);
    setSelectedDate("");
    setSelectedPeriod("");
    setSelectedDay("");
    setTimetableEntry(null);
    setMarkedAttendance({});
    setFilteredStudents([]);
    
    await fetchAbsentFacultyData(leave.facultyId);
  };

  const handleDateSelect = (date) => {
    console.log("Selected date:", date);
    setSelectedDate(date);
    setSelectedPeriod("");
    setSelectedDay("");
    setTimetableEntry(null);
    setMarkedAttendance({});
    setFilteredStudents([]);
    
    // Get day from date
    const dateObj = new Date(date);
    const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (dayIndex >= 1 && dayIndex <= 6) {
      const dayName = daysOfWeek[dayIndex - 1];
      setSelectedDay(dayName);
      console.log("Day from date:", dayName);
    }
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    setSelectedPeriod(period);
    console.log("Selected period:", period);
    
    if (period && selectedDay) {
      let timetableData = null;
      
      if (attendanceMode === "substitute" && absentFacultyData) {
        console.log("Looking in absent faculty timetable:", absentFacultyData.timetable);
        // Get timetable entry for absent faculty
        const dayEntry = absentFacultyData.timetable?.find(entry => entry.day === selectedDay);
        if (dayEntry) {
          console.log("Day entry found:", dayEntry);
          timetableData = dayEntry.periods.find(p => p.periodNumber === Number(period));
          console.log("Period entry found:", timetableData);
        }
      } else if (attendanceMode === "self" && facultyData) {
        console.log("Looking in current faculty timetable:", facultyData.timetable);
        // Get timetable entry for current faculty
        const dayEntry = facultyData.timetable?.find(entry => entry.day === selectedDay);
        if (dayEntry) {
          console.log("Day entry found:", dayEntry);
          timetableData = dayEntry.periods.find(p => p.periodNumber === Number(period));
          console.log("Period entry found:", timetableData);
        }
      }
      
      if (timetableData) {
        setTimetableEntry(timetableData);
        filterStudentsForClass(timetableData);
        setCanAddAttendance(true);
      } else {
        toast.error(`No class scheduled for ${selectedDay} Period ${period}`);
        setTimetableEntry(null);
        setFilteredStudents([]);
        setCanAddAttendance(false);
      }
    }
  };

  const filterStudentsForClass = (classInfo) => {
    console.log("Filtering students for class:", classInfo);
    let filtered = students;

    if (classInfo.branch) {
      filtered = filtered.filter(
        (student) => student.branch.toLowerCase() === classInfo.branch.toLowerCase()
      );
    }

    if (classInfo.semester) {
      filtered = filtered.filter(
        (student) => String(student.semester) === String(classInfo.semester)
      );
    }

    if (classInfo.section) {
      filtered = filtered.filter((student) => student.section === classInfo.section);
    }

    // Sort by enrollment number
    filtered.sort((a, b) => {
      const aNum = Number(a.enrollmentNo);
      const bNum = Number(b.enrollmentNo);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return String(a.enrollmentNo).localeCompare(String(b.enrollmentNo));
    });

    console.log("Filtered students:", filtered.length);
    setFilteredStudents(filtered);
  };

  // Toggle individual attendance
  const toggleAttendance = (student) => {
    setMarkedAttendance((prev) => {
      const newState = { ...prev };
      if (newState[student.enrollmentNo]) {
        delete newState[student.enrollmentNo];
      } else {
        newState[student.enrollmentNo] = {
          enrollmentNo: student.enrollmentNo,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim(),
          branch: student.branch,
          section: student.section,
          subject: timetableEntry?.subject,
          period: selectedPeriod,
          semester: timetableEntry?.semester,
          date: selectedDate,
          markedBy: router.state?.loginid,
          markedByName: facultyData ? `${facultyData.firstName} ${facultyData.lastName}` : "",
          isSubstitute: attendanceMode === "substitute",
          originalFaculty: attendanceMode === "substitute" ? selectedLeave?.facultyId : null,
          originalFacultyName: attendanceMode === "substitute" ? selectedLeave?.facultyName : null
        };
      }
      return newState;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    const newSelectAllChecked = !selectAllChecked;
    setSelectAllChecked(newSelectAllChecked);
    
    if (newSelectAllChecked) {
      const attendanceData = {};
      filteredStudents.forEach((student) => {
        attendanceData[student.enrollmentNo] = {
          enrollmentNo: student.enrollmentNo,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim(),
          branch: student.branch,
          section: student.section,
          subject: timetableEntry?.subject,
          period: selectedPeriod,
          semester: timetableEntry?.semester,
          date: selectedDate,
          markedBy: router.state?.loginid,
          markedByName: facultyData ? `${facultyData.firstName} ${facultyData.lastName}` : "",
          isSubstitute: attendanceMode === "substitute",
          originalFaculty: attendanceMode === "substitute" ? selectedLeave?.facultyId : null,
          originalFacultyName: attendanceMode === "substitute" ? selectedLeave?.facultyName : null
        };
      });
      setMarkedAttendance(attendanceData);
    } else {
      setMarkedAttendance({});
    }
  };

  // Handle presentees input
  const handlePresenteesInput = (input) => {
    setPresenteesInput(input);
    
    if (!input.trim()) return;
    
    const presentees = input.split(',').map(e => e.trim()).filter(e => e);
    
    const newAttendance = {};
    filteredStudents.forEach((student) => {
      if (presentees.includes(student.enrollmentNo)) {
        newAttendance[student.enrollmentNo] = {
          enrollmentNo: student.enrollmentNo,
          name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim(),
          branch: student.branch,
          section: student.section,
          subject: timetableEntry?.subject,
          period: selectedPeriod,
          semester: timetableEntry?.semester,
          date: selectedDate,
          markedBy: router.state?.loginid,
          markedByName: facultyData ? `${facultyData.firstName} ${facultyData.lastName}` : "",
          isSubstitute: attendanceMode === "substitute",
          originalFaculty: attendanceMode === "substitute" ? selectedLeave?.facultyId : null,
          originalFacultyName: attendanceMode === "substitute" ? selectedLeave?.facultyName : null
        };
      }
    });
    
    setMarkedAttendance(newAttendance);
    setSelectAllChecked(presentees.length === filteredStudents.length);
  };

  // Handle absentees input
  const handleAbsenteesInput = (input) => {
    setAbsenteesInput(input);
    
    if (!input.trim()) return;
    
    const absentees = input.split(',').map(e => e.trim()).filter(e => e);
    
    const newAttendance = { ...markedAttendance };
    absentees.forEach(enrollment => {
      delete newAttendance[enrollment];
    });
    
    setMarkedAttendance(newAttendance);
    setSelectAllChecked(Object.keys(newAttendance).length === filteredStudents.length);
  };

  const submitAttendance = async () => {
    if (Object.keys(markedAttendance).length === 0) {
      toast.error("No students selected for attendance");
      return;
    }

    if (!selectedDate || !selectedPeriod || !timetableEntry) {
      toast.error("Please select date and period");
      return;
    }

    setSubmitting(true);
    toast.loading("Submitting attendance...");

    try {
      const attendanceArray = Object.values(markedAttendance);
      console.log("Submitting attendance:", attendanceArray);
      
      const response = await axios.post(
        `${baseApiURL()}/attendence/addBulk`,
        attendanceArray
      );

      toast.dismiss();
      setSubmitting(false);

      if (response.data.success) {
        toast.success("Attendance submitted successfully!");
        setMarkedAttendance({});
        setSelectAllChecked(false);
        setAbsenteesInput("");
        setPresenteesInput("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      setSubmitting(false);
      console.error("Error submitting attendance:", error);
      toast.error(error.response?.data?.message || "Failed to submit attendance");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Substitute Attendance</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading substitute duties...</p>
        </div>
      )}

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs">
          <p><strong>Current Faculty ID:</strong> {router.state?.loginid}</p>
          <p><strong>Assigned Leaves:</strong> {assignedLeaves.length}</p>
          <button 
            onClick={fetchAssignedLeaves}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Refresh Leaves
          </button>
        </div>
      )}

      {/* Assigned Leaves */}
      {assignedLeaves.length > 0 && !selectedLeave && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Faculty on Leave - You are the Substitute</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedLeaves.map((leave) => (
              <div
                key={leave._id}
                className="border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow bg-blue-50"
                onClick={() => handleLeaveSelect(leave)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{leave.facultyName}</p>
                    <p className="text-sm text-gray-600">Employee ID: {leave.facultyId}</p>
                    <p className="text-sm text-gray-600 mt-2">Leave Dates:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {leave.dates.map((date, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                          {new Date(date).toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-green-600 mt-2">Status: {leave.status}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Take Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No leaves assigned */}
      {!loading && assignedLeaves.length === 0 && !selectedLeave && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600">No substitute duties assigned at the moment.</p>
        </div>
      )}

      {/* Attendance Mode Selection */}
      {selectedLeave && (
        <div className="mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800">
              You are taking attendance for <strong>{selectedLeave.facultyName}</strong> who is on leave.
            </p>
          </div>

          <div className="flex space-x-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg ${
                attendanceMode === "self"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => {
                setAttendanceMode("self");
                setTimetableEntry(null);
                setFilteredStudents([]);
                setMarkedAttendance({});
              }}
            >
              My Classes
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                attendanceMode === "substitute"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => {
                setAttendanceMode("substitute");
                setTimetableEntry(null);
                setFilteredStudents([]);
                setMarkedAttendance({});
              }}
            >
              {selectedLeave.facultyName}'s Classes
            </button>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">Select Date</label>
              <select
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="">-- Select Date --</option>
                {selectedLeave.dates.map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                disabled={!selectedDate}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="">-- Select Period --</option>
                {[...Array(9).keys()].map((i) => (
                  <option key={i + 1} value={i + 1}>
                    Period {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">Day</label>
              <input
                type="text"
                value={selectedDay}
                disabled
                className="w-full px-4 py-2 border rounded bg-gray-100"
              />
            </div>
          </div>

          {/* Class Info */}
          {timetableEntry && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Class Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Subject:</span>
                  <p className="font-medium">{timetableEntry.subject}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Branch:</span>
                  <p className="font-medium">{timetableEntry.branch}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Semester:</span>
                  <p className="font-medium">{timetableEntry.semester}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Section:</span>
                  <p className="font-medium">{timetableEntry.section}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Input Fields */}
          {filteredStudents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Presentees (comma-separated enrollment numbers)
                </label>
                <textarea
                  value={presenteesInput}
                  onChange={(e) => handlePresenteesInput(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  rows="2"
                  placeholder="Enter enrollment numbers separated by commas"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Absentees (comma-separated enrollment numbers)
                </label>
                <textarea
                  value={absenteesInput}
                  onChange={(e) => handleAbsenteesInput(e.target.value)}
                  className="w-full px-4 py-2 border rounded"
                  rows="2"
                  placeholder="Enter enrollment numbers separated by commas"
                />
              </div>
            </div>
          )}

          {/* Student List */}
          {filteredStudents.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Students ({filteredStudents.length} found)
                </h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectAllChecked}
                    onChange={toggleSelectAll}
                    className="mr-2"
                  />
                  <span>Select All</span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full bg-white border">
                  <thead className="sticky top-0 bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border">Select</th>
                      <th className="py-2 px-4 border">Enrollment No</th>
                      <th className="py-2 px-4 border">Name</th>
                      <th className="py-2 px-4 border">Branch</th>
                      <th className="py-2 px-4 border">Semester</th>
                      <th className="py-2 px-4 border">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.enrollmentNo} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border text-center">
                          <input
                            type="checkbox"
                            checked={!!markedAttendance[student.enrollmentNo]}
                            onChange={() => toggleAttendance(student)}
                          />
                        </td>
                        <td className="py-2 px-4 border">{student.enrollmentNo}</td>
                        <td className="py-2 px-4 border">
                          {student.firstName} {student.middleName} {student.lastName}
                        </td>
                        <td className="py-2 px-4 border">{student.branch}</td>
                        <td className="py-2 px-4 border">{student.semester}</td>
                        <td className="py-2 px-4 border">{student.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={submitAttendance}
                  disabled={submitting || Object.keys(markedAttendance).length === 0}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Attendance"}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  {Object.keys(markedAttendance).length} students selected for attendance
                </p>
              </div>
            </>
          )}

          {/* No students message */}
          {timetableEntry && filteredStudents.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No students found for this class.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubstituteAttendance;
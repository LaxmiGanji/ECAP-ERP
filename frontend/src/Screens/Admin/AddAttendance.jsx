import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";

const AddAttendance = ({ branch: lockedBranch }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [semester, setSemester] = useState("-- Select --");
  const [branch, setBranch] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("-- Select --");
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "-- Select --");
  const [selectedSection, setSelectedSection] = useState("-- Select --");
  const [selectedPeriod, setSelectedPeriod] = useState("-- Select --");
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [range, setRange] = useState({ start: "", end: "" });
  const [totalClasses, setTotalClasses] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [canAddAttendance, setCanAddAttendance] = useState(false);
  const [absenteesInput, setAbsenteesInput] = useState("");
  const [attendanceExists, setAttendanceExists] = useState(false);
  const [existingAttendanceRecords, setExistingAttendanceRecords] = useState([]);
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);

  // Sections available for filtering
  const sections = ['A', 'B', 'C', 'D', 'SOC', 'WIPRO TRAINING', 'ATT'];

  
  // Fetch branch data
  const getBranchData = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      });
  };

  
  // Fetch subject data
  const getSubjectData = () => {
    setLoading(true);
    toast.loading("Loading Subjects");
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        toast.dismiss();
        setLoading(false);
        if (response.data.success) {
          setSubjects(response.data.subject);
          filterSubjectsBySemester(semester, response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        setLoading(false);
        toast.error(error.message);
      });
  };

  // Function to filter subjects based on semester and branch
  const filterSubjectsBySemester = (selectedSemester, subjectsList = subjects) => {
    if (selectedSemester === "-- Select --" || selectedBranch === "-- Select --") {
      setFilteredSubjects([]);
      setSelectedSubject("-- Select --");
      setSelectedSubjectId(null);
      setTotalClasses("");
      setCanAddAttendance(false);
      return;
    }

    const semesterSubjects = subjectsList.filter(
      (subject) => 
        String(subject.semester) === String(selectedSemester) &&
        subject.branch?.name === selectedBranch &&
        (selectedRegulation === "" || subject.regulation?.toUpperCase() === selectedRegulation.toUpperCase())
    );
    setFilteredSubjects(semesterSubjects);
    
    // If we had a subject selected before, try to preserve it
    if (selectedSubject !== "-- Select --") {
      const preservedSubject = semesterSubjects.find(sub => sub.name === selectedSubject);
      if (preservedSubject) {
        setSelectedSubjectId(preservedSubject._id);
        // Get the section-specific total
        getSectionTotal(preservedSubject._id, selectedSection);
        setCanAddAttendance(false);
      } else {
        setSelectedSubject("-- Select --");
        setSelectedSubjectId(null);
        setTotalClasses("");
        setCanAddAttendance(false);
      }
    } else {
      setSelectedSubject("-- Select --");
      setSelectedSubjectId(null);
      setTotalClasses("");
      setCanAddAttendance(false);
    }
  };

  // Get section total from backend
  const getSectionTotal = async (subjectId, section) => {
    if (subjectId && section !== "-- Select --") {
      try {
        const response = await axios.get(`${baseApiURL()}/subject/getSectionTotal/${subjectId}/${section}`);
        if (response.data.success) {
          setTotalClasses(response.data.sectionTotal.toString());
        }
      } catch (error) {
        console.error("Error fetching section total:", error);
        setTotalClasses("0");
      }
    } else {
      setTotalClasses("");
    }
  };

  // Update section total in backend
  const updateSectionTotal = async (newTotal) => {
    if (!selectedSubjectId || selectedSection === "-- Select --" || newTotal === undefined) {
      toast.error("Please select a subject, section and enter total classes");
      return;
    }
    
    setLoading(true);
    toast.loading("Updating total classes...");
    try {
      const response = await axios.put(`${baseApiURL()}/subject/updateSectionTotal/${selectedSubjectId}`, {
        section: selectedSection,
        total: Number(newTotal),
        isIncrement: false, // Set to false for absolute value updates
        incrementType: 'BY_VALUE'
      });
      
      toast.dismiss();
      setLoading(false);
      if (response.data.success) {
        toast.success(`Section ${selectedSection} total classes updated successfully!`);
        setCanAddAttendance(true);
        
        // Update local state
        const updatedSubjects = subjects.map(sub => {
          if (sub._id === selectedSubjectId) {
            const updatedSectionTotals = [...sub.sectionTotals];
            const sectionIndex = updatedSectionTotals.findIndex(s => s.section === selectedSection);
            if (sectionIndex >= 0) {
              updatedSectionTotals[sectionIndex].total = Number(newTotal);
            } else {
              updatedSectionTotals.push({ section: selectedSection, total: Number(newTotal) });
            }
            return { ...sub, sectionTotals: updatedSectionTotals };
          }
          return sub;
        });
        setSubjects(updatedSubjects);
        
        const updatedFilteredSubjects = filteredSubjects.map(sub => {
          if (sub._id === selectedSubjectId) {
            const updatedSectionTotals = [...sub.sectionTotals];
            const sectionIndex = updatedSectionTotals.findIndex(s => s.section === selectedSection);
            if (sectionIndex >= 0) {
              updatedSectionTotals[sectionIndex].total = Number(newTotal);
            } else {
              updatedSectionTotals.push({ section: selectedSection, total: Number(newTotal) });
            }
            return { ...sub, sectionTotals: updatedSectionTotals };
          }
          return sub;
        });
        setFilteredSubjects(updatedFilteredSubjects);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      setLoading(false);
      toast.error("Failed to update total classes");
      console.error("Update error:", error.response?.data || error.message);
    }
  };

  // Handle semester change
  const handleSemesterChange = (e) => {
    const newSemester = e.target.value;
    setSemester(newSemester);
    // Reset regulation when semester changes to allow for fresh detection
    setSelectedRegulation("");
    filterSubjectsBySemester(newSemester);
  };

  // Handle branch change
  const handleBranchChange = (e) => {
    const newBranch = e.target.value;
    setSelectedBranch(newBranch);
    filterSubjectsBySemester(semester);
  };

  // Handle regulation change (internal use)
  const handleRegulationChange = (e) => {
    const newReg = e.target.value.toUpperCase();
    setSelectedRegulation(newReg);
    filterSubjectsBySemester(semester, subjects);
  };

  // Handle section change
  const handleSectionChange = (e) => {
    const newSection = e.target.value;
    setSelectedSection(newSection);
    
    // When section changes, update the total classes for the selected subject and section
    if (selectedSubjectId && newSection !== "-- Select --") {
      getSectionTotal(selectedSubjectId, newSection);
    } else {
      setTotalClasses("");
    }
    setCanAddAttendance(false);
  };

  // Handle subject change
  const handleSubjectChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedSubject(selectedValue);
    
    if (selectedValue === "-- Select --") {
      setSelectedSubjectId(null);
      setTotalClasses("");
      setCanAddAttendance(false);
      return;
    }

    const subject = filteredSubjects.find(sub => sub.name === selectedValue);
    if (subject) {
      setSelectedSubjectId(subject._id);
      // Get the section-specific total
      getSectionTotal(subject._id, selectedSection);
      setCanAddAttendance(false);
    } else {
      setSelectedSubjectId(null);
      setTotalClasses("");
      setCanAddAttendance(false);
    }
  };

  // Increment total classes by 1 only - FIXED
  const incrementTotalClasses = async () => {
    if (!selectedSubjectId || selectedSection === "-- Select --") {
      toast.error("Please select a subject and section first");
      return;
    }
    
    // Check if attendance already exists for this date/branch/semester/period/section
    if (attendanceExists) {
      toast.error("Attendance already exists for this date/subject/period/section. No need to increment total classes.");
      return;
    }
    
    setLoading(true);
    toast.loading("Incrementing total classes by 1...");
    
    try {
      // Use the new endpoint that increments by 1 only
      const response = await axios.put(
        `${baseApiURL()}/subject/incrementSectionTotalByOne/${selectedSubjectId}`,
        { section: selectedSection }
      );
      
      toast.dismiss();
      setLoading(false);
      
      if (response.data.success) {
        // Update local state with the new total
        const newTotal = response.data.sectionTotal;
        setTotalClasses(newTotal.toString());
        toast.success("Total classes incremented by 1");
        setCanAddAttendance(true);
        
        // Update local subjects state
        const updatedSubjects = subjects.map(sub => {
          if (sub._id === selectedSubjectId) {
            const updatedSectionTotals = [...sub.sectionTotals];
            const sectionIndex = updatedSectionTotals.findIndex(s => s.section === selectedSection);
            if (sectionIndex >= 0) {
              updatedSectionTotals[sectionIndex].total = newTotal;
            } else {
              updatedSectionTotals.push({ section: selectedSection, total: newTotal });
            }
            return { ...sub, sectionTotals: updatedSectionTotals };
          }
          return sub;
        });
        setSubjects(updatedSubjects);
        
        const updatedFilteredSubjects = filteredSubjects.map(sub => {
          if (sub._id === selectedSubjectId) {
            const updatedSectionTotals = [...sub.sectionTotals];
            const sectionIndex = updatedSectionTotals.findIndex(s => s.section === selectedSection);
            if (sectionIndex >= 0) {
              updatedSectionTotals[sectionIndex].total = newTotal;
            } else {
              updatedSectionTotals.push({ section: selectedSection, total: newTotal });
            }
            return { ...sub, sectionTotals: updatedSectionTotals };
          }
          return sub;
        });
        setFilteredSubjects(updatedFilteredSubjects);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      setLoading(false);
      toast.error("Failed to increment total classes");
      console.error("Increment error:", error.response?.data || error.message);
    }
  };

  // Decrement total classes and disable attendance if needed
  const decrementTotalClasses = () => {
    if (!selectedSubjectId || selectedSection === "-- Select --" || Number(totalClasses) <= 0) {
      return;
    }
    
    const newTotal = Number(totalClasses) - 1;
    setTotalClasses(newTotal.toString());
    updateSectionTotal(newTotal);
    
    // If we're decrementing to 0, disable attendance
    if (newTotal === 0) {
      setCanAddAttendance(false);
    }
  };

  // Manual total classes update
  const handleTotalClassesChange = (e) => {
    const value = e.target.value;
    setTotalClasses(value);
    // Don't auto-update here, let user use +/- buttons or manually submit
  };

  // Manual update of total classes
  const updateTotalClassesManually = () => {
    if (!selectedSubjectId || selectedSection === "-- Select --") {
      toast.error("Please select a subject and section first");
      return;
    }
    
    updateSectionTotal(Number(totalClasses));
  };

  // Check if attendance already exists for the selected filters
  const checkAttendanceExists = async () => {
    if (!selectedBranch || selectedBranch === "-- Select --" || 
        !semester || semester === "-- Select --" || 
        !selectedSection || selectedSection === "-- Select --" || 
        !selectedSubject || selectedSubject === "-- Select --" || 
        !selectedPeriod || selectedPeriod === "-- Select --" || 
        !selectedDate) {
      return;
    }

    setIsCheckingAttendance(true);
    try {
      const response = await axios.get(`${baseApiURL()}/attendence/checkExists`, {
        params: {
          branch: selectedBranch,
          semester: semester,
          period: selectedPeriod,
          section: selectedSection,
          subject: selectedSubject,
          date: selectedDate
        }
      });

      if (response.data.success) {
        setAttendanceExists(response.data.exists);
        if (response.data.exists) {
          // Fetch existing attendance records
          const existingResponse = await axios.get(`${baseApiURL()}/attendence/getExisting`, {
            params: {
              branch: selectedBranch,
              semester: semester,
              period: selectedPeriod,
              section: selectedSection,
              subject: selectedSubject,
              date: selectedDate
            }
          });

          if (existingResponse.data.success) {
            setExistingAttendanceRecords(existingResponse.data.attendanceRecords);
            // Pre-select students who already have attendance
            const preSelectedAttendance = {};
            existingResponse.data.attendanceRecords.forEach(record => {
              preSelectedAttendance[record.enrollmentNo] = {
                enrollmentNo: record.enrollmentNo,
                name: record.name,
                branch: record.branch,
                section: record.section,
                subject: record.subject,
                period: record.period,
                semester: record.semester,
                date: record.date,
              };
            });
            setMarkedAttendance(preSelectedAttendance);
            
            // Update select all checkbox state
            const allStudentsSelected = filteredStudents.length > 0 && 
              filteredStudents.every(student => preSelectedAttendance[student.enrollmentNo]);
            setSelectAllChecked(allStudentsSelected);
          }
        } else {
          setExistingAttendanceRecords([]);
          setMarkedAttendance({});
          setSelectAllChecked(false);
        }
      }
    } catch (error) {
      console.error("Error checking attendance existence:", error);
      toast.error("Failed to check existing attendance");
    } finally {
      setIsCheckingAttendance(false);
    }
  };

  // Fetch student data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
        setLoading(false);
        if (response.data.success) {
          setStudents(response.data.students);
        } else {
          toast.error("Failed to load students");
        }
      } catch (error) {
        setLoading(false);
        toast.error("Error fetching students");
        console.error(error);
      }
    };

    fetchStudents();
  }, []);

  // Initial data fetch
  useEffect(() => {
    getBranchData();
    getSubjectData();
  }, []);

  // Filter students based on filters
  useEffect(() => {
    filterStudents();
  }, [students, selectedBranch, semester, selectedSection, range]);

  // Check attendance existence when filters change
  useEffect(() => {
    checkAttendanceExists();
  }, [selectedBranch, semester, selectedSection, selectedSubject, selectedPeriod, selectedDate]);

  // Auto-detect regulation from filtered students
  useEffect(() => {
    if (filteredStudents.length > 0) {
      // Find the regulation from the first student (usually all students in a section have the same regulation)
      const detectedReg = filteredStudents[0].regulation;
      if (detectedReg && detectedReg.toUpperCase() !== selectedRegulation) {
        setSelectedRegulation(detectedReg.toUpperCase());
      }
    }
  }, [filteredStudents, selectedRegulation]);

  const filterStudents = () => {
    let filtered = students;

    if (selectedBranch && selectedBranch !== "-- Select --") {
      filtered = filtered.filter(
        (student) => student.branch.toLowerCase() === selectedBranch.toLowerCase()
      );
    }

    if (semester && semester !== "-- Select --") {
      filtered = filtered.filter((student) => String(student.semester) === semester);
    }

    if (selectedSection && selectedSection !== "-- Select --") {
      filtered = filtered.filter((student) => student.section === selectedSection);
    }

    if (range.start && range.end) {
      filtered = filtered.filter(
        (student) =>
          student.enrollmentNo >= Number(range.start) &&
          student.enrollmentNo <= Number(range.end)
      );
    }

    // Sort enrollment numbers in ascending order
    filtered.sort((a, b) => {
      const aNum = Number(a.enrollmentNo);
      const bNum = Number(b.enrollmentNo);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return String(a.enrollmentNo).localeCompare(String(b.enrollmentNo));
    });

    setFilteredStudents(filtered);
  };

  // Toggle individual attendance (local state only)
  const toggleAttendance = (student) => {
    // Allow editing if attendance already exists, otherwise require total class increment
    if (!attendanceExists && !canAddAttendance) {
      toast.error("Please increment total classes first to enable attendance marking");
      return;
    }
    if (selectedSubject === "-- Select --" || selectedPeriod === "-- Select --") {
      toast.error("Please select both a subject and period.");
      return;
    }
    
    // Check if student is marked as absent
    const absentees = absenteesInput.split(',').map(enrollment => enrollment.trim()).filter(enrollment => enrollment);
    if (absentees.includes(student.enrollmentNo)) {
      toast.error("Cannot mark attendance for absent student. Remove from absentees list first.");
      return;
    }
    
    setMarkedAttendance((prev) => {
      const newState = { ...prev };
      if (newState[student.enrollmentNo]) {
        delete newState[student.enrollmentNo];
      } else {
        newState[student.enrollmentNo] = {
          enrollmentNo: student.enrollmentNo,
          name: `${student.firstName} ${student.lastName}`,
          branch: student.branch,
          section: student.section,
          subject: selectedSubject,
          period: selectedPeriod,
          semester: semester,
          date: selectedDate,
        };
      }
      return newState;
    });
  };

  // Mark/unmark all locally
  const toggleSelectAll = () => {
    // Allow editing if attendance already exists, otherwise require total class increment
    if (!attendanceExists && !canAddAttendance) {
      toast.error("Please increment total classes first to enable attendance marking");
      return;
    }
    if (selectedSubject === "-- Select --" || selectedPeriod === "-- Select --") {
      toast.error("Please select both a subject and period.");
      return;
    }
    const newSelectAllChecked = !selectAllChecked;
    setSelectAllChecked(newSelectAllChecked);
    if (newSelectAllChecked) {
      const attendanceDataForBulk = {};
      // Get absentees from input
      const absentees = absenteesInput.split(',').map(enrollment => enrollment.trim()).filter(enrollment => enrollment);
      
      filteredStudents.forEach((student) => {
        // Skip absentees when marking all
        if (!absentees.includes(student.enrollmentNo)) {
          attendanceDataForBulk[student.enrollmentNo] = {
            enrollmentNo: student.enrollmentNo,
            name: `${student.firstName} ${student.lastName}`,
            branch: student.branch,
            section: student.section,
            subject: selectedSubject,
            period: selectedPeriod,
            semester: semester,
            date: selectedDate,
          };
        }
      });
      setMarkedAttendance(attendanceDataForBulk);
    } else {
      setMarkedAttendance({});
    }
  };

  // Handle absentees input
  const handleAbsenteesInput = (input) => {
    setAbsenteesInput(input);
    
    if (!input.trim()) {
      return;
    }
    
    const absentees = input.split(',').map(enrollment => enrollment.trim()).filter(enrollment => enrollment);
    
    const newAttendance = {};
    Object.keys(markedAttendance).forEach(enrollmentNo => {
      if (!absentees.includes(enrollmentNo)) {
        newAttendance[enrollmentNo] = markedAttendance[enrollmentNo];
      }
    });
    
    setMarkedAttendance(newAttendance);
    
    const remainingStudents = filteredStudents.filter(student => !absentees.includes(student.enrollmentNo));
    const allRemainingSelected = remainingStudents.length > 0 && 
      remainingStudents.every(student => newAttendance[student.enrollmentNo]);
    setSelectAllChecked(allRemainingSelected);
  };

  // Submit attendance to backend
  const handleSubmitAttendance = async () => {
    if (selectedSubject === "-- Select --" || selectedPeriod === "-- Select --") {
      toast.error("Please select both a subject and period.");
      return;
    }
    
    // If attendance already exists, allow editing without requiring total class increment
    if (!attendanceExists && !canAddAttendance) {
      toast.error("Please increment total classes first to enable attendance marking");
      return;
    }
    
    const attendanceArray = Object.values(markedAttendance);
    if (attendanceArray.length === 0) {
      toast.error("No students selected for attendance.");
      return;
    }
    
    setLoading(true);
    toast.loading(attendanceExists ? "Updating attendance..." : "Submitting attendance...");
    
    try {
      let response;
      
      if (attendanceExists) {
        // If attendance exists, we need to update existing records
        // First, remove existing attendance for this date/subject/period/section
        const existingEnrollmentNos = existingAttendanceRecords.map(record => record.enrollmentNo);
        
        // Remove existing attendance
        await axios.post(`${baseApiURL()}/attendence/removeBulk`, 
          existingAttendanceRecords.map(record => ({
            enrollmentNo: record.enrollmentNo,
            subject: record.subject,
            semester: record.semester,
            period: record.period,
            section: record.section,
            date: record.date
          }))
        );
        
        // Add new attendance
        response = await axios.post(
          `${baseApiURL()}/attendence/addBulk`,
          attendanceArray
        );
      } else {
        // Add new attendance
        response = await axios.post(
          `${baseApiURL()}/attendence/addBulk`,
          attendanceArray
        );
      }
      
      toast.dismiss();
      setLoading(false);
      
      if (response.data.success) {
        toast.success(attendanceExists ? "Attendance updated successfully!" : "Attendance submitted successfully!");
        setMarkedAttendance({});
        setSelectAllChecked(false);
        setAttendanceExists(false);
        setExistingAttendanceRecords([]);
        
        // Refresh the attendance check
        setTimeout(() => {
          checkAttendanceExists();
        }, 1000);
      } else {
        toast.error(response.data.message || "Failed to submit attendance.");
      }
    } catch (error) {
      toast.dismiss();
      setLoading(false);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit attendance.");
      }
      console.error("Submit attendance error:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Add Attendance</h2>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
        <div>
          <label className="block font-medium text-gray-700">Branch</label>
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={!!lockedBranch}
            className={`w-full px-4 py-2 border rounded ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option>-- Select --</option>
            {branch.map((b) => (
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Semester</label>
          <select
            value={semester}
            onChange={handleSemesterChange}
            className="w-full px-4 py-2 border rounded"
          >
            <option>-- Select --</option>
            {[...Array(8).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Regulation</label>
          <input
            type="text"
            value={selectedRegulation}
            readOnly
            placeholder="Detecting..."
            className="w-full px-4 py-2 border rounded bg-gray-50 cursor-not-allowed font-semibold text-blue-700"
          />
          <p className="text-[10px] text-gray-500 mt-1">Auto-fetched from student details</p>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Section</label>
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="w-full px-4 py-2 border rounded"
          >
            <option>-- Select --</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Subject</label>
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="w-full px-4 py-2 border rounded"
            disabled={semester === "-- Select --"}
          >
            <option>-- Select --</option>
            {filteredSubjects.map((subject) => (
              <option key={subject._id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          >
            <option>-- Select --</option>
            {[...Array(9).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Enrollment Range</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Start"
              value={range.start}
              onChange={(e) => setRange({ ...range, start: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="End"
              value={range.end}
              onChange={(e) => setRange({ ...range, end: e.target.value })}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Total Classes Input - Section Specific */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          Total Classes for Section {selectedSection !== "-- Select --" ? selectedSection : ""}
        </label>
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <input
              type="number"
              value={totalClasses}
              onChange={handleTotalClassesChange}
              className="w-full px-4 py-2 border rounded"
              placeholder="Enter total classes"
              disabled={!selectedSubjectId || selectedSection === "-- Select --"}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={incrementTotalClasses}
              disabled={!selectedSubjectId || selectedSection === "-- Select --" || loading}
              className={`px-3 py-2 rounded text-white ${!selectedSubjectId || selectedSection === "-- Select --" || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              +
            </button>
            <button
              onClick={decrementTotalClasses}
              disabled={!selectedSubjectId || selectedSection === "-- Select --" || loading || Number(totalClasses) <= 0}
              className={`px-3 py-2 rounded text-white ${!selectedSubjectId || selectedSection === "-- Select --" || loading || Number(totalClasses) <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              −
            </button>
          </div>
          <button
            onClick={updateTotalClassesManually}
            disabled={!selectedSubjectId || selectedSection === "-- Select --" || loading}
            className={`px-4 py-2 rounded text-white ${!selectedSubjectId || selectedSection === "-- Select --" || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Update
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          This total is specific to {selectedSection !== "-- Select --" ? `Section ${selectedSection}` : "selected section"}
        </p>
      </div>

      {/* Absentees Input */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">Absentees (Comma Separated)</label>
        <input
          type="text"
          value={absenteesInput}
          onChange={(e) => handleAbsenteesInput(e.target.value)}
          placeholder="e.g., 22N81A0501, 22N81A0502"
          className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">Enter enrollment numbers separated by commas to automatically deselect absent students</p>
      </div>

      {/* Status indicator */}
      {attendanceExists && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded border border-blue-200">
          <div className="flex items-center">
            <span className="text-lg mr-2">ℹ️</span>
            <div>
              <strong>Attendance already exists</strong> for this date/subject/period/section. 
              You can edit the existing attendance by modifying the selections below.
              {existingAttendanceRecords.length > 0 && (
                <div className="text-sm mt-1">
                  {existingAttendanceRecords.length} student(s) already marked for attendance.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!attendanceExists && canAddAttendance && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          ✓ Attendance marking is enabled. You can now mark attendance for students.
        </div>
      )}
      
      {isCheckingAttendance && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          🔍 Checking for existing attendance...
        </div>
      )}

      {/* Bulk Actions */}
      <div className="mb-6 flex space-x-4">
        <button
          onClick={toggleSelectAll}
          disabled={(!attendanceExists && !canAddAttendance) || selectedSubject === "-- Select --" || selectedPeriod === "-- Select --" || loading}
          className={`px-4 py-2 rounded text-white ${(!attendanceExists && !canAddAttendance) || selectedSubject === "-- Select --" || selectedPeriod === "-- Select --" || loading ? 'bg-gray-400 cursor-not-allowed' : selectAllChecked ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'Processing...' : selectAllChecked ? 'Unmark All' : 'Mark All'}
        </button>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">
                <input
                  type="checkbox"
                  checked={selectAllChecked}
                  onChange={toggleSelectAll}
                  disabled={(!attendanceExists && !canAddAttendance) || selectedSubject === "-- Select --" || selectedPeriod === "-- Select --"}
                />
              </th>
              <th className="border border-gray-300 px-4 py-2">Enrollment No</th>
              <th className="border border-gray-300 px-4 py-2">Name</th>
              <th className="border border-gray-300 px-4 py-2">Branch</th>
              <th className="border border-gray-300 px-4 py-2">Section</th>
              <th className="border border-gray-300 px-4 py-2">Semester</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const isAbsent = absenteesInput.split(',').map(e => e.trim()).filter(e => e).includes(student.enrollmentNo);
              return (
                <tr key={student._id} className={isAbsent ? 'bg-red-50' : ''}>
                <td className="border border-gray-300 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={!!markedAttendance[student.enrollmentNo]}
                    onChange={() => toggleAttendance(student)}
                    disabled={(!attendanceExists && !canAddAttendance) || selectedSubject === "-- Select --" || selectedPeriod === "-- Select --" || absenteesInput.split(',').map(e => e.trim()).filter(e => e).includes(student.enrollmentNo)}
                  />
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {student.enrollmentNo}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {student.firstName} {student.middleName} {student.lastName}
                </td>
                <td className="border border-gray-300 px-4 py-2">{student.branch}</td>
                <td className="border border-gray-300 px-4 py-2">{student.section}</td>
                <td className="border border-gray-300 px-4 py-2">{student.semester}</td>
              </tr>
                );
              })}
          </tbody>
        </table>
      )}

      {/* Submit Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmitAttendance}
          disabled={(!attendanceExists && !canAddAttendance) || Object.keys(markedAttendance).length === 0 || loading}
          className={`px-8 py-3 rounded-lg text-white font-semibold ${(!attendanceExists && !canAddAttendance) || Object.keys(markedAttendance).length === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? (attendanceExists ? "Updating..." : "Submitting...") : (attendanceExists ? "Update Attendance" : "Submit Attendance")}
        </button>
      </div>
    </div>
  );
};

export default AddAttendance;
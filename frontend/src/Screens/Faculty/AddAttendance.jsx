// AddAttendance.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import FacultyLeaveManagement from "./FacultyLeaveManagement";
import SubstituteAttendance from "./SubstituteAttendance";

const AddAttendance = () => {
  const router = useLocation();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [semester, setSemester] = useState("-- Select --");
  const [branch, setBranch] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("-- Select --");
  const [selectedBranch, setSelectedBranch] = useState("-- Select --");
  const [selectedSection, setSelectedSection] = useState("-- Select --");
  const [selectedPeriod, setSelectedPeriod] = useState("-- Select --");
  const [selectedDay, setSelectedDay] = useState("-- Select --");
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [range, setRange] = useState({ start: "", end: "" });
  const [totalClasses, setTotalClasses] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [canAddAttendance, setCanAddAttendance] = useState(false);
  const [absenteesInput, setAbsenteesInput] = useState("");
  const [presenteesInput, setPresenteesInput] = useState("");
  const [facultyData, setFacultyData] = useState(null);
  const [attendanceExists, setAttendanceExists] = useState(false);
  const [existingAttendanceRecords, setExistingAttendanceRecords] = useState([]);
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false);
  // New state for available periods based on selected day
  const [availablePeriods, setAvailablePeriods] = useState([]);
  
  // Modal states for leave management
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);

  // Days available for selection
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Sections available for filtering
  const sections = ['A', 'B', 'C', 'D', 'SOC', 'WIPRO TRAINING', 'ATT'];

  // Non-teaching activities that should be excluded
  const nonTeachingActivities = ['break', 'free', 'library', 'sports', 'lunch', 'zero period'];

  // Fetch faculty data including timetable
  const getFacultyData = () => {
    if (!router.state?.loginid) {
      toast.error("Faculty ID not found");
      return;
    }

    setLoading(true);
    axios
      .post(
        `${baseApiURL()}/faculty/details/getDetails`,
        { employeeId: router.state.loginid }
      )
      .then((response) => {
        setLoading(false);
        if (response.data.success) {
          const faculty = response.data.user[0];
          setFacultyData(faculty);
          
          // Check if faculty has timetable
          if (!faculty.timetable || faculty.timetable.length === 0) {
            toast.error("No timetable found for this faculty. Please contact administrator to set up your timetable.");
          } else {
            toast.success("Timetable loaded successfully! You can now select day and period to auto-populate fields.");
          }
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setLoading(false);
        console.error(error);
        toast.error("Failed to fetch faculty data");
      });
  };

  // Function to get available periods for a selected day (only teaching periods)
  const getAvailablePeriodsForDay = (day) => {
    if (!facultyData?.timetable) {
      return [];
    }
    
    const dayEntry = facultyData.timetable.find(entry => entry.day === day);
    if (!dayEntry) {
      return [];
    }
    
    // Filter periods that have a valid subject (not a non-teaching activity)
    const teachingPeriods = dayEntry.periods
      .filter(period => {
        // Check if the period has a subject that is not in non-teaching activities
        const subjectLower = period.subject?.toLowerCase() || '';
        return period.subject && 
               period.subject !== '-- Select --' && 
               !nonTeachingActivities.some(activity => subjectLower.includes(activity)) &&
               period.branch && period.branch !== '-- Select --' &&
               period.section && period.section !== '-- Select --' &&
               period.semester && period.semester !== '-- Select --';
      })
      .map(period => period.periodNumber)
      .sort((a, b) => a - b);
    
    console.log(`Available teaching periods for ${day}:`, teachingPeriods);
    return teachingPeriods;
  };

  // Handle day change - update available periods
  const handleDayChange = (e) => {
    const newDay = e.target.value;
    setSelectedDay(newDay);
    
    // Reset period and clear auto-populated fields
    setSelectedPeriod("-- Select --");
    setSelectedSubject("-- Select --");
    setSelectedBranch("-- Select --");
    setSelectedSection("-- Select --");
    setSemester("-- Select --");
    setSelectedSubjectId(null);
    setTotalClasses("");
    setCanAddAttendance(false);
    setMarkedAttendance({});
    setSelectAllChecked(false);
    setAbsenteesInput("");
    setPresenteesInput("");
    setAttendanceExists(false);
    setExistingAttendanceRecords([]);
    
    // Get available periods for the selected day
    if (newDay !== "-- Select --") {
      const periods = getAvailablePeriodsForDay(newDay);
      setAvailablePeriods(periods);
      
      if (periods.length === 0) {
        toast.info(`No teaching periods found for ${newDay}. You only have periods with subjects will be shown.`);
      }
    } else {
      setAvailablePeriods([]);
    }
  };

  // Function to get timetable entry for selected day and period
  const getTimetableEntry = (day, period) => {
    if (!facultyData?.timetable) {
      console.log("No faculty data or timetable available");
      return null;
    }
    
    const dayEntry = facultyData.timetable.find(entry => entry.day === day);
    if (!dayEntry) {
      console.log(`No timetable entry found for day: ${day}`);
      return null;
    }
    
    const periodEntry = dayEntry.periods.find(p => p.periodNumber === Number(period));
    if (!periodEntry) {
      console.log(`No period entry found for period: ${period} on ${day}`);
      return null;
    }
    
    console.log("Found timetable entry:", periodEntry);
    return periodEntry;
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
        total: Number(newTotal)
      });
      
      toast.dismiss();
      setLoading(false);
      if (response.data.success) {
        toast.success(`Section ${selectedSection} total classes updated successfully!`);
        setCanAddAttendance(true);
        
        // Update local state
        const updatedSubjects = subjects.map(sub => {
          if (sub._id === selectedSubjectId) {
            const updatedSectionTotals = [...sub.sectionTotals || []];
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
            const updatedSectionTotals = [...sub.sectionTotals || []];
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

  // Handle period change
  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setSelectedPeriod(newPeriod);
    
    if (newPeriod === "-- Select --" || selectedDay === "-- Select --") {
      // Reset auto-populated fields
      setSelectedSubject("-- Select --");
      setSelectedBranch("-- Select --");
      setSelectedSection("-- Select --");
      setSemester("-- Select --");
      setSelectedSubjectId(null);
      setTotalClasses("");
      setCanAddAttendance(false);
      setMarkedAttendance({});
      setSelectAllChecked(false);
      setAbsenteesInput("");
      setPresenteesInput("");
      setAttendanceExists(false);
      setExistingAttendanceRecords([]);
      return;
    }

    // Auto-populate fields from timetable
    const timetableEntry = getTimetableEntry(selectedDay, newPeriod);
    if (timetableEntry) {
      // Check if all required timetable fields are present
      if (!timetableEntry.subject || !timetableEntry.branch || !timetableEntry.section || !timetableEntry.semester) {
        toast.error(`Incomplete timetable data for ${selectedDay} Period ${newPeriod}. Please contact administrator to complete the timetable.`);
        setSelectedSubject("-- Select --");
        setSelectedBranch("-- Select --");
        setSelectedSection("-- Select --");
        setSemester("-- Select --");
        setSelectedSubjectId(null);
        setTotalClasses("");
        setCanAddAttendance(false);
        setMarkedAttendance({});
        setSelectAllChecked(false);
        setAbsenteesInput("");
        setPresenteesInput("");
        setAttendanceExists(false);
        setExistingAttendanceRecords([]);
        return;
      }

      setSelectedSubject(timetableEntry.subject);
      setSelectedBranch(timetableEntry.branch);
      setSelectedSection(timetableEntry.section);
      setSemester(timetableEntry.semester);
      
      if (timetableEntry.regulation) {
        setSelectedRegulation(timetableEntry.regulation.toUpperCase());
      }
      
      // Find the subject ID and total classes from the subjects array
      console.log("Looking for subject:", {
        name: timetableEntry.subject,
        branch: timetableEntry.branch,
        semester: timetableEntry.semester
      });
      console.log("Available subjects:", subjects);
      
      const subject = subjects.find(sub => 
        sub.name === timetableEntry.subject && 
        sub.branch?.name === timetableEntry.branch &&
        String(sub.semester) === String(timetableEntry.semester) &&
        (!timetableEntry.regulation || sub.regulation?.toUpperCase() === timetableEntry.regulation.toUpperCase())
      );
      
      if (subject) {
        setSelectedSubjectId(subject._id);
        // Get the section-specific total
        getSectionTotal(subject._id, timetableEntry.section);
        setCanAddAttendance(false); // Still need to check if attendance exists
        toast.success(`Timetable data loaded: ${timetableEntry.subject} - ${timetableEntry.branch} Sem ${timetableEntry.semester} Sec ${timetableEntry.section}`);
        console.log("Found matching subject:", subject);
      } else {
        setSelectedSubjectId(null);
        setTotalClasses("");
        setCanAddAttendance(false);
        
        // Check if subjects are loaded
        if (subjects.length === 0) {
          toast.error("Subjects not loaded yet. Please wait for subjects to load.");
        } else {
          toast.warning(`Subject "${timetableEntry.subject}" not found in subjects list. Please ensure the subject is properly configured.`);
          console.log("No matching subject found. Available subjects:", subjects.map(s => ({ name: s.name, branch: s.branch?.name, semester: s.semester })));
        }
      }
      
      // Clear attendance selections
      setMarkedAttendance({});
      setSelectAllChecked(false);
      setAbsenteesInput("");
      setPresenteesInput("");
      setAttendanceExists(false);
      setExistingAttendanceRecords([]);
    } else {
      // No timetable entry found for this day/period combination
      toast.error(`No class scheduled for ${selectedDay} Period ${newPeriod}`);
      setSelectedSubject("-- Select --");
      setSelectedBranch("-- Select --");
      setSelectedSection("-- Select --");
      setSemester("-- Select --");
      setSelectedSubjectId(null);
      setTotalClasses("");
      setCanAddAttendance(false);
      setMarkedAttendance({});
      setSelectAllChecked(false);
      setAbsenteesInput("");
      setPresenteesInput("");
      setAttendanceExists(false);
      setExistingAttendanceRecords([]);
    }
  };

  // Retry finding subject when subjects are loaded
  const retryFindSubject = () => {
    if (selectedDay === "-- Select --" || selectedPeriod === "-- Select --") {
      toast.error("Please select day and period first");
      return;
    }
    
    const timetableEntry = getTimetableEntry(selectedDay, selectedPeriod);
    if (!timetableEntry) {
      toast.error("No timetable entry found");
      return;
    }
    
    const subject = subjects.find(sub => 
      sub.name === timetableEntry.subject && 
      sub.branch?.name === timetableEntry.branch &&
      String(sub.semester) === String(timetableEntry.semester) &&
      (!timetableEntry.regulation || sub.regulation?.toUpperCase() === timetableEntry.regulation.toUpperCase())
    );
    
    if (subject) {
      setSelectedSubjectId(subject._id);
      // Get the section-specific total
      getSectionTotal(subject._id, timetableEntry.section);
      setCanAddAttendance(false);
      toast.success(`Subject found: ${subject.name}`);
    } else {
      toast.error("Subject still not found. Please check if the subject is properly configured in the system.");
    }
  };

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
      return;
    }

    const semesterSubjects = subjectsList.filter(
      (subject) => 
        String(subject.semester) === String(selectedSemester) &&
        subject.branch?.name === selectedBranch &&
        (selectedRegulation === "" || subject.regulation?.toUpperCase() === selectedRegulation.toUpperCase())
    );
    setFilteredSubjects(semesterSubjects);
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

  // Handle regulation change (now mostly for internal use as UI is read-only)
  const handleRegulationChange = (e) => {
    const newReg = e.target.value.toUpperCase();
    setSelectedRegulation(newReg);
    // Re-filter subjects when regulation changes
    const semesterSubjects = subjects.filter(
      (subject) => 
        String(subject.semester) === String(semester) &&
        subject.branch?.name === selectedBranch &&
        (newReg === "" || subject.regulation?.toUpperCase() === newReg)
    );
    setFilteredSubjects(semesterSubjects);
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

  // Increment total classes and enable attendance
  const incrementTotalClasses = () => {
    if (!selectedSubjectId || selectedSection === "-- Select --") {
      toast.error("Please select a subject and section first");
      return;
    }
    
    // Check if attendance already exists for this date/branch/semester/period/section
    if (attendanceExists) {
      toast.error("Attendance already exists for this date/subject/period/section. No need to increment total classes.");
      return;
    }
    
    const newTotal = Number(totalClasses) + 1;
    setTotalClasses(newTotal.toString());
    updateSectionTotal(newTotal);
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
  };

  // Manual update of total classes
  const updateTotalClassesManually = () => {
    if (!selectedSubjectId || selectedSection === "-- Select --") {
      toast.error("Please select a subject and section first");
      return;
    }
    
    updateSectionTotal(Number(totalClasses));
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
    getFacultyData();
  }, []);

  // Filter students based on filters
  useEffect(() => {
    filterStudents();
  }, [students, selectedBranch, semester, selectedSection, range, selectedDay]);

  // Update filtered subjects when semester or branch changes
  useEffect(() => {
    if (semester !== "-- Select --" && selectedBranch !== "-- Select --") {
      filterSubjectsBySemester(semester);
    }
  }, [semester, selectedBranch, selectedRegulation, subjects]);

  // Auto-retry finding subject when subjects are loaded
  useEffect(() => {
    if (subjects.length > 0 && selectedDay !== "-- Select --" && selectedPeriod !== "-- Select --" && 
        selectedSubject !== "-- Select --" && !selectedSubjectId) {
      // Wait a bit for the state to settle, then retry
      const timer = setTimeout(() => {
        retryFindSubject();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [subjects, selectedDay, selectedPeriod, selectedSubject, selectedSubjectId]);

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

  // Check attendance existence when filters change
  useEffect(() => {
    if (selectedBranch !== "-- Select --" && semester !== "-- Select --" && 
        selectedSection !== "-- Select --" && selectedSubject !== "-- Select --" && 
        selectedPeriod !== "-- Select --" && selectedDate) {
      checkAttendanceExists();
    }
  }, [selectedBranch, semester, selectedSection, selectedSubject, selectedPeriod, selectedDate]);

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

  // Handle presentees input
  const handlePresenteesInput = (input) => {
    setPresenteesInput(input);
    
    if (!input.trim()) {
      return;
    }
    
    // Clear absentees input when using presentees
    if (absenteesInput) {
      setAbsenteesInput("");
    }
    
    // Split by comma and clean up whitespace
    const presentees = input.split(',').map(enrollment => enrollment.trim()).filter(enrollment => enrollment);
    
    // Create new attendance state with only presentees
    const newAttendance = {};
    
    // Add all presentees to attendance
    filteredStudents.forEach((student) => {
      if (presentees.includes(student.enrollmentNo)) {
        newAttendance[student.enrollmentNo] = {
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
    
    setMarkedAttendance(newAttendance);
    
    // Update select all checkbox state
    const allPresenteesSelected = presentees.length > 0 && 
      presentees.every(enrollment => newAttendance[enrollment]);
    setSelectAllChecked(allPresenteesSelected);
  };

  // Handle absentees input
  const handleAbsenteesInput = (input) => {
    setAbsenteesInput(input);
    
    if (!input.trim()) {
      return;
    }
    
    // Clear presentees input when using absentees
    if (presenteesInput) {
      setPresenteesInput("");
    }
    
    // Split by comma and clean up whitespace
    const absentees = input.split(',').map(enrollment => enrollment.trim()).filter(enrollment => enrollment);
    
    // Create new attendance state excluding absentees
    const newAttendance = {};
    Object.keys(markedAttendance).forEach(enrollmentNo => {
      if (!absentees.includes(enrollmentNo)) {
        newAttendance[enrollmentNo] = markedAttendance[enrollmentNo];
      }
    });
    
    setMarkedAttendance(newAttendance);
    
    // Update select all checkbox state
    const remainingStudents = filteredStudents.filter(student => !absentees.includes(student.enrollmentNo));
    const allRemainingSelected = remainingStudents.length > 0 && 
      remainingStudents.every(student => newAttendance[student.enrollmentNo]);
    setSelectAllChecked(allRemainingSelected);
  };

  // Toggle individual attendance (local state only)
  const toggleAttendance = (student) => {
    // Allow editing if attendance already exists, otherwise require total class increment
    if (!attendanceExists && !canAddAttendance) {
      toast.error("Please increment total classes first to enable attendance marking");
      return;
    }
    if (selectedSubject === "-- Select --" || selectedPeriod === "-- Select --" || selectedDay === "-- Select --") {
      toast.error("Please select day, subject, and period.");
      return;
    }
    
    // Check if all timetable data is complete
    if (!selectedBranch || selectedBranch === "-- Select --" || !selectedSection || selectedSection === "-- Select --" || !semester || semester === "-- Select --") {
      toast.error("Incomplete timetable data. Cannot mark attendance until all fields are properly populated.");
      return;
    }
    
    // Check if student is marked as absent
    const absentees = absenteesInput.split(',').map(enrollment => enrollment.trim()).filter(enrollment => enrollment);
    if (absentees.includes(student.enrollmentNo)) {
      toast.error("Cannot mark attendance for absent student. Remove from absentees list first.");
      return;
    }
    
    // Clear presentees input when manually toggling attendance
    if (presenteesInput) {
      setPresenteesInput("");
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
    if (selectedSubject === "-- Select --" || selectedPeriod === "-- Select --" || selectedDay === "-- Select --") {
      toast.error("Please select day, subject, and period.");
      return;
    }
    
    // Check if all timetable data is complete
    if (!selectedBranch || selectedBranch === "-- Select --" || !selectedSection || selectedSection === "-- Select --" || !semester || semester === "-- Select --") {
      toast.error("Incomplete timetable data. Cannot mark attendance until all fields are properly populated.");
      return;
    }
    
    // Clear presentees input when using select all
    if (presenteesInput) {
      setPresenteesInput("");
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

  // Get day name from date
  const getDayFromDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Auto-select day based on selected date
  useEffect(() => {
    if (selectedDate) {
      const dayName = getDayFromDate(selectedDate);
      if (days.includes(dayName)) {
        setSelectedDay(dayName);
      }
    }
  }, [selectedDate]);

  // Submit attendance to backend
  const handleSubmitAttendance = async () => {
    if (selectedSubject === "-- Select --" || selectedPeriod === "-- Select --" || selectedDay === "-- Select --") {
      toast.error("Please select day, subject, and period.");
      return;
    }
    
    // If attendance already exists, allow editing without requiring total class increment
    if (!attendanceExists && !canAddAttendance) {
      toast.error("Please increment total classes first to enable attendance marking");
      return;
    }
    
    // Check if all timetable data is complete
    if (!selectedBranch || selectedBranch === "-- Select --" || !selectedSection || selectedSection === "-- Select --" || !semester || semester === "-- Select --") {
      toast.error("Incomplete timetable data. Cannot submit attendance until all fields are properly populated.");
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
        setAbsenteesInput("");
        setPresenteesInput("");
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
      {/* Header with buttons */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-center">Add Attendance</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Request Leave
          </button>
          <button
            onClick={() => setShowSubstituteModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Substitute Duty
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>How to use:</strong> First select a Day. The Period dropdown will only show periods where you have a subject (breaks, free periods, library, sports are excluded). 
          <br /><strong>Note:</strong> All timetable fields (Subject, Branch, Semester, Section) must be complete to mark attendance.
          <br />If attendance already exists for the selected date/subject/period/section, you can edit it without incrementing total classes.
        </p>
      </div>

      {/* Warning if no timetable */}
      {facultyData && (!facultyData.timetable || facultyData.timetable.length === 0) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Warning:</strong> No timetable found for this faculty. Please contact the administrator to set up your timetable before marking attendance.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
        <div>
          <label className="block font-medium text-gray-700">Day</label>
          <select
            value={selectedDay}
            onChange={handleDayChange}
            className="w-full px-4 py-2 border rounded"
          >
            <option>-- Select --</option>
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Period</label>
          <select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="w-full px-4 py-2 border rounded"
            disabled={selectedDay === "-- Select --"}
          >
            <option>-- Select --</option>
            {availablePeriods.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          {selectedDay !== "-- Select --" && availablePeriods.length === 0 && (
            <p className="text-xs text-red-600 mt-1">No teaching periods available</p>
          )}
          {selectedDay !== "-- Select --" && availablePeriods.length > 0 && (
            <p className="text-xs text-green-600 mt-1">{availablePeriods.length} teaching period(s) available</p>
          )}
        </div>

        <div>
          <label className="block font-medium text-gray-700">Subject</label>
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="w-full px-4 py-2 border rounded"
            disabled={selectedPeriod === "-- Select --"}
          >
            <option>-- Select --</option>
            {filteredSubjects.map((subject) => (
              <option key={subject._id} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
          {selectedSubject !== "-- Select --" && selectedPeriod !== "-- Select --" && selectedDay !== "-- Select --" && (
            <p className="text-xs text-green-600 mt-1">✓ Auto-populated from timetable</p>
          )}
        </div>

        <div>
          <label className="block font-medium text-gray-700">Branch</label>
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            className="w-full px-4 py-2 border rounded"
            disabled={selectedPeriod === "-- Select --"}
            >
              <option>-- Select --</option>
              {branch.map((branchItem) => (
                <option key={branchItem._id} value={branchItem.name}>
                  {branchItem.name}
                </option>
              ))}
            </select>
            {selectedBranch !== "-- Select --" && selectedPeriod !== "-- Select --" && selectedDay !== "-- Select --" && (
              <p className="text-xs text-green-600 mt-1">✓ Auto-populated from timetable</p>
            )}
          </div>
  
          <div>
            <label className="block font-medium text-gray-700">Semester</label>
            <select
              value={semester}
              onChange={handleSemesterChange}
              className="w-full px-4 py-2 border rounded"
              disabled={selectedPeriod === "-- Select --"}
            >
              <option>-- Select --</option>
              {[...Array(8).keys()].map((i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            {semester !== "-- Select --" && selectedPeriod !== "-- Select --" && selectedDay !== "-- Select --" && (
              <p className="text-xs text-green-600 mt-1">✓ Auto-populated from timetable</p>
            )}
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
              disabled={selectedPeriod === "-- Select --"}
            >
              <option>-- Select --</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            {selectedSection !== "-- Select --" && selectedPeriod !== "-- Select --" && selectedDay !== "-- Select --" && (
              <p className="text-xs text-green-600 mt-1">✓ Auto-populated from timetable</p>
            )}
          </div>
  
          <div>
            <label className="block font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
  
          <div>
            <label className="block font-medium text-gray-700">Total Classes</label>
            <div className="flex items-center">
              <button
                onClick={decrementTotalClasses}
                disabled={!selectedSubjectId || selectedSection === "-- Select --" || Number(totalClasses) <= 0}
                className="px-3 py-2 bg-red-500 text-white rounded-l disabled:bg-gray-300"
              >
                -
              </button>
              <input
                type="number"
                value={totalClasses}
                onChange={handleTotalClassesChange}
                onBlur={updateTotalClassesManually}
                className="w-full px-2 py-2 border-y text-center"
                min="0"
                disabled={!selectedSubjectId || selectedSection === "-- Select --"}
              />
              <button
                onClick={incrementTotalClasses}
                disabled={!selectedSubjectId || selectedSection === "-- Select --" || attendanceExists}
                className="px-3 py-2 bg-green-500 text-white rounded-r disabled:bg-gray-300"
                title={attendanceExists ? "Attendance already exists - no need to increment" : ""}
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {attendanceExists ? "✓ Attendance exists - editing enabled" : 
               canAddAttendance ? "✓ Ready to mark attendance" : 
               "Increment to enable attendance"}
            </p>
          </div>
        </div>
  
        {/* Retry subject finding button */}
        {selectedSubject !== "-- Select --" && !selectedSubjectId && subjects.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              Subject not found in system. This may be due to timing issues. Click below to retry.
            </p>
            <button
              onClick={retryFindSubject}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Retry Finding Subject
            </button>
          </div>
        )}
  
        {/* Attendance existence status */}
        {isCheckingAttendance ? (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">Checking for existing attendance...</p>
          </div>
        ) : attendanceExists ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Attendance already exists for {selectedDate}. You can edit the attendance below.
              {existingAttendanceRecords.length > 0 && ` (${existingAttendanceRecords.length} records found)`}
            </p>
          </div>
        ) : selectedBranch !== "-- Select --" && semester !== "-- Select --" && 
          selectedSection !== "-- Select --" && selectedSubject !== "-- Select --" && 
          selectedPeriod !== "-- Select --" && selectedDate ? (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-800">
              No existing attendance found for {selectedDate}. Increment total classes to mark new attendance.
            </p>
          </div>
        ) : null}
  
        {/* Range filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block font-medium text-gray-700">Start Enrollment No</label>
            <input
              type="number"
              value={range.start}
              onChange={(e) => setRange({ ...range, start: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              placeholder="From"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">End Enrollment No</label>
            <input
              type="number"
              value={range.end}
              onChange={(e) => setRange({ ...range, end: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              placeholder="To"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={filterStudents}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Filter Students
            </button>
          </div>
        </div>
  
        {/* Bulk input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-medium text-gray-700">
              Presentees (comma-separated enrollment numbers)
            </label>
            <textarea
              value={presenteesInput}
              onChange={(e) => handlePresenteesInput(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              rows="2"
              placeholder="Enter enrollment numbers separated by commas"
              disabled={!attendanceExists && !canAddAttendance}
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">
              Absentees (comma-separated enrollment numbers)
            </label>
            <textarea
              value={absenteesInput}
              onChange={(e) => handleAbsenteesInput(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              rows="2"
              placeholder="Enter enrollment numbers separated by commas"
              disabled={!attendanceExists && !canAddAttendance}
            />
          </div>
        </div>
  
        {/* Student list header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Students ({filteredStudents.length} found)
          </h3>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectAllChecked}
              onChange={toggleSelectAll}
              disabled={!attendanceExists && !canAddAttendance}
              className="mr-2"
            />
            <span>Select All</span>
          </div>
        </div>
  
        {/* Student list */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Select</th>
                <th className="py-2 px-4 border">Enrollment No</th>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Branch</th>
                <th className="py-2 px-4 border">Semester</th>
                <th className="py-2 px-4 border">Section</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-4 border text-center">
                    No students found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.enrollmentNo} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border text-center">
                      <input
                        type="checkbox"
                        checked={!!markedAttendance[student.enrollmentNo]}
                        onChange={() => toggleAttendance(student)}
                        disabled={!attendanceExists && !canAddAttendance}
                      />
                    </td>
                    <td className="py-2 px-4 border">{student.enrollmentNo}</td>
                    <td className="py-2 px-4 border">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-2 px-4 border">{student.branch}</td>
                    <td className="py-2 px-4 border">{student.semester}</td>
                    <td className="py-2 px-4 border">{student.section}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
  
        {/* Submit button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmitAttendance}
            disabled={loading || Object.keys(markedAttendance).length === 0 || 
                     (!attendanceExists && !canAddAttendance)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : 
             attendanceExists ? "Update Attendance" : "Submit Attendance"}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            {Object.keys(markedAttendance).length} students selected for attendance
          </p>
        </div>
  
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-semibold">Processing...</p>
            </div>
          </div>
        )}
  
        {/* Leave Management Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-4xl w-full max-h-screen overflow-y-auto">
              <FacultyLeaveManagement
                onClose={() => setShowLeaveModal(false)}
                onSuccess={() => {
                  setShowLeaveModal(false);
                  toast.success("Leave request submitted");
                }}
              />
            </div>
          </div>
        )}
  
        {/* Substitute Attendance Modal */}
        {showSubstituteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-6xl w-full max-h-screen overflow-y-auto">
              <SubstituteAttendance
                onClose={() => setShowSubstituteModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default AddAttendance;
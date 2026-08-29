// FacultyTimetable.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import ViewFacultyTimetable from "./ViewFacultyTimetable.jsx";
import FacultyTimetableImport from "./FacultyTimetableImport";

const FacultyTimetable = ({ branch: lockedBranch }) => {
  const [selectedTab, setSelectedTab] = useState("view");
  const [faculties, setFaculties] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [timetable, setTimetable] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  });
  const [originalTimetable, setOriginalTimetable] = useState(null); // Store for reset
  const [loading, setLoading] = useState(false);
  const [clashErrors, setClashErrors] = useState([]);
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [selectedPeriodForSubstitution, setSelectedPeriodForSubstitution] = useState(null);
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [selectedSubstituteFaculty, setSelectedSubstituteFaculty] = useState("");
  const [loadingAvailableFaculty, setLoadingAvailableFaculty] = useState(false);
  const [substitutionHistory, setSubstitutionHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Dynamic Section Cache by (branch_semester)
  const [sectionsCache, setSectionsCache] = useState({});

  const fetchSectionsForBranchAndSemester = async (b, sem) => {
    if (!b || !sem) return;
    const cacheKey = `${b.trim()}_${sem}`;
    if (sectionsCache[cacheKey]) return;

    try {
      const res = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, {
        params: { branch: b, semester: sem }
      });
      if (res.data.success && res.data.sections?.length > 0) {
        setSectionsCache(prev => ({
          ...prev,
          [cacheKey]: res.data.sections
        }));
      }
    } catch (err) {
      console.error(`Error fetching sections for ${b} Sem ${sem}:`, err);
    }
  };

  const getSectionsForPeriod = (b, sem) => {
    if (!b || !sem) return ["A", "B", "C", "D"];
    const cacheKey = `${b.trim()}_${sem}`;
    if (!sectionsCache[cacheKey]) {
      fetchSectionsForBranchAndSemester(b, sem);
      return ["A", "B", "C", "D"];
    }
    return sectionsCache[cacheKey];
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '9:00am - 10:00am',
    '10:00am - 10:50am',
    '10:50am - 11:00am',
    '11:00am - 11:50am',
    '11:50am - 12:40pm',
    '12:40pm - 1:30pm',
    '1:30pm - 2:20pm',
    '2:20pm - 3:10pm',
    '3:10pm - 4:00pm'
  ];

  useEffect(() => {
    getFacultyData();
    getSubjectData();
    getBranchData();
  }, []);

  useEffect(() => {
    if (lockedBranch) {
      setFilteredFaculties(faculties.filter(f => f.department === lockedBranch));
    } else {
      setFilteredFaculties(faculties);
    }
  }, [faculties, lockedBranch]);

  useEffect(() => {
    if (selectedFaculty) {
      loadFacultyInfo();
      loadFacultyTimetable();
      loadSubstitutionHistory();
    }
  }, [selectedFaculty]);

  const getFacultyData = () => {
    setLoading(true);
    axios
      .get(`${baseApiURL()}/faculty/details/getDetails2`)
      .then((res) => {
        if (res.data.success) {
          setFaculties(res.data.faculties);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch faculty data");
      })
      .finally(() => setLoading(false));
  };

  const getSubjectData = () => {
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((res) => {
        if (res.data.success) {
          console.log("Loaded subjects:", res.data.subject);
          setSubjects(res.data.subject);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch subjects");
      });
  };

  const getBranchData = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data.success) {
          setBranches(res.data.branches);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch branches");
      });
  };

  const loadFacultyInfo = async () => {
    try {
      const response = await axios.post(`${baseApiURL()}/faculty/details/getDetails`, { 
        employeeId: selectedFaculty 
      });

      if (response.data.success && response.data.user[0]) {
        const faculty = response.data.user[0];
        setFacultyInfo({
          name: `${faculty.firstName} ${faculty.middleName ? faculty.middleName + " " : ""}${faculty.lastName}`,
          department: faculty.department,
          employeeId: faculty.employeeId
        });
      }
    } catch (error) {
      console.error("Error loading faculty info:", error);
    }
  };

  const loadSubstitutionHistory = async () => {
    try {
      const response = await axios.get(
        `${baseApiURL()}/faculty/details/substitution-history/${selectedFaculty}`
      );
      if (response.data.success) {
        setSubstitutionHistory(response.data.substitutions);
      }
    } catch (error) {
      console.error("Error loading substitution history:", error);
    }
  };

  // Function to get filtered subjects for a specific branch, semester and regulation
  const getFilteredSubjects = (branch, semester, regulation) => {
    if (!branch || !semester) {
      return subjects; // Return all subjects if no basic filter
    }
    
    const filtered = subjects.filter(
      (subject) => 
        subject.semester === parseInt(semester) && 
        subject.branch?.name === branch &&
        (!regulation || subject.regulation?.toUpperCase() === regulation.toUpperCase())
    );
    
    return filtered;
  };

  const loadFacultyTimetable = () => {
    setLoading(true);
    axios
      .post(`${baseApiURL()}/faculty/details/getDetails`, { employeeId: selectedFaculty })
      .then((res) => {
        if (res.data.success && res.data.user[0]?.timetable) {
          const newTimetable = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
          };

          res.data.user[0].timetable.forEach(dayData => {
            if (dayData.day && dayData.periods) {
              newTimetable[dayData.day] = dayData.periods;
              
              // Auto-fetch missing regulations for existing periods
              dayData.periods.forEach((period, idx) => {
                if (!period.regulation && period.branch && period.semester && period.section) {
                  fetchRegulationForPeriod(dayData.day, idx, period.branch, period.semester, period.section);
                }
              });
            }
          });

          setTimetable(newTimetable);
          setOriginalTimetable(JSON.parse(JSON.stringify(newTimetable))); // Store deep copy for reset
        } else {
          const emptyTimetable = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
          };
          setTimetable(emptyTimetable);
          setOriginalTimetable(JSON.parse(JSON.stringify(emptyTimetable)));
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load faculty timetable");
      })
      .finally(() => setLoading(false));
  };

  const addPeriod = (day) => {
    setTimetable(prev => {
      const currentDaySchedule = prev[day] || [];
      return {
        ...prev,
        [day]: [...currentDaySchedule, {
          periodNumber: currentDaySchedule.length + 1,
          subject: "",
          branch: "",
          semester: "",
          section: "",
          startTime: "",
          endTime: "",
          regulation: ""
        }]
      };
    });
  };

  const removePeriod = (day, index) => {
    setTimetable(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index).map((period, i) => ({
        ...period,
        periodNumber: i + 1
      }))
    }));
  };

  const fetchRegulationForPeriod = (day, index, branch, semester, section) => {
    if (branch && semester && section) {
      axios
        .post(`${baseApiURL()}/student/details/getDetails`, {
          branch,
          semester,
          section,
        })
        .then((res) => {
          if (res.data.success && res.data.user.length > 0) {
            const detectedRegulation = res.data.user[0].regulation;
            if (detectedRegulation) {
              setTimetable(prev => {
                const daySchedule = [...prev[day]];
                daySchedule[index] = { 
                  ...daySchedule[index], 
                  regulation: detectedRegulation.toUpperCase() 
                };
                return { ...prev, [day]: daySchedule };
              });
            }
          }
        })
        .catch((err) => console.error("Error fetching regulation:", err));
    }
  };

  const updatePeriod = (day, index, field, value) => {
    setTimetable(prev => {
      const daySchedule = prev[day] ? [...prev[day]] : [];
      if (!daySchedule[index]) return prev;

      const updatedPeriod = {
        ...daySchedule[index],
        [field]: value
      };
      
      // If branch, semester or regulation changes, clear the subject if it's not available for the new combination
      if ((field === 'branch' || field === 'semester' || field === 'regulation') && updatedPeriod.subject) {
        const isSpecialPeriod = ["Break", "Sports", "Library", "Other"].includes(updatedPeriod.subject);
        if (!isSpecialPeriod) {
          const filteredSubjects = getFilteredSubjects(updatedPeriod.branch, updatedPeriod.semester, updatedPeriod.regulation);
          const subjectExists = filteredSubjects.some(subj => subj.name === updatedPeriod.subject);
          if (!subjectExists) {
            updatedPeriod.subject = "";
          }
        }
      }
      
      // If branch, semester or section changes, trigger regulation fetch
      if (field === 'branch' || field === 'semester' || field === 'section') {
        fetchRegulationForPeriod(day, index, updatedPeriod.branch, updatedPeriod.semester, updatedPeriod.section);
      }

      // Handle standard slot selection
      if (field === 'standardSlot' && value) {
        const [start, end] = value.split(' - ');
        updatedPeriod.startTime = start;
        updatedPeriod.endTime = end;
      }
      
      daySchedule[index] = updatedPeriod;
      return {
        ...prev,
        [day]: daySchedule
      };
    });
  };

  // Function to check if a period has a clash with existing faculty timetables
  const checkPeriodClash = (period, day) => {
    if (!period.branch || !period.semester || !period.section || !period.startTime || !period.endTime) {
      return null;
    }

    // Skip special periods
    if (["Break", "Sports", "Library", "Other"].includes(period.subject)) {
      return null;
    }

    // Check against clash errors
    return clashErrors.find(clash => 
      clash.day === day &&
      clash.time === `${period.startTime} - ${period.endTime}` &&
      clash.semester === period.semester &&
      clash.section === period.section &&
      clash.branch === period.branch
    );
  };

  const saveFacultyTimetable = () => {
    if (!selectedFaculty) {
      toast.error("Please select a faculty member");
      return;
    }

    // Clear previous clash errors
    setClashErrors([]);

    // Convert to backend format
    const timetableToSave = Object.entries(timetable)
      .map(([day, periods]) => ({
        day,
        periods: periods // Don't filter here, catch missing fields in validation below
      }))
      .filter(dayData => dayData.periods.length > 0);

    // Validate all required fields
    const hasEmptyFields = timetableToSave.some(dayData => 
      dayData.periods.some(period => {
        // For special periods, only subject, startTime and endTime are required
        const isSpecialPeriod = ["Break", "Sports", "Library", "Other"].includes(period.subject);
        
        if (isSpecialPeriod) {
          return !period.subject || !period.startTime || !period.endTime;
        } else {
          return !period.subject || 
                 !period.branch || 
                 !period.semester || 
                 !period.section || 
                 !period.startTime || 
                 !period.endTime;
        }
      })
    );

    if (hasEmptyFields) {
      toast.error("Please fill all required fields for all active periods");
      return;
    }

    toast.loading("Saving Faculty Timetable");
    axios
      .put(`${baseApiURL()}/faculty/details/updateTimetable/${selectedFaculty}`, { 
        timetable: timetableToSave 
      })
      .then((res) => {
        toast.dismiss();
        if (res.data.success) {
          toast.success("Faculty timetable updated successfully");
          // Reload the timetable to ensure consistency
          loadFacultyTimetable();
          // Switch back to view mode
          setSelectedTab("view");
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        toast.dismiss();
        console.error(err); 
        
        // Handle clash validation errors
        if (err.response?.data?.clashes && err.response.data.clashes.length > 0) {
          setClashErrors(err.response.data.clashes);
          toast.error("Faculty timetable clash detected! Please check the conflicts below.");
        } else {
          toast.error(err.response?.data?.message || "Failed to save faculty timetable");
        }
      });
  };

  // Open substitution modal
  const openSubstitutionModal = (day, period) => {
    setSelectedPeriodForSubstitution({ day, ...period });
    setShowSubstitutionModal(true);
    setSelectedSubstituteFaculty("");
    fetchAvailableFaculty(day, period);
  };

  // Fetch available faculty for substitution
  const fetchAvailableFaculty = async (day, period) => {
    if (!period.startTime || !period.endTime) {
      toast.error("Period must have start and end time");
      return;
    }

    setLoadingAvailableFaculty(true);
    try {
      const response = await axios.get(
        `${baseApiURL()}/faculty/details/available-for-substitution`,
        {
          params: {
            day,
            startTime: period.startTime,
            endTime: period.endTime,
            branch: period.branch,
            semester: period.semester,
            section: period.section,
            currentFacultyId: selectedFaculty
          }
        }
      );

      if (response.data.success) {
        setAvailableFaculty(response.data.availableFaculty);
        if (response.data.availableFaculty.length === 0) {
          toast.error("No faculty available at this time");
        }
      }
    } catch (error) {
      console.error("Error fetching available faculty:", error);
      toast.error("Failed to fetch available faculty");
    } finally {
      setLoadingAvailableFaculty(false);
    }
  };

  // Perform substitution
  const performSubstitution = async () => {
    if (!selectedSubstituteFaculty) {
      toast.error("Please select a faculty member");
      return;
    }

    if (!selectedPeriodForSubstitution) return;

    toast.loading("Performing substitution...");

    try {
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/substitute`,
        {
          originalFacultyId: selectedFaculty,
          substituteFacultyId: selectedSubstituteFaculty,
          day: selectedPeriodForSubstitution.day,
          periodNumber: selectedPeriodForSubstitution.periodNumber,
          startTime: selectedPeriodForSubstitution.startTime,
          endTime: selectedPeriodForSubstitution.endTime,
          subject: selectedPeriodForSubstitution.subject,
          branch: selectedPeriodForSubstitution.branch,
          semester: selectedPeriodForSubstitution.semester,
          section: selectedPeriodForSubstitution.section,
          originalTimetable: originalTimetable
        }
      );

      toast.dismiss();

      if (response.data.success) {
        toast.success("Faculty substituted successfully!");
        setShowSubstitutionModal(false);
        setSelectedPeriodForSubstitution(null);
        loadFacultyTimetable(); // Reload both faculties' timetables
        loadSubstitutionHistory();
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error performing substitution:", error);
      
      if (error.response?.data?.clashes) {
        toast.error("Substitute faculty has a clash at this time");
      } else {
        toast.error(error.response?.data?.message || "Failed to perform substitution");
      }
    }
  };

  // Reset timetable to original state
  const resetTimetable = async () => {
    if (!originalTimetable) {
      toast.error("No original timetable found");
      return;
    }

    if (!window.confirm("Are you sure you want to reset the timetable to its original state? This will undo all substitutions.")) {
      return;
    }

    toast.loading("Resetting timetable...");

    try {
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/reset-timetable`,
        {
          facultyId: selectedFaculty,
          originalTimetable: originalTimetable
        }
      );

      toast.dismiss();

      if (response.data.success) {
        toast.success("Timetable reset successfully!");
        loadFacultyTimetable(); // Reload timetable
        loadSubstitutionHistory();
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error resetting timetable:", error);
      toast.error("Failed to reset timetable");
    }
  };

  const handleImportSuccess = () => {
    toast.success("Timetable imported successfully!");
    setSelectedTab("view");
    loadFacultyTimetable();
  };

  if (loading && !faculties.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Faculty Selection Card */}

          {/* Faculty Selection - Common for all tabs */}
          <div className="bento-card p-6 bg-white border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <label htmlFor="faculty" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Faculty
                </label>
                <select
                  id="faculty"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Select Faculty --</option>
                  {filteredFaculties.map((faculty) => (
                    <option key={faculty._id} value={faculty.employeeId}>
                      {faculty.firstName} {faculty.middleName} {faculty.lastName} ({faculty.employeeId}) - {faculty.department}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Faculty Info Display */}
              {facultyInfo && (
                <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-100">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Name:</span>
                      <p className="font-bold text-slate-900">{facultyInfo.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Department:</span>
                      <p className="font-bold text-slate-900">{facultyInfo.department}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* History Button */}
              {selectedFaculty && substitutionHistory.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View Substitution History ({substitutionHistory.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bento-card p-1.5 bg-slate-100 border border-slate-200 mb-6 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-1.5">
              {["view", "edit"].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                    selectedTab === tab
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                  onClick={() => setSelectedTab(tab)}
                  disabled={!selectedFaculty && tab !== "view"}
                >
                  {tab === "view" ? "View Timetable" : "Edit Timetable"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="w-full">
            {/* No Faculty Selected Message */}
            {!selectedFaculty && (
              <div className="bento-card p-12 text-center bg-white border border-slate-200">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-3 text-base font-bold text-slate-900">No Faculty Selected</h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Please select a faculty member from the dropdown above to continue.
                </p>
              </div>
            )}

            {/* View Tab */}
            {selectedTab === "view" && selectedFaculty && (
              <ViewFacultyTimetable facultyId={selectedFaculty} />
            )}

            {/* Edit Tab */}
            {selectedTab === "edit" && selectedFaculty && (
              <div className="space-y-8">

                {/* Clash Error Display */}
                {clashErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <h3 className="text-lg font-bold text-red-800">Faculty Timetable Clash Detected</h3>
                    </div>
                    <p className="text-red-700 text-xs mb-4">The following conflicts were found. Please resolve them before saving:</p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {clashErrors.map((clash, index) => (
                        <div key={index} className="bg-white border border-red-200 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-bold text-slate-900 text-sm">{clash.day}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600 text-xs font-semibold">{clash.time}</span>
                              </div>
                              <div className="text-xs text-slate-700 mb-1">
                                <span className="font-semibold">Conflict:</span> {clash.branch} - Semester {clash.semester} - Section {clash.section}
                              </div>
                              <div className="text-xs text-slate-600 mb-1">
                                <span className="font-semibold">Your subject:</span> {clash.subject}
                              </div>
                              <div className="text-xs text-red-600 font-semibold">
                                <span>Conflicts with:</span> {clash.conflictingFaculty.name} ({clash.conflictingFaculty.employeeId}) - {clash.conflictingFaculty.subject}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setClashErrors([])}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="bento-card p-6 bg-white border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-slate-900">{day}</h3>
                        <button
                          onClick={() => addPeriod(day)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          Add Period
                        </button>
                      </div>
                      
                      {timetable[day].length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          No periods scheduled for {day}
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {timetable[day].map((period, index) => {
                            const clash = checkPeriodClash(period, day);
                            return (
                            <div key={index} className={`border rounded-xl p-5 shadow-sm transition-all duration-300 ${
                              clash 
                                ? 'border-red-300 bg-red-50 hover:shadow-red-100' 
                                : index % 2 === 0 
                                  ? 'border-blue-100 bg-blue-50/50 hover:shadow-blue-100' 
                                  : 'border-indigo-100 bg-indigo-50/50 hover:shadow-indigo-100'
                            }`}>
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-700">Period {period.periodNumber}</span>
                                  {clash && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                      </svg>
                                      Clash
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {/* Substitution Button */}
                                  {period.subject && 
                                   !["Break", "Sports", "Library", "Other"].includes(period.subject) && (
                                    <button
                                      onClick={() => openSubstitutionModal(day, period)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Substitute Faculty"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => removePeriod(day, index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {clash && (
                                <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                                  <div className="font-medium">Clash detected with:</div>
                                  <div>{clash.conflictingFaculty.name} ({clash.conflictingFaculty.employeeId})</div>
                                  <div>Subject: {clash.conflictingFaculty.subject}</div>
                                </div>
                              )}
                              
                              <div className="space-y-3">
                                {/* Subject Dropdown - including special periods */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    Subject
                                  </label>
                                  <select
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
                                    value={period.subject || ""}
                                    onChange={(e) => updatePeriod(day, index, "subject", e.target.value)}
                                  >
                                    <option value="">Select Subject</option>
                                    {/* Special periods */}
                                    <option value="Break" className="bg-gray-100 font-medium">-- Special Periods --</option>
                                    <option value="Break">☕ Break</option>
                                    <option value="Sports">🏀 Sports</option>
                                    <option value="Library">📚 Library</option>
                                    <option value="Other">⚙️ Other</option>
                                    <option value="" disabled className="bg-gray-100 font-medium">-- Academic Subjects --</option>
                                    {/* Academic subjects - filtered by branch, semester and regulation */}
                                    {period.branch && period.semester ? (
                                      getFilteredSubjects(period.branch, period.semester, period.regulation).length > 0 ? (
                                        getFilteredSubjects(period.branch, period.semester, period.regulation).map((subj) => (
                                          <option key={subj._id} value={subj.name}>
                                            {subj.name} ({subj.code}) {subj.regulation ? `[${subj.regulation}]` : ""}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="" disabled>
                                          No subjects found for {period.branch} Sem {period.semester} {period.regulation ? `[${period.regulation}]` : ""}
                                        </option>
                                      )
                                    ) : (
                                      <option value="" disabled>
                                        Select branch and semester first
                                      </option>
                                    )}
                                    {/* Show current subject if it's not in filtered list */}
                                    {period.subject && 
                                     period.branch && period.semester &&
                                     !getFilteredSubjects(period.branch, period.semester, period.regulation).some(subj => subj.name === period.subject) && 
                                     !["Break", "Sports", "Library", "Other"].includes(period.subject) && (
                                      <option value={period.subject} className="text-red-600 italic">
                                        {period.subject} (Not in {period.regulation || "selected"} regulation)
                                      </option>
                                    )}
                                  </select>
                                  {period.branch && period.semester && (
                                    <div className="text-[10px] text-blue-600 mt-1 font-medium">
                                      ✨ {getFilteredSubjects(period.branch, period.semester, period.regulation).length} subject(s) available
                                    </div>
                                  )}
                                </div>

                                {/* Regulation Input */}
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Regulation
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Auto-detected"
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 font-semibold text-blue-700 cursor-not-allowed shadow-sm ${
                                      ["Break", "Sports", "Library", "Other"].includes(period.subject)
                                        ? "text-gray-400"
                                        : "text-blue-700"
                                    }`}
                                    value={period.regulation || ""}
                                    readOnly
                                  />
                                </div>

                                {/* Branch Dropdown - disabled for special periods */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                  <select
                                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                      ["Break", "Sports", "Library", "Other"].includes(period.subject)
                                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                        : "border-gray-300"
                                    }`}
                                    value={period.branch || ""}
                                    onChange={(e) => updatePeriod(day, index, "branch", e.target.value)}
                                    disabled={["Break", "Sports", "Library", "Other"].includes(period.subject)}
                                  >
                                    <option value="">Select Branch</option>
                                    {branches.map((branch) => (
                                      <option key={branch._id} value={branch.name}>
                                        {branch.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {/* Semester Dropdown - disabled for special periods */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                    <select
                                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        ["Break", "Sports", "Library", "Other"].includes(period.subject)
                                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                          : "border-gray-300"
                                      }`}
                                      value={period.semester || ""}
                                      onChange={(e) => updatePeriod(day, index, "semester", e.target.value)}
                                      disabled={["Break", "Sports", "Library", "Other"].includes(period.subject)}
                                    >
                                      <option value="">Semester</option>
                                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <option key={sem} value={sem}>
                                          {sem}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Section Dropdown - disabled for special periods */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select
                                      className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        ["Break", "Sports", "Library", "Other"].includes(period.subject)
                                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                          : "border-gray-300"
                                      }`}
                                      value={period.section || ""}
                                      onChange={(e) => updatePeriod(day, index, "section", e.target.value)}
                                      disabled={["Break", "Sports", "Library", "Other"].includes(period.subject)}
                                    >
                                      <option value="">Section</option>
                                      {getSectionsForPeriod(period.branch, period.semester).map((sec) => (
                                        <option key={sec} value={sec}>
                                          {sec}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                 <div className="grid grid-cols-2 gap-3">
                                  {/* Time Slots */}
                                  <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Standard Slot (Optional)</label>
                                    <select
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/30"
                                      value={timeSlots.find(slot => slot === `${period.startTime} - ${period.endTime}`) || ""}
                                      onChange={(e) => updatePeriod(day, index, "standardSlot", e.target.value)}
                                    >
                                      <option value="">-- Select Standard Slot --</option>
                                      {timeSlots.map((slot) => (
                                        <option key={slot} value={slot}>{slot}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Time Inputs */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 9:00am"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={period.startTime || ""}
                                      onChange={(e) => updatePeriod(day, index, "startTime", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. 10:00am"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={period.endTime || ""}
                                      onChange={(e) => updatePeriod(day, index, "endTime", e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-6">
                  <button
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                    onClick={saveFacultyTimetable}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Faculty Timetable'}
                  </button>
                </div>
              </div>
            )}
          </div>

      {/* Substitution Modal */}
      {showSubstitutionModal && selectedPeriodForSubstitution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Substitute Faculty</h3>
                <button
                  onClick={() => {
                    setShowSubstitutionModal(false);
                    setSelectedPeriodForSubstitution(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Period Details */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Period Details:</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Day:</span> {selectedPeriodForSubstitution.day}</p>
                  <p><span className="font-medium">Period:</span> {selectedPeriodForSubstitution.periodNumber}</p>
                  <p><span className="font-medium">Subject:</span> {selectedPeriodForSubstitution.subject}</p>
                  <p><span className="font-medium">Time:</span> {selectedPeriodForSubstitution.startTime} - {selectedPeriodForSubstitution.endTime}</p>
                  <p><span className="font-medium">Branch:</span> {selectedPeriodForSubstitution.branch}</p>
                  <p><span className="font-medium">Semester:</span> {selectedPeriodForSubstitution.semester}</p>
                  <p><span className="font-medium">Section:</span> {selectedPeriodForSubstitution.section}</p>
                </div>
              </div>

              {/* Available Faculty Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Substitute Faculty
                </label>
                {loadingAvailableFaculty ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={selectedSubstituteFaculty}
                    onChange={(e) => setSelectedSubstituteFaculty(e.target.value)}
                  >
                    <option value="">Select Faculty</option>
                    {availableFaculty.map((faculty) => (
                      <option key={faculty.employeeId} value={faculty.employeeId}>
                        {faculty.name} ({faculty.employeeId}) - {faculty.department}
                      </option>
                    ))}
                  </select>
                )}
                {availableFaculty.length === 0 && !loadingAvailableFaculty && (
                  <p className="text-sm text-red-600 mt-2">No faculty available at this time</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSubstitutionModal(false);
                    setSelectedPeriodForSubstitution(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={performSubstitution}
                  disabled={!selectedSubstituteFaculty || loadingAvailableFaculty}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Substitution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Substitution History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Substitution History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {substitutionHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No substitution history found</p>
              ) : (
                <div className="space-y-4">
                  {substitutionHistory.map((sub, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800">{sub.day} - Period {sub.periodNumber}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(sub.substitutionDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Subject:</span> {sub.subject}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Time:</span> {sub.startTime} - {sub.endTime}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Class:</span> {sub.branch} - Semester {sub.semester} - Section {sub.section}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Substituted From:</span> {sub.substitutedFrom}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyTimetable;
// MyFacultyTimeTable.jsx - Complete Fixed Version (No Backend Models)
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { baseApiURL } from "../../baseUrl";
import { toast } from "react-hot-toast";

const MyFacultyTimeTable = ({ facultyId, isHODView = false }) => {
  const router = useLocation();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyData, setFacultyData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [allFaculty, setAllFaculty] = useState([]);
  
  // Substitution state
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [selectedPeriodForSubstitution, setSelectedPeriodForSubstitution] = useState(null);
  const [facultyWithStatus, setFacultyWithStatus] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubstituteFaculty, setSelectedSubstituteFaculty] = useState("");
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [substitutionHistory, setSubstitutionHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [undoLoading, setUndoLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);
  
  const [leaveContext, setLeaveContext] = useState(null);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchFacultyData();
    fetchAllFaculty();
    fetchPendingRequests();

    // Check for initial day and date from redirection
    const initialDay = sessionStorage.getItem("initialTimetableDay");
    const initialDate = sessionStorage.getItem("initialTimetableDate");
    const leaveId = sessionStorage.getItem("substitutingForLeaveId");
    const ownerId = sessionStorage.getItem("substitutingForFacultyId");

    // Only set leave context if it belongs to the currently viewed faculty
    const idToUse = facultyId || router.state?.loginid;
    if (initialDate && ownerId === idToUse) {
      setLeaveContext({ date: initialDate, id: leaveId });
      if (initialDay) {
        setSelectedDay(initialDay);
      }
    } else {
      // Clear stale context if IDs don't match
      if (!isHODView) {
        sessionStorage.removeItem("initialTimetableDay");
        sessionStorage.removeItem("initialTimetableDate");
        sessionStorage.removeItem("substitutingForLeaveId");
        sessionStorage.removeItem("substitutingForFacultyId");
      }
    }
  }, [facultyId, router.state?.loginid]); 

  const fetchAllFaculty = async () => {
    try {
      const response = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`);
      if (response.data.success) {
        setAllFaculty(response.data.faculties);
      }
    } catch (error) {
      console.error("Error fetching all faculty:", error);
    }
  };

  const fetchFacultyData = () => {
    const idToUse = facultyId || router.state?.loginid;
    if (!idToUse) {
      toast.error("Faculty ID not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    const headers = {
      "Content-Type": "application/json",
    };

    const initialDate = sessionStorage.getItem("initialTimetableDate");
    const url = initialDate 
      ? `${baseApiURL()}/faculty/details/getDetails?date=${initialDate}` 
      : `${baseApiURL()}/faculty/details/getDetails`;

    axios
      .post(
        url,
        { employeeId: idToUse },
        {
          headers: headers,
        }
      )
      .then((response) => {
        setLoading(false);
        if (response.data.success) {
          const faculty = response.data.user[0];
          setFacultyData(faculty);
          
          // Set timetable from faculty data
          if (faculty.timetable && faculty.timetable.length > 0) {
            setTimetable(faculty.timetable);
            loadSubstitutionHistory(faculty.employeeId);
          } else {
            toast.error("No timetable found for this faculty. Please contact administrator to set up your timetable.");
          }
        } else {
          toast.error(response.data.message || "Failed to fetch faculty details");
        }
      })
      .catch((error) => {
        setLoading(false);
        console.error("Error fetching faculty data:", error);
        toast.error(error.response?.data?.message || "Error fetching faculty details");
      });
  };

  const loadSubstitutionHistory = async (employeeId) => {
    try {
      const response = await axios.get(
        `${baseApiURL()}/faculty/details/substitution-history/${employeeId}`
      );
      if (response.data.success) {
        setSubstitutionHistory(response.data.substitutions);
      }
    } catch (error) {
      console.error("Error loading substitution history:", error);
    }
  };

  const fetchPendingRequests = async () => {
    const idToUse = facultyId || router.state?.loginid;
    if (!idToUse) return;
    try {
      const response = await axios.get(`${baseApiURL()}/faculty/details/substitution-history/${idToUse}`);
      if (response.data.success) {
        const pending = response.data.substitutions.filter(s => 
          s.substituteFacultyId === idToUse && 
          s.status === 'pending'
        );
        setPendingRequests(pending);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const handleSubstitutionResponse = async (substitutionId, status) => {
    setApproveLoading(true);
    toast.loading(`${status === 'active' ? 'Approving' : 'Rejecting'}...`);
    try {
      const response = await axios.post(`${baseApiURL()}/faculty/details/update-status`, {
        substitutionId,
        status
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success(`Substitution ${status === 'active' ? 'approved' : 'rejected'}!`);
        fetchFacultyData();
        fetchPendingRequests();
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to update status");
    } finally {
      setApproveLoading(false);
    }
  };

  const getDayTimetable = (day) => {
    const dayData = timetable.find(item => item.day === day);
    return dayData?.periods || [];
  };

  const sortPeriodsByNumber = (periods) => {
    return [...periods].sort((a, b) => a.periodNumber - b.periodNumber);
  };

  const getSubjectStyle = (subject) => {
    if (subject === 'Break' || subject === 'Lunch') {
      return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    }
    if (subject === 'Substituted') {
      return 'bg-purple-100 border-purple-300 text-purple-800';
    }
    return 'bg-white hover:shadow-md transition-shadow duration-200 border border-gray-200';
  };

  const getFacultyFullName = (faculty) => {
    if (!faculty) return '';
    const { firstName, middleName, lastName } = faculty;
    return [firstName, middleName, lastName].filter(Boolean).join(' ');
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    
    // Handle both "HH:MM" and "HH:MMam/pm" formats
    let hours = 0, minutes = 0;
    
    if (timeStr.includes('am') || timeStr.includes('pm')) {
      const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
      if (match) {
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        const meridiem = match[3].toLowerCase();
        
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        if (meridiem === 'am' && hours === 12) hours = 0;
      }
    } else {
      const [h, m] = timeStr.split(':').map(Number);
      hours = h || 0;
      minutes = m || 0;
    }
    
    return hours * 60 + minutes;
  };

  // Check faculty status at given time
  const checkFacultyStatus = (faculty, day, startTime, endTime) => {
    if (faculty.employeeId === facultyData?.employeeId) {
      return { status: "current", label: "Current Faculty", color: "gray" };
    }

    if (faculty.onLeave) {
      return { status: "leave", label: "On Leave (Unavailable)", color: "red" };
    }

    if (!faculty.timetable || !Array.isArray(faculty.timetable) || faculty.timetable.length === 0) {
      return { status: "free", label: "Free (No Timetable)", color: "green" };
    }

    const daySchedule = faculty.timetable.find(t => t.day === day);
    if (!daySchedule || !daySchedule.periods || daySchedule.periods.length === 0) {
      return { status: "free", label: "Free (No Classes)", color: "green" };
    }

    const targetStart = timeToMinutes(startTime);
    const targetEnd = timeToMinutes(endTime);

    for (const period of daySchedule.periods) {
      const periodStart = timeToMinutes(period.startTime);
      const periodEnd = timeToMinutes(period.endTime);
      
      const hasTimeOverlap = (
        (targetStart >= periodStart && targetStart < periodEnd) ||
        (targetEnd > periodStart && targetEnd <= periodEnd) ||
        (targetStart <= periodStart && targetEnd >= periodEnd)
      );

      if (hasTimeOverlap) {
        if (["Break", "Sports", "Library", "Other"].includes(period.subject)) {
          return { 
            status: period.subject.toLowerCase(), 
            label: period.subject,
            color: 
              period.subject === "Break" ? "yellow" :
              period.subject === "Sports" ? "orange" :
              period.subject === "Library" ? "blue" :
              "purple",
            details: period
          };
        } else {
          return { 
            status: "busy", 
            label: `Teaching ${period.subject}`,
            color: "red",
            details: period
          };
        }
      }
    }

    return { status: "free", label: "Free Period", color: "green" };
  };

  // Open substitution modal
  const openSubstitutionModal = (day, period) => {
    setSelectedPeriodForSubstitution({ day, ...period });
    setShowSubstitutionModal(true);
    setSelectedSubstituteFaculty("");
    setSearchTerm("");
    setStatusFilter("all");
    fetchAllFacultyWithStatus(day, period);
  };

  // Fetch all faculty with their status at given time
  const fetchAllFacultyWithStatus = async (day, period) => {
    if (!period.startTime || !period.endTime) {
      toast.error("Period must have start and end time");
      return;
    }

    setLoadingFaculty(true);
    const initialDate = sessionStorage.getItem("initialTimetableDate");
    const url = initialDate 
      ? `${baseApiURL()}/faculty/details/getDetails2?date=${initialDate}` 
      : `${baseApiURL()}/faculty/details/getDetails2`;

    try {
      const response = await axios.get(url);

      if (response.data.success) {
        const faculties = response.data.faculties.filter(
          f => f.employeeId !== facultyData?.employeeId
        );
        
        const facultiesWithStatus = faculties.map(faculty => ({
          ...faculty,
          statusInfo: checkFacultyStatus(faculty, day, period.startTime, period.endTime),
          fullName: getFacultyFullName(faculty)
        }));

        setFacultyWithStatus(facultiesWithStatus);
        filterFaculties(facultiesWithStatus, searchTerm, statusFilter);
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      toast.error("Failed to fetch faculty list");
    } finally {
      setLoadingFaculty(false);
    }
  };

  // Filter faculties based on search and status
  const filterFaculties = (faculties, search, status) => {
    let filtered = [...faculties];

    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(f => {
        const firstName = (f.firstName || "").toLowerCase();
        const middleName = (f.middleName || "").toLowerCase();
        const lastName = (f.lastName || "").toLowerCase();
        const fullName = `${firstName} ${middleName} ${lastName}`.toLowerCase();
        const employeeId = (f.employeeId || "").toLowerCase();
        const department = (f.department || "").toLowerCase();
        
        return firstName.includes(searchLower) ||
               middleName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               fullName.includes(searchLower) ||
               employeeId.includes(searchLower) ||
               department.includes(searchLower);
      });
    }

    if (status !== "all") {
      filtered = filtered.filter(f => f.statusInfo.status === status);
    }

    // Sort by status (free/break first, then busy last)
    filtered.sort((a, b) => {
      const statusOrder = {
        'free': 1,
        'break': 2,
        'sports': 3,
        'library': 4,
        'other': 5,
        'busy': 6,
        'current': 7
      };
      return (statusOrder[a.statusInfo.status] || 99) - (statusOrder[b.statusInfo.status] || 99);
    });

    setFilteredFaculty(filtered);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterFaculties(facultyWithStatus, term, statusFilter);
  };

  const handleStatusFilterChange = (e) => {
    const filter = e.target.value;
    setStatusFilter(filter);
    filterFaculties(facultyWithStatus, searchTerm, filter);
  };

  const getStatusBadgeColor = (statusInfo) => {
    switch(statusInfo.status) {
      case 'free': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sports': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'library': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'other': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'current': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'leave': return 'bg-red-100 text-red-800 border-red-200';
      case 'busy': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const performSubstitution = async () => {
    if (!selectedSubstituteFaculty) {
      toast.error("Please select a faculty member");
      return;
    }

    if (!selectedPeriodForSubstitution || !facultyData) return;

    toast.loading("Requesting substitution...");

    try {
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/substitute`,
        {
          originalFacultyId: facultyData.employeeId,
          substituteFacultyId: selectedSubstituteFaculty,
          day: selectedPeriodForSubstitution.day,
          periodNumber: selectedPeriodForSubstitution.periodNumber,
          startTime: selectedPeriodForSubstitution.startTime,
          endTime: selectedPeriodForSubstitution.endTime,
          subject: selectedPeriodForSubstitution.subject,
          branch: selectedPeriodForSubstitution.branch,
          semester: selectedPeriodForSubstitution.semester,
          section: selectedPeriodForSubstitution.section,
          date: sessionStorage.getItem("initialTimetableDate") || new Date().toISOString().split('T')[0],
          status: isHODView ? 'active' : 'pending'
        }
      );

      toast.dismiss();

      if (response.data.success) {
        toast.success("Substitution request submitted successfully!");
        setShowSubstitutionModal(false);
        setSelectedPeriodForSubstitution(null);
        fetchFacultyData();
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error performing substitution:", error);
      
      if (error.response?.data?.clashes) {
        toast.error("Selected faculty has a clash at this time");
      } else {
        toast.error(error.response?.data?.message || "Failed to request substitution");
      }
    }
  };

  // Updated undoSubstitution function
  const undoSubstitution = async (substitution) => {
    if (!facultyData) return;

    if (!window.confirm("Are you sure you want to undo this substitution? This will restore the original faculty's period and remove it from your timetable.")) {
      return;
    }

    setUndoLoading(true);
    toast.loading("Undoing substitution...");

    try {
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/undo-substitution`,
        {
          originalFacultyId: substitution.originalFacultyId,
          substituteFacultyId: substitution.substituteFacultyId,
          day: substitution.day,
          periodNumber: substitution.periodNumber
        }
      );

      toast.dismiss();

      if (response.data.success) {
        toast.success("Substitution undone successfully! Original subjects restored.");
        
        // Reload faculties' data
        fetchFacultyData();
        
        // If the substitution involved the current faculty, reload their history
        if (substitution.originalFacultyId === facultyData.employeeId || 
            substitution.substituteFacultyId === facultyData.employeeId) {
          loadSubstitutionHistory(facultyData.employeeId);
        }
        
        // Close modal after successful undo
        setTimeout(() => {
          setShowHistoryModal(false);
        }, 1500);
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error undoing substitution:", error);
      toast.error(error.response?.data?.message || "Failed to undo substitution");
    } finally {
      setUndoLoading(false);
    }
  };

  // Updated resetTimetable function
  const resetTimetable = async () => {
    if (!facultyData) {
      toast.error("Faculty data not found");
      return;
    }

    if (!window.confirm("⚠️ ARE YOU SURE?\n\nThis will:\n" +
        "✅ Restore ALL your original subjects\n" +
        "❌ Remove ALL periods you received from others\n" +
        "↩️ Return ALL periods you gave to others back to you\n" +
        "🔄 Update other faculties' timetables\n\n" +
        "This action CANNOT be undone!")) {
      return;
    }

    setResetLoading(true);
    toast.loading("Resetting timetable and restoring all original subjects...");

    try {
      const response = await axios.post(
        `${baseApiURL()}/faculty/details/reset-timetable`,
        {
          facultyId: facultyData.employeeId
        }
      );

      toast.dismiss();

      if (response.data.success) {
        toast.success(response.data.message);
        
        // Reload timetable
        fetchFacultyData();
        
        // Show detailed stats
        const stats = response.data.stats;
        if (stats) {
          toast.success(`✅ Restored ${stats.asOriginal} periods you gave away\n✅ Removed ${stats.asSubstitute} periods you received\n✅ Total: ${stats.substitutionsUndone} substitutions undone`, {
            duration: 5000
          });
        }
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error resetting timetable:", error);
      toast.error(error.response?.data?.message || "Failed to reset timetable");
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  if (!facultyData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Faculty information not found</h3>
          <p className="mt-1 text-sm text-gray-500">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  if (!timetable || timetable.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center">
              {facultyData?.profile && (
                <img
                  src={facultyData.profile}
                  alt="Faculty profile"
                  className="h-16 w-16 rounded-full border-2 border-white mr-4 object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {getFacultyFullName(facultyData)}
                </h1>
                <p className="text-blue-100">Employee ID: {facultyData.employeeId}</p>
                <p className="text-blue-100 text-sm mt-1">Department: {facultyData.department}</p>
              </div>
            </div>
          </div>
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Timetable Found</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Your timetable hasn't been set up yet. Please contact the administrator to set up your teaching schedule.
            </p>
          </div>
        </div>
      </div>
    );
  }

    const getUnsubstitutedPeriods = () => {
      const daySchedule = getDayTimetable(selectedDay);
      return daySchedule.filter(p => 
        p.subject && 
        !['Break', 'Lunch', 'Sports', 'Library', 'Other', 'Substituted'].includes(p.subject) && 
        !p.substituted
      );
    };

    const isAllSubstituted = getUnsubstitutedPeriods().length === 0;
    const pendingCount = getDayTimetable(selectedDay).filter(p => p.substitutionPending).length;

    const finishSubstitution = async () => {
      if (!isAllSubstituted) {
        if (pendingCount > 0) {
          toast.error(`Please wait for all substitutes to approve (${pendingCount} pending).`);
        } else {
          toast.error(`Please assign substitutes for all periods (${getUnsubstitutedPeriods().length} remaining).`);
        }
        return;
      }
      
      try {
        const leaveId = sessionStorage.getItem("substitutingForLeaveId");
        if (leaveId) {
          await axios.put(`${baseApiURL()}/faculty/leave/assignSubstitute/${leaveId}`, {
            substituteId: "MANUAL_PER_PERIOD",
            substituteName: "Assigned Per Period"
          });
        }
        
        sessionStorage.removeItem("initialTimetableDay");
        sessionStorage.removeItem("initialTimetableDate");
        sessionStorage.removeItem("substitutingForLeaveId");
        sessionStorage.removeItem("substitutingForFacultyId");
        setLeaveContext(null);
        toast.success("Substitution process completed! Pending HOD approval.");
        
        fetchFacultyData();
      } catch (error) {
        console.error("Error finishing substitution:", error);
        toast.error("Failed to confirm leave");
      }
    };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8 border-l-4 border-yellow-500">
          <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2 className="text-lg font-bold text-yellow-800">Substitution Requests ({pendingRequests.length})</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingRequests.map((req) => (
              <div key={req._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">{req.originalFacultyName} requests you to take their class</p>
                  <p className="text-sm text-gray-600">
                    {req.day}, {new Date(req.substitutionDate).toLocaleDateString()} • Period {req.periodNumber} • {req.subject}
                  </p>
                  <p className="text-xs text-gray-500">
                    {req.branch} - Sem {req.semester} - {req.section} ({req.startTime} - {req.endTime})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubstitutionResponse(req._id, 'active')}
                    disabled={approveLoading}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleSubstitutionResponse(req._id, 'rejected')}
                    disabled={approveLoading}
                    className="px-4 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leaveContext && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-lg mb-6 shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold">Leave Substitution Mode</p>
              <p className="text-sm opacity-90">Assign substitutes for your leave on <span className="underline font-semibold">{leaveContext.date}</span></p>
            </div>
          </div>
          <button 
            onClick={finishSubstitution}
            className={`px-6 py-2 font-bold rounded-full transition-colors shadow-md ${
              isAllSubstituted 
                ? "bg-white text-green-600 hover:bg-green-50" 
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isAllSubstituted 
              ? "Finish & Confirm Leave" 
              : pendingCount > 0 
                ? `${pendingCount} Pending Approvals` 
                : `${getUnsubstitutedPeriods().length} Periods Remaining`}
          </button>
        </div>
      )}
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {facultyData?.profile && (
                <img
                  src={facultyData.profile}
                  alt="Faculty profile"
                  className="h-16 w-16 rounded-full border-2 border-white mr-4 object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {getFacultyFullName(facultyData)}
                </h1>
                <p className="text-blue-100">Employee ID: {facultyData.employeeId}</p>
                <p className="text-blue-100 text-sm mt-1">Department: {facultyData.department}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={resetTimetable}
                disabled={resetLoading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset to original timetable"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {resetLoading ? "Resetting..." : "Reset Timetable"}
              </button>
              
              {substitutionHistory.length > 0 && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                  title="View substitution history"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  History ({substitutionHistory.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Day Selection */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px space-x-8 overflow-x-auto">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200
                    ${selectedDay === day
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </nav>
          </div>

          {/* Timetable Display */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedDay}'s Schedule
              </h3>
            </div>

            {getDayTimetable(selectedDay).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortPeriodsByNumber(getDayTimetable(selectedDay)).map((period, index) => (
                  <div
                    key={index}
                    className={`
                      rounded-lg border p-4 relative ${getSubjectStyle(period.subject)}
                      ${period.substitutedFrom ? 'border-green-300 bg-green-50' : ''}
                      ${period.isSubstitute ? 'border-purple-300 bg-purple-50' : ''}
                      ${period.substituted ? 'border-orange-300 bg-orange-50' : ''}
                      ${period.substitutionPending ? 'border-yellow-300 bg-yellow-50' : ''}
                    `}
                  >
                    {/* Substitution Indicators */}
                    {period.substitutionPending && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Waiting for Approval
                        </span>
                      </div>
                    )}
                    {period.substituted && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Substituted Out
                        </span>
                      </div>
                    )}
                    {period.isSubstitute && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Substitute In
                        </span>
                      </div>
                    )}

                    {/* Period Number Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Period {period.periodNumber}
                      </span>
                      <span className="text-sm text-gray-500">
                        {period.startTime} - {period.endTime}
                      </span>
                    </div>

                    {/* Subject Details */}
                    {period.subject && !['Break', 'Lunch', 'Substituted'].includes(period.subject) ? (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-lg text-gray-800">
                          {period.subject}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Branch:</span> {period.branch}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Semester:</span> {period.semester}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Section:</span> {period.section}
                          </p>
                          {period.substitutedTo && (
                            <p className="text-orange-600 text-xs mt-2">
                              <span className="font-medium">Substituted to:</span> {period.substitutedTo}
                            </p>
                          )}
                          {period.substitutedFrom && (
                            <p className="text-purple-600 text-xs mt-2">
                              <span className="font-medium">Substituted from:</span> {period.substitutedFrom}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-gray-500 font-medium">
                          {period.subject === 'Substituted' ? 'Period Substituted' : (period.subject || 'Free Period')}
                        </p>
                      </div>
                    )}

                    {/* Substitution Button - Show for all academic periods that are not substituted out */}
                    {period.subject && 
                     !['Break', 'Lunch', 'Sports', 'Library', 'Other', 'Substituted'].includes(period.subject) && 
                     !period.substituted && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => openSubstitutionModal(selectedDay, period)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          Request Substitution
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No classes scheduled</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You have no classes on {selectedDay}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Substitution Modal */}
      {showSubstitutionModal && selectedPeriodForSubstitution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Request Substitution</h3>
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

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Period Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-medium">Day:</span> {selectedPeriodForSubstitution.day}</p>
                  <p><span className="font-medium">Period:</span> {selectedPeriodForSubstitution.periodNumber}</p>
                  <p><span className="font-medium">Subject:</span> {selectedPeriodForSubstitution.subject}</p>
                  <p><span className="font-medium">Time:</span> {selectedPeriodForSubstitution.startTime} - {selectedPeriodForSubstitution.endTime}</p>
                  <p><span className="font-medium">Branch:</span> {selectedPeriodForSubstitution.branch}</p>
                  <p><span className="font-medium">Semester:</span> {selectedPeriodForSubstitution.semester}</p>
                  <p><span className="font-medium">Section:</span> {selectedPeriodForSubstitution.section}</p>
                </div>
              </div>

              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Faculty
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, ID, or department..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Faculty</option>
                    <option value="free">Free Period</option>
                    <option value="break">Break</option>
                    <option value="sports">Sports</option>
                    <option value="library">Library</option>
                    <option value="other">Other</option>
                    <option value="busy">Busy (Teaching)</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Substitute Faculty ({filteredFaculty.length} found)
                </label>
                
                {loadingFaculty ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredFaculty.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No faculty members found matching your criteria
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {filteredFaculty.map((faculty) => (
                          <label
                            key={faculty.employeeId}
                            className={`
                              block p-4 transition-colors
                              ${faculty.statusInfo.status === 'leave' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                              ${selectedSubstituteFaculty === faculty.employeeId 
                                ? 'bg-blue-50 border-l-4 border-blue-500' 
                                : ''
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                name="substituteFaculty"
                                value={faculty.employeeId}
                                checked={selectedSubstituteFaculty === faculty.employeeId}
                                disabled={faculty.statusInfo.status === 'leave'}
                                onChange={(e) => setSelectedSubstituteFaculty(e.target.value)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 disabled:opacity-0"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {faculty.firstName} {faculty.middleName || ''} {faculty.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {faculty.employeeId} • {faculty.department}
                                    </p>
                                  </div>
                                  <span className={`
                                    px-2 py-1 text-xs font-medium rounded-full border
                                    ${getStatusBadgeColor(faculty.statusInfo)}
                                  `}>
                                    {faculty.statusInfo.label}
                                  </span>
                                </div>
                                {faculty.statusInfo.status === 'busy' && faculty.statusInfo.details && (
                                  <p className="mt-1 text-xs text-red-600">
                                    Teaching: {faculty.statusInfo.details.subject} 
                                    ({faculty.statusInfo.details.branch} - Sem {faculty.statusInfo.details.semester} - {faculty.statusInfo.details.section})
                                  </p>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                  disabled={!selectedSubstituteFaculty || loadingFaculty}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Substitution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
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
                    <div key={index} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      sub.status === 'active' ? 'border-green-200' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-800">{sub.day} - Period {sub.periodNumber}</span>
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {sub.subject}
                          </span>
                          {sub.status === 'active' ? (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ● Active
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              ○ Cancelled
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(sub.substitutionDate).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">From:</span> {sub.originalFacultyName}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">To:</span> {sub.substituteFacultyName}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Time:</span> {sub.startTime} - {sub.endTime}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Class:</span> {sub.branch} - Sem {sub.semester} - {sub.section}
                        </p>
                      </div>
                      
                      {sub.status === 'active' && (
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => undoSubstitution(sub)}
                            disabled={undoLoading}
                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Undo Substitution
                          </button>
                        </div>
                      )}
                      
                      {sub.status === 'cancelled' && (
                        <div className="mt-2 text-xs text-gray-400 italic">
                          Undone on {new Date(sub.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFacultyTimeTable;
// FacultyLeaveManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const FacultyLeaveManagement = ({ onClose, onSuccess, setSelectedMenu }) => {
  const router = useLocation();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateOptions, setDateOptions] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [reason, setReason] = useState("");
  const [selectedSubstitute, setSelectedSubstitute] = useState("");
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("request");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState(null);
  const [activeLeaveForSubstitute, setActiveLeaveForSubstitute] = useState(null);
  const [quotas, setQuotas] = useState({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const leaveTypes = [
    "Casual Leave", 
    "Earned Leave", 
    "Medical Leave",
    "Sick Leave",
    "Vacation Leave", 
    "Commuted Leave (Half Pay Leave)", 
    "Maternity Leave", 
    "Study Leave", 
    "Sabbatical Leave", 
    "Overseas Assignment Leave",
    "Half Day Leave",
    "Optional Leave", 
    "Paternity Leave", 
    "Duty Leave"
  ];

  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    fetchCurrentFaculty();
    fetchAllFaculties();
    fetchLeaveHistory();
    fetchMonthlyHolidays();
    fetchQuotas();
  }, []);

  const fetchMonthlyHolidays = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const response = await axios.get(`${baseApiURL()}/accounts/attendance/config?month=${month}&year=${year}`);
      if (response.data.success && response.data.config) {
        setHolidays(response.data.config.globalHolidays.map(h => h.date));
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  useEffect(() => {
    generateDateOptions();
  }, [holidays]);

  const fetchCurrentFaculty = async () => {
    if (!router.state?.loginid) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${baseApiURL()}/faculty/details/getDetails`, { employeeId: router.state.loginid }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setCurrentFaculty(response.data.user[0]);
    } catch (error) {
      console.error("Error fetching current faculty:", error);
    }
  };

  const fetchAllFaculties = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const otherFaculties = response.data.faculties.filter(f => f.employeeId !== router.state?.loginid);
        setFaculties(otherFaculties);
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

  const fetchLeaveHistory = async () => {
    if (!router.state?.loginid) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/faculty/leave/getLeaves/${router.state.loginid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setLeaveRecords(response.data.leaves);
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  const fetchQuotas = async () => {
    try {
      const year = new Date().getFullYear();
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/faculty/leave/quotas?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.quotas) {
        setQuotas(response.data.quotas);
      }
    } catch (error) {
      console.error("Error fetching quotas:", error);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      // Skip Sundays and Global Holidays
      if (date.getDay() !== 0 && !holidays.includes(dateString)) {
        const dayName = daysOfWeek[date.getDay() - 1];
        dates.push({ date: dateString, day: dayName, display: `${dateString} (${dayName})` });
      }
    }
    setDateOptions(dates);
  };

  const handleDateSelect = (date) => {
    setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const submitLeaveRequest = async () => {
    if (selectedDates.length === 0 || !reason) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    toast.loading("Submitting leave request...");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${baseApiURL()}/faculty/leave/request`, {
        facultyId: router.state.loginid,
        facultyName: currentFaculty ? `${currentFaculty.firstName} ${currentFaculty.lastName}` : "",
        dates: selectedDates,
        leaveType,
        startDate: selectedDates[0],
        endDate: selectedDates[selectedDates.length - 1],
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.dismiss();
      setLoading(false);

      if (response.data.success) {
        toast.success("Leave request submitted! Pending HOD approval.");
        setSelectedDates([]);
        setReason("");
        fetchLeaveHistory();
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      setLoading(false);
      toast.error("Failed to submit leave request");
    }
  };

  const handleAssignSubstitute = async () => {
    if (!selectedSubstitute) {
      toast.error("Please select a substitute");
      return;
    }

    const substitute = faculties.find(f => f.employeeId === selectedSubstitute);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${baseApiURL()}/faculty/leave/assignSubstitute/${activeLeaveForSubstitute._id}`, {
        substituteId: selectedSubstitute,
        substituteName: `${substitute.firstName} ${substitute.lastName}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Substitute assigned! Redirecting to your timetable...");
        setShowSubstituteModal(false);
        fetchLeaveHistory();

        // Redirect to MyFacultyTimeTable after a short delay
        if (setSelectedMenu && activeLeaveForSubstitute.dates && activeLeaveForSubstitute.dates.length > 0) {
          setTimeout(() => {
            // Get the day of the week for the first leave date
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const firstDate = new Date(activeLeaveForSubstitute.dates[0]);
            const dayName = daysOfWeek[firstDate.getDay()];

            // Redirect using setSelectedMenu
            setSelectedMenu("MyFacultyTimeTable");

            // Store context in session storage so MyFacultyTimeTable can read it
            sessionStorage.setItem("initialTimetableDay", dayName);
            sessionStorage.setItem("initialTimetableDate", activeLeaveForSubstitute.dates[0]);
            sessionStorage.setItem("substitutingForLeaveId", activeLeaveForSubstitute._id);
            sessionStorage.setItem("substitutingForFacultyId", router.state.loginid);
          }, 1500);
        }
      }
    } catch (error) {
      toast.error("Failed to assign substitute");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved_by_hod": return "bg-blue-100 text-blue-800";
      case "approved_by_principal": return "bg-indigo-100 text-indigo-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leave Management</h2>
        {onClose && <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>}
      </div>

      <div className="flex border-b mb-6">
        <button className={`px-4 py-2 ${activeTab === "request" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("request")}>Request Leave</button>
        <button className={`px-4 py-2 ${activeTab === "history" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`} onClick={() => setActiveTab("history")}>Leave History</button>
      </div>

      {activeTab === "request" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Leave Type</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full p-2 border rounded">
                {leaveTypes.map((type) => {
                  const used = leaveRecords
                    .filter(l => l.leaveType === type && (l.status === 'confirmed' || l.status === 'approved_by_principal'))
                    .reduce((acc, l) => acc + (l.leaveType === 'Half Day Leave' ? 0.5 : l.dates.length), 0);
                  
                  const quotaKey = type === "Medical Leave" || type === "Sick Leave" ? "Medical Leave" : type;
                  const total = quotas[quotaKey] || 0;

                  return (
                    <option key={type} value={type}>
                      {type} {total > 0 ? `(${used}/${total})` : (used > 0 ? `(Used: ${used})` : '')}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Reason</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2 border rounded" placeholder="Reason for leave" />
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">Select Dates</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
              {dateOptions.map(d => (
                <label key={d.date} className={`flex items-center p-2 border rounded cursor-pointer ${selectedDates.includes(d.date) ? "bg-blue-50 border-blue-300" : ""}`}>
                  <input type="checkbox" checked={selectedDates.includes(d.date)} onChange={() => handleDateSelect(d.date)} className="mr-2" />
                  <span className="text-sm">{d.display}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={submitLeaveRequest} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {leaveRecords.map((record) => (
            <div key={record._id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{record.leaveType} ({record.dates.length} days)</p>
                <p className="text-sm text-gray-600">{record.startDate} to {record.endDate}</p>
                <p className="text-sm italic">"{record.reason}"</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                    {record.status.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  {record.status === "pending" && (
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${record.substituteId ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                      {record.substituteId ? 'SUBSTITUTION COMPLETED' : 'SUBSTITUTION PENDING'}
                    </span>
                  )}
                </div>
                {record.substituteName && <p className="text-xs mt-2 font-medium text-gray-700">Substitute: {record.substituteName}</p>}
                {record.rejectionReason && <p className="text-xs text-red-600 mt-1 font-bold">Rejected: {record.rejectionReason}</p>}
              </div>
              <div className="flex flex-col space-y-2">
                {record.status === "pending" && !record.substituteId && (
                  <button
                    onClick={() => {
                      // Store leave context and redirect
                      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const firstDate = new Date(record.dates[0]);
                      const dayName = daysOfWeek[firstDate.getDay()];

                      sessionStorage.setItem("initialTimetableDay", dayName);
                      sessionStorage.setItem("initialTimetableDate", record.dates[0]);
                      sessionStorage.setItem("substitutingForLeaveId", record._id);
                      sessionStorage.setItem("substitutingForFacultyId", router.state.loginid);

                      setSelectedMenu("MyFacultyTimeTable");
                    }}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-semibold"
                  >
                    Assign Substitute
                  </button>
                )}
                {(record.status === "pending" || record.status === "approved_by_hod") && (
                  <button onClick={() => { setLeaveToCancel(record._id); setShowConfirmModal(true); }} className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Substitute Modal */}
      {showSubstituteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Assign Substitute Faculty</h3>
            <p className="text-sm mb-4 text-gray-600">Your leave is approved. Please assign a substitute to confirm.</p>
            <select value={selectedSubstitute} onChange={(e) => setSelectedSubstitute(e.target.value)} className="w-full p-2 border rounded mb-6">
              <option value="">-- Select Substitute --</option>
              {faculties.map(f => <option key={f.employeeId} value={f.employeeId}>{f.firstName} {f.lastName} ({f.department})</option>)}
            </select>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowSubstituteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={handleAssignSubstitute} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
                {loading ? "Assigning..." : "Confirm Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="mb-4">Are you sure you want to cancel this request?</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-200 rounded">No</button>
              <button onClick={async () => {
                const token = localStorage.getItem("token");
                await axios.put(`${baseApiURL()}/faculty/leave/cancel/${leaveToCancel}`, {}, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Cancelled");
                setShowConfirmModal(false);
                fetchLeaveHistory();
              }} className="px-4 py-2 bg-red-600 text-white rounded">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyLeaveManagement;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiImage,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const DailyFacultyAttendance = ({ branch }) => {
  // If branch prop is passed, it is the HOD view. Otherwise, it is the Admin view.
  const isHOD = !!branch;
  const [selectedBranch, setSelectedBranch] = useState(branch || "All");
  const [branches, setBranches] = useState([]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [modalPhotoUrl, setModalPhotoUrl] = useState("");
  const [modalLogInfo, setModalLogInfo] = useState(null);

  // Fetch branches for admin
  useEffect(() => {
    if (!isHOD) {
      fetchBranches();
    }
  }, [isHOD]);

  // Fetch logs whenever date or selectedBranch changes
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseApiURL()}/branch/getBranch`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setBranches(res.data.branches);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const branchParam = selectedBranch === "All" ? "" : selectedBranch;
      const res = await axios.get(
        `${baseApiURL()}/biometric-attendance/logs?date=${date}&branch=${branchParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (error) {
      toast.error("Failed to load daily attendance logs");
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search and status
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.facultyId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || log.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const activeCheckins = logs.filter((l) => l.status === "Checked-In").length;
    const completed = logs.filter((l) => l.status === "Completed").length;
    const total = logs.length;
    return { activeCheckins, completed, total };
  };

  const stats = getStats();

  const handleOpenPhotoModal = (photoUrl, log, type) => {
    setModalPhotoUrl(photoUrl);
    setModalLogInfo({
      name: log.name,
      facultyId: log.facultyId,
      type: type === "checkin" ? "Check-In Photo" : "Check-Out Photo",
      time: type === "checkin" ? log.checkInTime : log.checkOutTime,
      distance: type === "checkin" ? log.checkInDistance : log.checkOutDistance,
      location: type === "checkin" ? log.checkInLocation : log.checkOutLocation,
    });
    setShowPhotoModal(true);
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center">
              <FiUsers className="mr-3 text-indigo-600" />
              {isHOD ? `${branch} Daily Attendance` : "Faculty Daily Attendance"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isHOD
                ? `Track today's check-in/check-out biometric logs for the ${branch} branch`
                : "Monitor and audit daily facial biometric attendance with geofence metrics across all branches"}
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 bg-white p-2 rounded-3xl shadow-sm border border-slate-200 w-full md:w-auto">
            {/* Date Selection */}
            <div className="flex items-center space-x-2 px-3 border-r border-slate-100">
              <FiCalendar className="text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm font-semibold outline-none bg-transparent cursor-pointer text-slate-700"
              />
            </div>

            {/* Branch Selection (Admin only) */}
            {!isHOD && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent px-3 py-1.5 text-sm font-semibold outline-none text-slate-700 cursor-pointer"
              >
                <option value="All">All Departments</option>
                {branches.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
              <FiUsers className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Active Logs</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.total}</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
              <FiClock className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Active Check-ins</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.activeCheckins}</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
              <FiCheckCircle className="text-2xl" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Completed Logs</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.completed}</h3>
            </div>
          </motion.div>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <FiSearch />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Faculty Name or ID..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 text-sm"
              />
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-1 rounded-2xl border border-slate-150">
              {["All", "Checked-In", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === status
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <p className="text-slate-500 font-medium">Fetching attendance records...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 px-6">
                <FiAlertCircle size={48} className="mb-4 opacity-30 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">No Daily Records Found</h3>
                <p className="text-sm max-w-sm text-center">
                  No attendance logs found for this date/branch combination. Ensure faculty have checked in.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Faculty Member</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Check-In details</th>
                    <th className="px-6 py-4">Check-Out details</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name & ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                            {log.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{log.name}</div>
                            <div className="text-xs text-slate-400 font-semibold">{log.facultyId}</div>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {log.department}
                      </td>

                      {/* Check-In Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.checkInTime ? (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleOpenPhotoModal(log.checkInPhotoUrl, log, "checkin")}
                              className="group w-12 h-12 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center bg-slate-50 cursor-pointer shadow-sm hover:border-indigo-500 transition-all"
                            >
                              {log.checkInPhotoUrl && log.checkInPhotoUrl !== "uploading" ? (
                                <img
                                  src={log.checkInPhotoUrl}
                                  alt="Check-in Snapshot"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                              ) : log.checkInPhotoUrl === "uploading" ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                                </div>
                              ) : (
                                <FiImage className="text-slate-400" />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-black text-slate-700 flex items-center">
                                <FiClock className="mr-1 text-slate-400" size={12} /> {log.checkInTime}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold flex items-center mt-0.5">
                                <FiMapPin className="mr-0.5 text-indigo-500" size={10} />
                                {log.checkInDistance !== null ? `${log.checkInDistance}m inside` : "Inside Geofence"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Not Checked-In</span>
                        )}
                      </td>

                      {/* Check-Out Details */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.checkOutTime ? (
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleOpenPhotoModal(log.checkOutPhotoUrl, log, "checkout")}
                              className="group w-12 h-12 rounded-xl overflow-hidden border border-slate-200 relative flex items-center justify-center bg-slate-50 cursor-pointer shadow-sm hover:border-indigo-500 transition-all"
                            >
                              {log.checkOutPhotoUrl && log.checkOutPhotoUrl !== "uploading" ? (
                                <img
                                  src={log.checkOutPhotoUrl}
                                  alt="Check-out Snapshot"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                              ) : log.checkOutPhotoUrl === "uploading" ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                                </div>
                              ) : (
                                <FiImage className="text-slate-400" />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-black text-slate-700 flex items-center">
                                <FiClock className="mr-1 text-slate-400" size={12} /> {log.checkOutTime}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold flex items-center mt-0.5">
                                <FiMapPin className="mr-0.5 text-indigo-500" size={10} />
                                {log.checkOutDistance !== null ? `${log.checkOutDistance}m inside` : "Inside Geofence"}
                              </div>
                            </div>
                          </div>
                        ) : log.checkInTime ? (
                          <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold animate-pulse">
                            <FiClock size={12} /> <span>Awaiting Check-Out</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">Awaiting Check-in</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wide ${
                            log.status === "Completed"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-indigo-50 text-indigo-600 border border-indigo-150 animate-pulse"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Audit Photo Modal */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-100"
            >
              {/* Photo Frame */}
              <div className="relative aspect-square w-full bg-slate-900 flex items-center justify-center">
                {modalPhotoUrl && modalPhotoUrl !== "uploading" ? (
                  <img src={modalPhotoUrl} alt="Audit Snapshot" className="w-full h-full object-cover" />
                ) : modalPhotoUrl === "uploading" ? (
                  <div className="text-white flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3"></div>
                    <span className="text-xs text-slate-400">Uploading photo...</span>
                  </div>
                ) : (
                  <div className="text-white flex flex-col items-center">
                    <FiImage size={48} className="opacity-20 mb-3" />
                    <span>No image captured</span>
                  </div>
                )}
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2.5 hover:bg-black/75 transition-all cursor-pointer border border-white/10"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Log Info Panel */}
              {modalLogInfo && (
                <div className="p-6 space-y-4">
                  <div>
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {modalLogInfo.type}
                    </span>
                    <h3 className="text-xl font-bold text-slate-800 mt-2">{modalLogInfo.name}</h3>
                    <p className="text-slate-400 text-xs font-semibold">{modalLogInfo.facultyId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm font-semibold">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Captured Time</p>
                      <p className="text-slate-700 flex items-center text-xs">
                        <FiClock className="mr-1 text-slate-400" /> {modalLogInfo.time || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geofence Distance</p>
                      <p className="text-slate-700 flex items-center text-xs">
                        <FiMapPin className="mr-1 text-indigo-600" />{" "}
                        {modalLogInfo.distance !== null ? `${modalLogInfo.distance} meters` : "Verified"}
                      </p>
                    </div>
                    {modalLogInfo.location && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GPS Coordinates</p>
                        <p className="text-slate-600 font-mono text-[11px] leading-tight">
                          Lat: {modalLogInfo.location.latitude?.toFixed(6)}, Lng: {modalLogInfo.location.longitude?.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyFacultyAttendance;

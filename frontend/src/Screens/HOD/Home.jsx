import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiFileText, FiBell, FiBookOpen, FiGrid, FiSettings, FiUserCheck, FiHome } from 'react-icons/fi';
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Notice from "../../components/Notice";
import Student from "../Admin/Student";
import Faculty from "../Admin/Faculty";
import Subjects from "../Admin/Subject";
import Attendance from "../Admin/Attendence";
import Section from "../Admin/Section";
import Timetables from "../Admin/Timetables";
import OBEConfig from "../Admin/OBE/OBEConfig";
import Material from "../Faculty/Material";
import ViewMarks from "../Faculty/ViewMarks";
import FacultyAttendance from "./FacultyAttendance";
import FacultySubstitution from "./FacultySubstitution";
import Profile from "../Admin/Profile";

const HODHome = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(router.state?.branch || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedMenu, setSelectedMenu] = useState("Leave Approvals");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!router.state?.loginid || router.state?.type !== 'HOD') {
      navigate('/');
    } else {
      fetchPendingRequests();
    }
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/faculty/leave/pending/${router.state.branch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPendingRequests(response.data.leaves);
      }
    } catch (error) {
      toast.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${baseApiURL()}/faculty/leave/approve/${leaveId}`, {
        approvedBy: router.state.loginid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Leave approved");
        fetchPendingRequests();
      }
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${baseApiURL()}/faculty/leave/reject/${selectedLeave._id}`, {
        rejectionReason,
        rejectedBy: router.state.loginid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Leave rejected");
        setShowRejectModal(false);
        setRejectionReason('');
        fetchPendingRequests();
      }
    } catch (error) {
      toast.error("Rejection failed");
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "Leave Approvals":
        return (
          <div className="p-4 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Pending Leave Approvals - {branch}</h2>
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
              ) : pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                  <FiCheckCircle className="mx-auto text-green-400 text-5xl mb-4" />
                  <h3 className="text-xl font-medium text-gray-700">No pending requests!</h3>
                  <p className="text-gray-500">Everything is up to date in the {branch} department.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingRequests.map((leave) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={leave._id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-lg font-bold text-gray-800">{leave.facultyName}</span>
                          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">{leave.leaveType}</span>
                          {leave.substituteId ? (
                            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-medium border border-green-100">Substitution Done</span>
                          ) : (
                            <span className="bg-rose-50 text-rose-700 text-xs px-2 py-1 rounded font-medium border border-rose-100 animate-pulse">Substitution Pending</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                          <p><span className="font-semibold">Duration:</span> {leave.dates.length} days ({leave.startDate} to {leave.endDate})</p>
                          <p><span className="font-semibold">ID:</span> {leave.facultyId}</p>
                          <p className="col-span-2"><span className="font-semibold">Reason:</span> {leave.reason}</p>
                          {leave.substituteName && (
                            <p className="col-span-2 text-xs font-semibold text-green-600 italic">Substitute: {leave.substituteName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0 sm:ml-6">
                        <button 
                          onClick={() => {
                            if (!leave.substituteId) {
                              toast.error("Substitution is not done yet. Faculty must assign a substitute.");
                              return;
                            }
                            handleApprove(leave._id);
                          }}
                          disabled={!leave.substituteId}
                          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm ${
                            leave.substituteId 
                              ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer" 
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <FiCheckCircle /> <span>Approve</span>
                        </button>
                        <button 
                          onClick={() => { setSelectedLeave(leave); setShowRejectModal(true); }}
                          className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm text-sm"
                        >
                          <FiXCircle /> <span>Reject</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case "Student":
        return <Student branch={branch} />;
      case "Faculty":
        return <Faculty branch={branch} />;
      case "Notice":
        return <Notice />;
      case "Subjects":
        return <Subjects branch={branch} />;
      case "Timetables":
        return <Timetables branch={branch} />;
      case "Attendance":
        return <Attendance branch={branch} />;
      case "Section":
        return <Section branch={branch} />;
      case "OBE Config":
        return <OBEConfig branch={branch} />;
      case "Material":
        return <Material branch={branch} />;
      case "Marks":
        return <ViewMarks branch={branch} setShowViewMarks={() => setSelectedMenu("Leave Approvals")} />;
      case "FacultyAttendance":
        return <FacultyAttendance branch={branch} />;
      case "FacultySubstitution":
        return <FacultySubstitution />;
      case "Profile":
        return <Profile />;
      default:
        return <div>Select a module</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navbar />
      <Sidebar 
        selectedMenu={selectedMenu} 
        setSelectedMenu={setSelectedMenu} 
        userType="HOD" 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
        <div className="p-0">
          {/* Header */}
          <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <FiHome className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedMenu}</h2>
                <p className="text-sm text-gray-500">{branch} Department</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-gray-800">{router.state?.loginid}</span>
                <span className="text-xs text-blue-600">Head of Department</span>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                {router.state?.loginid?.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white/50 min-h-[calc(100vh-11rem)]">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Reject Leave Request</h3>
              <p className="text-gray-500 mb-6 text-sm">Please provide a reason for rejecting {selectedLeave?.facultyName}'s leave request.</p>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all mb-6 h-32 resize-none"
                placeholder="Enter rejection reason..."
              />
              <div className="flex space-x-3">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold transition-all shadow-lg hover:shadow-red-500/25">Confirm Rejection</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HODHome;

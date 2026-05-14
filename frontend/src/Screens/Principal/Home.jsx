import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiUsers, FiCalendar, FiCheckCircle, FiXCircle, FiFileText, FiBell, FiActivity } from 'react-icons/fi';

const PrincipalHome = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!router.state?.loginid || router.state?.type !== 'Principal') {
      navigate('/');
    } else {
      fetchPendingRequests();
    }
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/faculty/leave/principal/pending`, {
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
      const response = await axios.put(`${baseApiURL()}/faculty/leave/principal/approve/${leaveId}`, {
        approvedBy: router.state.loginid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Leave fully approved and attendance updated");
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
      const response = await axios.put(`${baseApiURL()}/faculty/leave/principal/reject/${selectedLeave._id}`, {
        rejectionReason,
        rejectedBy: router.state.loginid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Leave rejected by Principal");
        setShowRejectModal(false);
        setRejectionReason('');
        fetchPendingRequests();
      }
    } catch (error) {
      toast.error("Rejection failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-indigo-900 text-white flex flex-col shadow-xl transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 text-center border-b border-indigo-800">
          <h1 className="text-2xl font-bold tracking-wider">Principal Panel</h1>
          <p className="text-indigo-300 text-sm mt-1">All Departments</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            <FiCalendar /> <span>Leave Approvals</span>
            {pendingRequests.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingRequests.length}</span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('branches'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'branches' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            <FiActivity /> <span>Branch Overview</span>
          </button>
          <button 
            onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'reports' ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-800'}`}
          >
            <FiFileText /> <span>College Reports</span>
          </button>
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button onClick={() => navigate('/')} className="w-full flex items-center space-x-3 px-4 py-3 text-red-300 hover:text-red-100 transition-colors">
            <FiLogOut /> <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <FiUsers className="text-xl text-indigo-900" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate max-w-[200px] md:max-w-none">
              {activeTab === 'dashboard' ? 'Final Leave Approvals' : activeTab === 'branches' ? 'Branch Management' : 'College Analytics'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
             <button onClick={fetchPendingRequests} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Refresh Requests">
               <FiCalendar className={`text-gray-500 text-lg md:text-xl ${loading ? 'animate-spin' : ''}`} />
             </button>
             <FiBell className="text-gray-500 text-lg md:text-xl cursor-pointer hidden md:block" />
             <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm md:text-base">
               {router.state?.loginid?.substring(0, 2).toUpperCase()}
             </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>
              ) : pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                  <FiCheckCircle className="mx-auto text-green-400 text-5xl mb-4" />
                  <h3 className="text-xl font-medium text-gray-700">No pending approvals!</h3>
                  <p className="text-gray-500">All HOD-approved leaves have been reviewed.</p>
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
                          <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium">{leave.leaveType}</span>
                          <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded font-medium border border-amber-100">{leave.branch}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm text-gray-600">
                          <p><span className="font-semibold">Duration:</span> {leave.dates.length} days ({leave.startDate} to {leave.endDate})</p>
                          <p><span className="font-semibold">ID:</span> {leave.facultyId}</p>
                          <p className="col-span-2"><span className="font-semibold">Reason:</span> {leave.reason}</p>
                          <p className="col-span-2 text-xs text-indigo-500 italic">Approved by HOD: {leave.hodApprovedBy} on {new Date(leave.hodApprovedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-0 sm:ml-6">
                        <button 
                          onClick={() => handleApprove(leave._id)}
                          className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-sm text-sm"
                        >
                          <FiCheckCircle /> <span>Final Approve</span>
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
          )}

          {activeTab === 'branches' && (
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <FiActivity className="mx-auto text-indigo-400 text-5xl mb-4" />
                <h3 className="text-xl font-medium">Branch Overview</h3>
                <p className="text-gray-500 mt-2">Monitor all college departments and their current status.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {['CSE', 'ECE', 'EEE', 'MECH'].map(branch => (
                        <div key={branch} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="block font-bold text-lg">{branch}</span>
                            <span className="text-xs text-gray-400">95% Attendance</span>
                        </div>
                    ))}
                </div>
             </div>
          )}
          
          {activeTab === 'reports' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h3 className="font-bold mb-4">Overall Faculty Attendance</h3>
                   <div className="h-48 bg-gray-50 rounded-lg flex items-end justify-around p-4">
                      {[75, 85, 70, 95, 80, 90].map((h, i) => (
                        <div key={i} className="w-8 bg-indigo-500 rounded-t-md" style={{ height: `${h}%` }}></div>
                      ))}
                   </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h3 className="font-bold mb-4">Leave Trends by Branch</h3>
                   <div className="space-y-4">
                        {['CSE', 'ECE', 'EEE'].map(b => (
                            <div key={b} className="flex items-center">
                                <span className="w-12 text-sm font-medium">{b}</span>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full mx-3 overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: b === 'CSE' ? '70%' : b === 'ECE' ? '45%' : '30%' }}></div>
                                </div>
                                <span className="text-xs text-gray-500">View Details</span>
                            </div>
                        ))}
                   </div>
                </div>
             </div>
          )}
        </main>
      </div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Principal Rejection</h3>
              <p className="text-gray-500 mb-6 text-sm">Reason for rejecting {selectedLeave?.facultyName}'s leave from {selectedLeave?.branch} department.</p>
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

export default PrincipalHome;

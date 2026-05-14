
// Home.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { baseApiURL } from "../../baseUrl";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Notice from "../../components/Notice";
import Profile from "./Profile";
import Timetable from "./Timetable";
import { Toaster } from "react-hot-toast";
import Material from "./Material";
import Marks from "./Marks";
import Student from "./Student";
import Attendence from "./Attendence";
import EditFaculty from "./EditFaculty";
import COAttainment from "./COAttainment";
import FinalCOPOAttainment from "./FinalCOPOAttainment";
import MyFacultyTimeTable from "./MyFacultyTimeTable";
import FacultyLeaveManagement from "./FacultyLeaveManagement";

const Home = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState("My Profile");
  const [load, setLoad] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({ stats: [], optionalLeave: { used: 0, available: 0 } });

  useEffect(() => {
    if (router.state === null) {
      navigate("/");
    }
    setLoad(true);
    if (router.state?.loginid) {
      fetchAnalytics();
    }
  }, [navigate, router.state]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/accounts/attendance/stats/${router.state.loginid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAnalyticsData({
          stats: response.data.stats,
          optionalLeave: response.data.optionalLeave
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "My Profile":
        return <Profile />;
      case "Student Info":
        return <Student />;
      case "Upload Marks":
        return <Marks />;
      case "Timetable":
        return <Timetable />;
      case "MyFacultyTimeTable":
        return <MyFacultyTimeTable />;
      case "Notice":
        return <Notice />;
      case "Material":
        return <Material />;
      case "Attendence":
        return <Attendence />;
      case "Edit Faculty":
        return <EditFaculty />; // ✅ Added case for EditFaculty
      case "CO Attainment":
        return <COAttainment />;
      case "Final CO/PO Attainment":
        return <FinalCOPOAttainment />;
      case "Leave Management":
        return <FacultyLeaveManagement />;
      default:
        return <Profile />;
    }
  };

  return (
    <>
      {load && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          <Navbar />
          <Sidebar
            selectedMenu={selectedMenu}
            setSelectedMenu={setSelectedMenu}
            userType="Faculty"
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />

          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
            <div className="p-4 md:p-8">
              {/* Dashboard Header */}
              {selectedMenu === "My Profile" && (
                <div className="mb-8">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 md:px-8 py-6">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">Faculty Dashboard</h1>
                      <p className="text-purple-100 mt-2 text-sm md:text-base">
                        Welcome to your academic management portal
                      </p>
                    </div>

                    <div className="p-4 md:p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Quick Actions */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm font-medium">Upload Marks</p>
                              <p className="text-lg font-semibold">Manage Grades</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Attendance */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm font-medium">Attendance</p>
                              <p className="text-lg font-semibold">Track Students</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Materials */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm font-medium">Materials</p>
                              <p className="text-lg font-semibold">Share Resources</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Leave Management */}
                        <div onClick={() => setSelectedMenu("Leave Management")} className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg cursor-pointer transform hover:scale-105 transition-all">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-indigo-100 text-sm font-medium">Leave Request</p>
                              <p className="text-lg font-semibold">Track & Apply</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Analytics Section */}
                      <div className="mt-12">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">Attendance Analytics</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Monthly Trend */}
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                             <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Last 6 Months Presence %</h3>
                             <div className="h-48 flex items-end justify-between px-4">
                                {analyticsData.stats.length === 0 ? (
                                  <div className="w-full text-center text-gray-400 text-sm py-10 italic">No attendance data recorded yet.</div>
                                ) : (
                                  analyticsData.stats.map((s, i) => (
                                    <div key={i} className="flex flex-col items-center group flex-1 h-full justify-end px-1">
                                       <div className="w-full h-full flex items-end justify-center relative min-h-[160px]">
                                          {/* Background bar track */}
                                          <div className="w-full max-w-[32px] bg-gray-100 rounded-t-lg h-full absolute bottom-0 opacity-40"></div>
                                          {/* Active bar */}
                                          <div 
                                            className="w-full max-w-[32px] bg-indigo-500 rounded-t-lg transition-all group-hover:bg-indigo-600 relative z-10 shadow-sm" 
                                            style={{ height: `${Math.max(s.percentage, 5)}%` }}
                                          >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-30 pointer-events-none">
                                              <div className="font-bold">{s.month}: {s.percentage}%</div>
                                              <div className="text-[9px] opacity-80">{s.presentDays}/{s.totalDays} Days</div>
                                            </div>
                                          </div>
                                       </div>
                                       <span className="text-[10px] mt-3 font-bold text-gray-500 uppercase tracking-tighter">{s.month}</span>
                                    </div>
                                  ))
                                )}
                             </div>
                          </div>
                          
                          {/* Optional Leave Pie Chart Simulation */}
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                             <div>
                                <h3 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Optional Leaves</h3>
                                <p className="text-2xl font-bold text-indigo-600">
                                  {analyticsData.optionalLeave.used} / {analyticsData.optionalLeave.available}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Used vs Total Available</p>
                             </div>
                             <div className="w-32 h-32 rounded-full border-[12px] border-indigo-500 relative flex items-center justify-center">
                                <div 
                                  className="absolute inset-0 border-[12px] border-indigo-100 rounded-full" 
                                  style={{ 
                                    clipPath: `polygon(50% 50%, 50% 0, ${analyticsData.optionalLeave.used / analyticsData.optionalLeave.available > 0.5 ? '100% 0, 100% 100%, 0 100%, 0 50%' : '100% 0, 100% 50%'})` 
                                  }}
                                ></div>
                                <span className="text-xs font-bold text-gray-700">
                                  {analyticsData.optionalLeave.available > 0 ? Math.round((analyticsData.optionalLeave.used / analyticsData.optionalLeave.available) * 100) : 0}% Used
                                </span>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
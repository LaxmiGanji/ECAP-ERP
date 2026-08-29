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
import FinalCOPOAttainment from "./FinalCOPOAttainment";
import MyFacultyTimeTable from "./MyFacultyTimeTable";
import FacultyLeaveManagement from "./FacultyLeaveManagement";
import DailyAttendance from "./DailyAttendance";
import AIAssistant from "../Student/AIAssistant";
import AIAnalytics from "./AIAnalytics";
import MessageParent from "../../components/MessageParent";
import FacultyOBEConfig from "./FacultyOBEConfig";
import PredictiveAnalytics from "../Admin/PredictiveAnalytics";

const Home = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [selectedMenu, setSelectedMenu] = useState("My Profile");
  const [load, setLoad] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [targetRollNo, setTargetRollNo] = useState("");

  const [analyticsData, setAnalyticsData] = useState({ stats: [], optionalLeave: { used: 0, available: 0 } });

  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (router.state === null && !activeToken) {
      navigate("/");
    }
    setLoad(true);
    if (router.state?.loginid || localStorage.getItem("loginid")) {
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
          stats: response.data.stats || [],
          optionalLeave: response.data.optionalLeave || { used: 0, available: 0 }
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
        return <Student onMessageParent={(roll) => { setTargetRollNo(roll); setSelectedMenu("Message Parent"); }} />;
      case "Upload Marks":
        return <Marks />;
      case "Message Parent":
        return <MessageParent userType="Faculty" currentUser={router.state} initialEnrollmentNo={targetRollNo} />;
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
        return <EditFaculty />;
      case "Final CO/PO Attainment":
        return <FinalCOPOAttainment />;
      case "CO-PO Mapping":
      case "OBE Config":
        return <FacultyOBEConfig />;
      case "Leave Management":
        return <FacultyLeaveManagement setSelectedMenu={setSelectedMenu} />;
      case "DailyAttendance":
        return <DailyAttendance />;
      case "AI Assistant":
        return <AIAssistant />;
      case "AI Student Analytics":
        return <AIAnalytics />;
      case "PredictiveAnalytics":
        return <PredictiveAnalytics />;
      default:
        return <Profile />;
    }
  };

  return (
    <>
      {load && (
        <div className="min-h-screen bg-slate-50/70 text-slate-800">
          <Navbar />
          <Sidebar
            selectedMenu={selectedMenu}
            setSelectedMenu={setSelectedMenu}
            userType="Faculty"
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />

          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16 w-full md:w-[calc(100%-4rem)]" : "md:ml-64 w-full md:w-[calc(100%-16rem)]"} ml-0 min-h-[calc(100vh-4rem)]`}>
            <div className="p-4 md:p-6 lg:p-8 w-full space-y-6">

              {/* Bento Dashboard Section on Profile */}
              {selectedMenu === "My Profile" && (
                <div className="space-y-6 mb-8">
                  {/* Hero Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Hero Banner (Spans 2 cols) */}
                    <div className="md:col-span-2 lg:col-span-2 bento-card bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[180px] border border-indigo-500/20 shadow-lg">
                      <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                      <div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 mb-3 shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                          Faculty Academic Hub
                        </span>
                        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-sm">Sphoorthy Engineering College</h1>
                        <p className="text-indigo-200 text-xs md:text-sm font-semibold mt-1">Teaching & Course Outcome Management Portal</p>
                      </div>
                      <div className="flex flex-wrap items-center space-x-3 pt-4 border-t border-slate-800/80 mt-4 text-xs font-semibold text-slate-300">
                        <span className="text-slate-400">Quick Actions</span>
                        <span className="text-slate-600">•</span>
                        <button onClick={() => setSelectedMenu("Attendence")} className="text-indigo-300 hover:text-white transition-colors cursor-pointer font-bold">Attendance</button>
                        <span className="text-slate-600">•</span>
                        <button onClick={() => setSelectedMenu("Upload Marks")} className="text-indigo-300 hover:text-white transition-colors cursor-pointer font-bold">Upload Marks</button>
                        <span className="text-slate-600">•</span>
                        <button onClick={() => setSelectedMenu("OBE Config")} className="text-indigo-300 hover:text-white transition-colors cursor-pointer font-bold">OBE & CO-PO</button>
                      </div>
                    </div>

                    {/* Quick Stat Card 1: Attendance */}
                    <div 
                      onClick={() => setSelectedMenu("Attendence")}
                      className="bento-card p-5 flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm hover:border-indigo-400 cursor-pointer transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</span>
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-lg font-bold text-slate-900">Mark & Track</p>
                        <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ Student Attendance</p>
                      </div>
                    </div>

                    {/* Quick Stat Card 2: OBE & CO-PO */}
                    <div 
                      onClick={() => setSelectedMenu("OBE Config")}
                      className="bento-card p-5 flex flex-col justify-between bg-white border border-slate-200/80 shadow-sm hover:border-purple-400 cursor-pointer transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OBE & CO-PO</span>
                        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-lg font-bold text-slate-900">CO Outcomes</p>
                        <p className="text-[11px] text-purple-600 font-medium mt-1">✓ Auto-Mapping Active</p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Analytics Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2 bento-card p-6 bg-white border border-slate-200/80 shadow-sm">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Monthly Attendance Trend</h3>
                      <div className="h-44 flex items-end justify-between px-4">
                        {analyticsData.stats.length === 0 ? (
                          <div className="w-full text-center text-slate-400 text-sm py-10 italic">No attendance records found yet.</div>
                        ) : (
                          analyticsData.stats.map((s, i) => (
                            <div key={i} className="flex flex-col items-center group flex-1 h-full justify-end px-1">
                              <div className="w-full h-full flex items-end justify-center relative min-h-[140px]">
                                <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg h-full absolute bottom-0 opacity-50"></div>
                                <div 
                                  className="w-full max-w-[28px] bg-indigo-600 rounded-t-lg transition-all group-hover:bg-indigo-700 relative z-10 shadow-sm" 
                                  style={{ height: `${Math.max(s.percentage, 5)}%` }}
                                >
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-30 pointer-events-none">
                                    <div className="font-bold">{s.month}: {s.percentage}%</div>
                                    <div className="text-[9px] opacity-80">{s.presentDays}/{s.totalDays} Days</div>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] mt-2 font-bold text-slate-500 uppercase">{s.month}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Optional Leaves Card */}
                    <div className="bento-card p-6 bg-white border border-slate-200/80 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Optional Leaves</h3>
                        <p className="text-3xl font-extrabold text-indigo-600">
                          {analyticsData.optionalLeave.used} / {analyticsData.optionalLeave.available}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Used vs Available</p>
                        <button 
                          onClick={() => setSelectedMenu("Leave Management")} 
                          className="mt-4 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                        >
                          Apply Leave
                        </button>
                      </div>
                      <div className="w-28 h-28 rounded-full border-[10px] border-indigo-600 relative flex items-center justify-center shadow-inner">
                        <span className="text-xs font-bold text-slate-800">
                          {analyticsData.optionalLeave.available > 0 ? Math.round((analyticsData.optionalLeave.used / analyticsData.optionalLeave.available) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Active Menu Content */}
              <div className="w-full">
                {renderContent()}
              </div>

            </div>
          </div>
        </div>
      )}
      <Toaster position="top-center" />
    </>
  );
};

export default Home;
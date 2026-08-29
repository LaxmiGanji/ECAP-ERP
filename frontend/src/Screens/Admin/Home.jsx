/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import Notice from "../../components/Notice";
import Student from "./Student";
import Faculty from "./Faculty";
import Subjects from "./Subject";
import { baseApiURL } from "../../baseUrl";
import Admin from "./Admin";
import Profile from "./Profile";
import Branch from "./Branch";
import Attendance from "./Attendence";
import Library from "./Library";
import TransportIncharge from "./TransportIncharge";
import Section from "./Section";
import Timetables from "./Timetables";
import Reports from "./Reports";
import OBEConfig from "./OBE/OBEConfig";
import OBEReports from "./OBE/OBEReports";
import GeofenceSetup from "./GeofenceSetup";
import DailyFacultyAttendance from "./DailyFacultyAttendance";
import AIAnalytics from "./AIAnalytics";
import NotificationSettings from "./NotificationSettings";
import MessageParent from "../../components/MessageParent";
import PredictiveAnalytics from "./PredictiveAnalytics";

const Home = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Profile");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [targetRollNo, setTargetRollNo] = useState("");
  const [dashboardData, setDashboardData] = useState({
    studentCount: "",
    facultyCount: "",
  });

  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (router.state === null && !activeToken) {
      navigate("/");
    }
    setLoad(true);
  }, [navigate, router.state]);

  useEffect(() => {
    getStudentCount();
    getFacultyCount();
  }, []);

  const getStudentCount = () => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .get(`${baseApiURL()}/student/details/count`, {
        headers: headers,
      })
      .then((response) => {
        if (response.data.success) {
          setDashboardData({
            ...dashboardData,
            studentCount: response.data.user,
          });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const getFacultyCount = () => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .get(`${baseApiURL()}/faculty/details/count`, {
        headers: headers,
      })
      .then((response) => {
        if (response.data.success) {
          setDashboardData({
            ...dashboardData,
            facultyCount: response.data.user,
          });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "Profile":
        return <Profile />;
      case "Student":
        return <Student onMessageParent={(roll) => { setTargetRollNo(roll); setSelectedMenu("Message Parent"); }} />;
      case "Faculty":
        return <Faculty />;
      case "Library":
        return <Library />;
      case "Message Parent":
        return <MessageParent userType="Admin" currentUser={router.state} initialEnrollmentNo={targetRollNo} />;
      case "Branch":
        return <Branch />;
      case "Notice":
        return <Notice />;
      case "Subjects":
        return <Subjects />;
      case "Timetables":
        return <Timetables />;
      case "Admin":
        return <Admin />;
      case "Attendance":
        return <Attendance />;
      case "Section":
        return <Section />;
      case "Reports":
        return <Reports />;
      case "OBE Config":
        return <OBEConfig />;
      case "OBE Reports":
        return <OBEReports />;
      case "Transport Incharge":
        return <TransportIncharge />;
      case "GeofenceSetup":
        return <GeofenceSetup />;
      case "DailyFacultyAttendance":
        return <DailyFacultyAttendance />;
      case "AI Analytics":
        return <AIAnalytics />;
      case "PredictiveAnalytics":
        return <PredictiveAnalytics />;
      case "Notification Settings":
        return <NotificationSettings />;
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
            userType="Admin" 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
          
          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16 w-full md:w-[calc(100%-4rem)]" : "md:ml-64 w-full md:w-[calc(100%-16rem)]"} ml-0 min-h-[calc(100vh-4rem)]`}>
            <div className="p-4 md:p-6 lg:p-8 w-full space-y-6">
              
              {/* Bento Dashboard Section */}
              {selectedMenu === "Profile" && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  
                  {/* Hero Bento Box (Spans 2 columns) */}
                  <div className="md:col-span-2 lg:col-span-2 bento-card bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[180px] border border-indigo-500/20 shadow-lg">
                    <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 mb-3 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                        Admin Control Panel
                      </span>
                      <h1 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-sm">Sphoorthy Engineering College</h1>
                      <p className="text-indigo-200 text-xs md:text-sm font-semibold mt-1">Automation & ERP Management Hub</p>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/80 mt-4 text-xs font-semibold text-slate-300">
                      <span className="text-slate-400">Quick Access</span>
                      <span className="text-slate-600">•</span>
                      <button onClick={() => setSelectedMenu("Student")} className="text-indigo-300 hover:text-white transition-colors cursor-pointer font-bold">Manage Students</button>
                      <span className="text-slate-600">•</span>
                      <button onClick={() => setSelectedMenu("Faculty")} className="text-indigo-300 hover:text-white transition-colors cursor-pointer font-bold">Faculty Directory</button>
                    </div>
                  </div>

                  {/* Student Count Bento Card */}
                  <div className="bento-card p-5 flex flex-col justify-between bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Students</span>
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-black text-slate-900">{dashboardData.studentCount !== "" ? dashboardData.studentCount : "—"}</p>
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">✓ Active Profiles Enrolled</p>
                    </div>
                  </div>

                  {/* Faculty Count Bento Card */}
                  <div className="bento-card p-5 flex flex-col justify-between bg-white border border-slate-200/80 shadow-xs hover:border-purple-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Faculty</span>
                      <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-black text-slate-900">{dashboardData.facultyCount !== "" ? dashboardData.facultyCount : "—"}</p>
                      <p className="text-[11px] text-purple-600 font-bold mt-1">✓ Teaching Staff</p>
                    </div>
                  </div>

                </div>
              )}

              {/* Main Content Render Area */}
              <div className="w-full">
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

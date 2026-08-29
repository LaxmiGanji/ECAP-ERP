import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import Profile from "./Profile";
import Timetable from "./Timetable";
import Marks from "./Marks";
import Notice from "../../components/Notice";
import Material from "./Material";
import { useLocation, useNavigate } from "react-router-dom";
import ViewAttendance from "./ViewAttendance";
import Certifications from "./Certifications";
import Fees from "./Fees";
import EditStudent from "./EditStudent";
import OnlineCompiler from "./OnlineCompiler";
import Transport from "./Transport";
import StudentPlacementProfile from "./PlacementProfile";
import AIAssistant from "./AIAssistant";
import LibraryRAGAssistant from "./LibraryRAGAssistant";
import { Toaster } from "react-hot-toast";
import { FiTrendingUp, FiCheckCircle, FiBookOpen, FiCalendar } from "react-icons/fi";

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("My Profile");
  const router = useLocation();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const activeToken = localStorage.getItem("token");
    if (router.state === null && !activeToken) {
      navigate("/");
    }
    setLoad(true);
  }, [navigate, router.state]);

  const renderContent = () => {
    switch (selectedMenu) {
      case "My Profile":
        return <Profile />;
      case "Library RAG Assistant":
        return <LibraryRAGAssistant />;
      case "Timetable":
        return <Timetable />;
      case "Marks":
        return <Marks />;
      case "Material":
        return <Material />;
      case "Notice":
        return <Notice />;
      case "ViewAttendance":
        return <ViewAttendance />;
      case "Certifications":
        return <Certifications />;
      case "Fees":
        return <Fees />;
      case "Transport":
        return <Transport />;
      case "Edit Student":
        return <EditStudent/>;
      case "OnlineCompiler":
        return <OnlineCompiler />;
      case "Placement":
        return <StudentPlacementProfile />;
      case "AI Assistant":
        return <AIAssistant />;
      default:
        return <Profile />;
    }
  };

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      {load && (
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Sidebar 
            selectedMenu={selectedMenu} 
            setSelectedMenu={setSelectedMenu} 
            userType="Student" 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
          
          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16 w-full md:w-[calc(100%-4rem)]" : "md:ml-64 w-full md:w-[calc(100%-16rem)]"} ml-0 min-h-[calc(100vh-4rem)]`}>
            <div className="p-4 md:p-6 lg:p-8 w-full space-y-6">
              {/* Dashboard Banner & Quick Access Cards */}
              {selectedMenu === "My Profile" && (
                <div className="space-y-6">
                  {/* 🌟 Header Banner */}
                  <div className="bento-header-banner flex items-center justify-between">
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Student Dashboard</h1>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Welcome to Sphoorthy Engineering College Academic Portal</p>
                    </div>
                  </div>
                  
                  {/* Quick Access Bento Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Academic Marks Card */}
                    <div 
                      onClick={() => setSelectedMenu("Marks")}
                      className="bento-card p-5 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Marks</p>
                        <p className="text-base font-bold text-slate-900 mt-1 group-hover:text-indigo-600 transition-colors">View Performance</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <FiTrendingUp className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Attendance Card */}
                    <div 
                      onClick={() => setSelectedMenu("ViewAttendance")}
                      className="bento-card p-5 bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</p>
                        <p className="text-base font-bold text-slate-900 mt-1 group-hover:text-emerald-600 transition-colors">View Attendance</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <FiCheckCircle className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Materials Card */}
                    <div 
                      onClick={() => setSelectedMenu("Material")}
                      className="bento-card p-5 bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Study Materials</p>
                        <p className="text-base font-bold text-slate-900 mt-1 group-hover:text-purple-600 transition-colors">Access Resources</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <FiBookOpen className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Class Schedule Card */}
                    <div 
                      onClick={() => setSelectedMenu("Timetable")}
                      className="bento-card p-5 bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Schedule</p>
                        <p className="text-base font-bold text-slate-900 mt-1 group-hover:text-amber-600 transition-colors">View Timetable</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all">
                        <FiCalendar className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Render Selected Content */}
              <div className="w-full">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;

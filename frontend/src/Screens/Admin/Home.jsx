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

const Home = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [load, setLoad] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("Profile");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    studentCount: "",
    facultyCount: "",
  });

  useEffect(() => {
    if (router.state === null) {
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
        return <Student />;
      case "Faculty":
        return <Faculty />;
      case "Library":
        return <Library />;
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
            userType="Admin" 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
          
          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"} ml-0`}>
            <div className="p-4 md:p-8">
              {/* Dashboard Header */}
              {selectedMenu === "Profile" && (
                <div className="mb-8">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 md:px-8 py-6">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
                      <p className="text-blue-100 mt-2 text-sm md:text-base">Welcome to Sphoorthy Engineering College Management System</p>
                    </div>
                    
                    <div className="p-4 md:p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {/* Student Count Card */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm font-medium">Total Students</p>
                              <p className="text-3xl font-bold">{dashboardData.studentCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Faculty Count Card */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm font-medium">Total Faculty</p>
                              <p className="text-3xl font-bold">{dashboardData.facultyCount}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm font-medium">Quick Actions</p>
                              <p className="text-lg font-semibold">Manage System</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* System Status Card */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm font-medium">System Status</p>
                              <p className="text-lg font-semibold">Online</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
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

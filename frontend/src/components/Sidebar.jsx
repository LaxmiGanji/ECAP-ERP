import { useState, useEffect } from "react";
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiBookOpen,
  FiSettings,
  FiFileText,
  FiCalendar,
  FiGrid,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiEye,
  FiBriefcase,
  FiBarChart2,
  FiMapPin,
  FiClock,
  FiMessageSquare,
  FiActivity,
  FiCpu
} from "react-icons/fi";
import { MdOutlineSchool, MdOutlineSubject } from "react-icons/md";

const Sidebar = ({ selectedMenu, setSelectedMenu, userType, isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen(!isMobileOpen);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, [isMobileOpen]);

  const handleMenuClick = (id) => {
    setSelectedMenu(id);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const getMenuItems = () => {
    switch (userType) {
      case "Admin":
        return [
          { id: "Profile", label: "Profile", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "Student", label: "Student", icon: FiUsers, color: "from-emerald-500 to-teal-600" },
          { id: "Faculty", label: "Faculty", icon: FiUserCheck, color: "from-purple-500 to-indigo-600" },
          { id: "Library", label: "Library", icon: FiBookOpen, color: "from-amber-500 to-orange-600" },
          { id: "Transport Incharge", label: "Transport Incharge", icon: FiTruck, color: "from-lime-500 to-emerald-600" },
          { id: "Branch", label: "Branch", icon: MdOutlineSchool, color: "from-indigo-500 to-blue-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-rose-600" },
          { id: "Subjects", label: "Subjects", icon: MdOutlineSubject, color: "from-teal-500 to-cyan-600" },
          { id: "Timetables", label: "Timetables", icon: FiCalendar, color: "from-rose-500 to-red-600" },
          { id: "Admin", label: "Admins", icon: FiSettings, color: "from-slate-600 to-slate-700" },
          { id: "Attendance", label: "Attendance", icon: FiGrid, color: "from-amber-500 to-yellow-600" },
          { id: "Section", label: "Section", icon: FiGrid, color: "from-cyan-500 to-blue-600" },
          { id: "Reports", label: "Reports", icon: FiFileText, color: "from-emerald-500 to-teal-600" },
          { id: "OBE Config", label: "OBE Config", icon: FiFileText, color: "from-indigo-500 to-purple-600" },
          { id: "GeofenceSetup", label: "Geofence Setup", icon: FiMapPin, color: "from-blue-600 to-cyan-500" },
          { id: "DailyFacultyAttendance", label: "Daily Faculty Attendance", icon: FiUserCheck, color: "from-teal-500 to-emerald-600" },
          { id: "Message Parent", label: "Message Parent", icon: FiMessageSquare, color: "from-pink-500 to-rose-600" },
          { id: "AI Analytics", label: "AI Analytics", icon: FiActivity, color: "from-purple-500 to-pink-600" },
          { id: "Notification Settings", label: "Notification Settings", icon: FiSettings, color: "from-blue-600 to-indigo-600" },
          { id: "PredictiveAnalytics", label: "Predictive & Reports", icon: FiActivity, color: "from-indigo-600 to-purple-600" }
        ];
      case "Faculty":
        return [
          { id: "My Profile", label: "My Profile", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "Student Info", label: "Student Info", icon: FiUsers, color: "from-emerald-500 to-teal-600" },
          { id: "Upload Marks", label: "Upload Marks", icon: FiFileText, color: "from-purple-500 to-indigo-600" },
          { id: "Message Parent", label: "Message Parent", icon: FiMessageSquare, color: "from-pink-500 to-rose-600" },
          { id: "Timetable", label: "Timetable", icon: FiCalendar, color: "from-amber-500 to-orange-600" },
          { id: "MyFacultyTimeTable", label: "MyFacultyTimeTable", icon: FiCalendar, color: "from-amber-500 to-orange-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-rose-600" },
          { id: "Material", label: "Material", icon: FiBookOpen, color: "from-teal-500 to-cyan-600" },
          { id: "Attendence", label: "Attendance", icon: FiGrid, color: "from-rose-500 to-red-600" },
          { id: "Edit Faculty", label: "Edit Faculty", icon: FiGrid, color: "from-rose-500 to-red-600" },
          { id: "Final CO/PO Attainment", label: "Final CO/PO Attainment", icon: MdOutlineSubject, color: "from-purple-500 to-indigo-600" },
          { id: "CO-PO Mapping", label: "CO-PO Mapping", icon: MdOutlineSubject, color: "from-indigo-500 to-blue-600" },
          { id: "Leave Management", label: "Leave Management", icon: FiCalendar, color: "from-indigo-500 to-purple-600" },
          { id: "DailyAttendance", label: "Daily Attendance", icon: FiClock, color: "from-amber-500 to-orange-600" },
          { id: "AI Assistant", label: "AI Assistant", icon: FiMessageSquare, color: "from-blue-500 to-indigo-600" },
          { id: "AI Student Analytics", label: "AI Student Analytics", icon: FiActivity, color: "from-purple-500 to-pink-600" },
          { id: "PredictiveAnalytics", label: "Predictive & Reports", icon: FiActivity, color: "from-indigo-600 to-purple-600" }
        ];
      case "Examination":
        return [
          { id: "My Profile", label: "My Profile", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "Add Faculty", label: "Add Faculty", icon: FiUsers, color: "from-emerald-500 to-teal-600" },
          { id: "View Faculty", label: "View Faculty", icon: FiEye, color: "from-purple-500 to-indigo-600" }
        ];
      case "Placement":
        return [
          { id: "Dashboard", label: "Dashboard", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "Companies", label: "Companies", icon: FiGrid, color: "from-emerald-500 to-teal-600" },
          { id: "Drives", label: "Drives", icon: FiCalendar, color: "from-purple-500 to-indigo-600" },
          { id: "Placement", label: "Placement", icon: FiBriefcase, color: "from-indigo-500 to-blue-600" },
          { id: "AI Assistant", label: "AI Assistant", icon: FiMessageSquare, color: "from-blue-500 to-indigo-600" }
        ];
      case "Student":
        return [
          { id: "My Profile", label: "My Profile", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "Marks", label: "Academic Marks", icon: FiFileText, color: "from-emerald-500 to-teal-600" },
          { id: "ViewAttendance", label: "Attendance", icon: FiUserCheck, color: "from-purple-500 to-indigo-600" },
          { id: "Timetable", label: "Class Timetable", icon: FiCalendar, color: "from-amber-500 to-orange-600" },
          { id: "Material", label: "Study Materials", icon: FiBookOpen, color: "from-teal-500 to-cyan-600" },
          { id: "Notice", label: "Notices", icon: FiFileText, color: "from-pink-500 to-rose-600" },
          { id: "Certifications", label: "Certifications", icon: FiBriefcase, color: "from-blue-500 to-indigo-600" },
          { id: "Fees", label: "Fee Details", icon: FiGrid, color: "from-emerald-500 to-teal-600" },
          { id: "Placement", label: "Placement Drive", icon: FiBriefcase, color: "from-indigo-500 to-purple-600" },
          { id: "OnlineCompiler", label: "Code Compiler", icon: FiCpu, color: "from-cyan-500 to-blue-600" },
          { id: "AI Assistant", label: "AI Assistant", icon: FiMessageSquare, color: "from-purple-500 to-pink-600" }
        ];
      case "Library":
        return [
          { id: "Profile", label: "My Profile", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "AI RAG Assistant", label: "AI RAG & Web Assistant", icon: FiCpu, color: "from-cyan-500 to-indigo-600" }
        ];
      case "HOD":
        return [
          { id: "Leave Approvals", label: "Leave Approvals", icon: FiCalendar, color: "from-indigo-500 to-purple-600" },
          { id: "PredictiveAnalytics", label: "Predictive & Reports", icon: FiActivity, color: "from-indigo-600 to-purple-600" },
          { id: "Student", label: "Student Mngmt", icon: FiUsers, color: "from-emerald-500 to-teal-600" },
          { id: "Faculty", label: "Faculty Mngmt", icon: FiUserCheck, color: "from-purple-500 to-indigo-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-rose-600" },
          { id: "Subjects", label: "Subjects", icon: MdOutlineSubject, color: "from-teal-500 to-cyan-600" },
          { id: "Timetables", label: "Timetables", icon: FiCalendar, color: "from-rose-500 to-red-600" },
          { id: "Attendance", label: "Attendance", icon: FiGrid, color: "from-amber-500 to-yellow-600" },
          { id: "Section", label: "Section", icon: FiGrid, color: "from-cyan-500 to-blue-600" },
          { id: "OBE Config", label: "OBE Config", icon: FiFileText, color: "from-indigo-500 to-purple-600" },
          { id: "Material", label: "Materials", icon: FiBookOpen, color: "from-teal-500 to-cyan-600" },
          { id: "Marks", label: "View Marks", icon: FiFileText, color: "from-amber-500 to-orange-600" },
          { id: "FacultyAttendance", label: "Faculty Tracking", icon: FiBarChart2, color: "from-blue-500 to-emerald-500" },
          { id: "FacultySubstitution", label: "Faculty Substitution", icon: FiCalendar, color: "from-amber-500 to-rose-500" },
          { id: "DailyFacultyAttendance", label: "Daily Faculty Attendance", icon: FiUserCheck, color: "from-teal-500 to-emerald-600" },
          { id: "Message Parent", label: "Message Parent", icon: FiMessageSquare, color: "from-pink-500 to-rose-600" },
          { id: "Profile", label: "My Profile", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "AI Analytics", label: "AI Analytics", icon: FiActivity, color: "from-purple-500 to-pink-600" }
        ];
      case "Principal":
        return [
          { id: "Dashboard", label: "Dashboard", icon: FiHome, color: "from-indigo-500 to-blue-600" },
          { id: "Leave Approvals", label: "Leave Approvals", icon: FiCalendar, color: "from-blue-500 to-indigo-600" },
          { id: "College Reports", label: "College Reports", icon: FiFileText, color: "from-emerald-500 to-teal-600" },
          { id: "Branches", label: "Branches", icon: FiGrid, color: "from-purple-500 to-indigo-600" },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 transition-all duration-300 z-30 ${
        isCollapsed ? "w-16" : "w-64"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } flex flex-col shadow-2xl`}
    >
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs md:hidden -z-10"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Collapse Toggle */}
      <div className="absolute -right-3.5 top-5 z-40">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 cursor-pointer"
        >
          {isCollapsed ? (
            <FiChevronRight className="w-3.5 h-3.5" />
          ) : (
            <FiChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Menu List */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full group relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r " + item.color + " text-white shadow-md shadow-indigo-500/20 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium"
              }`}
            >
              <div className="flex items-center px-3 py-2.5">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-800/90 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <span className="ml-3 text-xs tracking-tight truncate">{item.label}</span>
                )}
              </div>

              {isActive && !isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Branding */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-xs">
                <span className="text-white text-xs font-black">S</span>
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold text-slate-200 leading-tight">Sphoorthy ECAP</p>
                <p className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Autonomous Portal</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
//Sidebar.jsx

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
  FiCode,
  FiTruck,
  FiEye, // Add this import for the eye icon
  FiBriefcase,
  FiBarChart2
} from "react-icons/fi";
import { MdOutlineSchool, MdOutlineSubject } from "react-icons/md";

const Sidebar = ({ selectedMenu, setSelectedMenu, userType, isCollapsed, setIsCollapsed }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen(!isMobileOpen);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, [isMobileOpen]);

  // Close sidebar on mobile when menu item is clicked
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
          { id: "Profile", label: "Profile", icon: FiHome, color: "from-blue-500 to-blue-600" },
          { id: "Student", label: "Student", icon: FiUsers, color: "from-green-500 to-green-600" },
          { id: "Faculty", label: "Faculty", icon: FiUserCheck, color: "from-purple-500 to-purple-600" },
          { id: "Library", label: "Library", icon: FiBookOpen, color: "from-orange-500 to-orange-600" },
          { id: "Transport Incharge", label: "Transport Incharge", icon: FiTruck, color: "from-lime-500 to-lime-600" },
          { id: "Branch", label: "Branch", icon: MdOutlineSchool, color: "from-indigo-500 to-indigo-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-pink-600" },
          { id: "Subjects", label: "Subjects", icon: MdOutlineSubject, color: "from-teal-500 to-teal-600" },
          { id: "Timetables", label: "Timetables", icon: FiCalendar, color: "from-red-500 to-red-600" },
          { id: "Admin", label: "Admins", icon: FiSettings, color: "from-gray-500 to-gray-600" },
          { id: "Attendance", label: "Attendance", icon: FiGrid, color: "from-yellow-500 to-yellow-600" },
          { id: "Section", label: "Section", icon: FiGrid, color: "from-cyan-500 to-cyan-600" },
          { id: "Reports", label: "Reports", icon: FiFileText, color: "from-emerald-500 to-emerald-600" },
          { id: "OBE Config", label: "OBE Config", icon: FiFileText, color: "from-indigo-500 to-indigo-600" }
        ];
      case "Faculty":
        return [
          { id: "My Profile", label: "My Profile", icon: FiHome, color: "from-blue-500 to-blue-600" },
          { id: "Student Info", label: "Student Info", icon: FiUsers, color: "from-green-500 to-green-600" },
          { id: "Upload Marks", label: "Upload Marks", icon: FiFileText, color: "from-purple-500 to-purple-600" },
          { id: "Timetable", label: "Timetable", icon: FiCalendar, color: "from-orange-500 to-orange-600" },
          { id: "MyFacultyTimeTable", label: "MyFacultyTimeTable", icon: FiCalendar, color: "from-orange-500 to-orange-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-pink-600" },
          { id: "Material", label: "Material", icon: FiBookOpen, color: "from-teal-500 to-teal-600" },
          { id: "Attendence", label: "Attendance", icon: FiGrid, color: "from-red-500 to-red-600" },
          { id: "Edit Faculty", label: "Edit Faculty", icon: FiGrid, color: "from-red-500 to-red-600" },
          { id: "CO Attainment", label: "CO Attainment", icon: MdOutlineSubject, color: "from-indigo-500 to-indigo-600" },
          { id: "Final CO/PO Attainment", label: "Final CO/PO Attainment", icon: MdOutlineSubject, color: "from-purple-500 to-purple-600" },
          { id: "Leave Management", label: "Leave Management", icon: FiCalendar, color: "from-indigo-500 to-indigo-600" }
        ];
      case "Examination":
        return [
          { id: "My Profile", label: "My Profile", icon: FiHome, color: "from-blue-500 to-blue-600" },
          { id: "Add Faculty", label: "Add Faculty", icon: FiUsers, color: "from-green-500 to-green-600" },
          { id: "View Faculty", label: "View Faculty", icon: FiEye, color: "from-purple-500 to-purple-600" } // Add this line
        ];
      case "Placement":
        return [
          { id: "Dashboard", label: "Dashboard", icon: FiHome, color: "from-blue-500 to-blue-600" },
          { id: "Companies", label: "Companies", icon: FiGrid, color: "from-green-500 to-green-600" },
          { id: "Drives", label: "Drives", icon: FiCalendar, color: "from-purple-500 to-purple-600" },
          { id: "Applications", label: "Applications", icon: FiFileText, color: "from-orange-500 to-orange-600" },
          { id: "Training", label: "Training", icon: FiBookOpen, color: "from-teal-500 to-teal-600" },
          { id: "Reports", label: "Reports", icon: FiFileText, color: "from-emerald-500 to-emerald-600" }
        ];
      case "Student":
        return [
          { id: "My Profile", label: "My Profile", icon: FiHome, color: "from-blue-500 to-blue-600" },
          { id: "Timetable", label: "Timetable", icon: FiCalendar, color: "from-green-500 to-green-600" },
          { id: "Marks", label: "Marks", icon: FiFileText, color: "from-purple-500 to-purple-600" },
          { id: "Material", label: "Material", icon: FiBookOpen, color: "from-orange-500 to-orange-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-pink-600" },
          { id: "ViewAttendance", label: "View Attendance", icon: FiGrid, color: "from-teal-500 to-teal-600" },
          { id: "Certifications", label: "Certifications", icon: FiFileText, color: "from-red-500 to-red-600" },
          { id: "Fees", label: "Fees", icon: FiFileText, color: "from-yellow-500 to-yellow-600" },
          { id: "Transport", label: "Transport", icon: FiTruck, color: "from-lime-500 to-lime-600" },
          { id: "OnlineCompiler", label: "Online Compiler", icon: FiCode, color: "from-indigo-500 to-indigo-600" },
          { id: "Edit Student", label: "Edit Student", icon: FiGrid, color: "from-red-500 to-red-600" },
          { id: "Placement", label: "Placement", icon: FiBriefcase, color: "from-blue-500 to-blue-600" }
        ];
      case "HOD":
        return [
          { id: "Leave Approvals", label: "Leave Approvals", icon: FiCalendar, color: "from-indigo-500 to-indigo-600" },
          { id: "Student", label: "Student Mngmt", icon: FiUsers, color: "from-green-500 to-green-600" },
          { id: "Faculty", label: "Faculty Mngmt", icon: FiUserCheck, color: "from-purple-500 to-purple-600" },
          { id: "Notice", label: "Notice", icon: FiFileText, color: "from-pink-500 to-pink-600" },
          { id: "Subjects", label: "Subjects", icon: MdOutlineSubject, color: "from-teal-500 to-teal-600" },
          { id: "Timetables", label: "Timetables", icon: FiCalendar, color: "from-red-500 to-red-600" },
          { id: "Attendance", label: "Attendance", icon: FiGrid, color: "from-yellow-500 to-yellow-600" },
          { id: "Section", label: "Section", icon: FiGrid, color: "from-cyan-500 to-cyan-600" },
          { id: "OBE Config", label: "OBE Config", icon: FiFileText, color: "from-indigo-500 to-indigo-600" },
          { id: "Material", label: "Materials", icon: FiBookOpen, color: "from-teal-500 to-teal-600" },
          { id: "Marks", label: "View Marks", icon: FiFileText, color: "from-orange-500 to-orange-600" },
          { id: "FacultyAttendance", label: "Faculty Tracking", icon: FiBarChart2, color: "from-blue-500 to-emerald-500" },
          { id: "FacultySubstitution", label: "Faculty Substitution", icon: FiCalendar, color: "from-orange-500 to-red-500" },
          { id: "Profile", label: "My Profile", icon: FiHome, color: "from-blue-500 to-blue-600" },
        ];
      case "Principal":
        return [
          { id: "Dashboard", label: "Dashboard", icon: FiHome, color: "from-indigo-500 to-indigo-600" },
          { id: "Leave Approvals", label: "Leave Approvals", icon: FiCalendar, color: "from-blue-500 to-blue-600" },
          { id: "College Reports", label: "College Reports", icon: FiFileText, color: "from-emerald-500 to-emerald-600" },
          { id: "Branches", label: "Branches", icon: FiGrid, color: "from-purple-500 to-purple-600" },
        ];
      default:
        return [];
    }
  };

  
  const menuItems = getMenuItems();

  return (
    <div
      className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white shadow-2xl border-r border-gray-200 transition-all duration-300 z-40 ${
        isCollapsed ? "w-16" : "w-64"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } flex flex-col`}
    >
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden -z-10"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
        >
          {isCollapsed ? (
            <FiChevronRight className="w-3 h-3" />
          ) : (
            <FiChevronLeft className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r " +
                    item.color +
                    " text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center px-4 py-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 group-hover:bg-gradient-to-r " +
                        item.color +
                        " group-hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {!isCollapsed && (
                  <span className="ml-3 font-medium text-sm">{item.label}</span>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && !isCollapsed && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Section */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">Sphoorthy</p>
                <p className="text-xs text-gray-500">Engineering College</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default Sidebar;
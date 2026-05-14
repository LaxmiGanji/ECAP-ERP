import { useState } from "react";
import { FiLogOut, FiMenu, FiX, FiUser, FiBell } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import sphnLogo from "./sphn.png"; // Use your actual logo path

const Navbar = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new Event("toggleSidebar"));
  };

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 w-full">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <img
              src={sphnLogo}
              alt="Sphoorthy Logo"
              className="w-12 h-12 rounded-xl object-cover shadow-lg"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm md:text-xl font-bold text-white tracking-wide truncate max-w-[150px] md:max-w-none">
                Sphoorthy Engineering College
              </span>
              <span className="hidden sm:block text-[10px] md:text-xs text-blue-200 font-medium tracking-wider uppercase">
                Engineering College Automation Package
              </span>
            </div>
          </div>

          {/* Center Dashboard */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <RxDashboard className="text-blue-300 text-lg" />
              <span className="text-white font-medium">
                {router.state && router.state.type} Dashboard
              </span>
            </div>
          </div>

          {/* Profile & Logout */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="relative p-2 text-blue-200 hover:text-white transition-colors">
              <FiBell className="text-xl" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <FiUser className="text-white text-sm" />
              </div>
              <span className="text-white font-medium text-sm">
                {router.state && router.state.type}
              </span>
            </div>
            <button
              className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-lg"
              onClick={handleLogout}
            >
              <FiLogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleSidebar}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FiMenu className="text-xl" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800/95 backdrop-blur-sm rounded-xl mt-4 p-4 border border-blue-500/20">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-3">
                <RxDashboard className="text-blue-300" />
                <span className="text-white font-medium">
                  {router.state && router.state.type} Dashboard
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                    <FiUser className="text-white text-sm" />
                  </div>
                  <span className="text-white font-medium text-sm">
                    {router.state && router.state.type}
                  </span>
                </div>
                <button
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                  onClick={handleLogout}
                >
                  <FiLogOut className="mr-2 h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
import { FiLogOut, FiMenu, FiUser, FiBell } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import sphnLogo from "./sphn.png";

const Navbar = () => {
  const router = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleSidebar = () => {
    window.dispatchEvent(new Event("toggleSidebar"));
  };

  const userRole = (router.state && router.state.type) || "ECAP";

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <img
              src={sphnLogo}
              alt="Sphoorthy Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-md ring-2 ring-indigo-500/30 bg-slate-900"
            />
            <div className="flex flex-col justify-center">
              <span className="text-sm md:text-base font-extrabold text-white tracking-tight truncate max-w-[200px] md:max-w-none">
                Sphoorthy Engineering College
              </span>
              <span className="hidden sm:block text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                ECAP Management Portal
              </span>
            </div>
          </div>

          {/* Center Dashboard Badge */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2.5 bg-gradient-to-r from-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-full px-4 py-1.5 shadow-inner">
              <RxDashboard className="text-indigo-400 text-base" />
              <span className="text-slate-100 font-bold text-xs tracking-wide">
                {userRole} Dashboard
              </span>
            </div>
          </div>

          {/* Profile & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-all duration-200">
              <FiBell className="text-lg" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>

            <div className="flex items-center space-x-2.5 bg-slate-900/90 border border-slate-800 rounded-full px-3.5 py-1.5 shadow-sm">
              <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-cyan-500 rounded-full flex items-center justify-center shadow-xs">
                <FiUser className="text-white text-xs" />
              </div>
              <span className="text-slate-200 font-bold text-xs">
                {userRole}
              </span>
            </div>

            <button
              className="inline-flex items-center px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
              onClick={handleLogout}
            >
              <FiLogOut className="mr-1.5 h-3.5 w-3.5" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleSidebar}
              className="text-slate-300 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <FiMenu className="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
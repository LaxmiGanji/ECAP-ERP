import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast, { Toaster } from "react-hot-toast";
import {
  FaGraduationCap, FaUser, FaEnvelope, FaPhone,
  FaIdCard, FaBuilding, FaCalendarAlt, FaSignOutAlt,
  FaLinkedin, FaGithub, FaPortrait, FaBriefcase
} from "react-icons/fa";
import { FiBook, FiAward, FiHome } from "react-icons/fi";

const AlumniHome = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");

  useEffect(() => {
    if (!router.state) {
      navigate("/");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.post(
        `${baseApiURL()}/student/details/getDetails`,
        { enrollmentNo: router.state.enrollmentNo || router.state.loginid },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.success) {
        setData(response.data.user[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    navigate("/");
    toast.success("Logged out successfully");
  };

  const menuItems = [
    { name: "Dashboard", icon: FiHome },
    { name: "Profile", icon: FaUser },
  ];

  const renderContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      );
    }

    if (selectedMenu === "Profile") {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/40">
                  {data.firstName?.[0]}{data.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {[data.firstName, data.middleName, data.lastName].filter(Boolean).join(" ")}
                  </h2>
                  <p className="text-amber-100">Alumni • Batch {data.batch}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-400/20 text-green-100 border border-green-300/30 mt-1">
                    🎓 Graduated {data.graduationYear || new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: "Enrollment No", value: data.enrollmentNo, icon: FaIdCard },
                { label: "Branch", value: data.branch, icon: FaBuilding },
                { label: "Email", value: data.email, icon: FaEnvelope },
                { label: "Phone", value: data.phoneNumber, icon: FaPhone },
                { label: "Regulation", value: data.regulation, icon: FiBook },
                { label: "Gender", value: data.gender, icon: FaUser },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{value || "N/A"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Dashboard
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Welcome back, Alumni</p>
              <h2 className="text-3xl font-bold">
                {data ? [data.firstName, data.lastName].filter(Boolean).join(" ") : "Alumni"}
              </h2>
              <p className="text-amber-200 mt-1">
                {data?.branch} • Batch {data?.batch} • {data?.regulation}
              </p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <FaGraduationCap className="text-5xl text-white/80" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Enrollment No", value: data?.enrollmentNo || "—", icon: FaIdCard, color: "blue" },
            { label: "Branch", value: data?.branch || "—", icon: FaBuilding, color: "green" },
            { label: "Batch", value: data?.batch || "—", icon: FaCalendarAlt, color: "purple" },
            { label: "Graduation Year", value: data?.graduationYear || new Date().getFullYear(), icon: FiAward, color: "amber" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-md p-4 flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100 text-${color}-600`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-bold text-gray-800 text-sm">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Graduation Card */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <FaGraduationCap size={20} />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Alumni Status</h3>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 flex items-center space-x-4">
            <div className="text-4xl">🎓</div>
            <div>
              <p className="font-bold text-green-800 text-lg">Congratulations, Graduate!</p>
              <p className="text-green-600 text-sm mt-1">
                You have successfully completed your degree from <strong>{data?.branch}</strong>.
                Your alumni credentials grant you exclusive access to this portal.
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Note: Your student portal access has been revoked. Use this Alumni Portal to stay connected.
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 text-lg mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3">
              <FaEnvelope className="text-amber-500" />
              <span className="text-sm text-gray-700">{data?.email || "Not provided"}</span>
            </div>
            <div className="flex items-center space-x-3">
              <FaPhone className="text-amber-500" />
              <span className="text-sm text-gray-700">{data?.phoneNumber || "Not provided"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col">
      <Toaster position="top-right" />

      {/* Top Navbar */}
      <nav className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FaGraduationCap className="text-2xl text-white/90" />
          <div>
            <h1 className="text-lg font-bold">Alumni Portal</h1>
            <p className="text-amber-200 text-xs">ECAP Alumni Network</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-amber-100">
            {router.state?.loginid}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors"
          >
            <FaSignOutAlt className="text-sm" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-white shadow-md flex flex-col py-6 px-3">
          {menuItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setSelectedMenu(name)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-1 transition-all font-medium text-sm ${
                selectedMenu === name
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              <Icon size={16} />
              <span>{name}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AlumniHome;

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaBook } from "react-icons/fa";
import { Toaster } from "react-hot-toast";
import Interactive3DBackground from "./Interactive3DBackground";
import sphnLogo from "./sphn.png";

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    { name: "Student", icon: FaUserGraduate, path: "/student-login", color: "from-indigo-500 to-blue-600", desc: "Access courses, attendance & marks" },
    { name: "Faculty", icon: FaChalkboardTeacher, path: "/faculty-login", color: "from-cyan-500 to-blue-600", desc: "Manage classes, attendance & CO/PO" },
    { name: "Admin", icon: FaUserShield, path: "/admin-login", color: "from-violet-500 to-purple-600", desc: "Full ECAP portal administration" },
    { name: "Library", icon: FaBook, path: "/library-login", color: "from-amber-500 to-orange-600", desc: "Books catalog & circulation" },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -8, scale: 1.03, boxShadow: "0 20px 40px -15px rgba(99, 102, 241, 0.4)" },
    tap: { scale: 0.97 }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center p-6 md:p-12 overflow-hidden bg-slate-950">
      {/* 3D WebGL Motion Background */}
      <Interactive3DBackground />

      {/* Header Branding */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <img src={sphnLogo} alt="Sphoorthy Engineering College" className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-lg" />
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-wide">Sphoorthy Engineering College</h2>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">ECAP Autonomous Portal</span>
          </div>
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 w-full max-w-5xl my-auto py-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-xs tracking-widest uppercase mb-4 backdrop-blur-md">
            Next-Gen Academic ERP System
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight leading-tight mb-4 drop-shadow-sm">
            Welcome to Sphoorthy ECAP
          </h1>
          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Select your administrative role below to access personalized dashboards, smart analytics, and academic tools.
          </p>
        </motion.div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {roles.map((role, idx) => (
            <motion.div
              key={role.name}
              className="group relative bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center text-center border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer shadow-xl overflow-hidden"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              onClick={() => navigate(role.path)}
            >
              {/* Gradient Accent Glow */}
              <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${role.color}`} />
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                <role.icon size={28} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-indigo-300 transition-colors">
                {role.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                {role.desc}
              </p>

              <span className="mt-auto inline-flex items-center text-xs font-bold text-indigo-400 group-hover:text-white transition-colors">
                Sign In &rarr;
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-6xl flex justify-between items-center py-4 border-t border-slate-800/80 text-xs text-slate-500">
        <span>&copy; {new Date().getFullYear()} Sphoorthy Engineering College. All rights reserved.</span>
        <span className="font-mono opacity-60">developed by laxmi</span>
      </div>

      <Toaster position="bottom-center" />
    </div>
  );
};

export default RoleSelection;
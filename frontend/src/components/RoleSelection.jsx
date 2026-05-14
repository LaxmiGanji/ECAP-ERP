
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaBook } from "react-icons/fa";
import { Toaster } from "react-hot-toast";

const RoleSelection = () => {
  const navigate = useNavigate();

  const roles = [
    { name: "Student", icon: FaUserGraduate, path: "/student-login" },
    { name: "Faculty", icon: FaChalkboardTeacher, path: "/faculty-login" },
    { name: "Admin", icon: FaUserShield, path: "/admin-login" },
    { name: "Library", icon: FaBook, path: "/library-login" },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 justify-center items-center p-8">
      {/* Animated background elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-4xl">
        <motion.h1 
          className="text-5xl font-extrabold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to Sphoorthy Engineering College
        </motion.h1>
        <motion.p
          className="text-xl text-blue-100 text-center mb-16"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Please select your role to continue
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {roles.map((role) => (
            <motion.div
              key={role.name}
              className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center cursor-pointer border border-white/20"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              transition={{ duration: 0.3 }}
              onClick={() => navigate(role.path)}
            >
              <role.icon className="text-blue-300 mb-4" size={50} />
              <h2 className="text-2xl font-semibold text-white mb-2">
                {role.name}
              </h2>
              <p className="text-blue-200 text-center text-sm">
                Login as {role.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1E3A8A',
            color: '#fff',
            border: '1px solid #3B82F6',
          },
        }}
      />
      <div
        style={{
          position: "fixed",
          right: "12px",
          bottom: "8px",
          opacity: 0.18,
          fontSize: "0.95rem",
          color: "#1e293b",
          pointerEvents: "none",
          zIndex: 50,
          fontWeight: "bold",
          fontFamily: "monospace",
        }}
      >
        developed by laxmi
      </div>
    </div>
  );
};

 
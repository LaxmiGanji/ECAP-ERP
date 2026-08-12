import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaBook, FaBusAlt, FaClipboardList, FaBriefcase, FaGraduationCap } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { baseApiURL } from "../baseUrl";
import { motion } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const roles = [
    { name: "Student", icon: FaUserGraduate, path: "/student" },
    { name: "Faculty", icon: FaChalkboardTeacher, path: "/faculty" },
    { name: "Admin", icon: FaUserShield, path: "/admin" },
    { name: "Examination", icon: FaClipboardList, path: "/examination" },
    { name: "Library", icon: FaBook, path: "/library" },
    { name: "Transport", icon: FaBusAlt, path: "/transport" },
    { name: "Placement", icon: FaBriefcase, path: "/placement" },
    { name: "HOD", icon: FaUserShield, path: "/hod" },
    { name: "Principal", icon: FaUserShield, path: "/principal" },
    { name: "Accounts", icon: FaClipboardList, path: "/accounts" },
    { name: "Alumni", icon: FaGraduationCap, path: "/alumni" },
  ];


  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.05, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.95 }
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const data = { credential: credentialResponse.credential };
    axios
      .post(`${baseApiURL()}/auth/google-login`, data)
      .then((response) => {
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        toast.success(response.data.message);
        navigate(`/${response.data.role.toLowerCase()}`, {
          state: { type: response.data.role, ...response.data },
        });
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Google Auth error:", error);
        if (error.response && error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Internal Server Error");
        }
      });
  };

  const onSubmit = (data) => {
    if (data.loginid !== "" && data.password !== "") {
      const headers = {
        "Content-Type": "application/json",
      };
      axios
        .post(`${baseApiURL()}/${selectedRole.toLowerCase()}/auth/login`, data, {
          headers: headers,
        })
        .then((response) => {
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }
          navigate(`/${selectedRole.toLowerCase()}`, {
            state: { type: selectedRole, ...response.data },
          });
        })
        .catch((error) => {
          toast.dismiss();
          console.error(error);
          if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Unable to connect to server");
          }
        });
    }
  };

  const handleRoleSelect = (roleName) => {
    setSelectedRole(roleName);
    reset(); // Clear form fields when switching roles
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
    reset(); // Clear form fields when going back
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 justify-center items-center p-4 sm:p-8 relative">
      {/* Animated background elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-4xl">
        {!selectedRole ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={formVariants}
            transition={{ duration: 0.5 }}
          >
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVSz_mfjID4esb-MR0jWO584NqYdriBbzBfg&s"
              alt="College Logo"
              className="h-24 md:h-32 w-auto mx-auto mb-6 md:mb-8 transform hover:scale-105 transition-transform duration-300"
            />
            <motion.h1
              className="text-3xl md:text-5xl font-extrabold text-center mb-8 md:mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white drop-shadow-lg px-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Welcome to Sphoorthy Engineering College
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-blue-100 text-center mb-4 md:mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Please select your role to continue
            </motion.p>


            <motion.div 
              className="flex justify-center mb-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() => {
                  toast.error('Google Login Failed');
                }}
                theme="filled_blue"
                shape="pill"
                size="large"
              />
            </motion.div>

            <div className="flex items-center justify-center space-x-4 mb-8 md:mb-10 px-4">
              <div className="h-px bg-blue-200/30 flex-1"></div>
              <span className="text-blue-200 text-sm uppercase tracking-wide whitespace-nowrap">Or manual login</span>
              <div className="h-px bg-blue-200/30 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-4">
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
                  onClick={() => handleRoleSelect(role.name)}
                >
                  <role.icon className="text-blue-300 mb-3 md:mb-4" size={40} />
                  <h2 className="text-xl md:text-2xl font-semibold text-white mb-1 md:mb-2">
                    {role.name}
                  </h2>
                  <p className="text-blue-200 text-center text-sm">
                    Login as {role.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 md:p-8 transform transition-all duration-300 hover:shadow-blue-500/20"
            initial="hidden"
            animate="visible"
            variants={formVariants}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white">{selectedRole} Login</h2>
              <p className="text-blue-100 mt-2">Please login to access your Dashboard</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  {selectedRole} Login ID
                </label>
                <input
                  type="text"
                  {...register("loginid")}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-200/20 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  placeholder={`Enter ${selectedRole} ID`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-200/20 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 font-medium transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-blue-500/25"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Sign In</span>
                <FiLogIn className="w-5 h-5" />
              </motion.button>

            <div className="mt-8 text-center">
              <motion.button 
                type="button"
                onClick={handleBackToRoleSelection}
                className="text-blue-300 hover:underline text-sm"
                whileHover={{ scale: 1.05 }}
              >
                ← Back to Role Selection
              </motion.button>
            </div>

          </form>
        </motion.div>
        )}
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
    </div>
  );
};

export default Login;

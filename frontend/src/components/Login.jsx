import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiLogIn, FiEye, FiEyeOff, FiMail, FiX, FiKey, FiArrowLeft } from "react-icons/fi";
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaBook, FaBusAlt, FaClipboardList, FaBriefcase, FaGraduationCap } from "react-icons/fa";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { baseApiURL } from "../baseUrl";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogin } from '@react-oauth/google';
import Interactive3DBackground from "./Interactive3DBackground";
import sphnLogo from "./sphn.png";

const Login = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, getValues } = useForm();

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotLoginId, setForgotLoginId] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingForgot, setSendingForgot] = useState(false);
  const [forgotRequireEmail, setForgotRequireEmail] = useState(false);

  const roles = [
    { name: "Student", icon: FaUserGraduate, path: "/student", color: "from-indigo-500 to-blue-600" },
    { name: "Faculty", icon: FaChalkboardTeacher, path: "/faculty", color: "from-cyan-500 to-blue-600" },
    { name: "Admin", icon: FaUserShield, path: "/admin", color: "from-violet-500 to-purple-600" },
    { name: "Examination", icon: FaClipboardList, path: "/examination", color: "from-purple-500 to-pink-600" },
    { name: "Library", icon: FaBook, path: "/library", color: "from-amber-500 to-orange-600" },
    { name: "Transport", icon: FaBusAlt, path: "/transport", color: "from-lime-500 to-emerald-600" },
    { name: "Placement", icon: FaBriefcase, path: "/placement", color: "from-blue-600 to-indigo-600" },
    { name: "HOD", icon: FaUserShield, path: "/hod", color: "from-indigo-600 to-purple-600" },
    { name: "Principal", icon: FaUserShield, path: "/principal", color: "from-slate-700 to-slate-900" },
    { name: "Accounts", icon: FaClipboardList, path: "/accounts", color: "from-emerald-500 to-teal-600" },
    { name: "Alumni", icon: FaGraduationCap, path: "/alumni", color: "from-pink-500 to-rose-600" },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -6, scale: 1.03, boxShadow: "0 15px 30px -10px rgba(99, 102, 241, 0.3)" },
    tap: { scale: 0.97 }
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
        const userLoginId = response.data.loginid || "";
        const role = response.data.role || "Student";
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
        }
        if (userLoginId) {
          localStorage.setItem("loginid", userLoginId);
        }
        localStorage.setItem("userRole", role);

        toast.success(response.data.message || "Google Login Successful!");
        navigate(`/${role.toLowerCase()}`, {
          state: { type: role, loginid: userLoginId },
          replace: true,
        });
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Google Login Failed");
      });
  };

  const onSubmit = (data) => {
    if (!selectedRole) {
      toast.error("Please select your role first");
      return;
    }
    const loginData = { ...data, role: selectedRole };
    const apiEndpoint = selectedRole === "Student" 
      ? `${baseApiURL()}/student/auth/login`
      : selectedRole === "Faculty"
      ? `${baseApiURL()}/faculty/auth/login`
      : selectedRole === "Admin"
      ? `${baseApiURL()}/admin/auth/login`
      : selectedRole === "Library"
      ? `${baseApiURL()}/library/auth/login`
      : selectedRole === "Transport"
      ? `${baseApiURL()}/transport/auth/login`
      : selectedRole === "Placement"
      ? `${baseApiURL()}/placement/auth/login`
      : selectedRole === "Examination"
      ? `${baseApiURL()}/examination/auth/login`
      : selectedRole === "HOD"
      ? `${baseApiURL()}/hod/auth/login`
      : selectedRole === "Principal"
      ? `${baseApiURL()}/principal/auth/login`
      : selectedRole === "Accounts"
      ? `${baseApiURL()}/accounts/auth/login`
      : selectedRole === "Alumni"
      ? `${baseApiURL()}/alumni/auth/login`
      : `${baseApiURL()}/auth/login`;

    axios
      .post(apiEndpoint, loginData)
      .then((response) => {
        const userLoginId = response.data.loginid || data.loginid || "";
        const userToken = response.data.token || "";

        if (userToken) {
          localStorage.setItem("token", userToken);
        }
        if (userLoginId) {
          localStorage.setItem("loginid", userLoginId);
        }
        localStorage.setItem("userRole", selectedRole);

        toast.success(response.data.message || "Login Successful!");
        const roleObj = roles.find(r => r.name === selectedRole);
        const targetPath = roleObj ? roleObj.path : `/${selectedRole.toLowerCase()}`;

        navigate(targetPath, {
          state: {
            type: selectedRole,
            loginid: userLoginId,
            branch: response.data.branch || response.data.department || "",
          },
          replace: true,
        });
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Login Failed");
      });
  };

  const handleRoleSelect = (roleName) => {
    setSelectedRole(roleName);
    reset();
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotLoginId.trim()) {
      toast.error("Please enter your Login ID / Enrollment No.");
      return;
    }
    setSendingForgot(true);
    try {
      const res = await axios.post(`${baseApiURL()}/auth/forgot-password-request`, {
        loginid: forgotLoginId.trim(),
        email: forgotEmail.trim(),
        role: selectedRole || ""
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowForgotModal(false);
        setForgotLoginId("");
        setForgotEmail("");
        setForgotRequireEmail(false);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      if (err.response?.data?.requireEmail) {
        setForgotRequireEmail(true);
        toast.error("Email not found in system. Please enter your email address below.");
      } else {
        toast.error(err.response?.data?.message || "Failed to process forgot password request");
      }
    } finally {
      setSendingForgot(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-950 overflow-hidden">
      {/* 3D WebGL Background Visual */}
      <Interactive3DBackground />

      <div className="relative z-10 w-full max-w-6xl my-auto py-6">
        {!selectedRole ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center mb-8">
              <img src={sphnLogo} alt="Sphoorthy Logo" className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-2xl mb-4 bg-slate-900" />
              <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 text-center tracking-tight">
                Sphoorthy Engineering College
              </h1>
              <p className="text-sm sm:text-lg text-slate-300 text-center mt-2 font-medium">
                Select your institutional role to access the ECAP portal
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() => toast.error('Google Login Failed')}
                theme="filled_blue"
                shape="pill"
                size="large"
              />
            </div>

            <div className="flex items-center justify-center space-x-4 mb-8 max-w-md mx-auto">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Or Manual Role Login</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {roles.map((role) => (
                <motion.div
                  key={role.name}
                  className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 shadow-lg group relative overflow-hidden"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleRoleSelect(role.name)}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${role.color} flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                    <role.icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {role.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-white transition-colors">
                    Login &rarr;
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="w-full max-w-md mx-auto bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative"
            initial="hidden"
            animate="visible"
            variants={formVariants}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={() => setSelectedRole(null)}
              className="absolute top-6 left-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold"
            >
              <FiArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="mt-8 mb-8 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                {selectedRole} Portal
              </span>
              <h2 className="text-2xl font-black text-white">{selectedRole} Sign In</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your credentials to access your dashboard</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                  {selectedRole} Login ID / Enrollment No.
                </label>
                <input
                  type="text"
                  {...register("loginid")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                  placeholder={`Enter your ${selectedRole} ID`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <FiLogIn size={18} />
                <span>Sign In to Dashboard</span>
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white"
              >
                <FiX size={20} />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FiKey size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">Request password reset details</p>
                </div>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Login ID / Enrollment No.
                  </label>
                  <input
                    type="text"
                    value={forgotLoginId}
                    onChange={(e) => setForgotLoginId(e.target.value)}
                    placeholder="Enter Login ID"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                    required
                  />
                </div>

                {forgotRequireEmail && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter registered email"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingForgot}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  {sendingForgot ? "Processing..." : "Submit Reset Request"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toaster position="bottom-center" />
    </div>
  );
};

export default Login;

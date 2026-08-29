import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiLogIn, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { baseApiURL } from "../baseUrl";
import { motion } from "framer-motion";
import Interactive3DBackground from "./Interactive3DBackground";
import sphnLogo from "./sphn.png";
import { GoogleLogin } from '@react-oauth/google';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit } = useForm();

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
    if (data.loginid !== "" && data.password !== "") {
      const headers = {
        "Content-Type": "application/json",
      };
      axios
        .post(`${baseApiURL()}/student/auth/login`, data, {
          headers: headers,
        })
        .then((response) => {
          const userLoginId = response.data.loginid || data.loginid || "";
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }
          if (userLoginId) {
            localStorage.setItem("loginid", userLoginId);
          }
          localStorage.setItem("userRole", "Student");

          toast.success(response.data.message || "Login Successful!");
          navigate(`/student`, {
            state: { type: "Student", loginid: userLoginId },
            replace: true,
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

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-8 bg-slate-950 overflow-hidden">
      {/* 3D WebGL Background Visual */}
      <Interactive3DBackground />

      <div className="relative z-10 w-full max-w-md my-auto py-6">
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigate("/")}
            className="absolute top-6 left-6 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold"
          >
            <FiArrowLeft size={16} />
            <span>Role Selection</span>
          </button>

          <div className="flex justify-center mb-4 mt-4">
            <img src={sphnLogo} alt="Sphoorthy Logo" className="w-14 h-14 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-xl bg-slate-900" />
          </div>

          <div className="mb-8 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              Student Portal
            </span>
            <h2 className="text-2xl font-black text-white">Student Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">Access your courses, attendance & marks</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wide">
                Student Enrollment No / ID
              </label>
              <input
                type="text"
                {...register("loginid")}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                placeholder="Enter Student Enrollment No."
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

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 mt-2"
            >
              <FiLogIn size={18} />
              <span>Sign In to Student Dashboard</span>
            </button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Or Sign In With</span>
            <div className="border-t border-slate-800 w-full"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => toast.error('Google Login Failed')}
              theme="filled_dark"
              shape="pill"
            />
          </div>
        </motion.div>
      </div>

      <Toaster position="bottom-center" />
    </div>
  );
};

export default StudentLogin;
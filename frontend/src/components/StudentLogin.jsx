import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { baseApiURL } from "../baseUrl";
import { motion } from "framer-motion";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit } = useForm();

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
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }
          navigate(`/student`, {
            state: { type: "Student", loginid: response.data.loginid },
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
    <div className="min-h-screen w-full flex bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 justify-center items-center p-8">
      {/* Animated background elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Login Form */}
      <div className="w-full max-w-md">
        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 transform transition-all duration-300 hover:shadow-blue-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white">Student Login</h2>
            <p className="text-blue-100 mt-2">Please login to access your Dashboard</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Student Login ID
              </label>
              <input
                type="text"
                {...register("loginid")}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-blue-200/20 text-white placeholder-blue-200/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Enter Student ID"
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
          </form>

          <div className="mt-8 text-center">
            <p className="text-blue-100 text-sm">
              Go back to <motion.a 
                href="/" 
                className="text-blue-300 hover:underline"
                whileHover={{ scale: 1.05 }}
              >
                Role Selection
              </motion.a>
            </p>
          </div>
        </motion.div>
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

export default StudentLogin; 
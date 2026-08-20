import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiKey } from "react-icons/fi";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { baseApiURL } from "../baseUrl";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const role = searchParams.get("role") || "User";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setIsValidToken(false);
      setErrorMessage("No password reset token provided.");
      return;
    }

    // Verify token validity
    axios
      .get(`${baseApiURL()}/auth/verify-reset-token?token=${token}&role=${role}`, { timeout: 30000 })
      .then((res) => {
        if (res.data.valid) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setErrorMessage(res.data.message || "Invalid or expired token.");
        }
      })
      .catch((err) => {
        setIsValidToken(false);
        setErrorMessage(
          err.response?.data?.message || "Invalid or expired password reset link."
        );
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token, role]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);

    axios
      .post(`${baseApiURL()}/auth/reset-password`, {
        token,
        role,
        newPassword,
      }, { timeout: 30000 })
      .then((res) => {
        if (res.data.success) {
          setIsSuccess(true);
          toast.success("Password reset successfully!");
        } else {
          toast.error(res.data.message || "Failed to reset password.");
        }
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.message || "An error occurred while resetting password."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 justify-center items-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          className="w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20"
          initial="hidden"
          animate="visible"
          variants={formVariants}
          transition={{ duration: 0.4 }}
        >
          {/* Header Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/30 border border-blue-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-300 shadow-lg shadow-blue-500/20">
              <FiKey size={32} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Reset Password
            </h1>
            <p className="text-blue-200/80 text-sm mt-1">
              Account Role: <span className="font-semibold text-blue-300 capitalize">{role}</span>
            </p>
          </div>

          {verifying ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-200">Verifying reset token...</p>
            </div>
          ) : !isValidToken ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle size={36} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Invalid or Expired Link</h3>
              <p className="text-blue-200/80 text-sm mb-6 leading-relaxed">
                {errorMessage || "This password reset link is invalid or has expired."}
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30"
              >
                <FiArrowLeft size={18} />
                <span>Return to Login</span>
              </button>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle size={36} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Password Changed!</h3>
              <p className="text-blue-200/80 text-sm mb-6 leading-relaxed">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/25 flex items-center justify-center space-x-2"
              >
                <span>Proceed to Sign In</span>
                <FiArrowLeft size={18} className="rotate-180" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-blue-200/20 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-white transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-blue-200/20 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-200/70 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Requirement Hint */}
              <p className="text-xs text-blue-200/60 flex items-center gap-1.5">
                <FiLock size={12} /> Password should be at least 4 characters long.
              </p>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Reset Password</span>
                )}
              </motion.button>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-xs text-blue-300/80 hover:text-white hover:underline transition-colors inline-flex items-center gap-1"
                >
                  <FiArrowLeft size={14} /> Back to Role Selection
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1E3A8A",
            color: "#fff",
            border: "1px solid #3B82F6",
          },
        }}
      />
    </div>
  );
};

export default ResetPassword;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import { getFileUrl } from "../../utils/fileUrl";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiBookOpen, 
  FiLock, 
  FiShield, 
  FiBriefcase, 
  FiAward,
  FiEye,
  FiEyeOff,
  FiCheckCircle
} from "react-icons/fi";

const Profile = () => {
  const router = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState({ current: "", new: "" });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  const loginid = router.state?.loginid || "";
  const branch = router.state?.branch || "";

  useEffect(() => {
    const fetchHODProfile = async () => {
      setLoading(true);
      try {
        // Try fetching faculty details first (since HODs are senior faculty members)
        const res = await axios.post(
          `${baseApiURL()}/faculty/details/getDetails`,
          { employeeId: loginid },
          { headers: { "Content-Type": "application/json" } }
        );

        if (res.data.success && res.data.user && res.data.user.length > 0) {
          const facultyData = res.data.user[0];
          setData(facultyData);
          dispatch(
            setUserData({
              fullname: `${facultyData.firstName || ""} ${facultyData.middleName || ""} ${facultyData.lastName || ""}`.trim(),
              employeeId: facultyData.employeeId,
              branch: facultyData.department || branch,
            })
          );
        } else {
          // Fallback HOD details structure when specific faculty details aren't populated
          const fallbackData = {
            firstName: "Head of Department",
            middleName: "",
            lastName: `(${branch || "Department"})`,
            employeeId: loginid,
            department: branch || "Engineering",
            email: `${loginid.toLowerCase()}@college.edu`,
            phoneNumber: "N/A",
            post: "Head of Department (HOD)",
            jntuId: "N/A",
            aicteId: "N/A",
            isFallback: true
          };
          setData(fallbackData);
        }
      } catch (err) {
        console.error("Error fetching HOD profile details:", err);
        // Fallback to session data
        setData({
          firstName: "Head of Department",
          middleName: "",
          lastName: `(${branch || "Department"})`,
          employeeId: loginid,
          department: branch || "Engineering",
          email: `${loginid.toLowerCase()}@college.edu`,
          phoneNumber: "N/A",
          post: "Head of Department (HOD)",
          jntuId: "N/A",
          aicteId: "N/A",
          isFallback: true
        });
      } finally {
        setLoading(false);
      }
    };

    if (loginid) {
      fetchHODProfile();
    } else {
      setLoading(false);
    }
  }, [loginid, branch, dispatch]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!password.current || !password.new) {
      toast.error("Please fill in both current and new password");
      return;
    }
    if (password.new.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setUpdatingPass(true);
    try {
      // Step 1: Verify current password via HOD auth login endpoint
      const loginRes = await axios.post(`${baseApiURL()}/hod/auth/login`, {
        loginid: loginid,
        password: password.current,
      });

      if (!loginRes.data.success) {
        toast.error("Current password verification failed!");
        setUpdatingPass(false);
        return;
      }

      // Step 2: Update password via HOD auth update endpoint
      const updateRes = await axios.put(`${baseApiURL()}/hod/auth/update`, {
        loginid: loginid,
        password: password.new,
      });

      if (updateRes.data.success) {
        toast.success(updateRes.data.message || "Password updated successfully!");
        setPassword({ current: "", new: "" });
        setShowPass(false);
      } else {
        toast.error(updateRes.data.message || "Failed to update password");
      }
    } catch (err) {
      console.error("Password change error:", err);
      toast.error(err.response?.data?.message || "Error updating password");
    } finally {
      setUpdatingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-2 text-xs text-slate-500 font-medium">Loading HOD profile details...</p>
      </div>
    );
  }

  const fullName = data ? `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim() : "HOD User";
  const initial = data?.firstName?.[0] || "H";
  const profileImgUrl = data?.profile ? getFileUrl(data.profile) : null;

  return (
    <div className="w-full space-y-6">
      {/* 🌟 HOD Profile Hero Banner */}
      <div className="bento-card p-0 bg-white border border-slate-200/80 shadow-xs overflow-hidden rounded-3xl">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center space-x-5 relative z-10">
            {profileImgUrl ? (
              <img
                src={profileImgUrl}
                alt={fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-xl"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/20">
                {initial}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                  Head of Department
                </span>
                <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 font-bold rounded-lg text-xs border border-indigo-400/30">
                  {data?.department || branch || "Department"} Dept
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{fullName}</h1>
              <p className="text-xs sm:text-sm font-semibold text-indigo-200/80 mt-0.5">HOD Employee ID: <span className="text-white font-bold font-mono">{loginid || data?.employeeId}</span></p>
            </div>
          </div>

          <button
            className={`relative z-10 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-2 ${
              showPass
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
            }`}
            onClick={() => setShowPass(!showPass)}
          >
            <FiLock className="w-4 h-4" />
            <span>{showPass ? "Cancel Password Change" : "Change Password"}</span>
          </button>
        </div>
      </div>

      {/* 🔲 Profile Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
          <div className="flex items-center space-x-2 text-indigo-600">
            <FiBookOpen className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</span>
          </div>
          <p className="font-bold text-slate-900 text-base">{data?.department || branch || "N/A"}</p>
        </div>

        <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
          <div className="flex items-center space-x-2 text-purple-600">
            <FiBriefcase className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation / Post</span>
          </div>
          <p className="font-bold text-slate-900 text-base">{data?.post || "Head of Department (HOD)"}</p>
        </div>

        <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
          <div className="flex items-center space-x-2 text-emerald-600">
            <FiPhone className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</span>
          </div>
          <p className="font-bold text-slate-900 text-base">{data?.phoneNumber || "N/A"}</p>
        </div>

        <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
          <div className="flex items-center space-x-2 text-amber-600">
            <FiMail className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
          </div>
          <p className="font-bold text-slate-900 text-sm truncate">{data?.email || `${loginid.toLowerCase()}@college.edu`}</p>
        </div>
      </div>

      {/* 🏛 Academic Credentials & Institutional Identifiers */}
      <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FiAward className="text-indigo-600" /> Institutional Identifiers & Privileges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">JNTU Faculty ID</span>
            <span className="font-bold text-slate-800 text-sm">{data?.jntuId || "N/A"}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">AICTE Faculty ID</span>
            <span className="font-bold text-slate-800 text-sm">{data?.aicteId || "N/A"}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Administrative Privileges</span>
            <span className="font-bold text-indigo-700 text-sm">Full Departmental Control & Leave Approvals</span>
          </div>
        </div>
      </div>

      {/* 🔒 Password Change Box */}
      {showPass && (
        <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FiLock className="text-indigo-600" /> Change HOD Portal Password
          </h3>
          <form className="space-y-4" onSubmit={handlePasswordUpdate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <input
                  type={showCurrentPass ? "text" : "password"}
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updatingPass}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                {updatingPass ? "Updating..." : "Confirm Password Update"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;

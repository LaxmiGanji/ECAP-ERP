import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { setUserData } from "../../redux/actions";
import { getFileUrl } from "../../utils/fileUrl";

const Profile = () => {
  const router = useLocation();
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState({ current: "", new: "" });

  useEffect(() => {
    if (!router.state?.loginid) {
      return;
    }
    const headers = { "Content-Type": "application/json" };
    axios
      .post(
        `${baseApiURL()}/transport/details/getDetails`,
        { transportId: router.state.loginid },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          const profile = response.data.user[0];
          setData(profile);
          dispatch(
            setUserData({
              fullname: `${profile.firstName} ${profile.lastName}`,
              transportId: profile.transportId,
            })
          );
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Unable to load profile.");
      });
  }, [dispatch, router.state]);

  const checkPasswordHandler = (e) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json" };
    axios
      .post(
        `${baseApiURL()}/transport/auth/login`,
        { loginid: router.state.loginid, password: password.current },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          changePasswordHandler(response.data.id);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to verify current password.");
      });
  };

  const changePasswordHandler = (id) => {
    const headers = { "Content-Type": "application/json" };
    axios
      .put(
        `${baseApiURL()}/transport/auth/update/${id}`,
        { loginid: router.state.loginid, password: password.new },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          setPassword({ current: "", new: "" });
          setShowPass(false);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to update password.");
      });
  };

  if (!data) {
    return (
      <div className="bg-white rounded-2xl shadow p-8">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const fullName = [data?.firstName, data?.middleName, data?.lastName].filter(Boolean).join(" ");
  const initial = data?.firstName?.[0] || "T";
  const profileImgUrl = data?.profile ? getFileUrl(data.profile) : null;

  return (
    <div className="w-full space-y-6">
      {data && (
        <div className="bento-card p-0 bg-white border border-slate-200/80 shadow-xs overflow-hidden rounded-3xl">
          {/* Header Banner */}
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-black shadow-lg border-2 border-white/20">
                  {initial}
                </div>
              )}
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                  Transport Incharge
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{fullName}</h1>
                <p className="text-xs sm:text-sm font-semibold text-indigo-200/80 mt-0.5">Transport ID: <span className="text-white font-bold font-mono">{data.transportId}</span></p>
              </div>
            </div>

            <button
              className={`relative z-10 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                showPass
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
              }`}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Close Password Settings" : "🔒 Change Password"}
            </button>
          </div>

          {/* Details & Password Body */}
          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-sm font-bold text-slate-900">{fullName}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transport ID</p>
                <p className="text-sm font-bold text-indigo-600 font-mono">{data.transportId}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-sm font-bold text-slate-900">+91 {data.phoneNumber || "N/A"}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2 md:col-span-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-bold text-slate-900 truncate">{data.email || "N/A"}</p>
              </div>
            </div>

            {/* Change Password Form */}
            {showPass && (
              <form
                className="bg-slate-50/80 border border-slate-200 p-6 rounded-2xl space-y-4 max-w-lg"
                onSubmit={checkPasswordHandler}
              >
                <h3 className="text-sm font-extrabold text-slate-900 mb-2">Update Account Password</h3>
                <input
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  placeholder="Current Password"
                  className="w-full"
                  required
                />
                <input
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  placeholder="New Password"
                  className="w-full"
                  required
                />
                <button
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  type="submit"
                >
                  Save New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

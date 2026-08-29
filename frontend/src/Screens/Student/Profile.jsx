import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setUserData } from "../../redux/actions";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/fileUrl";
import { FiUser, FiMail, FiPhone, FiBookOpen, FiLock, FiBriefcase, FiAward, FiFileText } from "react-icons/fi";

const Profile = () => {
  const [showPass, setShowPass] = useState(false);
  const router = useLocation();
  const [data, setData] = useState();
  const dispatch = useDispatch();
  const [password, setPassword] = useState({
    new: "",
    current: "",
  });

  const [academicFields, setAcademicFields] = useState({
    tenthPercentage: "",
    twelfthPercentage: "",
    cgpa: "",
    activeBacklogs: "0",
    resumeLink: "",
    linkedinLink: "",
  });
  const [savingAcademic, setSavingAcademic] = useState(false);

  useEffect(() => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .post(
        `${baseApiURL()}/${router.state.type}/details/getDetails`,
        { enrollmentNo: router.state.loginid },
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.success) {
          const u = response.data.user[0];
          setData(u);
          setAcademicFields({
            tenthPercentage: u.tenthPercentage ?? "",
            twelfthPercentage: u.twelfthPercentage ?? "",
            cgpa: u.cgpa ?? "",
            activeBacklogs: u.activeBacklogs ?? "0",
            resumeLink: u.resumeLink || "",
            linkedinLink: u.linkedinLink || "",
          });

          dispatch(
            setUserData({
              fullname: `${u.firstName} ${u.middleName || ''} ${u.lastName}`,
              semester: u.semester,
              enrollmentNo: u.enrollmentNo,
              branch: u.branch,
            })
          );
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [dispatch, router.state.loginid, router.state.type]);

  const saveAcademicHandler = async (e) => {
    e.preventDefault();
    if (!data || !data._id) return;
    setSavingAcademic(true);
    try {
      const res = await axios.put(
        `${baseApiURL()}/student/details/update/${data._id}`,
        academicFields,
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data.success) {
        toast.success("Academic & Placement credentials updated successfully!");
        setData({ ...data, ...academicFields });
      } else {
        toast.error(res.data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error saving credentials");
    } finally {
      setSavingAcademic(false);
    }
  };

  const checkPasswordHandler = (e) => {
    e.preventDefault();
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .post(
        `${baseApiURL()}/student/auth/login`,
        { loginid: router.state.loginid, password: password.current },
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.success) {
          changePasswordHandler(response.data.id);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Error verifying password");
        console.error(error);
      });
  };

  const changePasswordHandler = (id) => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .put(
        `${baseApiURL()}/student/auth/update/${id}`,
        { loginid: router.state.loginid, password: password.new },
        {
          headers: headers,
        }
      )
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          setPassword({ new: "", current: "" });
          setShowPass(false);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Error updating password");
        console.error(error);
      });
  };

  const fullName = [data?.firstName, data?.middleName, data?.lastName].filter(Boolean).join(" ");
  const initial = data?.firstName?.[0] || "S";
  const profileImgUrl = data?.profile ? getFileUrl(data.profile) : null;

  return (
    <div className="w-full space-y-6">
      {data && (
        <div className="space-y-6">
          {/* 🌟 Profile Identity Bento Hero Banner */}
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
                      Student Portal
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 font-bold rounded-lg text-xs border border-indigo-400/30">
                      {data.branch}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg text-xs border border-emerald-400/30">
                      Sem {data.semester}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{fullName}</h1>
                  <p className="text-xs sm:text-sm font-semibold text-indigo-200/80 mt-0.5">Enrollment No: <span className="text-white font-bold font-mono">{data.enrollmentNo}</span></p>
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

          {/* 🔲 Contact & Academic Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-600">
                <FiBookOpen className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch</span>
              </div>
              <p className="font-bold text-slate-900 text-base">{data.branch}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-600">
                <FiUser className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester</span>
              </div>
              <p className="font-bold text-slate-900 text-base">Semester {data.semester}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
              <div className="flex items-center space-x-2 text-purple-600">
                <FiPhone className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</span>
              </div>
              <p className="font-bold text-slate-900 text-base">{data.phoneNumber || 'N/A'}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
              <div className="flex items-center space-x-2 text-amber-600">
                <FiMail className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</span>
              </div>
              <p className="font-bold text-slate-900 text-sm truncate">{data.email || 'N/A'}</p>
            </div>
          </div>

          {/* 🎓 Academic & Placement Credentials Management */}
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FiBriefcase className="text-indigo-600" /> Academic & Placement Credentials
              </h3>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Managed here & auto-fetched by Placements Portal
              </span>
            </div>

            <form onSubmit={saveAcademicHandler} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    10th Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 85.5"
                    value={academicFields.tenthPercentage}
                    onChange={(e) => setAcademicFields({ ...academicFields, tenthPercentage: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    12th / Diploma Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 82.0"
                    value={academicFields.twelfthPercentage}
                    onChange={(e) => setAcademicFields({ ...academicFields, twelfthPercentage: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 7.9"
                    value={academicFields.cgpa}
                    onChange={(e) => setAcademicFields({ ...academicFields, cgpa: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Active Backlogs Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={academicFields.activeBacklogs}
                    onChange={(e) => setAcademicFields({ ...academicFields, activeBacklogs: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resume Link (GDrive / Dropbox URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={academicFields.resumeLink}
                    onChange={(e) => setAcademicFields({ ...academicFields, resumeLink: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/in/..."
                    value={academicFields.linkedinLink}
                    onChange={(e) => setAcademicFields({ ...academicFields, linkedinLink: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingAcademic}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  {savingAcademic ? "Saving..." : "Save Profile Credentials"}
                </button>
              </div>
            </form>
          </div>

          {/* 🔒 Password Change Box */}
          {showPass && (
            <div className="bento-card p-6 bg-white border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Change Portal Password</h3>
              <form className="space-y-4" onSubmit={checkPasswordHandler}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Current Password</label>
                    <input
                      type="password"
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Password</label>
                    <input
                      type="password"
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    type="submit"
                  >
                    Confirm Password Update
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { getFileUrl } from "../../utils/fileUrl";
import { FiUpload, FiUser, FiUsers, FiBookOpen, FiSave, FiCheckCircle } from "react-icons/fi";

const EditStudent = () => {
  const router = useLocation();
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load student details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.post(
          `${baseApiURL()}/student/details/getDetails`,
          { enrollmentNo: router.state.loginid },
          { headers: { "Content-Type": "application/json" } }
        );
        if (res.data.success && res.data.user.length > 0) {
          setStudent(res.data.user[0]);
          setFormData(res.data.user[0]);
        } else {
          toast.error(res.data.message || "Failed to load details");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching details");
      }
    };
    fetchDetails();
  }, [router.state.loginid]);

  // Handle text input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile picture change
  const handleFileChange = (e) => {
    setProfileFile(e.target.files[0]);
  };

  // Submit updated details
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student?._id) {
      toast.error("Student ID not found");
      return;
    }

    const form = new FormData();
    Object.keys(formData).forEach((key) => {
      form.append(key, formData[key]);
    });
    if (profileFile) {
      form.append("profile", profileFile);
    }

    try {
      setLoading(true);
      const res = await axios.put(
        `${baseApiURL()}/student/details/updateDetails/${student._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        toast.success("Profile updated successfully");
        setStudent(res.data.user || formData);
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating details");
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FiUser className="text-indigo-400" />
            <span>Edit My Details</span>
          </h1>
          <p className="text-xs md:text-sm mt-1">Update your personal contact information & profile picture</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 📸 Avatar Bento Card */}
          <div className="bento-card p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900 self-start border-l-4 border-indigo-600 pl-3">
              Profile Avatar
            </h3>
            <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex items-center justify-center transition-all hover:border-indigo-500 shadow-md">
              <img
                src={
                  profileFile
                    ? URL.createObjectURL(profileFile)
                    : getFileUrl(student.profile)
                }
                alt="Student Profile Avatar"
                className="w-full h-full object-cover"
              />
              <label htmlFor="student-avatar-input" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-xs font-semibold">
                <FiUpload className="w-5 h-5 mb-1" />
                <span>Upload New</span>
              </label>
              <input type="file" id="student-avatar-input" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-xs text-slate-500">Allowed formats: JPG, PNG. Max size 5MB.</p>
          </div>

          {/* 👤 Personal Details Bento Card */}
          <div className="bento-card p-6 lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3 flex items-center gap-2">
              <FiUser className="text-indigo-600" />
              <span>Personal Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName || ""}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                >
                  <option value="">-- Select Gender --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 👨‍👩‍👧 Parent Contact Bento Card */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3 flex items-center gap-2">
            <FiUsers className="text-indigo-600" />
            <span>Parent & Guardian Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name</label>
              <input
                type="text"
                name="FatherName"
                value={formData.FatherName || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Father's Phone Number</label>
              <input
                type="text"
                name="FatherPhoneNumber"
                value={formData.FatherPhoneNumber || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label>
              <input
                type="text"
                name="MotherName"
                value={formData.MotherName || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Phone Number</label>
              <input
                type="text"
                name="MotherPhoneNumber"
                value={formData.MotherPhoneNumber || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 🎓 Academic Profile Information (Read-Only Badges) */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3 flex items-center gap-2">
            <FiBookOpen className="text-indigo-600" />
            <span>Academic Enrollment Info (Locked)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">Enrollment No</span>
              <span className="text-xs font-bold text-indigo-600 font-mono">{student.enrollmentNo}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">Branch</span>
              <span className="text-xs font-bold text-slate-800">{student.branch}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">Semester</span>
              <span className="text-xs font-bold text-slate-800">Sem {student.semester}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-[10px] text-slate-500 uppercase font-semibold">Regulation</span>
              <span className="text-xs font-bold text-slate-800">{student.regulation || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* 🚀 Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center space-x-2 disabled:opacity-60"
          >
            <FiCheckCircle className="text-base" />
            <span>{loading ? "Updating Profile..." : "Save Updated Details"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
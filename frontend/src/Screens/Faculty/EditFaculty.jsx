import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { toast } from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { getFileUrl } from "../../utils/fileUrl";
import { FiUser, FiMail, FiPhone, FiBriefcase, FiAward, FiUploadCloud, FiCheckCircle } from "react-icons/fi";

const EditFaculty = () => {
  const router = useLocation();
  const [faculty, setFaculty] = useState(null);
  const [formData, setFormData] = useState({});
  const [profileFile, setProfileFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load faculty details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.post(
          `${baseApiURL()}/${router.state.type}/details/getDetails`,
          { employeeId: router.state.loginid },
          { headers: { "Content-Type": "application/json" } }
        );
        if (res.data.success && res.data.user.length > 0) {
          setFaculty(res.data.user[0]);
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
  }, [router.state.loginid, router.state.type]);

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
    if (!faculty?._id) {
      toast.error("Faculty ID not found");
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
        `${baseApiURL()}/faculty/details/updateDetails/${faculty._id}`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        toast.success("Profile updated successfully");
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

  if (!faculty) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading faculty details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Edit Profile Details</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Update your personal information, contact info, department & credentials</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Profile Photo</h3>
          <div className="relative group mb-4">
            <img
              src={
                profileFile
                  ? URL.createObjectURL(profileFile)
                  : getFileUrl(faculty.profile)
              }
              alt="Profile"
              className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-100 shadow-md"
            />
          </div>

          <label className="cursor-pointer px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition-colors flex items-center space-x-2">
            <FiUploadCloud className="w-4 h-4" />
            <span>Change Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
          <p className="text-[11px] text-slate-400 mt-2">JPG, PNG or WEBP up to 5MB</p>
        </div>

        {/* Form Fields Card */}
        <div className="lg:col-span-2 bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b pb-3">Personal & Academic Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                type="number"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Designation / Post</label>
              <input
                type="text"
                name="post"
                value={formData.post || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">JNTU ID</label>
              <input
                type="text"
                name="jntuId"
                value={formData.jntuId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">AICTE ID</label>
              <input
                type="text"
                name="aicteId"
                value={formData.aicteId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <FiCheckCircle className="w-4 h-4" />
              <span>{loading ? "Updating..." : "Save Profile Details"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditFaculty;

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { FiUpload, FiUser, FiBriefcase, FiCreditCard, FiCheckCircle } from "react-icons/fi";

const AddFaculty = ({ branch: lockedBranch }) => {
  const [file, setFile] = useState();
  const [branch, setBranch] = useState();
  const [previewImage, setPreviewImage] = useState("");
  const [data, setData] = useState({
    employeeId: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: lockedBranch || "",
    gender: "",
    experience: "",
    post: "",
    panCard: "",
    jntuId: "",
    aicteId: "",
  });

  const getBranchData = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    getBranchData();
    if (lockedBranch) {
      setData(prev => ({ ...prev, department: lockedBranch }));
    }
  }, [lockedBranch]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const imageUrl = URL.createObjectURL(selectedFile);
      setPreviewImage(imageUrl);
    }
  };

  const addFacultyProfile = (e) => {
    e.preventDefault();
    if (!data.employeeId || !data.firstName || !data.lastName || !data.email) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    toast.loading("Adding Faculty Member...");
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));
    formData.append("type", "profile");
    if (file) {
      formData.append("profile", file);
    }

    axios
      .post(`${baseApiURL()}/faculty/details/addDetails`, formData)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          axios
            .post(`${baseApiURL()}/faculty/auth/register`, {
              loginid: data.employeeId,
              password: data.employeeId,
            })
            .then((res) => {
              if (res.data.success) {
                toast.success(res.data.message);
                resetForm();
              } else {
                toast.error(res.data.message);
              }
            })
            .catch((error) => {
              toast.error(error.response?.data?.message || "Auth Registration Failed");
            });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Failed to add faculty");
      });
  };

  const resetForm = () => {
    setFile(null);
    setData({
      employeeId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      department: lockedBranch || "",
      gender: "",
      experience: "",
      post: "",
      panCard: "",
      jntuId: "",
      aicteId: "",
    });
    setPreviewImage("");
  };

  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FiUser className="text-indigo-400" />
            <span>Add New Faculty</span>
          </h1>
          <p className="text-xs md:text-sm mt-1">Fill in the faculty details below to initialize teaching credentials</p>
        </div>
      </div>

      <form onSubmit={addFacultyProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 📸 Photo Upload Bento Box */}
          <div className="bento-card p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900 self-start border-l-4 border-indigo-600 pl-3">
              Faculty Profile Photo
            </h3>
            <div className="relative group w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex items-center justify-center transition-all hover:border-indigo-500">
              {previewImage ? (
                <img src={previewImage} alt="Faculty Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <FiUser className="w-10 h-10 mb-1" />
                  <span className="text-[10px] font-medium">No Image</span>
                </div>
              )}
              <label htmlFor="faculty-photo" className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-xs font-semibold">
                <FiUpload className="w-5 h-5 mb-1" />
                <span>Upload</span>
              </label>
              <input type="file" id="faculty-photo" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-xs text-slate-500">Allowed formats: JPG, PNG. Max 5MB.</p>
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
                  required
                  value={data.firstName}
                  onChange={(e) => setData({ ...data, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={data.middleName}
                  onChange={(e) => setData({ ...data, middleName: e.target.value })}
                  placeholder="Enter middle name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={data.lastName}
                  onChange={(e) => setData({ ...data, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={data.employeeId}
                  onChange={(e) => setData({ ...data, employeeId: e.target.value })}
                  placeholder="e.g. FAC101"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="faculty@sphoorthy.ac.in"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={data.phoneNumber}
                  onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value })}
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

        {/* 💼 Professional Information Bento Card */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3 flex items-center gap-2">
            <FiBriefcase className="text-indigo-600" />
            <span>Professional Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Branch *</label>
              <select
                required
                disabled={!!lockedBranch}
                value={data.department}
                onChange={(e) => setData({ ...data, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              >
                <option value="">-- Select Department --</option>
                {branch && branch.map((item) => (
                  <option key={item._id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Post</label>
              <input
                type="text"
                value={data.post}
                onChange={(e) => setData({ ...data, post: e.target.value })}
                placeholder="e.g. Assistant Professor"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
              <input
                type="text"
                value={data.experience}
                onChange={(e) => setData({ ...data, experience: e.target.value })}
                placeholder="e.g. 5 Years"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 💳 Statutory Identifiers Bento Card */}
        <div className="bento-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-l-4 border-indigo-600 pl-3 flex items-center gap-2">
            <FiCreditCard className="text-indigo-600" />
            <span>Statutory & Accreditation IDs</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PAN Card Number</label>
              <input
                type="text"
                value={data.panCard}
                onChange={(e) => setData({ ...data, panCard: e.target.value })}
                placeholder="ABCDE1234F"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">JNTU Faculty ID</label>
              <input
                type="text"
                value={data.jntuId}
                onChange={(e) => setData({ ...data, jntuId: e.target.value })}
                placeholder="Enter JNTU ID"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">AICTE Faculty ID</label>
              <input
                type="text"
                value={data.aicteId}
                onChange={(e) => setData({ ...data, aicteId: e.target.value })}
                placeholder="Enter AICTE ID"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 🚀 Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center space-x-2"
          >
            <FiCheckCircle className="text-base" />
            <span>Add Faculty Member</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFaculty;

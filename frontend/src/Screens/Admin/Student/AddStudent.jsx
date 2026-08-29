import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { FiUpload, FiUser, FiBook, FiUsers } from "react-icons/fi";

const AddStudent = ({ branch: lockedBranch }) => {
  const [file, setFile] = useState();
  const [branch, setBranch] = useState();
  const [previewImage, setPreviewImage] = useState("");
  const [data, setData] = useState({
    enrollmentNo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    FatherName: "",
    MotherName: "",
    FatherPhoneNumber: "",
    MotherPhoneNumber: "",
    semester: "",
    branch: lockedBranch || "",
    batch: "",
    regulation: "",
    gender: "",
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
      setData(prev => ({ ...prev, branch: lockedBranch }));
    }
  }, [lockedBranch]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log(selectedFile);
    setFile(selectedFile);
    const imageUrl = URL.createObjectURL(selectedFile);
    console.log(imageUrl);
    setPreviewImage(imageUrl);
  };

  const addStudentProfile = (e) => {
    e.preventDefault();
    toast.loading("Adding Student");
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));
    formData.append("type", "profile");
    formData.append("profile", file);

    axios
      .post(`${baseApiURL()}/student/details/addDetails`, formData)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          axios
            .post(`${baseApiURL()}/student/auth/register`, {
              loginid: data.enrollmentNo,
              password: data.enrollmentNo,
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
              toast.error(error.response.data.message);
            });
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  const resetForm = () => {
    setFile(null);
    setData({
      enrollmentNo: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      FatherName: "",
      MotherName: "",
      FatherPhoneNumber: "",
      MotherPhoneNumber: "",
      semester: "",
      branch: "",
      batch: "",
      gender: "",
    });
    setPreviewImage("");
  };

  return (
    <div className="py-4 px-2 md:px-4 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl">
            <FiUser className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Add New Student Profile</h1>
            <p className="text-slate-500 font-medium text-xs md:text-sm">Create student record & credentials</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={addStudentProfile} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Profile Picture Bento Box (1 Column) */}
          <div className="bento-card p-6 bg-white flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FiUpload className="text-lg" />
                </div>
                <h2 className="text-base font-semibold text-slate-800">Profile Picture</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">Upload official passport size student photo</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              {previewImage ? (
                <div className="relative group">
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="w-36 h-36 object-cover rounded-2xl border-2 border-indigo-100 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">
                    ✓
                  </div>
                </div>
              ) : (
                <div className="w-36 h-36 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                  <FiUser className="text-4xl text-slate-300 mb-2" />
                  <span className="text-[11px] text-slate-400">No Photo Selected</span>
                </div>
              )}

              <div className="mt-4 w-full">
                <label htmlFor="file" className="block w-full">
                  <div className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-center cursor-pointer transition-colors text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2">
                    <FiUpload />
                    <span>{previewImage ? "Change Photo" : "Choose File"}</span>
                  </div>
                  <input
                    type="file"
                    id="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Personal Info Bento Box (2 Columns) */}
          <div className="lg:col-span-2 bento-card p-6 bg-white space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <FiUser className="text-lg" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Personal Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-xs font-medium text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstname"
                  value={data.firstName}
                  onChange={(e) => setData({ ...data, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="First name"
                />
              </div>

              <div>
                <label htmlFor="middlename" className="block text-xs font-medium text-slate-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middlename"
                  value={data.middleName}
                  onChange={(e) => setData({ ...data, middleName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="Middle name"
                />
              </div>

              <div>
                <label htmlFor="lastname" className="block text-xs font-medium text-slate-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastname"
                  value={data.lastName}
                  onChange={(e) => setData({ ...data, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="Last name"
                />
              </div>

              <div>
                <label htmlFor="enrollmentNo" className="block text-xs font-medium text-slate-700 mb-1">
                  Enrollment No / Roll No *
                </label>
                <input
                  type="text"
                  id="enrollmentNo"
                  required
                  value={data.enrollmentNo}
                  onChange={(e) => setData({ ...data, enrollmentNo: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="e.g. 21SP1A0501"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="student@sphoorthy.ac.in"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={data.phoneNumber}
                  onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="gender" className="block text-xs font-medium text-slate-700 mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Grid for Academic & Parent Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Academic Info Bento Card */}
          <div className="bento-card p-6 bg-white space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <FiBook className="text-lg" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Academic Info</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="branch" className="block text-xs font-medium text-slate-700 mb-1">
                  Branch *
                </label>
                <select
                  id="branch"
                  required
                  value={data.branch}
                  onChange={(e) => setData({ ...data, branch: e.target.value })}
                  disabled={!!lockedBranch}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors ${lockedBranch ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select branch</option>
                  {branch?.map((b) => (
                    <option value={b.name} key={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="semester" className="block text-xs font-medium text-slate-700 mb-1">
                  Semester *
                </label>
                <select
                  id="semester"
                  required
                  value={data.semester}
                  onChange={(e) => setData({ ...data, semester: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select semester</option>
                  <option value="1">1st Semester</option>
                  <option value="2">2nd Semester</option>
                  <option value="3">3rd Semester</option>
                  <option value="4">4th Semester</option>
                  <option value="5">5th Semester</option>
                  <option value="6">6th Semester</option>
                  <option value="7">7th Semester</option>
                  <option value="8">8th Semester</option>
                </select>
              </div>

              <div>
                <label htmlFor="batch" className="block text-xs font-medium text-slate-700 mb-1">
                  Batch Year *
                </label>
                <select
                  id="batch"
                  required
                  value={data.batch}
                  onChange={(e) => setData({ ...data, batch: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select batch year</option>
                  {Array.from({ length: 8 }).map((_, idx) => {
                    const year = new Date().getFullYear() - idx;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="regulation" className="block text-xs font-medium text-slate-700 mb-1">
                  Regulation *
                </label>
                <input
                  type="text"
                  id="regulation"
                  required
                  value={data.regulation}
                  onChange={(e) => setData({ ...data, regulation: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="e.g. R20"
                />
              </div>
            </div>
          </div>

          {/* Parent Info Bento Card */}
          <div className="bento-card p-6 bg-white space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <FiUsers className="text-lg" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Parent Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="FatherName" className="block text-xs font-medium text-slate-700 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  id="FatherName"
                  value={data.FatherName}
                  onChange={(e) => setData({ ...data, FatherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="Father's name"
                />
              </div>

              <div>
                <label htmlFor="MotherName" className="block text-xs font-medium text-slate-700 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  id="MotherName"
                  value={data.MotherName}
                  onChange={(e) => setData({ ...data, MotherName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="Mother's name"
                />
              </div>

              <div>
                <label htmlFor="FatherPhoneNumber" className="block text-xs font-medium text-slate-700 mb-1">
                  Father's Phone
                </label>
                <input
                  type="tel"
                  id="FatherPhoneNumber"
                  value={data.FatherPhoneNumber}
                  onChange={(e) => setData({ ...data, FatherPhoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="Father's phone"
                />
              </div>

              <div>
                <label htmlFor="MotherPhoneNumber" className="block text-xs font-medium text-slate-700 mb-1">
                  Mother's Phone
                </label>
                <input
                  type="tel"
                  id="MotherPhoneNumber"
                  value={data.MotherPhoneNumber}
                  onChange={(e) => setData({ ...data, MotherPhoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
                  placeholder="Mother's phone"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-indigo-500/20 transition-all active:scale-95"
          >
            Add Student Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;

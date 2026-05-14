import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { FiUpload, FiUser, FiBriefcase, FiCreditCard } from "react-icons/fi";


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
    const imageUrl = URL.createObjectURL(selectedFile);
    setPreviewImage(imageUrl);
  };

  const addFacultyProfile = (e) => {
    e.preventDefault();
    toast.loading("Adding Faculty");
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));
    formData.append("type", "profile");
    formData.append("profile", file);

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
      employeeId: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      department: "",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FiUser className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Add New Faculty</h1>
                <p className="text-blue-100 text-sm">Enter faculty information below</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={addFacultyProfile} className="p-8">
            <div className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiUser className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstname"
                    
                      value={data.firstName}
                      onChange={(e) => setData({ ...data, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="middlename" className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middlename"
                      value={data.middleName}
                      onChange={(e) => setData({ ...data, middleName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastname"
                     
                      value={data.lastName}
                      onChange={(e) => setData({ ...data, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      id="employeeId"
                      required
                      value={data.employeeId}
                      onChange={(e) => setData({ ...data, employeeId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter employee ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={data.email}
                      onChange={(e) => setData({ ...data, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      required
                      value={data.phoneNumber}
                      onChange={(e) => setData({ ...data, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      id="gender"
                      required
                      value={data.gender}
                      onChange={(e) => setData({ ...data, gender: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiBriefcase className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Professional Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      id="department"
                      required
                      value={data.department}
                      onChange={(e) => setData({ ...data, department: e.target.value })}
                      disabled={!!lockedBranch}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select department</option>
                      {branch?.map((branch) => (
                        <option value={branch.name} key={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="post" className="block text-sm font-medium text-gray-700 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      id="post"
                      value={data.post}
                      onChange={(e) => setData({ ...data, post: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Assistant Professor"
                    />
                  </div>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years) *
                    </label>
                    <input
                      type="number"
                      id="experience"
                      value={data.experience}
                      onChange={(e) => setData({ ...data, experience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter years of experience"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* ID Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiCreditCard className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">ID Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="panCard" className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      id="panCard"
                      value={data.panCard}
                      onChange={(e) => setData({ ...data, panCard: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter PAN card number"
                    />
                  </div>
                  <div>
                    <label htmlFor="jntuId" className="block text-sm font-medium text-gray-700 mb-2">
                      JNTUH ID
                    </label>
                    <input
                      type="text"
                      id="jntuId"
                      value={data.jntuId}
                      onChange={(e) => setData({ ...data, jntuId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter JNTUH ID"
                    />
                  </div>
                  <div>
                    <label htmlFor="aicteId" className="block text-sm font-medium text-gray-700 mb-2">
                      AICTE ID
                    </label>
                    <input
                      type="text"
                      id="aicteId"
                      value={data.aicteId}
                      onChange={(e) => setData({ ...data, aicteId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter AICTE ID"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Picture Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiUpload className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Profile Picture</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photo
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                        <div className="flex items-center justify-center space-x-2">
                          <FiUpload className="text-gray-400 text-lg" />
                          <span className="text-gray-600">
                            {previewImage ? "Change photo" : "Click to upload photo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {previewImage && (
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Profile Preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                        />
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          ✓
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Faculty
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFaculty;

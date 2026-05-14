import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { FiUpload, FiUser, FiBriefcase, FiCreditCard, FiBookOpen } from "react-icons/fi";

const AddExaminationFaculty = () => {
  const [file, setFile] = useState();
  const [branch, setBranch] = useState();
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
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
    batch: "",
  });

  // Fetch branches for dropdown
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
        console.error("Error fetching branches:", error);
        toast.error("Failed to fetch departments");
      });
  };

  useEffect(() => {
    getBranchData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFile(selectedFile);
      const imageUrl = URL.createObjectURL(selectedFile);
      setPreviewImage(imageUrl);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setData({ ...data, [id]: value });
  };

  const validateForm = () => {
    // Required fields validation
    const requiredFields = ['firstName', 'lastName', 'employeeId', 'email', 'phoneNumber', 'department', 'gender', 'post'];
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Phone number validation (10 digits, starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(data.phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number starting with 6-9");
      return false;
    }

    // Experience validation
    if (data.experience && (data.experience < 0 || data.experience > 50)) {
      toast.error("Please enter valid experience (0-50 years)");
      return false;
    }

    // Batch validation if provided
    if (data.batch) {
      const currentYear = new Date().getFullYear();
      if (data.batch < 2000 || data.batch > currentYear + 10) {
        toast.error(`Please enter a valid batch year (2000-${currentYear + 10})`);
        return false;
      }
    }

    return true;
  };

  const addExaminationFaculty = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Adding Examination Faculty...");

    // First, create credentials
    axios
      .post(`${baseApiURL()}/examination/auth/register`, {
        loginid: data.employeeId,
        password: data.employeeId,
      })
      .then((res) => {
        if (res.data.success) {
          // Then, create faculty details with profile
          const formData = new FormData();
          
          // Append all data fields individually
          formData.append("employeeId", data.employeeId);
          formData.append("firstName", data.firstName);
          formData.append("middleName", data.middleName || "");
          formData.append("lastName", data.lastName);
          formData.append("email", data.email);
          formData.append("phoneNumber", data.phoneNumber);
          formData.append("department", data.department);
          formData.append("gender", data.gender);
          formData.append("post", data.post);
          
          // Optional fields
          if (data.experience) formData.append("experience", data.experience);
          if (data.panCard) formData.append("panCard", data.panCard);
          if (data.jntuId) formData.append("jntuId", data.jntuId);
          if (data.aicteId) formData.append("aicteId", data.aicteId);
          if (data.batch) formData.append("batch", parseInt(data.batch));
          
          // Set the type for the upload middleware
          formData.append("type", "profile");
          
          // Append the file if exists
          if (file) {
            formData.append("material", file);  // TO THIS
          }

          return axios.post(`${baseApiURL()}/examination/details/addDetails`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            }
          });
        } else {
          throw new Error(res.data.message);
        }
      })
      .then((response) => {
        toast.dismiss(loadingToast);
        if (response.data.success) {
          toast.success("Examination Faculty added successfully!");
          resetForm();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        console.error("Error adding faculty:", error);
        
        if (error.response) {
          toast.error(error.response.data?.message || "Failed to add examination faculty");
        } else if (error.request) {
          toast.error("No response from server. Please check your connection.");
        } else {
          toast.error(error.message || "Failed to add examination faculty");
        }
      })
      .finally(() => {
        setLoading(false);
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
      batch: "",
    });
    setPreviewImage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FiBookOpen className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Add Examination Faculty</h1>
                <p className="text-purple-100 text-sm">Enter examination faculty information below</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={addExaminationFaculty} className="p-8">
            <div className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiUser className="text-purple-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={data.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middleName"
                      value={data.middleName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={data.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="employeeId"
                      required
                      value={data.employeeId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter employee ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used as Login ID and initial password</p>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={data.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      required
                      value={data.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                    />
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      required
                      value={data.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Year
                    </label>
                    <input
                      type="number"
                      id="batch"
                      value={data.batch}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter batch year (e.g., 2024)"
                      min="2000"
                      max={new Date().getFullYear() + 10}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiBriefcase className="text-purple-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">Professional Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="department"
                      required
                      value={data.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select department</option>
                      {branch?.map((branch) => (
                        <option value={branch.name} key={branch._id || branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="post" className="block text-sm font-medium text-gray-700 mb-2">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="post"
                      required
                      value={data.post}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="e.g., Assistant Professor"
                    />
                  </div>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      id="experience"
                      value={data.experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter years of experience"
                      min="0"
                      max="50"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              {/* ID Information Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiCreditCard className="text-purple-600 text-lg" />
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
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter PAN card number"
                      maxLength="10"
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
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter AICTE ID"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Picture Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FiUpload className="text-purple-600 text-lg" />
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
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 transition-colors cursor-pointer bg-gray-50">
                        <div className="flex items-center justify-center space-x-2">
                          <FiUpload className="text-gray-400 text-lg" />
                          <span className="text-gray-600">
                            {file ? file.name : "Click to upload photo"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                  {previewImage && (
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Profile Preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreviewImage("");
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Login Information Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Login Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">Login ID</label>
                    <p className="text-sm font-medium text-gray-900">{data.employeeId || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Initial Password</label>
                    <p className="text-sm font-medium text-gray-900">{data.employeeId || "Not set"}</p>
                    <p className="text-xs text-gray-500 mt-1">User can change password after first login</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={loading}
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Adding Faculty...</span>
                  </>
                ) : (
                  <span>Add Examination Faculty</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExaminationFaculty;
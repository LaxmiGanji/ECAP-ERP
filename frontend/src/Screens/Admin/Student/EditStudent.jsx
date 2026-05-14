import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { FiSearch, FiUpload, FiX } from "react-icons/fi";
import { getFileUrl } from "../../../utils/fileUrl";

const EditStudent = () => {
  const [file, setFile] = useState();
  const [branch, setBranch] = useState([]);
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(false);
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
    branch: "",
    batch: "",
    regulation: "",
    gender: "",
    profile: "",
    detained: false,
    passed: false,
  });
  const [id, setId] = useState("");

  const getBranchData = () => {
    const headers = {
      "Content-Type": "application/json",
    };
    axios
      .get(`${baseApiURL()}/branch/getBranch`, { headers })
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load branches");
      });
  };

  useEffect(() => {
    getBranchData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const imageUrl = URL.createObjectURL(selectedFile);
    setPreviewImage(imageUrl);
  };

  const handleDetainStudent = async () => {
    try {
      const loadingToast = toast.loading("Moving student to detained records...");
      
      const response = await axios.post(
        `${baseApiURL()}/student/detain/detain`,
        { 
          studentId: id,
          detentionReason: "Student detained via edit form"
        },
        {
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success("Student moved to detained records successfully");
        clearSearchHandler();
      } else {
        toast.error(response.data.message || "Failed to detain student");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error detaining student");
      console.error("Detain error:", error);
    }
  };

  const updateStudentProfile = async (e) => {
    e.preventDefault();
    
    // Only validate essential fields
    if (!data.firstName || !data.lastName || !data.phoneNumber || !data.enrollmentNo) {
      toast.error("First Name, Last Name, Phone Number, and Enrollment No are required");
      return;
    }

    // Check if detained checkbox was checked
    if (data.detained) {
      // Show confirmation dialog
      toast((t) => (
        <div className="text-center">
          <p className="mb-4">This will move the student to detained records and remove them from active students. Continue?</p>
          <div className="flex justify-center gap-4">
            <button 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={async () => {
                toast.dismiss(t.id);
                await handleDetainStudent();
              }}
            >
              Yes, Detain Student
            </button>
            <button 
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: 10000,
      });
      return;
    }

    // Regular update if not detained
    const loadingToast = toast.loading("Updating Student...");
    
    try {
      const formData = new FormData();
      
      // Append all fields with proper handling - allow empty strings for optional fields
      formData.append("enrollmentNo", data.enrollmentNo || "");
      formData.append("firstName", data.firstName || "");
      formData.append("middleName", data.middleName || "");
      formData.append("lastName", data.lastName || "");
      formData.append("email", data.email || "");
      formData.append("phoneNumber", data.phoneNumber || "");
      formData.append("semester", data.semester || "");
      formData.append("branch", data.branch || "");
      formData.append("batch", data.batch || "");
      formData.append("regulation", data.regulation || "");
      formData.append("gender", data.gender || "");
      
      // Parent fields - can be empty
      formData.append("FatherName", data.FatherName || "");
      formData.append("MotherName", data.MotherName || "");
      formData.append("FatherPhoneNumber", data.FatherPhoneNumber || "");
      formData.append("MotherPhoneNumber", data.MotherPhoneNumber || "");
      
      // Boolean fields
      formData.append("detained", data.detained ? "true" : "false");
      formData.append("passed", data.passed ? "true" : "false");
      
      if (file) {
        formData.append("type", "profile");
        formData.append("profile", file);
      }
      
      console.log("Sending update for ID:", id);
      
      const response = await axios.put(
        `${baseApiURL()}/student/details/updateDetails/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        toast.success(response.data.message || "Student updated successfully!");
        clearSearchHandler();
      } else {
        toast.error(response.data.message || "Failed to update student");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Update error:", error);
      
      // Enhanced error handling
      if (error.response) {
        toast.error(error.response.data?.message || `Server error: ${error.response.status}`);
        console.log("Server response:", error.response.data);
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  };

  const searchStudentHandler = (e) => {
    e.preventDefault();
    
    if (!search || search.trim() === "") {
      toast.error("Please enter an enrollment number");
      return;
    }

    setSearchActive(true);
    const loadingToast = toast.loading("Getting Student...");
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    axios
      .post(
        `${baseApiURL()}/student/details/getDetails`,
        { enrollmentNo: search.trim() },
        { headers }
      )
      .then((response) => {
        toast.dismiss(loadingToast);
        
        if (response.data.success) {
          if (!response.data.user || response.data.user.length === 0) {
            toast.error("No Student Found!");
            setSearchActive(false);
          } else {
            const student = response.data.user[0];
            toast.success(response.data.message || "Student found!");
            
            setData({
              enrollmentNo: student.enrollmentNo || "",
              firstName: student.firstName || "",
              middleName: student.middleName || "",
              lastName: student.lastName || "",
              email: student.email || "",
              phoneNumber: student.phoneNumber || "",
              FatherName: student.FatherName || "",
              MotherName: student.MotherName || "",
              FatherPhoneNumber: student.FatherPhoneNumber || "",
              MotherPhoneNumber: student.MotherPhoneNumber || "",
              semester: student.semester ? student.semester.toString() : "",
              branch: student.branch || "",
              batch: student.batch ? student.batch.toString() : "",
              regulation: student.regulation || "",
              gender: student.gender || "",
              profile: student.profile || "",
              detained: student.detained || false,
              passed: student.passed || false,
            });
            setId(student._id);
            setPreviewImage("");
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch student details");
          setSearchActive(false);
        }
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        console.error("Search error:", error);
        
        if (error.response) {
          toast.error(error.response.data?.message || `Error: ${error.response.status}`);
        } else if (error.request) {
          toast.error("No response from server. Please check your connection.");
        } else {
          toast.error("Error searching for student: " + error.message);
        }
        setSearchActive(false);
      });
  };

  const clearSearchHandler = () => {
    setSearchActive(false);
    setSearch("");
    setId("");
    setPreviewImage("");
    setFile(undefined);
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
      regulation: "",
      gender: "",
      profile: "",
      detained: false,
      passed: false,
    });
  };

  return (
    <div className="my-6 mx-auto w-full">
      <form
        className="flex justify-center items-center border-2 border-blue-500 rounded w-[40%] mx-auto"
        onSubmit={searchStudentHandler}
      >
        <input
          type="text"
          className="px-6 py-3 w-full outline-none"
          placeholder="Enter Enrollment No."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!searchActive && (
          <button className="px-4 text-2xl hover:text-blue-500" type="submit">
            <FiSearch />
          </button>
        )}
        {searchActive && (
          <button
            className="px-4 text-2xl hover:text-blue-500"
            onClick={clearSearchHandler}
            type="button"
          >
            <FiX />
          </button>
        )}
      </form>
      
      {searchActive && id && (
        <form
          onSubmit={updateStudentProfile}
          className="w-[70%] flex justify-center items-center flex-wrap gap-6 mx-auto mt-10"
        >
          <div className="w-[40%]">
            <label htmlFor="batch" className="leading-7 text-sm">
              Batch Year
            </label>
            <select
              id="batch"
              className="px-2 bg-blue-50 py-3 rounded-sm text-base w-full accent-blue-700 mt-1"
              value={data.batch}
              onChange={(e) => setData({ ...data, batch: e.target.value })}
            >
              <option value="">-- Select --</option>
              {Array.from({ length: 8 }).map((_, idx) => {
                const year = new Date().getFullYear() - idx;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="firstname" className="leading-7 text-sm">
              First Name *
            </label>
            <input
              type="text"
              id="firstname"
              required
              value={data.firstName}
              onChange={(e) => setData({ ...data, firstName: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="middlename" className="leading-7 text-sm">
              Middle Name
            </label>
            <input
              type="text"
              id="middlename"
              value={data.middleName}
              onChange={(e) => setData({ ...data, middleName: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="lastname" className="leading-7 text-sm">
              Last Name *
            </label>
            <input
              type="text"
              id="lastname"
              required
              value={data.lastName}
              onChange={(e) => setData({ ...data, lastName: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="enrollmentNo" className="leading-7 text-sm">
              Enrollment No *
            </label>
            <input
              disabled
              type="text"
              id="enrollmentNo"
              value={data.enrollmentNo}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="email" className="leading-7 text-sm">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              placeholder="Enter email address (optional)"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="phoneNumber" className="leading-7 text-sm">
              Phone Number *
            </label>
            <input
              type="text"
              id="phoneNumber"
              required
              value={data.phoneNumber}
              onChange={(e) =>
                setData({ ...data, phoneNumber: e.target.value })
              }
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="FatherName" className="leading-7 text-sm">
              Father Name (Optional)
            </label>
            <input
              type="text"
              id="FatherName"
              value={data.FatherName}
              onChange={(e) => setData({ ...data, FatherName: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              placeholder="Enter father's name (optional)"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="MotherName" className="leading-7 text-sm">
              Mother Name (Optional)
            </label>
            <input
              type="text"
              id="MotherName"
              value={data.MotherName}
              onChange={(e) => setData({ ...data, MotherName: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              placeholder="Enter mother's name (optional)"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="FatherPhoneNumber" className="leading-7 text-sm">
              Father Phone (Optional)
            </label>
            <input
              type="text"
              id="FatherPhoneNumber"
              value={data.FatherPhoneNumber}
              onChange={(e) => setData({ ...data, FatherPhoneNumber: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              placeholder="Enter father's phone (optional)"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="MotherPhoneNumber" className="leading-7 text-sm">
              Mother Phone (Optional)
            </label>
            <input
              type="text"
              id="MotherPhoneNumber"
              value={data.MotherPhoneNumber}
              onChange={(e) => setData({ ...data, MotherPhoneNumber: e.target.value })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              placeholder="Enter mother's phone (optional)"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="semester" className="leading-7 text-sm">
              Semester
            </label>
            <select
              id="semester"
              className="px-2 bg-blue-50 py-3 rounded-sm text-base w-full accent-blue-700 mt-1"
              value={data.semester}
              onChange={(e) => setData({ ...data, semester: e.target.value })}
            >
              <option value="">-- Select --</option>
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
          
          <div className="w-[40%]">
            <label htmlFor="branch" className="leading-7 text-sm">
              Branch
            </label>
            <select
              id="branch"
              className="px-2 bg-blue-50 py-3 rounded-sm text-base w-full accent-blue-700 mt-1"
              value={data.branch}
              onChange={(e) => setData({ ...data, branch: e.target.value })}
            >
              <option value="">-- Select --</option>
              {branch?.map((branch) => {
                return (
                  <option value={branch.name} key={branch.name}>
                    {branch.name}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="regulation" className="leading-7 text-sm">
              Regulation
            </label>
            <input
              type="text"
              id="regulation"
              required
              value={data.regulation}
              onChange={(e) => setData({ ...data, regulation: e.target.value.toUpperCase() })}
              className="w-full bg-blue-50 rounded border focus:border-dark-green focus:bg-secondary-light focus:ring-2 focus:ring-light-green text-base outline-none py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              placeholder="e.g. R20"
            />
          </div>
          
          <div className="w-[40%]">
            <label htmlFor="gender" className="leading-7 text-sm">
              Gender
            </label>
            <select
              id="gender"
              className="px-2 bg-blue-50 py-3 rounded-sm text-base w-full accent-blue-700 mt-1"
              value={data.gender}
              onChange={(e) => setData({ ...data, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          
          {/* Checkboxes section */}
          <div className="w-[40%] flex gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="detained"
                checked={data.detained}
                onChange={(e) => setData({ ...data, detained: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="detained" className="ml-2 text-sm text-gray-700">
                Detained
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="passed"
                checked={data.passed}
                onChange={(e) => setData({ ...data, passed: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="passed" className="ml-2 text-sm text-gray-700">
                Passed
              </label>
            </div>
          </div>

          <div className="w-[40%]">
            <label htmlFor="file" className="leading-7 text-sm">
              Select New Profile
            </label>
            <label
              htmlFor="file"
              className="px-2 bg-blue-50 py-3 rounded-sm text-base w-full flex justify-center items-center cursor-pointer"
            >
              Upload
              <span className="ml-2">
                <FiUpload />
              </span>
            </label>
            <input
              hidden
              type="file"
              id="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          {(previewImage || data.profile) && (
            <div className="w-full flex justify-center items-center">
              <img 
                src={previewImage || getFileUrl(data.profile)} 
                alt="student" 
                className="h-36 rounded-lg shadow-md"
              />
            </div>
          )}
          
          <button
            type="submit"
            className="bg-blue-500 px-6 py-3 rounded-sm mb-6 text-white hover:bg-blue-600 transition-colors"
          >
            Update Student
          </button>
        </form>
      )}
    </div>
  );
};

export default EditStudent;
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { FiSearch, FiUser, FiMail, FiPhone, FiBook, FiCalendar, FiAward } from "react-icons/fi";
import ViewStudents from "../Admin/Student/ViewStudents";
import { getFileUrl } from "../../utils/fileUrl";

const Student = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("view");
  const [data, setData] = useState({
    enrollmentNo: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    semester: "",
    branch: "",
    gender: "",
    profile: "",
    certifications: [],
  });
  const [id, setId] = useState("");
  const [marks, setMarks] = useState(null);

  const searchStudentHandler = (e) => {
    e.preventDefault();
    setId("");
    setData({
      enrollmentNo: "",
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      semester: "",
      branch: "",
      gender: "",
      profile: "",
      certifications: [],
    });
    setMarks(null);

    toast.loading("Getting Student...");
    const headers = { "Content-Type": "application/json" };

    axios
      .post(`${baseApiURL()}/student/details/getDetails`, { enrollmentNo: search }, { headers })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          const user = response.data.user[0];
          if (!user) {
            toast.error("No Student Found!");
          } else {
            toast.success(response.data.message);
            setData({
              enrollmentNo: user.enrollmentNo,
              firstName: user.firstName,
              middleName: user.middleName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              semester: user.semester,
              branch: user.branch,
              gender: user.gender,
              profile: user.profile,
              certifications: user.certifications || [],
            });
            setId(user._id);
            fetchMarks(user.enrollmentNo);
          }
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || "Error occurred");
        console.error(error);
      });
  };

  const fetchMarks = (enrollmentNo) => {
    axios
      .post(`${baseApiURL()}/marks/getMarks`, { enrollmentNo })
      .then((response) => {
        if (response.data.success) {
          setMarks(response.data.Mark[0]);
        } else {
          toast.error("Marks not available");
        }
      })
      .catch((error) => {
        toast.error("Error fetching marks");
        console.error(error);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiUser className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Student Management</h1>
                  <p className="text-blue-100 text-sm">Search and view student information</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selected === "search" 
                      ? "bg-white text-blue-600" 
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setSelected("search")}
                >
                  Search Student
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selected === "view" 
                      ? "bg-white text-blue-600" 
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setSelected("view")}
                >
                  View All Students
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {selected === "search" && (
              <div className="space-y-8">
                {/* Search Section */}
                <div className="max-w-2xl mx-auto">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Student</h2>
                    <form onSubmit={searchStudentHandler} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enrollment Number
                        </label>
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Enter enrollment number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Search Student
                      </button>
                    </form>
                  </div>
                </div>

                {/* Student Details */}
                {id && (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">
                          Student Information
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                              <p className="text-lg font-semibold text-gray-900">
                                {data.firstName} {data.middleName} {data.lastName}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment No</label>
                              <p className="text-lg font-semibold text-gray-900">{data.enrollmentNo}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <div className="flex items-center space-x-2">
                                <FiMail className="text-gray-400" />
                                <p className="text-gray-900">{data.email}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                              <div className="flex items-center space-x-2">
                                <FiPhone className="text-gray-400" />
                                <p className="text-gray-900">+91 {data.phoneNumber}</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                              <div className="flex items-center space-x-2">
                                <FiBook className="text-gray-400" />
                                <p className="text-gray-900">{data.branch}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                              <div className="flex items-center space-x-2">
                                <FiCalendar className="text-gray-400" />
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  Semester {data.semester}
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                data.gender === 'Male' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-pink-100 text-pink-800'
                              }`}>
                                {data.gender}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Certifications Section */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <div className="flex items-center space-x-2 mb-4">
                            <FiAward className="text-blue-600 text-lg" />
                            <h4 className="text-lg font-semibold text-gray-800">Certifications</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.certifications.length > 0 ? (
                              data.certifications.map((cert, index) => (
                                <a
                                  key={index}
                                  href={getFileUrl(cert)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                  <FiAward className="text-blue-600" />
                                  <span className="text-blue-700 font-medium">Certification {index + 1}</span>
                                </a>
                              ))
                            ) : (
                              <p className="text-gray-500 col-span-full">No certifications available</p>
                            )}
                          </div>
                        </div>

                        {/* Marks Section */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">Academic Marks</h4>
                          {marks ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-semibold text-gray-800 mb-2">Internal Marks</h5>
                                <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                                  {JSON.stringify(marks.internal, null, 2)}
                                </pre>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <h5 className="font-semibold text-gray-800 mb-2">External Marks</h5>
                                <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                                  {JSON.stringify(marks.external, null, 2)}
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500">No marks available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected === "view" && <ViewStudents />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student;

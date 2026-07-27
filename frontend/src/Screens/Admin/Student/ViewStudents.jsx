import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { FiDownload, FiUsers, FiSearch, FiTrash2, FiMessageSquare } from "react-icons/fi";

const ViewStudents = ({ branch: lockedBranch, onMessageParent }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [semester, setSemester] = useState("-- Select --");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const [branch, setBranch] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "-- Select --");
  const [selectedRegulation, setSelectedRegulation] = useState("-- Select --");
  const [searchTerm, setSearchTerm] = useState("");

  // Custom sorting function for enrollment numbers
  const sortEnrollmentNumbers = (students, order = 'ascending') => {
    return [...students].sort((a, b) => {
      const getSortValue = (enrollment) => {
        if (!enrollment) return '';
        
        const match = enrollment.match(/^(\d+)([A-Z]*)(\d*)([A-Z]*)$/);
        if (!match) return enrollment;
        
        const [, prefix, letters1, numbers, letters2] = match;
        
        const paddedPrefix = prefix.padStart(10, '0');
        const letters1Value = letters1 || '';
        const paddedNumbers = numbers.padStart(3, '0');
        const letters2Value = letters2 || '';
        
        return `${paddedPrefix}${letters1Value}${paddedNumbers}${letters2Value}`;
      };

      const valA = getSortValue(a.enrollmentNo);
      const valB = getSortValue(b.enrollmentNo);
      
      return order === 'ascending' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  };

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
        toast.error(error.message);
      });
  };

  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to export!");
      return;
    }

    const dataToExport = filteredStudents.map((student) => ({
      "Enrollment No": student.enrollmentNo,
      "Name": `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim(),
      "Email": student.email || '',
      "Phone": student.phoneNumber || '',
      "Father Name": student.FatherName || "Not provided",
      "Mother Name": student.MotherName || "Not provided",
      "Father Phone": student.FatherPhoneNumber || "Not provided",
      "Mother Phone": student.MotherPhoneNumber || "Not provided",
      "Semester": student.semester,
      "Branch": student.branch,
      "Gender": student.gender,
      "Section": student.section || 'Not assigned',
      "Batch": student.batch || 'Not specified',
      "Regulation": student.regulation || 'Not specified'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, `students_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel file downloaded successfully!");
  };

  useEffect(() => {
    getBranchData();
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    const headers = { "Content-Type": "application/json" };
    toast.loading("Loading students...");
    
    axios
      .get(`${baseApiURL()}/student/details/getDetails2`, { headers })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          const sortedStudents = sortEnrollmentNumbers(response.data.students, 'ascending');
          setStudents(sortedStudents);
          setFilteredStudents(sortedStudents);
          toast.success(`Loaded ${sortedStudents.length} students`);
        } else {
          toast.error(response.data.message || "Failed to load students");
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Fetch error:", error);
        toast.error(error.response?.data?.message || error.message || "Failed to load students");
      });
  };

  useEffect(() => {
    let filtered = students.filter((student) => {
      const matchesBranch = selectedBranch === "-- Select --" || student.branch === selectedBranch;
      const matchesSemester =
        semester === "-- Select --" ||
        String(student.semester) === semester;
      const matchesRegulation = selectedRegulation === "" || 
                               selectedRegulation === "-- Select --" || 
                               student.regulation === selectedRegulation;
      const matchesSearch =
        searchTerm === "" ||
        (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesBranch && matchesSemester && matchesRegulation && matchesSearch;
    });

    filtered = sortEnrollmentNumbers(filtered, sortOrder.toLowerCase());
    setFilteredStudents(filtered);
  }, [students, selectedBranch, semester, selectedRegulation, sortOrder, searchTerm]);

  // Delete student handler
  const handleDeleteStudent = async (id, enrollmentNo) => {
    if (!window.confirm(`Are you sure you want to delete student ${enrollmentNo}? This action cannot be undone.`)) {
      return;
    }
    
    const loadingToast = toast.loading(`Deleting student ${enrollmentNo}...`);
    
    try {
      const headers = { "Content-Type": "application/json" };
      
      console.log("Deleting student with ID:", id);
      console.log("Delete URL:", `${baseApiURL()}/student/details/delete/${id}`);
      
      const response = await axios.delete(
        `${baseApiURL()}/student/details/delete/${id}`,
        { headers }
      );
      
      toast.dismiss(loadingToast);
      
      if (response.data.success) {
        toast.success(`Student ${enrollmentNo} deleted successfully!`);
        
        // Update both states
        setStudents((prev) => {
          const updated = prev.filter((s) => s._id !== id);
          return sortEnrollmentNumbers(updated, sortOrder.toLowerCase());
        });
        
        setFilteredStudents((prev) => {
          const updated = prev.filter((s) => s._id !== id);
          return sortEnrollmentNumbers(updated, sortOrder.toLowerCase());
        });
      } else {
        toast.error(response.data.message || "Failed to delete student.");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Delete error:", error);
      
      if (error.response) {
        // Server responded with error
        toast.error(error.response.data?.message || `Server error: ${error.response.status}`);
        console.log("Error response:", error.response.data);
      } else if (error.request) {
        // Request made but no response
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something else happened
        toast.error("Error: " + error.message);
      }
    }
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
                  <FiUsers className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Student Management</h1>
                  <p className="text-blue-100 text-sm">View and manage student information</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                </span>
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <FiDownload className="text-sm" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Students
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, enrollment, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!!lockedBranch}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="-- Select --">All Branches</option>
                  {branch &&
                    branch.map((branch) => (
                      <option value={branch.name} key={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="-- Select --">All Semesters</option>
                  {[...Array(8).keys()].map((i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Semester {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="Ascending">Ascending (A0 → A9 → B0)</option>
                  <option value="Descending">Descending</option>
                </select>
              </div>

              {/* Regulation Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Regulation
                </label>
                <input
                  type="text"
                  placeholder="e.g. R20"
                  value={selectedRegulation}
                  onChange={(e) => setSelectedRegulation(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-8">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <FiUsers className="mx-auto text-gray-400 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-lg">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <th className="py-4 px-6 text-left font-semibold">S.No</th>
                      <th className="py-4 px-6 text-left font-semibold">Enrollment No</th>
                      <th className="py-4 px-6 text-left font-semibold">Name</th>
                      <th className="py-4 px-6 text-left font-semibold">Email</th>
                      <th className="py-4 px-6 text-left font-semibold">Phone</th>
                      <th className="py-4 px-6 text-left font-semibold">Father Name</th>
                      <th className="py-4 px-6 text-left font-semibold">Mother Name</th>
                      <th className="py-4 px-6 text-left font-semibold">Father Phone</th>
                      <th className="py-4 px-6 text-left font-semibold">Mother Phone</th>
                      <th className="py-4 px-6 text-left font-semibold">Semester</th>
                      <th className="py-4 px-6 text-left font-semibold">Branch</th>
                      <th className="py-4 px-6 text-left font-semibold">Gender</th>
                      <th className="py-4 px-6 text-left font-semibold">Section</th>
                      <th className="py-4 px-6 text-left font-semibold">Batch</th>
                      <th className="py-4 px-6 text-left font-semibold">Regulation</th>
                      <th className="py-4 px-6 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr 
                        key={student._id} 
                        className={`border-b hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">{index + 1}</td>
                        <td className="py-4 px-6 font-mono font-medium">{student.enrollmentNo}</td>
                        <td className="py-4 px-6">
                          {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || 'N/A'}
                        </td>
                        <td className="py-4 px-6">{student.email || 'N/A'}</td>
                        <td className="py-4 px-6">{student.phoneNumber || 'N/A'}</td>
                        <td className="py-4 px-6">{student.FatherName || "N/A"}</td>
                        <td className="py-4 px-6">{student.MotherName || "N/A"}</td>
                        <td className="py-4 px-6">{student.FatherPhoneNumber || "N/A"}</td>
                        <td className="py-4 px-6">{student.MotherPhoneNumber || "N/A"}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {student.semester}
                          </span>
                        </td>
                        <td className="py-4 px-6">{student.branch}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            student.gender === 'Male' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {student.gender}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            student.section ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {student.section || 'Not set'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {student.batch || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            {student.regulation || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {onMessageParent && (
                              <button
                                onClick={() => onMessageParent(student.enrollmentNo)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors text-sm font-medium shrink-0"
                                title="Message Parent"
                              >
                                <FiMessageSquare className="text-sm" />
                                Message Parent
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteStudent(student._id, student.enrollmentNo)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors text-sm font-medium shrink-0"
                              title="Delete Student"
                            >
                              <FiTrash2 className="text-sm" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudents;
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { getFileUrl } from "../../../utils/fileUrl";
import { FiUserX, FiFilter, FiRefreshCw, FiDownload, FiEye } from "react-icons/fi";

const ViewDetainStudents = () => {
  const [detainedStudents, setDetainedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch: "",
    batch: "",
    semester: "",
    regulation: ""
  });
  const [branches, setBranches] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  // Fetch branches for filter
  const getBranchData = () => {
    const headers = { "Content-Type": "application/json" };
    axios
      .get(`${baseApiURL()}/branch/getBranch`, { headers })
      .then((response) => {
        if (response.data.success) {
          setBranches(response.data.branches);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // Fetch detained students
  const fetchDetainedStudents = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.branch) params.append("branch", filters.branch);
      if (filters.batch) params.append("batch", filters.batch);
      if (filters.semester) params.append("semester", filters.semester);
      if (filters.regulation) params.append("regulation", filters.regulation);

      const response = await axios.get(
        `${baseApiURL()}/student/detain/detained?${params.toString()}`,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        setDetainedStudents(response.data.students);
      } else {
        toast.error(response.data.message || "Failed to fetch detained students");
      }
    } catch (error) {
      console.error("Error fetching detained students:", error);
      toast.error(error.response?.data?.message || "Error fetching detained students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBranchData();
    fetchDetainedStudents();
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: name === "regulation" ? value.toUpperCase() : value 
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchDetainedStudents();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ branch: "", batch: "", semester: "", regulation: "" });
    setTimeout(() => fetchDetainedStudents(), 100);
  };

  // Restore student
  const restoreStudent = async (detainId) => {
    if (!window.confirm("Are you sure you want to restore this student to the main list?")) {
      return;
    }

    setRestoringId(detainId);
    toast.loading("Restoring student...");

    try {
      const response = await axios.post(
        `${baseApiURL()}/student/detain/restore/${detainId}`,
        {},
        { headers: { "Content-Type": "application/json" } }
      );

      toast.dismiss();
      if (response.data.success) {
        toast.success("Student restored successfully");
        fetchDetainedStudents(); // Refresh list
        if (selectedStudent?._id === detainId) {
          setShowDetailsModal(false);
        }
      } else {
        toast.error(response.data.message || "Failed to restore student");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error restoring student");
    } finally {
      setRestoringId(null);
    }
  };

  // View student details
  const viewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (detainedStudents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Enrollment No",
      "Name",
      "Branch",
      "Semester",
      "Batch",
      "Regulation",
      "Gender",
      "Phone",
      "Email",
      "Detention Date",
      "Detained By"
    ];

    const csvData = detainedStudents.map(student => [
      student.enrollmentNo,
      `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim(),
      student.branch,
      student.semester,
      student.batch,
      student.regulation || 'N/A',
      student.gender || 'N/A',
      student.phoneNumber,
      student.email || 'N/A',
      new Date(student.detentionDate).toLocaleDateString(),
      student.detainedBy || 'system'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detained_students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported successfully");
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FiUserX className="text-red-500" />
          Detained Students
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({detainedStudents.length} students)
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            disabled={detainedStudents.length === 0}
          >
            <FiDownload />
            Export CSV
          </button>
          <button
            onClick={fetchDetainedStudents}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <span className="font-medium">Filters:</span>
          </div>
          
          {/* Branch Filter */}
          <select
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch._id || branch.name} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Batch Filter */}
          <select
            name="batch"
            value={filters.batch}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Batches</option>
            {Array.from({ length: 8 }).map((_, idx) => {
              const year = new Date().getFullYear() - idx;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>

          {/* Semester Filter */}
          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <option key={sem} value={sem}>{sem}th Semester</option>
            ))}
          </select>
          
          {/* Regulation Filter */}
          <input
            type="text"
            name="regulation"
            placeholder="Regulation (e.g. R20)"
            value={filters.regulation}
            onChange={handleFilterChange}
            className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Apply Filters
          </button>

          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : detainedStudents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FiUserX className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No detained students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Regulation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detention Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detainedStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={student.profile ? getFileUrl(student.profile) : "https://via.placeholder.com/40"}
                      alt={student.firstName}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40";
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {student.enrollmentNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {`${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.branch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.semester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.batch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.regulation || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(student.detentionDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewStudentDetails(student)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => restoreStudent(student._id)}
                        disabled={restoringId === student._id}
                        className={`text-green-600 hover:text-green-800 ${
                          restoringId === student._id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Restore Student"
                      >
                        {restoringId === student._id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <FiRefreshCw size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Student Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-6 mb-6">
                <img
                  src={selectedStudent.profile ? getFileUrl(selectedStudent.profile) : "https://via.placeholder.com/100"}
                  alt={selectedStudent.firstName}
                  className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/100";
                  }}
                />
                <div>
                  <h3 className="text-2xl font-bold">
                    {`${selectedStudent.firstName || ''} ${selectedStudent.middleName || ''} ${selectedStudent.lastName || ''}`.trim()}
                  </h3>
                  <p className="text-gray-600">Enrollment: {selectedStudent.enrollmentNo}</p>
                  <p className="text-gray-600">Detained on: {formatDate(selectedStudent.detentionDate)}</p>
                  <p className="text-gray-600">Detained by: {selectedStudent.detainedBy || 'system'}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Personal Information</label>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Gender:</span> {selectedStudent.gender || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedStudent.phoneNumber}</p>
                    <p><span className="font-medium">Email:</span> {selectedStudent.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Academic Information</label>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Branch:</span> {selectedStudent.branch}</p>
                    <p><span className="font-medium">Semester:</span> {selectedStudent.semester}</p>
                    <p><span className="font-medium">Batch:</span> {selectedStudent.batch}</p>
                    <p><span className="font-medium">Regulation:</span> {selectedStudent.regulation || 'N/A'}</p>
                    <p><span className="font-medium">Section:</span> {selectedStudent.section || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Family Information</label>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Father's Name:</span> {selectedStudent.FatherName || 'N/A'}</p>
                    <p><span className="font-medium">Father's Phone:</span> {selectedStudent.FatherPhoneNumber || 'N/A'}</p>
                    <p><span className="font-medium">Mother's Name:</span> {selectedStudent.MotherName || 'N/A'}</p>
                    <p><span className="font-medium">Mother's Phone:</span> {selectedStudent.MotherPhoneNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Books & Transport</label>
                  <div className="mt-2 space-y-2">
                    <p><span className="font-medium">Issued Books:</span> {selectedStudent.books?.filter(b => b.status === 'issued').length || 0}</p>
                    <p><span className="font-medium">Transport:</span> {selectedStudent.transport?.routeName || 'Not assigned'}</p>
                    <p><span className="font-medium">Bus Number:</span> {selectedStudent.transport?.busNumber || 'N/A'}</p>
                    <p><span className="font-medium">Seat Number:</span> {selectedStudent.transport?.seatNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Issued Books Section */}
              {selectedStudent.books?.filter(b => b.status === 'issued').length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500 font-medium">Currently Issued Books</label>
                  <div className="mt-2">
                    {selectedStudent.books
                      .filter(b => b.status === 'issued')
                      .map((book, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span>Book ID: {book.bookId}</span>
                          <span className="text-sm text-gray-500">
                            Issued: {new Date(book.issueDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {selectedStudent.certifications?.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500 font-medium">Certifications</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedStudent.certifications.map((cert, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {cert.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => restoreStudent(selectedStudent._id)}
                  disabled={restoringId === selectedStudent._id}
                  className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors ${
                    restoringId === selectedStudent._id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {restoringId === selectedStudent._id ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Restoring...
                    </span>
                  ) : (
                    'Restore Student'
                  )}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDetainStudents;
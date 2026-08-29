import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import { getFileUrl } from "../../../utils/fileUrl";
import { sortEnrollmentNo } from "../../../utils/enrollmentSorter";
import { 
  FiUserX, 
  FiFilter, 
  FiRefreshCw, 
  FiDownload, 
  FiEye, 
  FiGrid, 
  FiList, 
  FiSearch,
  FiRotateCcw,
  FiUser
} from "react-icons/fi";

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
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [searchTerm, setSearchTerm] = useState("");

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
        const studentList = response.data.students || [];
        studentList.sort(sortEnrollmentNo);
        setDetainedStudents(studentList);
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
    setSearchTerm("");
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
        toast.success("Student restored successfully!");
        fetchDetainedStudents(); // Refresh list
      } else {
        toast.error(response.data.message || "Failed to restore student");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Error restoring student:", error);
      toast.error(error.response?.data?.message || "Error restoring student");
    } finally {
      setRestoringId(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (detainedStudents.length === 0) {
      toast.error("No detained students to export!");
      return;
    }

    const headers = [
      "Enrollment No", "Name", "Branch", "Semester", "Section", "Batch",
      "Detain Reason", "Detained Date", "Detained By", "Attendance %", "Backlogs"
    ];

    const csvData = detainedStudents.map(student => [
      student.enrollmentNo || '',
      `"${student.studentName || ''}"`,
      student.branch || '',
      student.semester || '',
      student.section || '',
      student.batch || '',
      `"${student.reason || ''}"`,
      student.detainedDate ? new Date(student.detainedDate).toLocaleDateString() : '',
      `"${student.detainedBy || ''}"`,
      student.attendancePercentage || 'N/A',
      student.activeBacklogs || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `detained_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully!");
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

  // Filtered by local search term
  const displayedStudents = detainedStudents.filter(student => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(term)) ||
      (student.studentName && student.studentName.toLowerCase().includes(term)) ||
      (student.branch && student.branch.toLowerCase().includes(term)) ||
      (student.reason && student.reason.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full space-y-6 relative pb-16">
      
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            <FiUserX className="text-rose-600 text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Detained Students Directory
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                {detainedStudents.length} Students
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-0.5">Manage, filter and review detained student academic records</p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Dual View Switcher */}
          <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-rose-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiGrid className="text-sm" />
              <span className="hidden sm:inline">Bento Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table" ? "bg-white text-rose-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiList className="text-sm" />
              <span className="hidden sm:inline">Compact Table</span>
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
            disabled={detainedStudents.length === 0}
          >
            <FiDownload />
            Export CSV
          </button>
          <button
            onClick={fetchDetainedStudents}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* 🔲 Filter & Search Bento Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Local Search Input */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, enrollment no, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Branch Filter */}
          <select
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b._id || b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Semester Filter */}
          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <option key={sem} value={sem}>{sem}th Semester</option>
            ))}
          </select>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 📦 Main Dual View Content */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-rose-600 border-r-transparent"></div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Loading detained students...</p>
        </div>
      ) : displayedStudents.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white border border-slate-200">
          <FiUserX className="mx-auto text-slate-300 text-4xl mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Detained Students Found</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">There are no student records currently marked as detained.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* 🔲 Bento Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedStudents.map((student) => (
            <div
              key={student._id}
              className="bento-card p-6 bg-white border border-rose-200/80 hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header Row: Student Info */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getFileUrl(student.studentId?.profile)}
                      alt={student.studentName}
                      className="w-12 h-12 rounded-xl object-cover border border-rose-100 bg-rose-50 shadow-xs"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center font-bold text-base shadow-xs" style={{ display: 'none' }}>
                      <FiUser />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {student.studentName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Enrollment: <span className="font-bold text-rose-600">{student.enrollmentNo}</span></p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-lg text-xs border border-rose-100">
                    Detained
                  </span>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-slate-400 font-medium block">Branch</span>
                    <span className="font-bold text-slate-800 block truncate">{student.branch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Semester</span>
                    <span className="font-bold text-slate-800 block">Sem {student.semester}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Section</span>
                    <span className="font-bold text-slate-800 block">Sec {student.section || 'A'}</span>
                  </div>
                </div>

                {/* Reason & Detain Notes */}
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs space-y-1">
                  <span className="font-bold text-rose-800 block">Detain Reason:</span>
                  <p className="text-slate-700 leading-relaxed font-medium line-clamp-2">{student.reason || 'No specific reason provided'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowDetailsModal(true);
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FiEye /> View Details
                </button>
                <button
                  onClick={() => restoreStudent(student._id)}
                  disabled={restoringId === student._id}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  <FiRotateCcw /> Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 📋 Compact Table View */
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
          <table className="min-w-[1200px] w-full text-left">
            <thead>
              <tr>
                <th className="py-3 px-4">Enrollment No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Detain Reason</th>
                <th className="py-3 px-4">Detained Date</th>
                <th className="py-3 px-4">Detained By</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student, index) => (
                <tr key={student._id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="font-bold text-xs text-rose-600 py-3.5 px-4">{student.enrollmentNo}</td>
                  <td className="font-bold text-sm text-slate-900 py-3.5 px-4">{student.studentName}</td>
                  <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{student.branch}</td>
                  <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">Sem {student.semester}</td>
                  <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{student.section || 'A'}</td>
                  <td className="text-xs text-slate-600 py-3.5 px-4 truncate max-w-xs">{student.reason}</td>
                  <td className="text-xs text-slate-500 py-3.5 px-4">{formatDate(student.detainedDate)}</td>
                  <td className="text-xs text-slate-600 py-3.5 px-4">{student.detainedBy || 'Admin'}</td>
                  <td className="py-3.5 px-4 flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDetailsModal(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button
                      onClick={() => restoreStudent(student._id)}
                      disabled={restoringId === student._id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1"
                    >
                      <FiRotateCcw /> Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bento-card p-6 bg-white border border-slate-200 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Detained Student Profile Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-sm">
                  {selectedStudent.studentName?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedStudent.studentName}</h4>
                  <p className="text-slate-500 font-medium">Enrollment: {selectedStudent.enrollmentNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium block">Branch</span>
                  <span className="font-bold text-slate-800">{selectedStudent.branch}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Semester</span>
                  <span className="font-bold text-slate-800">Sem {selectedStudent.semester}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Section</span>
                  <span className="font-bold text-slate-800">Section {selectedStudent.section || 'A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Batch</span>
                  <span className="font-bold text-slate-800">{selectedStudent.batch || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl space-y-1">
                <span className="font-bold text-rose-800 block">Detain Reason</span>
                <p className="text-slate-700 font-medium leading-relaxed">{selectedStudent.reason || 'No specific reason provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-500 font-medium pt-1">
                <div>
                  <span>Detained Date: </span>
                  <span className="font-bold text-slate-800">{formatDate(selectedStudent.detainedDate)}</span>
                </div>
                <div>
                  <span>Detained By: </span>
                  <span className="font-bold text-slate-800">{selectedStudent.detainedBy || 'Admin'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => restoreStudent(selectedStudent._id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <FiRotateCcw /> Restore Student
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDetainStudents;
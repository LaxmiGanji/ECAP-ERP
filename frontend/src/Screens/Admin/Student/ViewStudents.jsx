import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { 
  FiDownload, 
  FiUsers, 
  FiSearch, 
  FiTrash2, 
  FiMessageSquare, 
  FiGrid, 
  FiList, 
  FiSliders, 
  FiX, 
  FiMoreVertical, 
  FiMail, 
  FiPhone, 
  FiBookOpen, 
  FiLayers, 
  FiPlus, 
  FiFilter
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";

import { sortEnrollmentNo } from "../../../utils/enrollmentSorter";

const ViewStudents = ({ branch: lockedBranch, onMessageParent }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [semester, setSemester] = useState("-- Select --");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const [branch, setBranch] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "-- Select --");
  const [selectedRegulation, setSelectedRegulation] = useState("-- Select --");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active"); // "All", "Active", "Graduated"
  const [selectedStudents, setSelectedStudents] = useState([]);

  // UI Interactive States
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Custom sorting function for enrollment numbers
  const sortEnrollmentNumbers = (studentsList, order = 'ascending') => {
    const sorted = [...studentsList].sort(sortEnrollmentNo);
    return order === 'ascending' ? sorted : sorted.reverse();
  };

  const getBranchData = () => {
    const headers = { "Content-Type": "application/json" };
    axios
      .get(`${baseApiURL()}/branch/getBranch`, { headers })
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        }
      })
      .catch((error) => console.error(error));
  };

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
        toast.error(error.response?.data?.message || error.message || "Failed to load students");
      });
  };

  useEffect(() => {
    getBranchData();
    fetchStudents();
  }, []);

  useEffect(() => {
    let filtered = students.filter((student) => {
      const matchesBranch = selectedBranch === "-- Select --" || student.branch === selectedBranch;
      const matchesSemester = semester === "-- Select --" || String(student.semester) === semester;
      const matchesRegulation = selectedRegulation === "" || selectedRegulation === "-- Select --" || student.regulation === selectedRegulation;
      const matchesSearch =
        searchTerm === "" ||
        (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && !student.isGraduated) ||
        (statusFilter === "Graduated" && student.isGraduated);

      return matchesBranch && matchesSemester && matchesRegulation && matchesSearch && matchesStatus;
    });

    filtered = sortEnrollmentNumbers(filtered, sortOrder.toLowerCase());
    setFilteredStudents(filtered);
  }, [students, selectedBranch, semester, selectedRegulation, sortOrder, searchTerm, statusFilter]);

  const handleDeleteStudent = async (id, enrollmentNo) => {
    if (!window.confirm(`Delete student ${enrollmentNo}? This action cannot be undone.`)) return;
    const loadingToast = toast.loading(`Deleting ${enrollmentNo}...`);
    try {
      const response = await axios.delete(`${baseApiURL()}/student/details/delete/${id}`, {
        headers: { "Content-Type": "application/json" }
      });
      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success(`Student ${enrollmentNo} deleted!`);
        setStudents((prev) => prev.filter((s) => s._id !== id));
        setActiveMenuId(null);
      } else {
        toast.error(response.data.message || "Failed to delete student.");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || "Delete failed.");
    }
  };

  const toggleStudentSelect = (enrollmentNo) => {
    setSelectedStudents((prev) =>
      prev.includes(enrollmentNo) ? prev.filter((e) => e !== enrollmentNo) : [...prev, enrollmentNo]
    );
  };

  const handleGraduateSelected = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Select at least one student to graduate.");
      return;
    }
    if (!window.confirm(`Graduate ${selectedStudents.length} selected student(s)?`)) return;
    const loadingToast = toast.loading("Processing graduation...");
    try {
      const response = await axios.post(
        `${baseApiURL()}/student/details/graduate`,
        { enrollmentNos: selectedStudents },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedStudents([]);
        fetchStudents();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to graduate students.");
    }
  };

  const downloadExcel = () => {
    if (filteredStudents.length === 0) {
      toast.error("No students to export!");
      return;
    }
    const dataToExport = filteredStudents.map((student) => ({
      "Enrollment No": student.enrollmentNo,
      "Name": `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim(),
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
    const blobData = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blobData, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel downloaded!");
  };

  return (
    <div className="w-full space-y-6 relative pb-16">
      
      {/* Top Banner Control Header */}
      <div className="bento-header-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
            <FiUsers className="text-indigo-600 text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Student Directory</h1>
            <p className="text-slate-500 font-medium text-xs mt-0.5">Manage, filter and review student academic records</p>
          </div>
        </div>

        {/* View Switcher & Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dual View Segmented Switcher */}
          <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiGrid className="text-sm" />
              <span className="hidden sm:inline">Bento Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiList className="text-sm" />
              <span className="hidden sm:inline">Compact Table</span>
            </button>
          </div>

          {/* Slide-over Filter Sheet Trigger */}
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <FiSliders className="text-indigo-400" />
            <span>Filter Sheet</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={downloadExcel}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
          >
            <FiDownload />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Graduation action */}
          {selectedStudents.length > 0 && (
            <button
              onClick={handleGraduateSelected}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3.5 py-2 rounded-xl transition-all font-semibold shadow-sm animate-pulse"
            >
              <FaGraduationCap />
              <span>Graduate ({selectedStudents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Search & Summary Bar */}
      <div className="bento-card p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900">{filteredStudents.length}</strong> of {students.length} students</span>
          {(selectedBranch !== "-- Select --" || semester !== "-- Select --" || statusFilter !== "Active") && (
            <button 
              onClick={() => { setSelectedBranch("-- Select --"); setSemester("-- Select --"); setStatusFilter("Active"); setSearchTerm(""); }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Rendering: Dual View Mode Switch */}
      {filteredStudents.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white space-y-3">
          <FiUsers className="mx-auto text-4xl text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">No Student Records Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">Try broadening your search query or adjust filters in the slide-over Filter Sheet.</p>
        </div>
      ) : viewMode === "grid" ? (
        
        /* 🌟 BENTO CARD GRID VIEW (No Horizontal Scroll Needed) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const fullName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim() || "N/A";
            return (
              <div 
                key={student._id} 
                className="bento-card p-5 bg-white border border-slate-200 hover:border-indigo-300 relative flex flex-col justify-between space-y-4 group transition-all"
              >
                {/* Header & Checkbox */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                      {student.firstName ? student.firstName[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{fullName}</h3>
                      <p className="text-[11px] font-mono text-indigo-600 font-semibold">{student.enrollmentNo}</p>
                    </div>
                  </div>

                  {/* Three-Dots Menu Popover */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === student._id ? null : student._id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <FiMoreVertical />
                    </button>

                    {activeMenuId === student._id && (
                      <div className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-slate-700 space-y-1">
                        {onMessageParent && (
                          <button
                            onClick={() => { onMessageParent(student.enrollmentNo); setActiveMenuId(null); }}
                            className="w-full px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2 text-left"
                          >
                            <FiMessageSquare className="text-indigo-500" />
                            <span>Message Parent</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteStudent(student._id, student.enrollmentNo)}
                          className="w-full px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 flex items-center space-x-2 text-left text-rose-600"
                        >
                          <FiTrash2 />
                          <span>Delete Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges & Details */}
                <div className="space-y-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Branch & Sem</span>
                    <span className="font-semibold text-slate-800">{student.branch} • Sem {student.semester}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Regulation</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold text-[10px]">{student.regulation || "R20"}</span>
                  </div>

                  {student.email && (
                    <div className="flex items-center space-x-1.5 text-slate-500 truncate pt-1">
                      <FiMail className="text-slate-400 shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}

                  {student.phoneNumber && (
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <FiPhone className="text-slate-400 shrink-0" />
                      <span>{student.phoneNumber}</span>
                    </div>
                  )}
                </div>

                {/* Footer Checkbox / Graduation Status */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {student.isGraduated ? (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                      <span>🎓 Alumni</span>
                    </span>
                  ) : (
                    <label className="flex items-center space-x-2 cursor-pointer text-slate-600 text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.enrollmentNo)}
                        onChange={() => toggleStudentSelect(student.enrollmentNo)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Select for Graduation</span>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* 📋 FULL HORIZONTAL SCROLL DATA TABLE VIEW */
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
          <table className="min-w-[1600px] w-full text-left">
            <thead>
              <tr>
                <th className="py-3 px-4">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents(filteredStudents.filter(s => !s.isGraduated).map(s => s.enrollmentNo));
                      } else {
                        setSelectedStudents([]);
                      }
                    }}
                    checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.filter(s => !s.isGraduated).length}
                    className="rounded"
                  />
                </th>
                <th>S.No</th>
                <th>Enrollment No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Father Name</th>
                <th>Mother Name</th>
                <th>Father Phone</th>
                <th>Mother Phone</th>
                <th>Semester</th>
                <th>Branch</th>
                <th>Gender</th>
                <th>Section</th>
                <th>Batch</th>
                <th>Regulation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr 
                  key={student._id} 
                  className={`hover:bg-slate-50 transition-colors ${
                    student.isGraduated ? 'bg-amber-50/60' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  <td className="py-3 px-4">
                    {!student.isGraduated && (
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.enrollmentNo)}
                        onChange={() => toggleStudentSelect(student.enrollmentNo)}
                        className="rounded"
                      />
                    )}
                  </td>
                  <td className="font-medium text-xs text-slate-500">{index + 1}</td>
                  <td className="font-mono font-semibold text-xs text-indigo-600">
                    <span>{student.enrollmentNo}</span>
                    {student.isGraduated && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        🎓 Alumni
                      </span>
                    )}
                  </td>
                  <td className="font-medium text-slate-900 text-xs">
                    {[student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ') || 'N/A'}
                  </td>
                  <td className="text-xs text-slate-600">{student.email || 'N/A'}</td>
                  <td className="text-xs text-slate-600">{student.phoneNumber || 'N/A'}</td>
                  <td className="text-xs text-slate-600">{student.FatherName || "N/A"}</td>
                  <td className="text-xs text-slate-600">{student.MotherName || "N/A"}</td>
                  <td className="text-xs text-slate-600">{student.FatherPhoneNumber || "N/A"}</td>
                  <td className="text-xs text-slate-600">{student.MotherPhoneNumber || "N/A"}</td>
                  <td className="text-xs font-semibold text-slate-700">Sem {student.semester}</td>
                  <td className="text-xs text-slate-600">{student.branch}</td>
                  <td className="text-xs font-medium text-slate-700">{student.gender || 'N/A'}</td>
                  <td className="text-xs text-slate-600">{student.section || 'Not set'}</td>
                  <td className="text-xs font-medium text-slate-700">{student.batch || 'N/A'}</td>
                  <td className="text-xs">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">{student.regulation || 'N/A'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {onMessageParent && (
                        <button
                          onClick={() => onMessageParent(student.enrollmentNo)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1"
                          title="Message Parent"
                        >
                          <FiMessageSquare className="text-xs" />
                          <span>Message</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteStudent(student._id, student.enrollmentNo)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1"
                        title="Delete Student"
                      >
                        <FiTrash2 className="text-xs" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 💬 SLIDE-OVER FILTER SHEET DRAWER */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFilterSheetOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col justify-between p-6 z-10 space-y-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center space-x-2">
                  <FiSliders className="text-indigo-600 text-lg" />
                  <h2 className="text-lg font-bold text-slate-900">Filter Student Records</h2>
                </div>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Branch Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    disabled={!!lockedBranch}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="-- Select --">All Branches</option>
                    {branch?.map((b) => (
                      <option value={b.name} key={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Semester Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="-- Select --">All Semesters</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={String(s)}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="All">All Students</option>
                    <option value="Active">Active Students Only</option>
                    <option value="Graduated">Graduated / Alumni Only</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Sort Order</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    <option value="Ascending">Ascending (Roll No)</option>
                    <option value="Descending">Descending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
              <button
                onClick={() => {
                  setSelectedBranch("-- Select --");
                  setSemester("-- Select --");
                  setStatusFilter("Active");
                  setSearchTerm("");
                }}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-2">
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-indigo-500/30 transition-all hover:scale-110 active:scale-95"
          title="Open Filter Sheet"
        >
          <FiFilter className="text-lg" />
        </button>
      </div>

    </div>
  );
};

export default ViewStudents;
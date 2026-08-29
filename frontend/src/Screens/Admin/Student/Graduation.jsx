import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { 
  FiAward, 
  FiSearch, 
  FiCheckSquare, 
  FiSquare, 
  FiGrid, 
  FiList, 
  FiUserCheck, 
  FiUsers, 
  FiAlertCircle,
  FiFilter,
  FiUser
} from "react-icons/fi";
import { getFileUrl } from "../../../utils/fileUrl";
import { sortEnrollmentNo } from "../../../utils/enrollmentSorter";

const Graduation = ({ branch: lockedBranch }) => {
  const [activeTab, setActiveTab] = useState("eligible"); // 'eligible' or 'graduated'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "-- Select --");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedRegulation, setSelectedRegulation] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [graduating, setGraduating] = useState(false);
  const [branches, setBranches] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState("8"); // Default to 8th Semester

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${baseApiURL()}/branch/getBranch`);
        if (res.data.success) {
          setBranches(res.data.branches || []);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch all students for graduation evaluation
  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
      const studentList = res.data.students || res.data.user || [];
      if (res.data.success) {
        setStudents(studentList);
      } else {
        toast.error("Failed to load student records");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      toast.error("Error loading students list");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreStudent = async (enrollmentNo) => {
    if (!window.confirm(`Are you sure you want to restore student ${enrollmentNo} back to 8th Semester active status?`)) {
      return;
    }
    try {
      const res = await axios.post(`${baseApiURL()}/student/details/ungraduate`, { enrollmentNo });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchStudentsData();
      } else {
        toast.error(res.data.message || "Failed to restore student");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error restoring student to 8th semester");
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  // Extract available unique batches (sorted descending)
  const availableBatches = Array.from(
    new Set(students.map((s) => s.batch).filter(Boolean))
  ).sort((a, b) => b - a);

  // Extract available regulations (scoped by selected batch if a batch is picked)
  const availableRegulations = Array.from(
    new Set(
      students
        .filter((s) => selectedBatch === "All" || String(s.batch) === String(selectedBatch))
        .map((s) => (s.regulation ? String(s.regulation).toUpperCase() : null))
        .filter(Boolean)
    )
  ).sort();

  // Auto-fetch & auto-select regulation whenever batch is changed
  const handleBatchChange = (batchVal) => {
    setSelectedBatch(batchVal);
    if (batchVal === "All") {
      setSelectedRegulation("All");
    } else {
      // Find students matching the selected batch
      const batchStudents = students.filter((s) => String(s.batch) === String(batchVal));
      if (batchStudents.length > 0) {
        // Count frequency of regulations for this batch
        const regCounts = {};
        batchStudents.forEach((s) => {
          if (s.regulation) {
            const reg = String(s.regulation).toUpperCase();
            regCounts[reg] = (regCounts[reg] || 0) + 1;
          }
        });
        const sortedRegs = Object.keys(regCounts).sort((a, b) => regCounts[b] - regCounts[a]);
        if (sortedRegs.length > 0) {
          setSelectedRegulation(sortedRegs[0]);
        } else {
          setSelectedRegulation("All");
        }
      } else {
        setSelectedRegulation("All");
      }
    }
  };

  // Filter students for eligible tab (Sem 8 or selected semester)
  const eligibleSem8Students = students.filter((s) => {
    const notGraduated = !s.isGraduated;
    const matchesSem = selectedSemester === "All" || String(s.semester) === String(selectedSemester);
    const matchesBranch = selectedBranch === "-- Select --" || s.branch === selectedBranch;
    const matchesBatch = selectedBatch === "All" || String(s.batch) === String(selectedBatch);
    const matchesRegulation =
      selectedRegulation === "All" ||
      (s.regulation && String(s.regulation).toUpperCase() === String(selectedRegulation).toUpperCase());
    const matchesSearch =
      searchTerm === "" ||
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (`${s.firstName || ""} ${s.middleName || ""} ${s.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.branch && s.branch.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.batch && String(s.batch).includes(searchTerm)) ||
      (s.regulation && s.regulation.toLowerCase().includes(searchTerm.toLowerCase()));

    return notGraduated && matchesSem && matchesBranch && matchesBatch && matchesRegulation && matchesSearch;
  }).sort(sortEnrollmentNo);

  // Filter already graduated students for graduated tab
  const graduatedStudents = students.filter((s) => {
    const isGraduated = !!s.isGraduated;
    const matchesBranch = selectedBranch === "-- Select --" || s.branch === selectedBranch;
    const matchesBatch = selectedBatch === "All" || String(s.batch) === String(selectedBatch);
    const matchesRegulation =
      selectedRegulation === "All" ||
      (s.regulation && String(s.regulation).toUpperCase() === String(selectedRegulation).toUpperCase());
    const matchesSearch =
      searchTerm === "" ||
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (`${s.firstName || ""} ${s.middleName || ""} ${s.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.branch && s.branch.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.batch && String(s.batch).includes(searchTerm)) ||
      (s.regulation && s.regulation.toLowerCase().includes(searchTerm.toLowerCase()));

    return isGraduated && matchesBranch && matchesBatch && matchesRegulation && matchesSearch;
  }).sort(sortEnrollmentNo);

  // Handle select single student
  const toggleSelectStudent = (enrollmentNo) => {
    if (selectedEnrollments.includes(enrollmentNo)) {
      setSelectedEnrollments(selectedEnrollments.filter(e => e !== enrollmentNo));
    } else {
      setSelectedEnrollments([...selectedEnrollments, enrollmentNo]);
    }
  };

  // Handle select all eligible Sem 8 students
  const toggleSelectAll = () => {
    if (selectedEnrollments.length === eligibleSem8Students.length && eligibleSem8Students.length > 0) {
      setSelectedEnrollments([]);
    } else {
      setSelectedEnrollments(eligibleSem8Students.map(s => s.enrollmentNo));
    }
  };

  // Trigger Graduation API
  const handleGraduateStudents = async (enrollmentList) => {
    if (!enrollmentList || enrollmentList.length === 0) {
      toast.error("Please select at least one Semester 8 student to graduate!");
      return;
    }

    if (!window.confirm(`Are you sure you want to graduate ${enrollmentList.length} selected Sem 8 student(s)? This will create Alumni credentials.`)) {
      return;
    }

    setGraduating(true);
    const loadingToast = toast.loading(`Graduating ${enrollmentList.length} student(s)...`);

    try {
      const res = await axios.post(
        `${baseApiURL()}/student/details/graduateStudents`,
        { enrollmentNos: enrollmentList },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.dismiss(loadingToast);

      if (res.data.success) {
        toast.success(res.data.message || "Students graduated successfully!");
        setSelectedEnrollments([]);
        fetchStudentsData(); // Refresh list
        setActiveTab("graduated"); // Move to graduated view
      } else {
        toast.error(res.data.message || "Graduation process failed");
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Graduation error:", err);
      toast.error(err.response?.data?.message || "Error processing graduation");
    } finally {
      setGraduating(false);
    }
  };

  return (
    <div className="w-full space-y-6 relative pb-16">
      
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl text-indigo-600">
            <FiAward className="text-2xl" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Graduation & Alumni Management
            </h1>
            <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5">
              Only Semester 8 students are eligible for graduation to Alumni status
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2">
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
        </div>
      </div>

      {/* 🔲 Bento Navigation Tabs */}
      <div className="bento-card p-1.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("eligible")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "eligible"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <FiUsers className="w-4 h-4" />
            <span>Eligible Semester 8 Students</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
              {eligibleSem8Students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("graduated")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "graduated"
                ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <FiUserCheck className="w-4 h-4 text-emerald-600" />
            <span>Graduated Alumni Records</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
              {graduatedStudents.length}
            </span>
          </button>
        </div>

        {/* Info Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 font-semibold">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Strict Policy: Only Semester 8 students can be graduated</span>
        </div>
      </div>

      {/* 🔲 Filter & Search Controls */}
      <div className="bento-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search name, enrollment, batch, reg..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Department / Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!!lockedBranch}
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none ${lockedBranch ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              <option value="-- Select --">All Branches</option>
              {branches.map((b) => (
                <option key={b._id || b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            >
              <option value="All">All Batches</option>
              {availableBatches.map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>

          {/* Regulation Filter (Auto-fetches based on Batch) */}
          <div>
            <select
              value={selectedRegulation}
              onChange={(e) => setSelectedRegulation(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            >
              <option value="All">All Regulations</option>
              {availableRegulations.map((reg) => (
                <option key={reg} value={reg}>
                  Regulation {reg}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            >
              <option value="8">Semester 8 (Eligible)</option>
              <option value="All">All Semesters</option>
              <option value="7">Semester 7</option>
              <option value="6">Semester 6</option>
              <option value="5">Semester 5</option>
              <option value="4">Semester 4</option>
              <option value="3">Semester 3</option>
              <option value="2">Semester 2</option>
              <option value="1">Semester 1</option>
            </select>
          </div>
        </div>

        {/* Action Triggers for Eligible Tab */}
        {activeTab === "eligible" && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={toggleSelectAll}
              disabled={eligibleSem8Students.length === 0}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-200 disabled:opacity-50"
            >
              {selectedEnrollments.length === eligibleSem8Students.length && eligibleSem8Students.length > 0 ? (
                <FiCheckSquare className="text-indigo-600 w-4 h-4" />
              ) : (
                <FiSquare className="text-slate-400 w-4 h-4" />
              )}
              <span>Select All ({eligibleSem8Students.length})</span>
            </button>

            <button
              onClick={() => handleGraduateStudents(selectedEnrollments)}
              disabled={graduating || selectedEnrollments.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiAward className="w-4 h-4" />
              <span>Graduate Selected ({selectedEnrollments.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* 📦 Main Dual View Content */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Evaluating graduation eligibility...</p>
        </div>
      ) : activeTab === "eligible" ? (
        /* TAB 1: ELIGIBLE SEMESTER 8 STUDENTS */
        eligibleSem8Students.length === 0 ? (
          <div className="bento-card p-12 text-center bg-white border border-slate-200">
            <FiAward className="mx-auto text-slate-300 text-4xl mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Eligible Semester 8 Students Found</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">There are currently no active 8th semester students awaiting graduation matching your filter.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Bento Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eligibleSem8Students.map((student) => {
              const isSelected = selectedEnrollments.includes(student.enrollmentNo);
              return (
                <div
                  key={student._id}
                  onClick={() => toggleSelectStudent(student.enrollmentNo)}
                  className={`bento-card p-6 bg-white border cursor-pointer transition-all duration-200 space-y-4 flex flex-col justify-between ${
                    isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md" : "border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getFileUrl(student.profile)}
                          alt={student.firstName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-xs"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shadow-xs" style={{ display: 'none' }}>
                          <FiUser />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">
                            {student.firstName} {student.middleName} {student.lastName}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Enrollment: <span className="font-bold text-indigo-600">{student.enrollmentNo}</span></p>
                        </div>
                      </div>

                      <div className="text-indigo-600 text-lg">
                        {isSelected ? <FiCheckSquare className="text-indigo-600" /> : <FiSquare className="text-slate-300" />}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                      <div>
                        <span className="text-slate-400 font-medium block">Branch</span>
                        <span className="font-bold text-slate-800 block truncate">{student.branch}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Batch</span>
                        <span className="font-bold text-indigo-700 block">{student.batch || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Reg.</span>
                        <span className="font-bold text-purple-700 block">{student.regulation ? student.regulation.toUpperCase() : "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Backlogs</span>
                        <span className={`font-bold block ${student.activeBacklogs > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                          {student.activeBacklogs || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Single Graduate Trigger */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      Eligible for Graduation
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGraduateStudents([student.enrollmentNo]);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <FiAward /> Graduate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Compact Table View */
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
            <table className="min-w-[1200px] w-full text-left">
              <thead>
                <tr>
                  <th className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedEnrollments.length === eligibleSem8Students.length && eligibleSem8Students.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3 px-4">Enrollment No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Regulation</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Active Backlogs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {eligibleSem8Students.map((student, index) => {
                  const isSelected = selectedEnrollments.includes(student.enrollmentNo);
                  return (
                    <tr key={student._id} className={isSelected ? "bg-indigo-50/40" : index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(student.enrollmentNo)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="font-bold text-xs text-indigo-600 py-3.5 px-4">{student.enrollmentNo}</td>
                      <td className="font-bold text-sm text-slate-900 py-3.5 px-4">
                        {student.firstName} {student.middleName} {student.lastName}
                      </td>
                      <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{student.branch}</td>
                      <td className="text-xs font-bold text-indigo-700 py-3.5 px-4">{student.batch || "N/A"}</td>
                      <td className="text-xs font-bold text-purple-700 py-3.5 px-4">{student.regulation ? student.regulation.toUpperCase() : "N/A"}</td>
                      <td className="text-xs font-bold text-slate-700 py-3.5 px-4">Semester {student.semester}</td>
                      <td className="text-xs font-bold py-3.5 px-4">
                        <span className={student.activeBacklogs > 0 ? "text-amber-600" : "text-emerald-600"}>
                          {student.activeBacklogs || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-100">
                          Eligible
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleGraduateStudents([student.enrollmentNo])}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <FiAward /> Graduate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* TAB 2: ALUMNI / GRADUATED RECORDS */
        graduatedStudents.length === 0 ? (
          <div className="bento-card p-12 text-center bg-white border border-slate-200">
            <FiUserCheck className="mx-auto text-slate-300 text-4xl mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Alumni / Graduated Records Found</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Students marked as graduated will appear here with active Alumni credentials matching your filter.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {graduatedStudents.map((student) => (
              <div
                key={student._id}
                className="bento-card p-6 bg-white border border-emerald-200/80 hover:shadow-md transition-all duration-200 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getFileUrl(student.profile)}
                      alt={student.firstName}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-100 bg-emerald-50 shadow-xs"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-base shadow-xs" style={{ display: 'none' }}>
                      <FiUser />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {student.firstName} {student.middleName} {student.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Enrollment: <span className="font-bold text-emerald-700">{student.enrollmentNo}</span></p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-100">
                    Alumni / Graduated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center">
                  <div>
                    <span className="text-slate-400 font-medium block">Branch</span>
                    <span className="font-bold text-slate-800 block truncate">{student.branch}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Batch</span>
                    <span className="font-bold text-indigo-700 block">{student.batch || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Regulation</span>
                    <span className="font-bold text-purple-700 block">{student.regulation ? student.regulation.toUpperCase() : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Grad. Year</span>
                    <span className="font-bold text-emerald-700 block">{student.graduationYear || new Date().getFullYear()}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleRestoreStudent(student.enrollmentNo)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-2xs"
                  >
                    Restore to 8th Sem Active
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
            <table className="min-w-[1000px] w-full text-left">
              <thead>
                <tr>
                  <th className="py-3 px-4">Enrollment No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Regulation</th>
                  <th className="py-3 px-4">Graduation Year</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {graduatedStudents.map((student, index) => (
                  <tr key={student._id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="font-bold text-xs text-emerald-700 py-3.5 px-4">{student.enrollmentNo}</td>
                    <td className="font-bold text-sm text-slate-900 py-3.5 px-4">
                      {student.firstName} {student.middleName} {student.lastName}
                    </td>
                    <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{student.branch}</td>
                    <td className="text-xs font-bold text-indigo-700 py-3.5 px-4">{student.batch || "N/A"}</td>
                    <td className="text-xs font-bold text-purple-700 py-3.5 px-4">{student.regulation ? student.regulation.toUpperCase() : "N/A"}</td>
                    <td className="text-xs font-bold text-emerald-700 py-3.5 px-4">{student.graduationYear || new Date().getFullYear()}</td>
                    <td className="py-3.5 px-4 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-100">
                        Alumni Credential Active
                      </span>
                      <button
                        onClick={() => handleRestoreStudent(student.enrollmentNo)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-all"
                      >
                        Restore to 8th Sem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default Graduation;

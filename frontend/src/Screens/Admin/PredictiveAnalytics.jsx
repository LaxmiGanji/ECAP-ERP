import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import {
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiBriefcase,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiFilter,
  FiAward,
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiList,
  FiBarChart2,
  FiFileText,
  FiRefreshCw
} from "react-icons/fi";
import { downloadCSV, printFormattedReport } from "../../utils/reportExporter";
import { sortEnrollmentNo } from "../../utils/enrollmentSorter";

const PredictiveAnalytics = ({ branch: lockedBranch }) => {
  const [activeTab, setActiveTab] = useState("risk"); // 'risk', 'placement', 'reports'
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "All");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedRegulation, setSelectedRegulation] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  // Data states
  const [riskData, setRiskData] = useState({ summary: {}, students: [] });
  const [placementData, setPlacementData] = useState({ summary: {}, predictions: [] });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch branches for filter
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

  // Fetch predictive risk analysis
  const fetchPredictiveRisk = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch !== "All" && selectedBranch !== "-- Select --") params.append("branch", selectedBranch);
      if (selectedBatch !== "All") params.append("batch", selectedBatch);
      if (selectedRegulation !== "All") params.append("regulation", selectedRegulation);

      const res = await axios.get(`${baseApiURL()}/predictive/batch-risk?${params.toString()}`);
      if (res.data.success) {
        setRiskData({ summary: res.data.summary || {}, students: res.data.students || [] });
      }
    } catch (err) {
      console.error("Error fetching predictive risk:", err);
      toast.error("Failed to load predictive risk analytics");
    } finally {
      setLoading(false);
    }
  };

  // Fetch placement readiness prediction
  const fetchPlacementPrediction = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch !== "All" && selectedBranch !== "-- Select --") params.append("branch", selectedBranch);
      if (selectedBatch !== "All") params.append("batch", selectedBatch);

      const res = await axios.get(`${baseApiURL()}/predictive/placement-readiness?${params.toString()}`);
      if (res.data.success) {
        setPlacementData({ summary: res.data.summary || {}, predictions: res.data.predictions || [] });
      }
    } catch (err) {
      console.error("Error fetching placement predictions:", err);
      toast.error("Failed to load placement readiness predictions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "risk") {
      fetchPredictiveRisk();
    } else if (activeTab === "placement") {
      fetchPlacementPrediction();
    }
  }, [activeTab, selectedBranch, selectedBatch, selectedRegulation]);

  // Extract unique batches from current student list
  const availableBatches = Array.from(
    new Set((riskData.students || []).map((s) => s.batch).filter(Boolean))
  ).sort((a, b) => b - a);

  // Extract unique regulations
  const availableRegulations = Array.from(
    new Set((riskData.students || []).map((s) => s.regulation).filter(Boolean))
  ).sort();

  // Search filtering
  const filteredRiskStudents = (riskData.students || []).filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(term)) ||
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.branch && s.branch.toLowerCase().includes(term)) ||
      (s.riskLevel && s.riskLevel.toLowerCase().includes(term))
    );
  }).sort(sortEnrollmentNo);

  const filteredPlacementStudents = (placementData.predictions || []).filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(term)) ||
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.branch && s.branch.toLowerCase().includes(term)) ||
      (s.placementStatus && s.placementStatus.toLowerCase().includes(term))
    );
  }).sort(sortEnrollmentNo);

  // Export handlers
  const exportRiskCSV = () => {
    const dataToExport = filteredRiskStudents.map((s) => ({
      enrollmentNo: s.enrollmentNo,
      name: s.name,
      branch: s.branch,
      batch: s.batch,
      regulation: s.regulation,
      semester: s.semester,
      attendancePct: s.attendancePct,
      activeBacklogs: s.activeBacklogs,
      riskScore: s.riskScore,
      riskLevel: s.riskLevel,
      primaryRiskDrivers: (s.riskDrivers || []).join(" | "),
    }));
    downloadCSV("Predictive_Academic_Risk_Report", dataToExport);
  };

  const printRiskPDF = () => {
    const headers = {
      enrollmentNo: "Enrollment No",
      name: "Student Name",
      branch: "Branch",
      batch: "Batch",
      attendancePct: "Attendance %",
      activeBacklogs: "Backlogs",
      riskScore: "Risk Score",
      riskLevel: "Risk Level",
    };
    printFormattedReport("Predictive Student Academic & Attendance Risk Analysis", headers, filteredRiskStudents, {
      Branch: selectedBranch,
      Batch: selectedBatch,
      Regulation: selectedRegulation,
      "High Risk Count": riskData.summary.highRiskCount || 0,
    });
  };

  const exportPlacementCSV = () => {
    const dataToExport = filteredPlacementStudents.map((s) => ({
      enrollmentNo: s.enrollmentNo,
      name: s.name,
      branch: s.branch,
      batch: s.batch,
      cgpa: s.cgpa,
      activeBacklogs: s.activeBacklogs,
      readinessScore: `${s.readinessScore}/100`,
      placementLikelihood: s.placementStatus,
      predictedCtcRange: s.predictedCtc,
    }));
    downloadCSV("Predictive_Placement_Readiness_Report", dataToExport);
  };

  return (
    <div className="w-full space-y-6 relative pb-16 p-4 md:p-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <FiTrendingUp className="text-3xl text-indigo-300" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              Predictive Analytics & Reports Engine
            </h1>
            <p className="text-indigo-200 text-xs md:text-sm font-medium mt-0.5">
              AI-driven academic risk forecasting, placement readiness prediction & institutional report generation
            </p>
          </div>
        </div>

        {/* View Mode & Refresh */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-2xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-indigo-900 shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              <FiGrid className="text-sm" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === "table" ? "bg-white text-indigo-900 shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              <FiList className="text-sm" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === "risk") fetchPredictiveRisk();
              else if (activeTab === "placement") fetchPlacementPrediction();
            }}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all text-sm"
            title="Refresh Analytics"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 🔲 Navigation Tabs */}
      <div className="bento-card p-1.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("risk")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "risk"
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <FiAlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Predictive Risk Analytics</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
              {riskData.summary?.highRiskCount || 0} High Risk
            </span>
          </button>

          <button
            onClick={() => setActiveTab("placement")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "placement"
                ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <FiBriefcase className="w-4 h-4 text-emerald-600" />
            <span>Placement Readiness Forecast</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
              {placementData.summary?.highLikelihood || 0} Ready
            </span>
          </button>
        </div>
      </div>

      {/* 🔲 Global Filter Bar */}
      <div className="bento-card p-5 bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, enrollment ID..."
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
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none ${
                lockedBranch ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
            >
              <option value="All">All Branches</option>
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
              onChange={(e) => setSelectedBatch(e.target.value)}
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

          {/* Regulation Filter */}
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
        </div>
      </div>

      {/* 📊 TAB 1: PREDICTIVE RISK ANALYTICS */}
      {activeTab === "risk" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-600">
                <FiUsers className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Evaluated</span>
              </div>
              <p className="font-extrabold text-slate-900 text-2xl">{riskData.summary?.totalStudents || 0}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-rose-200 bg-rose-50/30 space-y-1">
              <div className="flex items-center space-x-2 text-rose-600">
                <FiAlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Predicted High Risk</span>
              </div>
              <p className="font-extrabold text-rose-700 text-2xl">{riskData.summary?.highRiskCount || 0}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-amber-200 bg-amber-50/30 space-y-1">
              <div className="flex items-center space-x-2 text-amber-600">
                <FiBarChart2 className="w-4 h-4" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Moderate Risk</span>
              </div>
              <p className="font-extrabold text-amber-700 text-2xl">{riskData.summary?.mediumRiskCount || 0}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-emerald-200 bg-emerald-50/30 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-600">
                <FiCheckCircle className="w-4 h-4" />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Low Risk / Healthy</span>
              </div>
              <p className="font-extrabold text-emerald-700 text-2xl">{riskData.summary?.lowRiskCount || 0}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl">
            <div className="text-xs font-bold text-indigo-900 flex items-center gap-2">
              <FiFileText className="text-indigo-600 text-base" />
              <span>Predictive Academic Risk Export Options ({filteredRiskStudents.length} Records)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportRiskCSV}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <FiDownload /> Export CSV
              </button>

              <button
                onClick={printRiskPDF}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <FiPrinter /> Print PDF Report
              </button>
            </div>
          </div>

          {/* Main Risk Content View */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-2 text-xs text-slate-500 font-medium">Calculating predictive risk scores...</p>
            </div>
          ) : filteredRiskStudents.length === 0 ? (
            <div className="bento-card p-12 text-center bg-white border border-slate-200">
              <FiCheckCircle className="mx-auto text-slate-300 text-4xl mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Risk Records Matching Filters</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Adjust your Branch, Batch, or Search filter to evaluate student risk.</p>
            </div>
          ) : viewMode === "grid" ? (
            /* Bento Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRiskStudents.map((s) => {
                const isHigh = s.riskLevel === "High";
                const isMedium = s.riskLevel === "Medium";
                return (
                  <div
                    key={s.studentId || s.enrollmentNo}
                    className={`bento-card p-6 bg-white border transition-all duration-200 space-y-4 flex flex-col justify-between ${
                      isHigh
                        ? "border-rose-300 ring-2 ring-rose-500/10 shadow-sm"
                        : isMedium
                        ? "border-amber-300 shadow-sm"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">{s.name}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Enrollment: <span className="font-bold text-indigo-600">{s.enrollmentNo}</span>
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            isHigh
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isMedium
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {s.riskLevel} Risk ({s.riskScore}/100)
                        </span>
                      </div>

                      {/* Risk Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Predictive Risk Score</span>
                          <span className={isHigh ? "text-rose-600" : isMedium ? "text-amber-600" : "text-emerald-600"}>
                            {s.riskScore}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${s.riskScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <div>
                          <span className="text-slate-400 font-medium block">Branch</span>
                          <span className="font-bold text-slate-800 block truncate">{s.branch}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Attendance</span>
                          <span className={`font-bold block ${s.attendancePct === "N/A" ? "text-slate-500" : parseInt(s.attendancePct) < 75 ? "text-rose-600" : "text-emerald-600"}`}>
                            {s.attendancePct}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Backlogs</span>
                          <span className={`font-bold block ${s.activeBacklogs > 0 ? "text-amber-600" : "text-slate-700"}`}>
                            {s.activeBacklogs}
                          </span>
                        </div>
                      </div>

                      {/* Risk Drivers */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Risk Drivers</span>
                        <div className="space-y-1">
                          {(s.riskDrivers || []).map((driver, idx) => (
                            <div key={idx} className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                              <span>{driver}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Footer */}
                    <div className="pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Recommended Action</span>
                      <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                        {(s.recommendations && s.recommendations[0]) || "Monitor progress closely."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Table View */
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="min-w-[1000px] w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Enrollment No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Attendance</th>
                    <th className="py-3.5 px-4">Backlogs</th>
                    <th className="py-3.5 px-4">Risk Score</th>
                    <th className="py-3.5 px-4">Risk Category</th>
                    <th className="py-3.5 px-4">Primary Risk Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiskStudents.map((s, idx) => (
                    <tr key={s.studentId || s.enrollmentNo} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="font-bold text-xs text-indigo-600 py-3.5 px-4">{s.enrollmentNo}</td>
                      <td className="font-bold text-sm text-slate-900 py-3.5 px-4">{s.name}</td>
                      <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{s.branch}</td>
                      <td className={`text-xs font-bold py-3.5 px-4 ${s.attendancePct === "N/A" ? "text-slate-500" : parseInt(s.attendancePct) < 75 ? "text-rose-600" : "text-emerald-600"}`}>
                        {s.attendancePct}
                      </td>
                      <td className={`text-xs font-bold py-3.5 px-4 ${s.activeBacklogs > 0 ? "text-amber-600" : "text-slate-700"}`}>
                        {s.activeBacklogs}
                      </td>
                      <td className="text-xs font-bold text-slate-900 py-3.5 px-4">{s.riskScore}%</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.riskLevel === "High"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : s.riskLevel === "Medium"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {s.riskLevel} Risk
                        </span>
                      </td>
                      <td className="text-xs text-slate-600 font-medium py-3.5 px-4 truncate max-w-xs">
                        {(s.riskDrivers && s.riskDrivers[0]) || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 💼 TAB 2: PLACEMENT READINESS FORECAST */}
      {activeTab === "placement" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bento-card p-5 bg-white border border-slate-200 space-y-1">
              <div className="flex items-center space-x-2 text-indigo-600">
                <FiUsers className="w-4 h-4" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Evaluated</span>
              </div>
              <p className="font-extrabold text-slate-900 text-2xl">{placementData.summary?.totalEvaluated || 0}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-emerald-200 bg-emerald-50/30 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-600">
                <FiCheckCircle className="w-4 h-4" />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">High Placement Likelihood</span>
              </div>
              <p className="font-extrabold text-emerald-700 text-2xl">{placementData.summary?.highLikelihood || 0}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-amber-200 bg-amber-50/30 space-y-1">
              <div className="flex items-center space-x-2 text-amber-600">
                <FiBarChart2 className="w-4 h-4" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Moderate Likelihood</span>
              </div>
              <p className="font-extrabold text-amber-700 text-2xl">{placementData.summary?.moderateLikelihood || 0}</p>
            </div>

            <div className="bento-card p-5 bg-white border border-rose-200 bg-rose-50/30 space-y-1">
              <div className="flex items-center space-x-2 text-rose-600">
                <FiAlertTriangle className="w-4 h-4" />
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Needs Skill Enhancement</span>
              </div>
              <p className="font-extrabold text-rose-700 text-2xl">{placementData.summary?.needsEnhancement || 0}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
              <FiBriefcase className="text-emerald-600 text-base" />
              <span>Placement Readiness Forecast ({filteredPlacementStudents.length} Records)</span>
            </div>

            <button
              onClick={exportPlacementCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <FiDownload /> Export Placement Forecast CSV
            </button>
          </div>

          {/* Content View */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
              <p className="mt-2 text-xs text-slate-500 font-medium">Calculating placement readiness predictions...</p>
            </div>
          ) : filteredPlacementStudents.length === 0 ? (
            <div className="bento-card p-12 text-center bg-white border border-slate-200">
              <FiBriefcase className="mx-auto text-slate-300 text-4xl mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Placement Records Matching Filters</h3>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlacementStudents.map((s) => {
                const isHigh = s.placementStatus === "High Likelihood";
                const isModerate = s.placementStatus === "Moderate Likelihood";
                return (
                  <div key={s.enrollmentNo} className="bento-card p-6 bg-white border border-slate-200 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">{s.name}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Enrollment: <span className="font-bold text-indigo-600">{s.enrollmentNo}</span>
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            isHigh
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isModerate
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : s.placementStatus.includes("Pending")
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {s.placementStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <div>
                          <span className="text-slate-400 font-medium block">CGPA</span>
                          <span className="font-bold text-indigo-700 block">{s.cgpa}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">10th / 12th</span>
                          <span className="font-bold text-slate-800 block">{s.tenthPct} / {s.twelfthPct}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block">Backlogs</span>
                          <span className={`font-bold block ${s.activeBacklogs > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {s.activeBacklogs}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Predicted Package</span>
                        <span className="font-bold text-emerald-700 block">{s.predictedCtc}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Readiness Score</span>
                        <span className="font-bold text-indigo-600 block">{s.readinessScore}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="min-w-[1000px] w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase">
                    <th className="py-3.5 px-4">Enrollment No</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">CGPA</th>
                    <th className="py-3.5 px-4">Readiness Score</th>
                    <th className="py-3.5 px-4">Placement Likelihood</th>
                    <th className="py-3.5 px-4">Predicted CTC Range</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlacementStudents.map((s, idx) => (
                    <tr key={s.enrollmentNo} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="font-bold text-xs text-indigo-600 py-3.5 px-4">{s.enrollmentNo}</td>
                      <td className="font-bold text-sm text-slate-900 py-3.5 px-4">{s.name}</td>
                      <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{s.branch}</td>
                      <td className="text-xs font-bold text-slate-900 py-3.5 px-4">{s.cgpa}</td>
                      <td className="text-xs font-bold text-indigo-600 py-3.5 px-4">{s.readinessScore}/100</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.placementStatus === "High Likelihood"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : s.placementStatus === "Moderate Likelihood"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}
                        >
                          {s.placementStatus}
                        </span>
                      </td>
                      <td className="text-xs font-bold text-emerald-700 py-3.5 px-4">{s.predictedCtc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictiveAnalytics;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import { FiUsers, FiAlertTriangle, FiActivity, FiArrowRight, FiCheckCircle, FiSearch, FiCpu } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const AIAnalytics = () => {
  // Selector states
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("risk"); // risk or anomalies

  // Loaded data
  const [riskData, setRiskData] = useState([]);
  const [anomaliesData, setAnomaliesData] = useState([]);
  
  // Drill-down Modal
  const [showModal, setShowModal] = useState(false);
  const [modalStudent, setModalStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalAiReport, setModalAiReport] = useState(null);

  const sections = ["A", "B", "C", "D", "SOC", "WIPRO TRAINING"];

  // Fetch branches on mount
  useEffect(() => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data.success) {
          setBranches(res.data.branches);
        }
      })
      .catch((err) => console.error("Error loading branches:", err));
  }, []);

  const handleFetchAnalytics = async () => {
    if (!selectedBranch || !selectedSemester || !selectedSection) {
      toast.error("Please select branch, semester, and section.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch Section Risk Summary
      const riskRes = await axios.get(`${baseApiURL()}/ai/section-risk`, {
        params: { branch: selectedBranch, semester: selectedSemester, section: selectedSection },
        headers
      });

      // 2. Fetch Section Anomalies
      const anomalyRes = await axios.get(`${baseApiURL()}/ai/anomalies-section`, {
        params: { branch: selectedBranch, semester: selectedSemester, section: selectedSection },
        headers
      });

      if (riskRes.data.success && anomalyRes.data.success) {
        setRiskData(riskRes.data.summary);
        setAnomaliesData(anomalyRes.data.anomalies);
        toast.success("AI Analytics loaded successfully!");
      } else {
        toast.error("Failed to load some analytics components.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching analytics details from server.");
    } finally {
      setLoading(false);
    }
  };

  // Detailed AI Student Risk report
  const handleOpenDetailedAnalysis = async (student) => {
    setModalStudent(student);
    setModalAiReport(null);
    setShowModal(true);
    setModalLoading(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.get(`${baseApiURL()}/ai/risk/${student.enrollmentNo}`, { headers });
      if (res.data.success) {
        setModalAiReport(res.data.data);
      } else {
        toast.error("Failed to generate detailed analysis.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error generating detailed AI risk prediction.");
    } finally {
      setModalLoading(false);
    }
  };

  // Stats Calculations
  const totalStudents = riskData.length;
  const highRiskCount = riskData.filter(s => s.riskLevel === "High").length;
  const mediumRiskCount = riskData.filter(s => s.riskLevel === "Medium").length;
  const totalAnomalies = anomaliesData.length;

  // Chart Data preparation
  const riskChartData = [
    { name: "High Risk", value: highRiskCount, color: "#EF4444" },
    { name: "Medium Risk", value: mediumRiskCount, color: "#F59E0B" },
    { name: "Low Risk", value: totalStudents - highRiskCount - mediumRiskCount, color: "#10B981" }
  ].filter(c => c.value > 0);

  // Group anomalies by type
  const anomalyCounts = anomaliesData.reduce((acc, curr) => {
    acc[curr.anomalyType] = (acc[curr.anomalyType] || 0) + 1;
    return acc;
  }, {});

  const anomalyChartData = Object.keys(anomalyCounts).map(key => ({
    name: key,
    count: anomalyCounts[key]
  }));

  return (
    <div className="p-6 md:p-8 bg-white min-h-[70vh]">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiActivity className="text-indigo-600" />
            AI Student Risk & Attendance Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Detect patterns, flag attendance anomalies, and predict academic performance risks.
          </p>
        </div>
      </div>

      {/* Selectors Panel */}
      <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm mb-8">
        <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wider">Configure Section Target</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
            >
              <option value="">-- Select Branch --</option>
              {branches.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
            >
              <option value="">-- Select Semester --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Section</label>
            <div className="flex gap-2">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
              >
                <option value="">-- Select Section --</option>
                {sections.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFetchAnalytics}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSearch /> Load
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {riskData.length > 0 ? (
        <div className="space-y-8">
          
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FiUsers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Students Monitored</p>
                <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">High Risk Predicted</p>
                <p className="text-2xl font-bold text-red-600">{highRiskCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Medium Risk</p>
                <p className="text-2xl font-bold text-amber-600">{mediumRiskCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <FiActivity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Anomalies Detected</p>
                <p className="text-2xl font-bold text-purple-600">{totalAnomalies}</p>
              </div>
            </div>

          </div>

          {/* Visual Recharts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Risk Breakdown Pie */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4 text-sm md:text-base border-b pb-3">AI Risk Distribution</h3>
              <div className="h-60 flex items-center justify-center">
                {riskChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {riskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm">No critical data to display</p>
                )}
              </div>
            </div>

            {/* Anomaly Bar Chart */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4 text-sm md:text-base border-b pb-3">Anomaly Type Breakdown</h3>
              <div className="h-60">
                {anomalyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={anomalyChartData} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm gap-2">
                    <FiCheckCircle className="text-emerald-500 w-5 h-5" />
                    <span>No attendance anomalies detected in this section!</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Detailed Lists tabs */}
          <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            
            {/* Tab selection */}
            <div className="flex border-b border-gray-100 bg-slate-50/50">
              <button
                onClick={() => setActiveTab("risk")}
                className={`flex-1 py-4 font-bold text-xs md:text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                  activeTab === "risk"
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                <FiAlertTriangle />
                Student Academic Risk Predictions
              </button>
              <button
                onClick={() => setActiveTab("anomalies")}
                className={`flex-1 py-4 font-bold text-xs md:text-sm transition-all border-b-2 flex items-center justify-center gap-2 ${
                  activeTab === "anomalies"
                    ? "border-indigo-600 text-indigo-600 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                <FiActivity />
                Detected Attendance Anomalies ({totalAnomalies})
              </button>
            </div>

            {/* Tab content */}
            <div className="p-4 md:p-6">
              
              {activeTab === "risk" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b">
                      <tr>
                        <th className="px-6 py-3.5">Enrollment No</th>
                        <th className="px-6 py-3.5">Student Name</th>
                        <th className="px-6 py-3.5">Overall Attendance</th>
                        <th className="px-6 py-3.5">Risk Score</th>
                        <th className="px-6 py-3.5">Risk Level</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {riskData.map((std) => (
                        <tr key={std.enrollmentNo} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4 font-semibold text-gray-800">{std.enrollmentNo}</td>
                          <td className="px-6 py-4">{std.name}</td>
                          <td className="px-6 py-4 font-medium">
                            {std.attendancePercentage !== "N/A" ? `${std.attendancePercentage}%` : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-150 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    std.riskLevel === "High" ? "bg-red-500" : std.riskLevel === "Medium" ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${std.riskScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold">{std.riskScore}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                std.riskLevel === "High"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : std.riskLevel === "Medium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {std.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenDetailedAnalysis(std)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Analyze Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "anomalies" && (
                <div>
                  {anomaliesData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b">
                          <tr>
                            <th className="px-6 py-3.5">Student Name</th>
                            <th className="px-6 py-3.5">Enrollment No</th>
                            <th className="px-6 py-3.5">Anomaly Type</th>
                            <th className="px-6 py-3.5">Severity</th>
                            <th className="px-6 py-3.5">Details</th>
                            <th className="px-6 py-3.5">Trigger Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {anomaliesData.map((anom, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                              <td className="px-6 py-4 font-semibold text-gray-800">{anom.studentName}</td>
                              <td className="px-6 py-4">{anom.enrollmentNo}</td>
                              <td className="px-6 py-4">
                                <span className="font-semibold text-slate-700">{anom.anomalyType}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    anom.severity === "High"
                                      ? "bg-red-150 text-red-800"
                                      : "bg-amber-150 text-amber-800"
                                  }`}
                                >
                                  {anom.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4 max-w-xs truncate md:max-w-md text-xs">{anom.details}</td>
                              <td className="px-6 py-4 text-xs text-gray-400">
                                {anom.date ? new Date(anom.date).toLocaleDateString() : "Recurring Pattern"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                      <FiCheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                      <h4 className="font-bold text-gray-700">Perfect Class Section Status</h4>
                      <p className="text-sm text-gray-500 mt-1">No attendance anomalies detected in this section.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <FiActivity className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg">No AI Analytics Loaded</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-sm px-6">
            Configure target branch, semester, and section in selectors panel and click Load to run AI risk modeling.
          </p>
        </div>
      )}

      {/* Drill-down detailed analysis Modal */}
      <AnimatePresence>
        {showModal && modalStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white">
                    <FiCpu className="animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base">AI Academic Performance Report</h3>
                    <p className="text-xs text-slate-400">Enrollment No: {modalStudent.enrollmentNo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-all text-sm font-semibold"
                >
                  Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Student Info Bar */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider font-semibold">Student Name</span>
                    <span className="text-sm font-semibold mt-0.5 block">{modalStudent.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider font-semibold">Section Attendance</span>
                    <span className="text-sm font-semibold mt-0.5 block">
                      {modalStudent.attendancePercentage !== "N/A" ? `${modalStudent.attendancePercentage}%` : "N/A"}
                    </span>
                  </div>
                </div>

                {modalLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">ECAP AI is modeling student data...</p>
                  </div>
                ) : modalAiReport ? (
                  <div className="space-y-6">
                    
                    {/* Risk Badge Block */}
                    <div className="flex items-center justify-between bg-slate-950/20 border border-slate-800/60 p-4 rounded-xl">
                      <div>
                        <span className="text-slate-400 text-xs">Risk Index Score</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-extrabold text-white">{modalAiReport.riskScore}</span>
                          <span className="text-xs text-slate-500">/ 100</span>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-1.5 text-xs font-black rounded-full uppercase ${
                          modalAiReport.riskLevel === "High"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : modalAiReport.riskLevel === "Medium"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {modalAiReport.riskLevel} Risk Level
                      </span>
                    </div>

                    {/* AI Summary */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">AI Summary</h4>
                      <p className="text-sm leading-relaxed text-slate-200 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                        {modalAiReport.summary}
                      </p>
                    </div>

                    {/* Contributing Factors */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Contributing Factors</h4>
                      <ul className="space-y-2">
                        {modalAiReport.details?.map((detail, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-300 items-start">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* AI Recommendations */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">AI Intervention Guidance</h4>
                      <ul className="space-y-2">
                        {modalAiReport.recommendations?.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-300 items-start">
                            <span className="text-emerald-500 mt-1">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ) : (
                  <p className="text-center text-slate-400 text-sm">Failed to generate AI analysis report.</p>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AIAnalytics;

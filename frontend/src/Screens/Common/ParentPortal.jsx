import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  FiUser, FiBookOpen, FiCalendar, FiTrendingUp, FiMessageSquare, 
  FiClock, FiCheckCircle, FiXCircle, FiPercent, FiAward 
} from "react-icons/fi";

const ParentPortal = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({
    parentName: "",
    contactNumber: "",
    message: ""
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Fetch parent dashboard data using secure token
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseApiURL()}/parent/dashboard/${token}`);
      if (response.data.success) {
        setData(response.data);
      } else {
        setError(response.data.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid or expired Parent Portal link.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Handle feedback input
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedback(prev => ({ ...prev, [name]: value }));
  };

  // Submit feedback to HOD
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.parentName || !feedback.contactNumber || !feedback.message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setFeedbackLoading(true);
    try {
      const response = await axios.post(`${baseApiURL()}/parent/feedback/${token}`, feedback);
      if (response.data.success) {
        toast.success("Feedback submitted successfully!");
        setFeedback({ parentName: "", contactNumber: "", message: "" });
      } else {
        toast.error(response.data.message || "Failed to submit feedback");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error submitting feedback. Please try again.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Securing connection and loading academic reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 text-5xl mb-6">
          <FiXCircle />
        </div>
        <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
        <p className="text-slate-400 mt-2 max-w-md text-sm md:text-base">{error}</p>
        <p className="text-xs text-slate-500 mt-6">If you believe this is an error, please contact the campus administrative office.</p>
      </div>
    );
  }

  const { student, attendanceSummary, attendanceRecords, marks } = data;

  // Calculate Overall Attendance Percentage
  const totalClasses = attendanceSummary.reduce((acc, curr) => acc + curr.total, 0);
  const attendedClasses = attendanceSummary.reduce((acc, curr) => acc + curr.attended, 0);
  const overallPercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : "0.00";

  // Prepare Chart Data for Marks
  // Marks schema contains marks by subject, e.g. marks.internal = { "Maths": 23, "Physics": 21 }
  const subjectsWithMarks = [
    ...new Set([
      ...Object.keys(marks.internal || {}),
      ...Object.keys(marks.external || {})
    ])
  ];

  const chartData = subjectsWithMarks.map(subject => ({
    name: subject,
    Internal: marks.internal[subject] || 0,
    External: marks.external[subject] || 0
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Toaster position="top-right" />
      
      {/* Navigation Header */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            EC
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Parent Connect Portal
          </span>
        </div>
        <div className="text-xs font-mono text-slate-500 border border-slate-900 rounded-lg px-2.5 py-1 bg-slate-900/30">
          Secure Token Authentication
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Row 1: Student Details & Attendance Summary Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1.1: Student Metadata */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-900 p-6 shadow-xl flex flex-col justify-between">
            <div className="flex items-start gap-5">
              <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-3xl font-bold shadow-inner">
                <FiUser />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Ward Details
                </span>
                <h1 className="text-2xl font-extrabold text-slate-100">
                  {student.firstName} {student.middleName || ""} {student.lastName}
                </h1>
                <p className="text-slate-400 text-sm font-semibold">{student.enrollmentNo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-900/60 text-sm">
              <div>
                <span className="text-slate-500 text-xs block mb-1">Branch</span>
                <span className="font-bold text-slate-200">{student.branch}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-1">Semester</span>
                <span className="font-bold text-slate-200">Sem {student.semester}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-1">Section</span>
                <span className="font-bold text-slate-200">Section {student.section || "A"}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-1">Parent</span>
                <span className="font-bold text-slate-200">{student.FatherName || student.MotherName || "Parent"}</span>
              </div>
            </div>
          </div>

          {/* Card 1.2: Overall Attendance Gauge */}
          <div className="bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between border-b border-slate-900 pb-3">
              <h2 className="font-bold text-slate-400 text-xs uppercase tracking-wider flex items-center gap-2">
                <FiPercent className="text-blue-500" /> Overall Attendance
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                Number(overallPercentage) >= 75 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {Number(overallPercentage) >= 75 ? "Safe Threshold" : "Low Attendance"}
              </span>
            </div>

            <div className="relative my-6 flex items-center justify-center">
              {/* Circular Gauge */}
              <div className="relative h-32 w-32 rounded-full flex items-center justify-center bg-slate-950 border-4 border-slate-800 shadow-inner">
                <div className="text-center">
                  <span className="text-3xl font-black text-slate-100">{overallPercentage}%</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Classes Attended</span>
                </div>
                {/* Visual Circle highlight */}
                <div className={`absolute inset-0 rounded-full border-4 ${
                  Number(overallPercentage) >= 75 ? "border-emerald-500/40" : "border-rose-500/40"
                } pointer-events-none`}></div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Attended <strong className="text-slate-200">{attendedClasses}</strong> out of <strong className="text-slate-200">{totalClasses}</strong> classes held.
            </div>
          </div>
        </div>

        {/* Row 2: Subject-wise Attendance Breakdown */}
        <div className="bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl">
          <h2 className="text-lg font-bold flex items-center gap-2.5 text-blue-400 mb-6 uppercase tracking-wider text-xs">
            <FiBookOpen /> Subject-Wise Attendance Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendanceSummary.map((sub, i) => (
              <div key={i} className="bg-slate-950/40 border border-slate-900 p-5 rounded-xl hover:border-slate-800 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-sm text-slate-200 line-clamp-1">{sub.subjectName}</h3>
                    <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-500 font-bold shrink-0">{sub.code || "SUB"}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-4">
                    <span>Attendance Rate</span>
                    <span className={`font-bold ${sub.percentage >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-950 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.percentage >= 75 ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-rose-500 shadow-lg shadow-rose-500/20"
                      }`} 
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                    <span>Classes Attended: {sub.attended}</span>
                    <span>Total Held: {sub.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Result Analysis & Comparison Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart visual */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2.5 text-indigo-400 mb-6 uppercase tracking-wider text-xs">
              <FiTrendingUp /> Ward Performance Graph
            </h2>
            {chartData.length === 0 ? (
              <div className="h-64 flex flex-col justify-center items-center text-slate-500 text-sm">
                No exam results uploaded in system yet.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Internal" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Internals" />
                    <Bar dataKey="External" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="External Exams" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Results raw table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2.5 text-purple-400 mb-6 uppercase tracking-wider text-xs">
                <FiAward /> Recent Exam Reports
              </h2>
              {subjectsWithMarks.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-sm">
                  No marks reports generated.
                </div>
              ) : (
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {subjectsWithMarks.map((subject, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-3 text-sm">
                      <div>
                        <div className="font-bold text-slate-200 line-clamp-1">{subject}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Exam Results</div>
                      </div>
                      <div className="flex gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Internal</span>
                          <span className="font-bold text-blue-400 font-mono">{marks.internal[subject] ?? "-"}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">External</span>
                          <span className="font-bold text-purple-400 font-mono">{marks.external[subject] ?? "-"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-4 mt-4">
              *Marks displays correspond to the latest evaluations configured by departmental HODs.
            </div>
          </div>
        </div>

        {/* Row 3.5: Messages from Faculty & College Management */}
        <div className="bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2.5 text-blue-400 uppercase tracking-wider text-xs">
              <FiMessageSquare className="text-blue-500" /> Direct Messages from Faculty & Administration
            </h2>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
              {(data.parentMessages || []).length} Message{(data.parentMessages || []).length !== 1 ? 's' : ''}
            </span>
          </div>

          {(data.parentMessages || []).length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950/40 rounded-xl border border-slate-900/60">
              No direct communication notices received yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data.parentMessages || []).map((msg, i) => (
                <div key={i} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        msg.category === "Attendance" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        msg.category === "Academic" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        msg.category === "Discipline" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        msg.category === "Fee" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {msg.category || "General"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 mb-1">{msg.subject}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Sent by: <strong className="text-slate-200">{msg.senderName}</strong> ({msg.senderRole})</span>
                    <span className="text-slate-500">To: {msg.recipientName || msg.recipientType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 4: Daily Log Timeline & Callback Request Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Log */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-bold flex items-center gap-2.5 text-blue-400 mb-6 uppercase tracking-wider text-xs">
              <FiCalendar /> Attendance Log (Last 15 Records)
            </h2>
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                No attendance events logged.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 px-4">Subject</th>
                      <th className="pb-3 px-4">Period</th>
                      <th className="pb-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Sort by date descending and take top 15 */}
                    {[...attendanceRecords]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 15)
                      .map((rec, i) => (
                        <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-900/10">
                          <td className="py-3 pr-4 font-medium text-slate-300">
                            {new Date(rec.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-slate-200 font-semibold">{rec.subject}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono">Period {rec.period}</td>
                          <td className="py-3 px-4 text-emerald-400 font-bold flex items-center gap-1">
                            <FiCheckCircle size={14} /> Present
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Feedback Form */}
          <div className="bg-slate-900 rounded-2xl border border-slate-900 p-6 shadow-xl flex flex-col justify-between">
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2.5 text-blue-400 uppercase tracking-wider text-xs">
                <FiMessageSquare /> Call Request / Feedback
              </h2>
              <p className="text-slate-400 text-xs">
                Have questions about your ward's progress? Send a direct message to the class mentor and HOD here.
              </p>
              
              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Your Name</label>
                <input
                  type="text"
                  name="parentName"
                  value={feedback.parentName}
                  onChange={handleFeedbackChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="Father / Mother Name"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Contact Phone Number</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={feedback.contactNumber}
                  onChange={handleFeedbackChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="Mobile number for callback"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1 uppercase font-bold tracking-wider">Query / Message</label>
                <textarea
                  name="message"
                  value={feedback.message}
                  onChange={handleFeedbackChange}
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="Explain your query..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={feedbackLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-500/10 transition-all uppercase tracking-wider"
              >
                {feedbackLoading ? "Sending request..." : "Submit Message Request"}
              </button>
            </form>

            <div className="text-[10px] text-slate-500 text-center mt-4">
              We usually call back within 1 working day.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParentPortal;

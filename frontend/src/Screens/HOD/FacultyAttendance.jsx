import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiCalendar, 
  FiBarChart2, 
  FiTrendingUp, 
  FiCheckCircle, 
  FiXCircle, 
  FiArrowRight,
  FiPieChart,
  FiInfo
} from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const FacultyAttendance = ({ branch }) => {
  const [faculties, setFaculties] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyStats, setFacultyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [workingDays, setWorkingDays] = useState(0);

  useEffect(() => {
    fetchData();
  }, [branch, month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch Monthly Config (Working Days)
      const configRes = await axios.get(`${baseApiURL()}/accounts/attendance/config?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (configRes.data.success && configRes.data.config) {
        setWorkingDays(configRes.data.config.totalWorkingDays);
      } else {
        // Fallback working days calculation
        const totalDays = new Date(year, month, 0).getDate();
        let sundays = 0;
        for (let d = 1; d <= totalDays; d++) {
          if (new Date(year, month - 1, d).getDay() === 0) sundays++;
        }
        setWorkingDays(totalDays - sundays);
      }

      // Fetch Faculty Details (Filtered by Branch)
      const facultyRes = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (facultyRes.data.success) {
        const branchFaculties = facultyRes.data.faculties.filter(f => f.department === branch);
        setFaculties(branchFaculties);
      }

      // Fetch Attendance Records
      const attendanceRes = await axios.get(`${baseApiURL()}/accounts/attendance/all?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (attendanceRes.data.success) {
        setAttendanceData(attendanceRes.data.attendance);
      }
    } catch (error) {
      toast.error("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyStats = async (faculty) => {
    setSelectedFaculty(faculty);
    setStatsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/accounts/attendance/stats/${faculty.employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setFacultyStats(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch faculty stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const getAttendanceForFaculty = (facultyId) => {
    return attendanceData.find(a => a.facultyId === facultyId);
  };

  // Department Summary Stats
  const getDeptSummary = () => {
    if (faculties.length === 0) return { avg: 0, totalPresent: 0, totalWorking: 0 };
    
    let totalPresent = 0;
    faculties.forEach(f => {
      const att = getAttendanceForFaculty(f.employeeId);
      totalPresent += att ? att.presentDays : workingDays;
    });
    
    const totalWorkingPossible = faculties.length * workingDays;
    const avg = totalWorkingPossible > 0 ? (totalPresent / totalWorkingPossible) * 100 : 0;
    
    return {
      avg: avg.toFixed(1),
      totalPresent,
      totalWorking: totalWorkingPossible
    };
  };

  const summary = getDeptSummary();

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Faculty Attendance</h1>
            <p className="text-slate-500 mt-1 flex items-center">
              <FiUsers className="mr-2" /> Tracking attendance for {branch} Department
            </p>
          </div>
          
          <div className="flex space-x-3 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent px-4 py-2 text-sm font-semibold outline-none border-r border-slate-100"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent px-4 py-2 text-sm font-semibold outline-none"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-blue-50 p-4 rounded-2xl">
              <FiTrendingUp className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Department Avg</p>
              <h3 className="text-2xl font-bold text-slate-800">{summary.avg}%</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-emerald-50 p-4 rounded-2xl">
              <FiCheckCircle className="text-emerald-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Present Days</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {(summary.totalPresent / faculties.length).toFixed(1)} <span className="text-sm text-slate-400">/ {workingDays}</span>
              </h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4"
          >
            <div className="bg-purple-50 p-4 rounded-2xl">
              <FiCalendar className="text-purple-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Working Days</p>
              <h3 className="text-2xl font-bold text-slate-800">{workingDays} Days</h3>
            </div>
          </motion.div>
        </div>

        {/* Main Content: Faculty List & Individual Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Faculty List Table */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Faculty Roster</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Faculty Member</th>
                      <th className="px-6 py-4 text-center">Present / Total</th>
                      <th className="px-6 py-4 text-center">Attendance %</th>
                      <th className="px-6 py-4 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {faculties.map((f) => {
                      const att = getAttendanceForFaculty(f.employeeId);
                      const present = att ? att.presentDays : workingDays;
                      const percent = workingDays > 0 ? ((present / workingDays) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr 
                          key={f._id} 
                          onClick={() => fetchFacultyStats(f)}
                          className={`group cursor-pointer transition-colors ${selectedFaculty?.employeeId === f.employeeId ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                {f.firstName[0]}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">{f.firstName} {f.lastName}</div>
                                <div className="text-xs text-slate-400">{f.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-slate-700">{present} / {workingDays}</span>
                            <p className="text-[10px] text-slate-400 uppercase font-semibold">Days</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${parseFloat(percent) >= 90 ? 'text-emerald-600' : parseFloat(percent) >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {percent}%
                              </span>
                              <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${parseFloat(percent) >= 90 ? 'bg-emerald-500' : parseFloat(percent) >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                              <FiArrowRight />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Individual Analytics Panel */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedFaculty ? (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 h-full flex flex-col"
                >
                  {statsLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="text-slate-500 font-medium">Analyzing Data...</p>
                    </div>
                  ) : facultyStats ? (
                    <>
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">{selectedFaculty.firstName} {selectedFaculty.lastName}</h3>
                          <p className="text-slate-500 text-sm">Attendance Trends & History</p>
                        </div>
                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-blue-600/20">
                          {selectedFaculty.employeeId}
                        </div>
                      </div>

                      {/* Summary Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Optional Leaves</p>
                          <div className="flex items-end space-x-2">
                            <span className="text-2xl font-black text-slate-800">{facultyStats.optionalLeave.used}</span>
                            <span className="text-slate-400 font-medium mb-1">/ {facultyStats.optionalLeave.available}</span>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Avg Attendance</p>
                          <div className="flex items-end space-x-2">
                            <span className="text-2xl font-black text-blue-600">
                              {(facultyStats.stats.reduce((acc, s) => acc + s.percentage, 0) / facultyStats.stats.length).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Performance Highlights */}
                      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 mb-8">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Monthly Performance</h4>
                        <div className="flex justify-between items-center">
                          <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Present</p>
                            <span className="text-xl font-black text-slate-800">
                              {getAttendanceForFaculty(selectedFaculty.employeeId)?.presentDays || workingDays}
                            </span>
                          </div>
                          <div className="h-8 w-px bg-blue-200 mx-4"></div>
                          <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Working</p>
                            <span className="text-xl font-black text-slate-800">{workingDays}</span>
                          </div>
                          <div className="h-8 w-px bg-blue-200 mx-4"></div>
                          <div className="text-center flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Absences</p>
                            <span className="text-xl font-black text-rose-500">
                              {workingDays - (getAttendanceForFaculty(selectedFaculty.employeeId)?.presentDays || workingDays)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chart Section */}
                      <div className="flex-1 min-h-[300px] mb-8">
                        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                          <FiBarChart2 className="mr-2 text-blue-500" /> 6-Month Attendance Trend
                        </h4>
                        <div className="w-full h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={facultyStats.stats}>
                              <defs>
                                <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="month" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                              />
                              <YAxis 
                                hide 
                                domain={[0, 100]} 
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '4 4' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="percentage" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorPercent)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Stats Table Breakdown */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detailed History</h4>
                        {facultyStats.stats.map((s, i) => (
                          <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                            <span className="text-sm font-bold text-slate-700">{s.month} 2024</span>
                            <div className="flex items-center space-x-4">
                              <span className="text-xs text-slate-400 font-medium">{s.presentDays} / {s.totalDays} Days</span>
                              <span className={`text-sm font-black ${s.percentage >= 90 ? 'text-emerald-500' : 'text-slate-800'}`}>{s.percentage}%</span>
                            </div>
                          </div>
                        )).reverse()}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <FiInfo size={48} className="mb-4 opacity-20" />
                      <p>Failed to load analytics</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center h-full"
                >
                  <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                    <FiPieChart className="text-4xl text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Select a Faculty Member</h3>
                  <p className="text-slate-500 text-sm max-w-xs">Click on any faculty member from the list to view their detailed attendance analytics and 6-month history trends.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyAttendance;

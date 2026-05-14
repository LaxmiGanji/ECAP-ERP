import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseApiURL } from '../../baseUrl';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiSettings, FiCalendar, FiUsers, FiBarChart2, FiPlus, FiTrash2, FiSave, FiAlertCircle } from 'react-icons/fi';

const AccountsHome = () => {
  const router = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('config');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Monthly Config State
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [workingDays, setWorkingDays] = useState(26);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });

  // Faculty Attendance State
  const [faculties, setFaculties] = useState([]);
  const [facultyAttendance, setFacultyAttendance] = useState([]);

  useEffect(() => {
    if (!router.state?.loginid || router.state?.type !== 'Accounts') {
      navigate('/');
    } else {
      const autoWorkingDays = getWorkingDays(month, year);
      setWorkingDays(autoWorkingDays);
      fetchMonthlyConfig();
      fetchFaculties();
    }
  }, [month, year]);

  const getWorkingDays = (m, y) => {
    const totalDays = new Date(y, m, 0).getDate();
    let sundays = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (new Date(y, m - 1, d).getDay() === 0) sundays++;
    }
    return totalDays - sundays;
  };

  const fetchMonthlyConfig = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApiURL()}/accounts/attendance/config?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.config) {
        setWorkingDays(response.data.config.totalWorkingDays);
        setHolidays(response.data.config.globalHolidays);
      } else {
        // If no config exists, use our auto-calculated value (Total Days - Sundays)
        const autoDays = getWorkingDays(month, year);
        setWorkingDays(autoDays);
        setHolidays([]);
      }
    } catch (error) {
      console.error("Config fetch error:", error);
    }
  };

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem("token");
      const facultyResponse = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const attendanceResponse = await axios.get(`${baseApiURL()}/accounts/attendance/all?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (facultyResponse.data.success) {
        setFaculties(facultyResponse.data.faculties);
      }
      if (attendanceResponse.data.success) {
        setFacultyAttendance(attendanceResponse.data.attendance);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };

  const handleUpdateAttendance = async (facultyId, presentDays, optionalLeavesUsed) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${baseApiURL()}/accounts/attendance/update`, {
        facultyId, month, year, presentDays, optionalLeavesUsed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Attendance updated!");
        fetchFaculties();
      }
    } catch (error) {
      toast.error("Failed to update attendance");
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${baseApiURL()}/accounts/attendance/config`, {
        month, year, totalWorkingDays: workingDays, globalHolidays: holidays
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Monthly configuration saved!");
      }
    } catch (error) {
      toast.error("Failed to save config");
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.reason) return;
    setHolidays([...holidays, newHoliday]);
    setWorkingDays(prev => prev - 1);
    setNewHoliday({ date: '', reason: '' });
  };

  const removeHoliday = (index) => {
    const updated = holidays.filter((_, i) => i !== index);
    setHolidays(updated);
    setWorkingDays(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-[#0f172a] text-white flex flex-col shadow-2xl transition-transform duration-300 z-50 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="p-8 border-b border-white/10">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Accounts Hub</h1>
          <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest font-semibold">Institute Administration</p>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          <button 
            onClick={() => { setActiveTab('config'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'config' ? 'bg-blue-600 shadow-lg shadow-blue-600/30 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FiSettings className="text-xl" /> <span className="font-medium">Monthly Setup</span>
          </button>
          <button 
            onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'attendance' ? 'bg-blue-600 shadow-lg shadow-blue-600/30 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FiUsers className="text-xl" /> <span className="font-medium">Faculty Track</span>
          </button>
          <button 
            onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === 'analytics' ? 'bg-blue-600 shadow-lg shadow-blue-600/30 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <FiBarChart2 className="text-xl" /> <span className="font-medium">Analytics</span>
          </button>
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={() => navigate('/')} className="w-full flex items-center space-x-4 px-5 py-4 text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all duration-300">
            <FiLogOut className="text-xl" /> <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-10 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center z-10 gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
             >
               <FiSettings className="text-xl text-slate-800" />
             </button>
             <div className="bg-blue-50 p-2 md:p-3 rounded-2xl hidden sm:block">
                <FiCalendar className="text-blue-600 text-xl md:text-2xl" />
             </div>
             <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate max-w-[180px] md:max-w-none">Attendance Config</h2>
                <p className="text-slate-500 text-xs md:text-sm">Managing records for {new Date(year, month-1).toLocaleString('default', { month: 'long' })} {year}</p>
             </div>
          </div>
          <div className="flex space-x-2 md:space-x-4 w-full md:w-auto justify-end">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="flex-1 md:flex-none bg-white border border-slate-200 px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="flex-1 md:flex-none bg-white border border-slate-200 px-2 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8fafc]">
          {activeTab === 'config' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Working Days Card */}
               <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><FiSettings className="mr-2 text-blue-500" /> Working Days</h3>
                  <div className="space-y-6">
                     <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-2">Original Working Days</label>
                        <input 
                          type="number" 
                          value={workingDays} 
                          onChange={(e) => setWorkingDays(parseInt(e.target.value))}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-800 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        />
                     </div>
                     <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-4">
                        <FiAlertCircle className="text-amber-500 text-xl mt-1" />
                        <p className="text-sm text-amber-700 font-medium leading-relaxed">Adjust working days manually or add holidays to auto-calculate the final count.</p>
                     </div>
                     <button 
                       onClick={handleSaveConfig}
                       disabled={loading}
                       className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                     >
                       {loading ? "Saving Changes..." : "Save Configuration"}
                     </button>
                  </div>
               </div>

               {/* Holiday Management Card */}
               <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center"><FiCalendar className="mr-2 text-rose-500" /> Global Holidays</h3>
                                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                     <input 
                       type="date" 
                       value={newHoliday.date}
                       onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                       className="w-full sm:flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                     />
                     <input 
                       type="text" 
                       placeholder="Occasion / Reason"
                       value={newHoliday.reason}
                       onChange={(e) => setNewHoliday({...newHoliday, reason: e.target.value})}
                       className="w-full sm:flex-[2] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                     />
                     <button 
                       onClick={addHoliday}
                       className="w-full sm:w-auto px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 flex justify-center items-center"
                     >
                        <FiPlus className="text-xl" />
                     </button>
                  </div>                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {holidays.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl">
                           <FiCalendar className="mx-auto text-4xl mb-4 opacity-20" />
                           <p className="font-medium">No global holidays added for this month.</p>
                        </div>
                     ) : (
                        holidays.map((h, i) => (
                           <motion.div 
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             key={i} 
                             className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all"
                           >
                              <div className="flex items-center space-x-4">
                                 <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono text-sm font-bold text-blue-600">{h.date}</div>
                                 <span className="font-semibold text-slate-700">{h.reason}</span>
                              </div>
                              <button onClick={() => removeHoliday(i)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                 <FiTrash2 size={18} />
                              </button>
                           </motion.div>
                        ))
                     )}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="text-xl font-bold text-slate-800">Faculty Attendance Overview</h3>
                   <div className="flex space-x-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Working Days: {workingDays}</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">Active Faculty: {faculties.length}</span>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="px-8 py-5">Faculty Member</th>
                            <th className="px-8 py-5">Department</th>
                            <th className="px-8 py-5">Present Days</th>
                            <th className="px-8 py-5">Optional (Used/Total)</th>
                            <th className="px-8 py-5">Attendance %</th>
                            <th className="px-8 py-5 text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {faculties.map((f) => {
                            const att = facultyAttendance.find(a => a.facultyId === f.employeeId);
                            const currentPresent = att ? att.presentDays : workingDays;
                            const attendancePercent = workingDays > 0 ? ((currentPresent / workingDays) * 100).toFixed(1) : "0.0";
                            
                            return (
                             <tr key={f._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5">
                                   <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">{f.firstName[0]}</div>
                                      <div>
                                         <div className="font-bold text-slate-800">{f.firstName} {f.lastName}</div>
                                         <div className="text-xs text-slate-400">{f.employeeId}</div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-slate-600">{f.department}</td>
                                <td className="px-8 py-5">
                                   <input 
                                     type="number" 
                                     defaultValue={att ? att.presentDays : workingDays} 
                                     id={`present-${f.employeeId}`}
                                     className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                                   />
                                </td>
                                <td className="px-8 py-5 text-sm font-bold text-slate-700">
                                   <input 
                                     type="number" 
                                     defaultValue={att ? att.optionalLeavesUsed : 0} 
                                     id={`optional-${f.employeeId}`}
                                     className="w-12 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-blue-500 mr-2" 
                                   />
                                   <span className="text-slate-400">/</span> {month}
                                </td>
                                <td className="px-8 py-5">
                                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1">
                                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${attendancePercent}%` }}></div>
                                   </div>
                                   <span className="text-xs font-bold text-emerald-600">{attendancePercent}%</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                   <button 
                                     onClick={() => {
                                       const p = document.getElementById(`present-${f.employeeId}`).value;
                                       const o = document.getElementById(`optional-${f.employeeId}`).value;
                                       handleUpdateAttendance(f.employeeId, parseInt(p), parseInt(o));
                                     }}
                                     className="text-blue-600 font-bold text-sm hover:underline"
                                   >
                                     Update
                                   </button>
                                </td>
                             </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AccountsHome;

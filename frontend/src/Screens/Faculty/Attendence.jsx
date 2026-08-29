import { useState } from "react";
import AddAttendance from "./AddAttendance";
import ViewTotalAttendance from "./ViewTotalAttendance";
import ViewAttendenceByDate from "./ViewAttendenceByDate";
import { FiPlusCircle, FiCalendar, FiBarChart2 } from "react-icons/fi";

const Attendence = () => {
  const [activeTab, setActiveTab] = useState('add');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Attendance Management</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Record daily attendance, view history by date, and track total student attendance</p>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              activeTab === "add"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiPlusCircle className="w-4 h-4" />
              <span>Add Attendance</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              activeTab === "viewDate"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("viewDate")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiCalendar className="w-4 h-4" />
              <span>Attendance By Date</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              activeTab === "view"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiBarChart2 className="w-4 h-4" />
              <span>View Total Attendance</span>
            </div>
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="w-full">
        {activeTab === "add" && <AddAttendance />}
        {activeTab === "viewDate" && <ViewAttendenceByDate />}
        {activeTab === "view" && <ViewTotalAttendance />}
      </div>
    </div>
  );
};

export default Attendence;
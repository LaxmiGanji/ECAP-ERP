import { useState } from "react";
import AddAttendance from "./AddAttendance";
import DeleteAttendance from "./DeleteAttendance";
import ViewTotalAttendance from "../Faculty/ViewTotalAttendance";
import { FiUserCheck, FiEye } from "react-icons/fi";
import ImportAttendance from "./ImportAttendance";

const Attendence = ({ branch }) => {
  const [activeTab, setActiveTab] = useState('add');
  
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-xs md:text-sm mt-1">Add, view, import & manage student attendance records {branch ? `for ${branch}` : ''}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              activeTab === "add"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserCheck className="w-4 h-4" />
              <span>Add Attendance</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              activeTab === "import"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("import")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserCheck className="w-4 h-4" />
              <span>Import Attendance</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              activeTab === "view"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEye className="w-4 h-4" />
              <span>View Total</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              activeTab === "delete"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setActiveTab("delete")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserCheck className="w-4 h-4" />
              <span>Delete Attendance</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === "add" && <AddAttendance branch={branch} />}
        {activeTab === "import" && <ImportAttendance branch={branch} />}
        {activeTab === "view" && <ViewTotalAttendance branch={branch} />}
        {activeTab === "delete" && <DeleteAttendance branch={branch} />}
      </div>
    </div>
  );
};

export default Attendence;
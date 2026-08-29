import { useState } from "react";
import AddStudent from "./Student/AddStudent";
import EditStudent from "./Student/EditStudent";
import ViewStudents from "./Student/ViewStudents";
import ImportStudent from "./Student/ImportStudent";
import ViewDetainStudents from "./Student/ViewDetainStudents";
import Graduation from "./Student/Graduation";
import { FiUserPlus, FiEdit, FiEye, FiDownload, FiUserX, FiAward } from "react-icons/fi";

const Student = ({ branch, onMessageParent }) => {
  const [selected, setSelected] = useState("add");
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Student Management</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Manage student profiles, details, import data, detentions & graduation {branch ? `for ${branch}` : ''}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              selected === "add"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              selected === "edit"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("edit")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEdit className="w-4 h-4" />
              <span>Edit Student</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              selected === "view"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEye className="w-4 h-4" />
              <span>View Students</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              selected === "import"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("import")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>Import Data</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              selected === "detain"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("detain")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserX className="w-4 h-4 text-rose-500" />
              <span>Detain Students</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
              selected === "graduation"
                ? "bg-white text-indigo-600 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("graduation")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiAward className="w-4 h-4 text-amber-500" />
              <span>Graduation / Alumni</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected === "add" && <AddStudent branch={branch} />}
        {selected === "edit" && <EditStudent branch={branch} />}
        {selected === "view" && <ViewStudents branch={branch} onMessageParent={onMessageParent} />}
        {selected === "import" && <ImportStudent branch={branch} />}
        {selected === "detain" && <ViewDetainStudents branch={branch} />}
        {selected === "graduation" && <Graduation branch={branch} />}
      </div>
    </div>
  );
};

export default Student;

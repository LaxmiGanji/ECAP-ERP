import { useState } from "react";
import AddCertification from "./AddCertification";
import EditCertification from "./EditCertification";
import ViewCertification from "./ViewCertification";
import { FiAward, FiPlusCircle, FiEdit3, FiEye } from "react-icons/fi";

const Certifications = () => {
  const [selected, setSelected] = useState("add");

  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FiAward className="text-indigo-400" />
            <span>Student Certifications</span>
          </h1>
          <p className="text-xs md:text-sm mt-1">Upload and manage course certifications, internships & achievements</p>
        </div>
      </div>

      {/* 🔲 Bento Pill Tabs */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "add"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiPlusCircle className="w-4 h-4" />
              <span>Add Certification</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "edit"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("edit")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEdit3 className="w-4 h-4" />
              <span>Edit Certification</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "view"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEye className="w-4 h-4" />
              <span>View Certifications</span>
            </div>
          </button>
        </div>
      </div>

      {/* 📋 Active Tab Content */}
      <div className="w-full">
        {selected === "add" && <AddCertification />}
        {selected === "edit" && <EditCertification />}
        {selected === "view" && <ViewCertification />}
      </div>
    </div>
  );
};

export default Certifications;

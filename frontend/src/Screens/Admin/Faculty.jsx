import { useState } from "react";
import EditFaculty from "./Faculty/EditFaculty";
import AddFaculty from "./Faculty/AddFaculty";
import ViewFaculty from "./Faculty/ViewFaculty";
import ImportFaculty from "./Faculty/ImportFaculty";
import { FiUserPlus, FiEdit, FiEye, FiDownload } from "react-icons/fi";

const Faculty = ({ branch }) => {
  const [selected, setSelected] = useState("add");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Faculty Management</h1>
          <p className="text-xs md:text-sm mt-1">Add, edit, view & manage teaching faculty records {branch ? `for ${branch}` : ''}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "add"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserPlus className="w-4 h-4" />
              <span>Add Faculty</span>
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
              <FiEdit className="w-4 h-4" />
              <span>Edit Faculty</span>
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
              <span>View Faculty</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "import"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("import")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>Import Faculty</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected === "add" && <AddFaculty branch={branch} />}
        {selected === "edit" && <EditFaculty branch={branch} />}
        {selected === "view" && <ViewFaculty branch={branch} />}
        {selected === "import" && <ImportFaculty branch={branch} />}
      </div>
    </div>
  );
};

export default Faculty;

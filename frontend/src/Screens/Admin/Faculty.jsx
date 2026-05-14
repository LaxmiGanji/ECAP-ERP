import { useState } from "react";
import EditFaculty from "./Faculty/EditFaculty";
import AddFaculty from "./Faculty/AddFaculty";
import ViewFaculty from "./Faculty/ViewFaculty";
import ImportFaculty from "./Faculty/ImportFaculty";
import { FiUserPlus, FiEdit, FiEye, FiDownload } from "react-icons/fi";

const Faculty = ({ branch }) => {
  const [selected, setSelected] = useState("add");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Faculty Management</h1>
            <p className="text-gray-600 mt-2">Add, edit, view, and manage faculty information {branch ? `for ${branch}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "add"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserPlus className="w-5 h-5" />
              <span>Add Faculty</span>
            </div>
          </button>
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "edit"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("edit")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEdit className="w-5 h-5" />
              <span>Edit Faculty</span>
            </div>
          </button>
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "view"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEye className="w-5 h-5" />
              <span>View Faculty</span>
            </div>
          </button>
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "import"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("import")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiDownload className="w-5 h-5" />
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

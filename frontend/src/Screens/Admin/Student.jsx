import { useState } from "react";
import AddStudent from "./Student/AddStudent";
import EditStudent from "./Student/EditStudent";
import ViewStudents from "./Student/ViewStudents";
import ImportStudent from "./Student/ImportStudent";
import { FiUserPlus, FiEdit, FiEye, FiDownload } from "react-icons/fi";
import ViewDetainStudents from "./Student/ViewDetainStudents";

const Student = ({ branch }) => {
  const [selected, setSelected] = useState("add");
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Management</h1>
            <p className="text-gray-600 mt-2">Add, edit, view, and manage student information {branch ? `for ${branch}` : ''}</p>
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
              <span>Add Student</span>
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
              <span>Edit Student</span>
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
              <span>View Students</span>
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
              <span>Import Students</span>
            </div>
          </button>
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "detain"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("detain")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiDownload className="w-5 h-5" />
              <span>Detain Students</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected === "add" && <AddStudent branch={branch} />}
        {selected === "edit" && <EditStudent branch={branch} />}
        {selected === "view" && <ViewStudents branch={branch} />}
        {selected === "import" && <ImportStudent branch={branch} />}
        {selected === "detain" && <ViewDetainStudents branch={branch} />}
      </div>
    </div>
  );
};

export default Student;

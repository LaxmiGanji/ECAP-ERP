// Timetables.jsx
import { useState } from "react";
import { FiUserPlus, FiEdit, FiDownload } from "react-icons/fi";
import StudentTimetable from "./StudentTimetable";
import FacultyTimetable from "./FacultyTimetable";

const Timetables = ({ branch }) => {
  const [selected, setSelected] = useState("student-timetable");
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Timetable Management</h1>
            <p className="text-gray-600 mt-2">Manage student and faculty timetables with Excel import support {branch ? `for ${branch}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "student-timetable"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("student-timetable")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserPlus className="w-5 h-5" />
              <span>Student Timetable</span>
            </div>
          </button>
          <button
            className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-200 ${
              selected === "faculty-timetable"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            onClick={() => setSelected("faculty-timetable")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiEdit className="w-5 h-5" />
              <span>Faculty Timetable</span>
            </div>
          </button>
        </div>
        
        {/* Feature badges */}
        <div className="flex justify-end px-6 py-2 bg-gray-50">
          <div className="flex space-x-4 text-sm">
            <span className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Create
            </span>
            <span className="flex items-center text-blue-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </span>
            <span className="flex items-center text-purple-600">
              <FiDownload className="w-4 h-4 mr-1" />
              Import Excel
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected === "student-timetable" && <StudentTimetable branch={branch} />}
        {selected === "faculty-timetable" && <FacultyTimetable branch={branch} />}
      </div>
    </div>
  );
};

export default Timetables;
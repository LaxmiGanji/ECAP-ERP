import { useState } from "react";
import { FiCalendar, FiClock, FiUsers, FiUserCheck } from "react-icons/fi";
import StudentTimetable from "./StudentTimetable";
import FacultyTimetable from "./FacultyTimetable";

const Timetables = ({ branch }) => {
  const [selected, setSelected] = useState("student-timetable");
  
  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FiCalendar className="text-indigo-600" />
            <span>Timetable Management</span>
          </h1>
          <p className="text-xs md:text-sm mt-1">Configure & schedule class timetables for students and teaching faculty {branch ? `for ${branch}` : ''}</p>
        </div>
      </div>

      {/* 🔲 Bento Pill Tabs */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "student-timetable"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("student-timetable")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUsers className="w-4 h-4" />
              <span>Student Timetable</span>
            </div>
          </button>
          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "faculty-timetable"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("faculty-timetable")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUserCheck className="w-4 h-4" />
              <span>Faculty Timetable</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full">
        {selected === "student-timetable" && <StudentTimetable branch={branch} />}
        {selected === "faculty-timetable" && <FacultyTimetable branch={branch} />}
      </div>
    </div>
  );
};

export default Timetables;
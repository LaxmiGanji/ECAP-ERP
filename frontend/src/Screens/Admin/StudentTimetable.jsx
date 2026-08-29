// StudentTimetable.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import ViewTimetable from "../Common/ViewTimetable";
import TimetableImport from "./TimetableImport";
import SearchableFacultySelect from "../../components/SearchableFacultySelect";

const StudentTimetable = ({ branch: lockedBranch }) => {
  const [selectedTab, setSelectedTab] = useState("create");
  const [selected, setSelected] = useState({ 
    branch: lockedBranch || "", 
    semester: "", 
    section: "", 
    regulation: "",
    classIncharge: "" 
  });
  const [branch, setBranch] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [sectionsList, setSectionsList] = useState(["A", "B", "C", "D"]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        let params = {};
        if (selected.branch) params.branch = selected.branch;
        if (selected.semester) params.semester = selected.semester;
        const res = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, { params });
        if (res.data.success && res.data.sections?.length > 0) {
          setSectionsList(res.data.sections);
        }
      } catch (err) {
        console.error("Error fetching dynamic sections:", err);
      }
    };
    fetchSections();
  }, [selected.branch, selected.semester]);

  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    getBranchData();
    getSubjectData();
    getFacultyData();
  }, []);

  // Filter subjects when branch, semester or regulation changes
  useEffect(() => {
    if (selected.branch && selected.semester) {
      const filtered = subjects.filter(
        (subject) => 
          subject.semester === parseInt(selected.semester) && 
          subject.branch?.name === selected.branch &&
          (!selected.regulation || subject.regulation?.toUpperCase() === selected.regulation.toUpperCase())
      );
      setFilteredSubjects(filtered);
      setSchedule(prev => {
        const newSchedule = { ...prev };
        Object.keys(newSchedule).forEach(day => {
          newSchedule[day] = newSchedule[day].map(period => ({
            ...period,
            subject: ""
          }));
        });
        return newSchedule;
      });
    } else {
      setFilteredSubjects([]);
    }
  }, [selected.branch, selected.semester, selected.regulation, subjects]);

  // Auto-detect regulation based on students in the selected class
  useEffect(() => {
    if (selected.branch && selected.semester && selected.section) {
      axios
        .post(`${baseApiURL()}/student/details/getDetails`, {
          branch: selected.branch,
          semester: selected.semester,
          section: selected.section,
        })
        .then((res) => {
          if (res.data.success && res.data.user.length > 0) {
            const detectedRegulation = res.data.user[0].regulation;
            if (detectedRegulation) {
              setSelected(prev => ({ ...prev, regulation: detectedRegulation.toUpperCase() }));
            }
          }
        })
        .catch((err) => console.error("Error fetching students for regulation:", err));
    }
  }, [selected.branch, selected.semester, selected.section]);

  const getBranchData = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data.success) {
          setBranch(res.data.branches);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch branches");
      });
  };

  const getSubjectData = () => {
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((res) => {
        if (res.data.success) {
          setSubjects(res.data.subject);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch subjects");
      });
  };

  const getFacultyData = () => {
    axios
      .get(`${baseApiURL()}/faculty/details/getDetails2`)
      .then((res) => {
        if (res.data.success) {
          setFaculties(res.data.faculties);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch faculty data");
      });
  };

  const addPeriod = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: [...prev[day], {
        periodNumber: prev[day].length + 1,
        subject: "",
        faculty: "",
        startTime: "",
        endTime: ""
      }]
    }));
  };

  const removePeriod = (day, index) => {
    setSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index).map((period, i) => ({
        ...period,
        periodNumber: i + 1
      }))
    }));
  };

  const updatePeriod = (day, index, field, value) => {
    setSchedule(prev => {
      const daySchedule = [...prev[day]];
      while (daySchedule.length <= index) {
        daySchedule.push({
          periodNumber: daySchedule.length + 1,
          subject: "",
          faculty: "",
          startTime: "",
          endTime: ""
        });
      }
      daySchedule[index] = {
        ...daySchedule[index],
        [field]: value
      };
      return {
        ...prev,
        [day]: daySchedule
      };
    });
  };

  const addTimetableHandler = () => {
    if (!selected.branch || !selected.semester || !selected.section) {
      toast.error("Please select branch, semester and section");
      return;
    }

    const periodsToSave = {};
    let allPeriodsValid = true;

    Object.entries(schedule).forEach(([day, periods]) => {
      const activePeriods = periods.filter(period =>
        period.subject || period.faculty || period.startTime || period.endTime
      );

      if (activePeriods.length > 0) {
        activePeriods.forEach(period => {
          // For Break, Sports, Library, faculty can be empty
          const isSpecialPeriod = ["Break", "Sports", "Library"].includes(period.subject);
          
          if (
            !period.subject ||
            (!isSpecialPeriod && !period.faculty) ||
            !period.startTime ||
            !period.endTime
          ) {
            allPeriodsValid = false;
            toast.error(`Please fill all fields for active periods on ${day}.`);
            return;
          }
        });
        periodsToSave[day] = activePeriods;
      }
    });

    if (!allPeriodsValid) return;

    const hasAnyPeriods = Object.values(periodsToSave).some(dayPeriods => dayPeriods.length > 0);
    if (!hasAnyPeriods) {
      toast.error("No periods entered. Please add at least one period.");
      return;
    }

    // Prepare schedule data for backend
    const formattedSchedule = Object.entries(periodsToSave).map(([day, periods]) => ({
      day,
      periods: periods.map(period => ({
        ...period,
        // Set faculty to empty string for special periods
        faculty: ["Break", "Sports", "Library"].includes(period.subject) ? "" : period.faculty,
        regulation: selected.regulation
      }))
    }));

    toast.loading("Adding Timetable");
    axios
      .post(`${baseApiURL()}/timetable/addTimetable`, {
        branch: selected.branch,
        semester: selected.semester,
        section: selected.section,
        schedule: JSON.stringify(formattedSchedule),
        metadata: {
          classIncharge: selected.classIncharge || ""
        }
      })
      .then((res) => {
        toast.dismiss();
        if (res.data.success) {
          toast.success(res.data.message);
          setSelected({ branch: "", semester: "", section: "", regulation: "", classIncharge: "" });
          setSchedule({
            Monday: [], Tuesday: [], Wednesday: [],
            Thursday: [], Friday: [], Saturday: [],
          });
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        toast.dismiss();
        console.error(err);
        toast.error(err.response?.data?.message || "Error adding timetable");
      });
  };

  // Filter faculties by active branch (locked branch from HOD or selected branch from Admin)
  const targetBranch = lockedBranch || selected.branch;
  const filteredFaculties = targetBranch
    ? faculties.filter((f) => f.department === targetBranch || f.branch === targetBranch)
    : faculties;

  return (
    <div className="w-full space-y-6">
      {/* Sub-tab Navigation */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-2 gap-2">
          {["create", "view"].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs capitalize transition-all cursor-pointer ${
                selectedTab === tab
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "create" ? "Create Timetable" : "View Timetable"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
            {selectedTab === "create" && (
              <div className="space-y-8">
                {/* Selection Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label htmlFor="branch" className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>🏫</span> Select Branch
                    </label>
                    <select
                      id="branch"
                      disabled={!!lockedBranch}
                      className={`w-full ${lockedBranch ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      value={selected.branch}
                      onChange={(e) => setSelected({ ...selected, branch: e.target.value })}
                    >
                      <option value="">Select Branch</option>
                      {branch.map((b) => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="semester" className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>📚</span> Select Semester
                    </label>
                    <select
                      id="semester"
                      className="w-full"
                      value={selected.semester}
                      onChange={(e) => setSelected({ ...selected, semester: e.target.value })}
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>{sem} Semester</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="regulation" className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>🛡️</span> Regulation
                    </label>
                    <input
                      id="regulation"
                      type="text"
                      placeholder="Auto-detected"
                      className="w-full bg-slate-50 font-bold text-indigo-600 cursor-not-allowed"
                      value={selected.regulation}
                      readOnly
                    />
                  </div>

                  <div>
                    <label htmlFor="section" className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>👥</span> Select Section
                    </label>
                    <select
                      id="section"
                      className="w-full"
                      value={selected.section}
                      onChange={(e) => setSelected({ ...selected, section: e.target.value })}
                    >
                      <option value="">Select Section</option>
                      {sectionsList.map((sec) => (
                        <option key={sec} value={sec}>Section {sec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>👤</span> Class Incharge
                    </label>
                    <SearchableFacultySelect
                      faculties={filteredFaculties}
                      value={selected.classIncharge}
                      onChange={(val) => setSelected(prev => ({ ...prev, classIncharge: val }))}
                    />
                  </div>
                </div>

                {/* Help Text */}
                {selected.branch && selected.semester && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-700">
                        <strong>Branch and Semester Selected:</strong> Subjects will be filtered automatically based on your selection. 
                        Only subjects assigned to {selected.branch} - Semester {selected.semester} will be available in the timetable.
                        {filteredSubjects.length > 0 && (
                          <span className="ml-2 font-semibold">({filteredSubjects.length} subjects available)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timetable Grid */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Filter Status */}
                  {selected.branch && selected.semester && (
                    <div className="bg-blue-50 border-b border-gray-200 p-4">
                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                        <span className="text-sm text-blue-700">
                          Showing subjects for {selected.branch} - Semester {selected.semester} 
                          {filteredSubjects.length > 0 ? ` (${filteredSubjects.length} subjects available)` : ' (No subjects available)'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <table className="min-w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-20 bg-slate-900 text-white py-3.5 px-5 text-left text-xs font-extrabold uppercase tracking-wider border-b border-slate-800 shadow-sm min-w-[120px]">
                            Day / Period
                          </th>
                          {Array.from({ length: Math.max(...daysOfWeek.map(day => schedule[day].length), 1) }).map((_, i) => (
                            <th key={i} className="min-w-[340px] w-[340px] bg-slate-900 text-white py-3.5 px-4 text-center text-xs font-extrabold uppercase tracking-wider border-b border-r border-slate-800">
                              Period {i + 1}
                            </th>
                          ))}
                          <th className="sticky right-0 z-20 bg-slate-900 text-white py-3.5 px-5 text-center text-xs font-extrabold uppercase tracking-wider border-b border-slate-800 shadow-sm min-w-[130px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {daysOfWeek.map((day) => (
                          <tr key={day} className="hover:bg-slate-50/50">
                            <td className="sticky left-0 z-10 bg-white py-4 px-5 font-bold text-xs text-slate-900 shadow-xs border-r border-slate-200 align-top pt-6">
                              {day}
                            </td>
                            {Array.from({ length: Math.max(schedule[day].length, 1) }).map((_, index) => (
                              <td key={index} className="py-4 px-3 align-top border-r border-slate-100">
                                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 shadow-2xs hover:shadow-xs transition-all">
                                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                    <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">
                                      Period {index + 1}
                                    </span>
                                    {schedule[day][index] && (
                                      <button
                                        type="button"
                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                                        onClick={() => removePeriod(day, index)}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>

                                  {/* Subject Dropdown */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Subject
                                    </label>
                                    <select
                                      className={`w-full text-xs font-semibold rounded-xl ${
                                        !selected.branch || !selected.semester || filteredSubjects.length === 0
                                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                                          : "bg-white text-slate-800 border-slate-300"
                                      }`}
                                      value={schedule[day][index]?.subject || ""}
                                      onChange={(e) => updatePeriod(day, index, "subject", e.target.value)}
                                      disabled={!selected.branch || !selected.semester || filteredSubjects.length === 0}
                                    >
                                      <option value="">
                                        {!selected.branch || !selected.semester 
                                          ? "Select Branch & Semester First" 
                                          : filteredSubjects.length === 0 
                                            ? "No Subjects Available" 
                                            : "Select Subject"}
                                      </option>
                                      {/* Special periods */}
                                      <option value="Break">Break</option>
                                      <option value="Sports">Sports</option>
                                      <option value="Library">Library</option>
                                      {/* Academic subjects */}
                                      {filteredSubjects.map((subj) => (
                                        <option key={subj._id} value={subj.name}>
                                          {subj.name} ({subj.code}) {subj.regulation ? `[${subj.regulation}]` : ""}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Faculty Searchable Dropdown */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Faculty
                                    </label>
                                    <SearchableFacultySelect
                                      faculties={filteredFaculties}
                                      value={schedule[day][index]?.faculty || ""}
                                      onChange={(val) => updatePeriod(day, index, "faculty", val)}
                                      disabled={["Break", "Sports", "Library"].includes(schedule[day][index]?.subject)}
                                    />
                                  </div>

                                  {/* Time Inputs */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Period Timing
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="time"
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2 text-slate-800"
                                        value={schedule[day][index]?.startTime || ""}
                                        onChange={(e) => updatePeriod(day, index, "startTime", e.target.value)}
                                      />
                                      <input
                                        type="time"
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-2 text-slate-800"
                                        value={schedule[day][index]?.endTime || ""}
                                        onChange={(e) => updatePeriod(day, index, "endTime", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            ))}
                            <td className="sticky right-0 z-10 bg-white py-4 px-4 text-center align-middle border-l border-slate-100 shadow-xs">
                              <button
                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                onClick={() => addPeriod(day)}
                              >
                                + Add Period
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-2">
                  <button
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                    onClick={addTimetableHandler}
                  >
                    Save Complete Timetable
                  </button>
                </div>
              </div>
            )}

            {selectedTab === "view" && <ViewTimetable />}
      </div>
    </div>
  );
};

export default StudentTimetable;
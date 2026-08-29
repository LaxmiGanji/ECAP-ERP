import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import ViewFacultyTimetable from "../Admin/ViewFacultyTimetable.jsx";
import { FiCalendar, FiUser, FiFilter, FiSearch, FiBookOpen } from "react-icons/fi";

const Timetable = () => {
  const [activeTab, setActiveTab] = useState("class"); // "class" | "faculty"
  const [student, setStudent] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingTimetable, setFetchingTimetable] = useState(false);

  // Filters for Class Timetable
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [sectionsList, setSectionsList] = useState(["A", "B", "C", "D"]);

  // Faculty Timetable States
  const [faculties, setFaculties] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [facultySearch, setFacultySearch] = useState("");

  const router = useLocation();
  const dispatch = useDispatch();

  // Fetch initial student details and branches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Branches
        const branchRes = await axios.get(`${baseApiURL()}/branch/getBranch`);
        if (branchRes.data.success) {
          setBranches(branchRes.data.branches);
        }

        // Fetch Faculty List
        const facultyRes = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`);
        if (facultyRes.data.success) {
          setFaculties(facultyRes.data.faculties || []);
        }

        // Fetch Student Profile Details
        if (router.state?.loginid && router.state?.type) {
          const studentRes = await axios.post(
            `${baseApiURL()}/${router.state.type}/details/getDetails`,
            { enrollmentNo: router.state.loginid },
            { headers: { "Content-Type": "application/json" } }
          );

          if (studentRes.data.success && studentRes.data.user[0]) {
            const userData = studentRes.data.user[0];
            setStudent(userData);
            setSelectedBranch(userData.branch || "");
            setSelectedSemester(userData.semester ? String(userData.semester) : "");
            setSelectedSection(userData.section || "A");
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Error fetching profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, router.state?.loginid, router.state?.type]);

  // Fetch dynamic sections list whenever branch or semester changes
  useEffect(() => {
    const fetchSections = async () => {
      try {
        let params = {};
        if (selectedBranch) params.branch = selectedBranch;
        if (selectedSemester) params.semester = selectedSemester;
        const res = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, { params });
        if (res.data.success && res.data.sections?.length > 0) {
          setSectionsList(res.data.sections);
        }
      } catch (err) {
        console.error("Error fetching dynamic sections:", err);
      }
    };
    fetchSections();
  }, [selectedBranch, selectedSemester]);

  // Fetch Class Timetable
  const fetchClassTimetable = async () => {
    if (!selectedBranch || !selectedSemester) return;

    try {
      setFetchingTimetable(true);
      const response = await axios.post(`${baseApiURL()}/timetable/getTimetable`, {
        branch: selectedBranch,
        semester: Number(selectedSemester),
        section: selectedSection || "A",
      });

      if (response.data.success && response.data.timetable.length > 0) {
        setTimetable(response.data.timetable[0]);
      } else {
        setTimetable(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching class timetable");
    } finally {
      setFetchingTimetable(false);
    }
  };

  useEffect(() => {
    if (selectedBranch && selectedSemester) {
      fetchClassTimetable();
    }
  }, [selectedBranch, selectedSemester, selectedSection]);

  const maxPeriods = () => {
    if (!timetable || !timetable.schedule) return 0;
    return Math.max(...timetable.schedule.map(day => day.periods ? day.periods.length : 0));
  };

  // Filtered Faculty list for search dropdown
  const filteredFaculties = faculties.filter((f) => {
    const fullName = `${f.firstName || ''} ${f.lastName || ''} ${f.employeeId || ''}`.toLowerCase();
    return fullName.includes(facultySearch.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-blue-600">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <span className="font-semibold text-gray-700">Loading Timetable Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 bg-gray-50 min-h-screen space-y-6">
      {/* Header Banner & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FiCalendar className="text-blue-600" />
            Timetable Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            View your class weekly schedule or search & view any faculty member's timetable.
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab("class")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "class"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            <FiBookOpen className="w-4 h-4" />
            <span>Class Timetable</span>
          </button>

          <button
            onClick={() => setActiveTab("faculty")}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "faculty"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            <FiUser className="w-4 h-4" />
            <span>Faculty Timetable</span>
          </button>
        </div>
      </div>

      {/* CLASS TIMETABLE TAB */}
      {activeTab === "class" && (
        <div className="space-y-6">
          {/* Class Filters Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <FiFilter className="text-blue-600 text-lg" />
              <h2 className="text-lg font-semibold text-gray-900">Class Timetable Filters</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Semester</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="">Select Section</option>
                  {sectionsList.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Info Pill */}
          {student && (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                Enrolled Branch: <strong className="text-blue-900">{student.branch}</strong>
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                Semester: <strong className="text-blue-900">Sem {student.semester}</strong>
              </span>
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                Section: <strong className="text-blue-900">{student.section || 'A'}</strong>
              </span>
            </div>
          )}

          {/* Timetable Table */}
          {fetchingTimetable ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500">
              <p className="text-sm font-medium">Fetching timetable...</p>
            </div>
          ) : timetable ? (
            <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm bg-white">
              <table className="min-w-[1200px] w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Day</th>
                    {Array.from({ length: maxPeriods() }).map((_, i) => (
                      <th key={i} className="py-3.5 px-4">Period {i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {timetable.schedule.map((dayEntry, index) => (
                    <tr key={dayEntry.day} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="font-bold text-xs text-blue-600 py-4 px-4">{dayEntry.day}</td>
                      {Array.from({ length: maxPeriods() }).map((_, i) => {
                        const period = dayEntry.periods ? dayEntry.periods[i] : null;
                        return (
                          <td key={i} className="py-4 px-4 text-xs text-gray-700">
                            {period ? (
                              <div className="space-y-1">
                                <span className="block font-bold text-gray-900">{period.subject}</span>
                                <span className="block text-[11px] text-gray-500 font-medium">
                                  {[period.faculty?.firstName, period.faculty?.lastName].filter(Boolean).join(' ')}
                                </span>
                                <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                  {period.startTime} - {period.endTime}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200 shadow-sm">
              <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-800">No Timetable Found</p>
              <p className="text-xs text-gray-500 mt-1">
                No timetable published for {selectedBranch} Semester {selectedSemester} Section {selectedSection || 'A'}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FACULTY TIMETABLE TAB */}
      {activeTab === "faculty" && (
        <div className="space-y-6">
          {/* Faculty Search & Selection Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <FiUser className="text-blue-600 text-lg" />
              <h2 className="text-lg font-semibold text-gray-900">Select Faculty Member</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Search Faculty Name / ID
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or employee ID..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Choose Faculty ({filteredFaculties.length})
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                >
                  <option value="">-- Select Faculty Member --</option>
                  {filteredFaculties.map((f) => (
                    <option key={f._id} value={f.employeeId}>
                      {f.firstName} {f.lastName} ({f.employeeId}) - {f.department || 'General'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Render Selected Faculty Timetable */}
          {selectedFaculty ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <ViewFacultyTimetable facultyId={selectedFaculty} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200 shadow-sm">
              <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-800">Select a Faculty Member</p>
              <p className="text-xs text-gray-500 mt-1">
                Choose a faculty member from the dropdown above to view their weekly timetable.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timetable;
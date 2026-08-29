import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { sortEnrollmentNo } from "../../utils/enrollmentSorter";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { FiAlertCircle } from "react-icons/fi";

const DeleteAttendance = ({ branch: lockedBranch }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjectObjs, setFilteredSubjectObjs] = useState([]);
  const [noStudentsMessage, setNoStudentsMessage] = useState("");
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    branch: "",
    semester: "",
    section: "",
    subject: "",
    date: null,
    period: "",
  });
  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    const fetchDynamicSections = async () => {
      if (selectedBranch && selectedSemester) {
        try {
          const response = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, {
            params: {
              branch: selectedBranch,
              semester: selectedSemester,
            },
          });
          if (response.data.success && response.data.sections) {
            setSections(response.data.sections);
            if (selectedSection && !response.data.sections.includes(selectedSection)) {
              setSelectedSection("");
            }
          }
        } catch (error) {
          console.error("Error fetching dynamic sections:", error);
        }
      } else {
        setSections([]);
        setSelectedSection("");
      }
    };
    fetchDynamicSections();
  }, [selectedBranch, selectedSemester]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/subject/getSubject`);
        if (response.data.success) {
          setAllSubjects(response.data.subject); // Store all subject objects
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/branch/getBranch`);
        if (response.data.success) {
          setBranches(response.data.branches.map(b => b.name));
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchSubjects();
    fetchBranches();
  }, []);

  useEffect(() => {
    const filterSubjectsByStudentRegulation = async () => {
      if (selectedBranch && selectedSemester) {
        let studentReg = null;
        let hasStudents = false;
        try {
          const studentRes = await axios.post(`${baseApiURL()}/student/details/getDetails`, {
            branch: selectedBranch,
            semester: Number(selectedSemester)
          });
          if (studentRes.data.success && studentRes.data.user && studentRes.data.user.length > 0) {
            hasStudents = true;
            studentReg = studentRes.data.user[0].regulation;
            setSelectedRegulation(studentReg ? studentReg.toUpperCase() : "");
          }
        } catch (err) {
          console.warn("Could not fetch students for regulation check:", err);
        }

        if (!hasStudents) {
          setSubjects([]);
          setFilteredSubjectObjs([]);
          setSelectedRegulation("");
          setNoStudentsMessage("no students are there for that semester");
          setSelectedSubject("");
          return;
        }

        setNoStudentsMessage("");

        const filtered = allSubjects.filter(
          (subject) =>
            (subject.branch?.name === selectedBranch || subject.branch === selectedBranch) &&
            String(subject.semester) === String(selectedSemester) &&
            (!studentReg || subject.regulation?.toUpperCase() === studentReg.toUpperCase())
        );
        setFilteredSubjectObjs(filtered);
        setSubjects(filtered.map(sub => sub.name));
      } else {
        setFilteredSubjectObjs(allSubjects);
        setSubjects(allSubjects.map(sub => sub.name));
        setSelectedRegulation("");
        setNoStudentsMessage("");
      }
    };
    filterSubjectsByStudentRegulation();
  }, [selectedBranch, selectedSemester, allSubjects]);

  const fetchAttendanceByDate = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${baseApiURL()}/attendence/getByDate`;

      const params = new URLSearchParams();
      if (selectedSubject) params.append("subject", selectedSubject);
      if (selectedBranch) params.append("branch", selectedBranch);
      if (selectedSemester) params.append("semester", selectedSemester);
      if (selectedSection) params.append("section", selectedSection);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url);
      if (response.data.success) {
        setAttendanceRecords(response.data.attendance);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to fetch attendance records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, selectedBranch, selectedSemester, selectedSection, startDate, endDate]);

  useEffect(() => {
    fetchAttendanceByDate();
  }, [fetchAttendanceByDate]);

  const handleDeleteAttendance = async (id) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        const response = await axios.delete(`${baseApiURL()}/attendence/delete/${id}`);
        if (response.data.success) {
          toast.success(response.data.message || "Attendance deleted successfully");
          setAttendanceRecords(prevRecords =>
            prevRecords.filter(record => record._id !== id)
          );
        } else {
          toast.error(response.data.message || "Failed to delete attendance");
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Failed to delete attendance"
        );
      }
    }
  };

  // Edit Attendance
  const openEditModal = (record) => {
    setEditRecord(record);
    setEditForm({
      branch: record.branch || "",
      semester: record.semester || "",
      section: record.section || "",
      subject: record.subject || "",
      date: record.date ? new Date(record.date) : null,
      period: record.period || "",
    });
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditDateChange = (date) => {
    setEditForm(prev => ({ ...prev, date }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        branch: editForm.branch,
        semester: editForm.semester,
        section: editForm.section,
        subject: editForm.subject,
        date: editForm.date ? editForm.date.toISOString() : null,
        period: editForm.period,
      };
      const response = await axios.put(
        `${baseApiURL()}/attendence/update/${editRecord._id}`,
        payload
      );
      if (response.data.success) {
        toast.success("Attendance updated successfully");
        setAttendanceRecords(prev =>
          prev.map(rec =>
            rec._id === editRecord._id
              ? { ...rec, ...payload, date: editForm.date }
              : rec
          )
        );
        setEditModal(false);
      } else {
        toast.error(response.data.message || "Failed to update attendance");
      }
    } catch (error) {
      toast.error("Failed to update attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleSemesterChange = (e) => {
    setSelectedSemester(e.target.value);
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (endDate && date && endDate < date) {
      setEndDate(null);
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const clearFilters = () => {
    setSelectedSubject("");
    setSelectedBranch("");
    setSelectedSemester("");
    setSelectedSection("");
    setStartDate(null);
    setEndDate(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-slate-700 text-sm">Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <FiAlertCircle className="mx-auto text-rose-500 text-3xl mb-2" />
        <p className="font-bold text-rose-800 text-sm">{error}</p>
      </div>
    );
  }

  const filteredRecords = attendanceRecords
    .filter(record =>
      (!selectedBranch || record.branch === selectedBranch) &&
      (!selectedSemester || String(record.semester) === String(selectedSemester)) &&
      (!selectedSection || record.section === selectedSection) &&
      (!selectedSubject || record.subject === selectedSubject)
    )
    .sort(sortEnrollmentNo);

  return (
    <div className="space-y-6">
      {/* Bento Filter Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
            <h3 className="font-bold text-slate-900 text-base">Filter Attendance Records</h3>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={handleBranchChange}
              disabled={!!lockedBranch}
              className={`w-full ${lockedBranch ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="w-full"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Regulation</label>
            <input
              type="text"
              value={selectedRegulation}
              readOnly
              placeholder="Auto-fetched..."
              className="w-full bg-slate-50 font-bold text-indigo-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              disabled={!selectedBranch || !selectedSemester}
              className={`w-full ${!selectedBranch || !selectedSemester ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {!selectedBranch || !selectedSemester
                  ? "Select Branch & Sem First"
                  : sections.length > 0
                  ? "All Sections"
                  : "No Sections Found"}
              </option>
              {sections.map((section) => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full"
            >
              <option value="">All Subjects</option>
              {filteredSubjectObjs.map((subjectObj) => (
                <option key={subjectObj._id} value={subjectObj.name}>
                  {subjectObj.name} {subjectObj.code ? `(${subjectObj.code})` : ''} {subjectObj.regulation ? `[${subjectObj.regulation}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">From Date</label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Select start date"
              className="w-full"
              maxDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              placeholderText="Select end date"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white border border-slate-200">
          <FiAlertCircle className="mx-auto text-slate-300 text-4xl mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Attendance Records Found</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Try adjusting your filters above to display attendance logs.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold">Enrollment No</th>
                <th className="py-3.5 px-4 text-xs font-bold">Student Name</th>
                <th className="py-3.5 px-4 text-xs font-bold">Branch</th>
                <th className="py-3.5 px-4 text-xs font-bold">Sem</th>
                <th className="py-3.5 px-4 text-xs font-bold">Sec</th>
                <th className="py-3.5 px-4 text-xs font-bold">Subject</th>
                <th className="py-3.5 px-4 text-xs font-bold">Period</th>
                <th className="py-3.5 px-4 text-xs font-bold">Date</th>
                <th className="py-3.5 px-4 text-xs font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <tr key={record._id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                  <td className="py-3 px-4 font-bold text-xs text-indigo-600">{record.enrollmentNo}</td>
                  <td className="py-3 px-4 font-bold text-xs text-slate-800">{record.name}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-700">{record.branch}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-700">{record.semester}</td>
                  <td className="py-3 px-4 text-xs font-bold text-slate-800">{record.section}</td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-700">{record.subject}</td>
                  <td className="py-3 px-4 text-xs font-bold text-purple-700">{record.period}</td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-600">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteAttendance(record._id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Edit Attendance</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block mb-1">Branch</label>
                <select
                  name="branch"
                  value={editForm.branch}
                  onChange={handleEditChange}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Semester</label>
                <select
                  name="semester"
                  value={editForm.semester}
                  onChange={handleEditChange}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Section</label>
                <select
                  name="section"
                  value={editForm.section}
                  onChange={handleEditChange}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Subject</label>
                <select
                  name="subject"
                  value={editForm.subject}
                  onChange={handleEditChange}
                  className="border rounded px-2 py-1 w-full"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Period</label>
                <input
                  type="text"
                  name="period"
                  value={editForm.period}
                  onChange={handleEditChange}
                  className="border rounded px-2 py-1 w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Date</label>
                <DatePicker
                  selected={editForm.date}
                  onChange={handleEditDateChange}
                  className="border rounded px-2 py-1 w-full"
                  required
                  maxDate={new Date()}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAttendance;
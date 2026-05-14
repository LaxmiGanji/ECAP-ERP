import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const DeleteAttendance = ({ branch: lockedBranch }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState(["A", "B", "C", "D","SOC","WIPRO TRAINING","ATT"]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "");
  const [selectedSemester, setSelectedSemester] = useState("");
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

  const [allSubjects, setAllSubjects] = useState([]); // Store all subjects

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
    if (selectedBranch && selectedSemester) {
      const filtered = allSubjects.filter(
        (subject) =>
          subject.branch?.name === selectedBranch &&
          String(subject.semester) === String(selectedSemester)
      );
      setSubjects(filtered.map(sub => sub.name));
    } else {
      setSubjects(allSubjects.map(sub => sub.name));
    }
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
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col sm:flex-row justify-start gap-4 mb-4 flex-wrap">
        <div>
          <label className="mr-2">Branch:</label>
          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            disabled={!!lockedBranch}
            className={`border rounded px-2 py-1 ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
          <label className="mr-2">Semester:</label>
          <select
            value={selectedSemester}
            onChange={handleSemesterChange}
            className="border rounded px-2 py-1"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map((sem) => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2">Section:</label>
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="border rounded px-2 py-1"
          >
            <option value="">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2">Subject:</label>
          <select
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="border rounded px-2 py-1"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2">From Date:</label>
          <DatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Select start date"
            className="border rounded px-2 py-1"
            maxDate={new Date()}
          />
        </div>
        <div>
          <label className="mr-2">To Date:</label>
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            placeholderText="Select end date"
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={clearFilters}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Clear Filters
        </button>
      </div>


      {attendanceRecords.length === 0 ? (
        <div className="text-center mt-5">
          <p>No attendance records found for the selected filters.</p>
        </div>
      ) : (
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-left">Enrollment No</th>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Branch</th>
              <th className="py-2 px-4 text-left">Semester</th>
              <th className="py-2 px-4 text-left">Section</th>
              <th className="py-2 px-4 text-left">Subject</th>
              <th className="py-2 px-4 text-left">Period</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords
              .filter(record =>
                (!selectedBranch || record.branch === selectedBranch) &&
                (!selectedSemester || String(record.semester) === String(selectedSemester)) &&
                (!selectedSection || record.section === selectedSection) &&
                (!selectedSubject || record.subject === selectedSubject)
              )
              // Sort enrollment numbers in ascending order
              .sort((a, b) => {
                const aNum = Number(a.enrollmentNo);
                const bNum = Number(b.enrollmentNo);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                  return aNum - bNum;
                }
                return String(a.enrollmentNo).localeCompare(String(b.enrollmentNo));
              })
              .map((record) => (
                <tr key={record._id} className="border-b">
                  <td className="py-2 px-4">{record.enrollmentNo}</td>
                  <td className="py-2 px-4">{record.name}</td>
                  <td className="py-2 px-4">{record.branch}</td>
                  <td className="py-2 px-4">{record.semester}</td>
                  <td className="py-2 px-4">{record.section}</td>
                  <td className="py-2 px-4">{record.subject}</td>
                  <td className="py-2 px-4">{record.period}</td>
                  <td className="py-2 px-4">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      onClick={() => handleDeleteAttendance(record._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
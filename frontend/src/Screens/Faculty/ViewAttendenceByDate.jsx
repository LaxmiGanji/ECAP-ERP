import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const ViewAttendenceByDate = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sections, setSections] = useState(["A", "B", "C", "D", "SOC", "WIPRO TRAINING", "ATT"]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
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

  const [allSubjects, setAllSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/subject/getSubject`);
        if (response.data.success) {
          setAllSubjects(response.data.subject);
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading attendance records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Attendance by Date</h1>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={handleBranchChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={handleSemesterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={handleSectionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <DatePicker
              selected={startDate}
              onChange={handleStartDateChange}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Select start date"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              maxDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <DatePicker
              selected={endDate}
              onChange={handleEndDateChange}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              placeholderText="Select end date"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {attendanceRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
          <p className="mt-1 text-sm text-gray-500">No attendance records found for the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Enrollment No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords
                  .filter(record =>
                    (!selectedBranch || record.branch === selectedBranch) &&
                    (!selectedSemester || String(record.semester) === String(selectedSemester)) &&
                    (!selectedSection || record.section === selectedSection) &&
                    (!selectedSubject || record.subject === selectedSubject)
                  )
                  .sort((a, b) => {
                    const aNum = Number(a.enrollmentNo);
                    const bNum = Number(b.enrollmentNo);
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                      return aNum - bNum;
                    }
                    return String(a.enrollmentNo).localeCompare(String(b.enrollmentNo));
                  })
                  .map((record, index) => (
                    <tr key={record._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.enrollmentNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.branch}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.semester}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.section}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{record.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(record)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAttendance(record._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Attendance Record</h3>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  name="branch"
                  value={editForm.branch}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  name="semester"
                  value={editForm.semester}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  name="section"
                  value={editForm.section}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  name="subject"
                  value={editForm.subject}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <input
                  type="text"
                  name="period"
                  value={editForm.period}
                  onChange={handleEditChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <DatePicker
                  selected={editForm.date}
                  onChange={handleEditDateChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  maxDate={new Date()}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAttendenceByDate;
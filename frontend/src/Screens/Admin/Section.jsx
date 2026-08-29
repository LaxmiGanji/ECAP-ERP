import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { sortEnrollmentNo } from "../../utils/enrollmentSorter";
import { 
  FiUsers, 
  FiFilter, 
  FiCheckCircle, 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiLayers, 
  FiGrid,
  FiBookOpen
} from "react-icons/fi";

const Section = ({ branch: lockedBranch }) => {
  const [activeTab, setActiveTab] = useState("allocate"); // "manage" | "allocate"
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "-- Select --");
  const [semester, setSemester] = useState("-- Select --");

  // Allocation State
  const [fromEnrollment, setFromEnrollment] = useState("");
  const [toEnrollment, setToEnrollment] = useState("");
  const [selectedSection, setSelectedSection] = useState("-- Select --");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Dynamic Section Management State
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionCapacity, setNewSectionCapacity] = useState(60);
  const [editingSection, setEditingSection] = useState(null);
  const [editSectionName, setEditSectionName] = useState("");
  const [editSectionCapacity, setEditSectionCapacity] = useState(60);

  // Custom sorting function for enrollment numbers
  const sortEnrollmentNumbers = (studentsList, order = 'ascending') => {
    const sorted = [...studentsList].sort(sortEnrollmentNo);
    return order === 'ascending' ? sorted : sorted.reverse();
  };

  // Fetch branches and students
  const fetchData = async () => {
    try {
      const branchRes = await axios.get(`${baseApiURL()}/branch/getBranch`);
      if (branchRes.data.success) setBranches(branchRes.data.branches);

      const studentRes = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
      if (studentRes.data.success) {
        const sortedStudents = sortEnrollmentNumbers(studentRes.data.students, 'ascending');
        setAllStudents(sortedStudents);
      }
    } catch (error) {
      toast.error("Error fetching data");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch sections list for Management view and Dropdowns
  const fetchSections = async () => {
    try {
      let url = `${baseApiURL()}/section/getSections`;
      let params = {};
      if (selectedBranch && selectedBranch !== "-- Select --") params.branch = selectedBranch;
      if (semester && semester !== "-- Select --") params.semester = semester;

      const res = await axios.get(url, { params });
      if (res.data.success) {
        setSectionsList(res.data.sections);
      }

      // Fetch dynamic dropdown options
      const dropdownRes = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, { params });
      if (dropdownRes.data.success) {
        setAvailableSections(dropdownRes.data.sections);
      }
    } catch (error) {
      console.error("Error fetching dynamic sections:", error);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [selectedBranch, semester]);

  // Filter students by selected filters
  useEffect(() => {
    let result = allStudents;

    if (selectedBranch !== "-- Select --") {
      result = result.filter((s) => s.branch === selectedBranch);
    }

    if (semester !== "-- Select --") {
      result = result.filter((s) => String(s.semester) === String(semester));
    }

    if (fromEnrollment) {
      result = result.filter((s) => s.enrollmentNo >= fromEnrollment);
    }

    if (toEnrollment) {
      result = result.filter((s) => s.enrollmentNo <= toEnrollment);
    }

    const sortedResult = sortEnrollmentNumbers(result, 'ascending');
    setFilteredStudents(sortedResult);
    setSelectedStudents([]);
  }, [selectedBranch, semester, fromEnrollment, toEnrollment, allStudents]);

  // Student Selection Handlers
  const handleStudentSelect = (enrollmentNo) => {
    setSelectedStudents(prev => 
      prev.includes(enrollmentNo)
        ? prev.filter(id => id !== enrollmentNo)
        : [...prev, enrollmentNo]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.enrollmentNo));
    }
  };

  // Section Assignment Action
  const handleAssignSection = async () => {
    if (
      selectedBranch === "-- Select --" ||
      semester === "-- Select --" ||
      selectedSection === "-- Select --"
    ) {
      toast.error("Branch, Semester, and Section are required");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    try {
      const res = await axios.put(`${baseApiURL()}/student/details/assignSection`, {
        branch: selectedBranch,
        semester,
        section: selectedSection,
        studentEnrollments: selectedStudents,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        await fetchData();
        await fetchSections();
        setSelectedStudents([]);
      } else {
        toast.error(res.data.message || "Failed to assign section");
      }
    } catch (error) {
      toast.error("Error while assigning section");
      console.error(error);
    }
  };

  // Dynamic Section CRUD Actions
  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }
    if (selectedBranch === "-- Select --" || semester === "-- Select --") {
      toast.error("Please select Branch and Semester first");
      return;
    }

    try {
      const res = await axios.post(`${baseApiURL()}/section/addSection`, {
        name: newSectionName.trim(),
        branch: selectedBranch,
        semester: Number(semester),
        capacity: Number(newSectionCapacity),
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setNewSectionName("");
        setIsAddModalOpen(false);
        fetchSections();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add section");
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    if (!editSectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    try {
      const res = await axios.put(`${baseApiURL()}/section/updateSection/${editingSection._id}`, {
        name: editSectionName.trim(),
        capacity: Number(editSectionCapacity),
      });

      if (res.data.success) {
        toast.success("Section updated successfully!");
        setIsEditModalOpen(false);
        setEditingSection(null);
        fetchSections();
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update section");
    }
  };

  const handleDeleteSection = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Section "${name}"? Students in this section will be unassigned.`)) {
      return;
    }

    try {
      const res = await axios.delete(`${baseApiURL()}/section/deleteSection/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSections();
        fetchData();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error("Error deleting section");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <FiLayers className="text-blue-600" />
            Dynamic Section Management
          </h1>
          <p className="text-gray-600 mt-1">
            Define dynamic sections per Branch and Semester, rename sections, and assign students.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("allocate")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "allocate"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FiUsers className="w-4 h-4" />
            <span>Student Allocation</span>
          </button>

          <button
            onClick={() => setActiveTab("manage")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "manage"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <FiGrid className="w-4 h-4" />
            <span>Manage Sections</span>
          </button>
        </div>
      </div>

      {/* Global Branch & Semester Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <FiFilter className="text-blue-600 text-lg" />
          <h2 className="text-lg font-semibold text-gray-900">Select Cohort (Branch & Semester)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!!lockedBranch}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              <option>-- Select --</option>
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option>-- Select --</option>
              {[...Array(8).keys()].map((i) => (
                <option key={i + 1} value={i + 1}>
                  Semester {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (selectedBranch === "-- Select --" || semester === "-- Select --") {
                  toast.error("Please select both Branch and Semester first");
                  return;
                }
                setIsAddModalOpen(true);
              }}
              className="w-full px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Dynamic Section</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MANAGE SECTIONS */}
      {activeTab === "manage" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FiBookOpen className="text-blue-600" />
              Configured Sections ({sectionsList.length})
            </h3>
            {selectedBranch !== "-- Select --" && semester !== "-- Select --" && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 font-medium text-sm rounded-full">
                {selectedBranch} - Sem {semester}
              </span>
            )}
          </div>

          {sectionsList.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FiGrid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Custom Sections Found</h3>
              <p className="text-gray-500 mb-6">
                No dynamic sections created for this cohort yet. Default sections (A, B, C, D) are currently used.
              </p>
              <button
                onClick={() => {
                  if (selectedBranch === "-- Select --" || semester === "-- Select --") {
                    toast.error("Please select Branch and Semester first");
                    return;
                  }
                  setIsAddModalOpen(true);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <FiPlus className="w-4 h-4" />
                <span>Create Section Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sectionsList.map((sec) => (
                <div key={sec._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-black text-gray-900 tracking-wide">
                        {sec.name}
                      </span>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-100">
                        Cap: {sec.capacity}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <div><strong className="text-gray-700">Branch:</strong> {sec.branch}</div>
                      <div><strong className="text-gray-700">Semester:</strong> {sec.semester}</div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        <FiUsers className="text-blue-500" />
                        <span className="text-sm font-semibold text-gray-800">
                          {sec.studentCount} Student{sec.studentCount !== 1 ? 's' : ''} Enrolled
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingSection(sec);
                        setEditSectionName(sec.name);
                        setEditSectionCapacity(sec.capacity);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                      title="Rename / Edit Section"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      <span>Rename</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSection(sec._id, sec.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                      title="Delete Section"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT ALLOCATION */}
      {activeTab === "allocate" && (
        <div className="space-y-8">
          {/* Allocation Controls Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option>-- Select --</option>
                  {availableSections.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Enrollment No</label>
                <input
                  type="text"
                  value={fromEnrollment}
                  onChange={(e) => setFromEnrollment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g. 22N81A0501"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Enrollment No</label>
                <input
                  type="text"
                  value={toEnrollment}
                  onChange={(e) => setToEnrollment(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g. 22N81A05B9"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAssignSection}
                  className="w-full px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Assign Section</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FiUsers className="text-blue-600 text-lg" />
                <h3 className="text-xl font-bold text-gray-900">Filtered Students</h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 font-medium">
                <span>{selectedStudents.length} of {filteredStudents.length} selected</span>
                <span>•</span>
                <span>{filteredStudents.length} total found</span>
              </div>
            </div>

            <div className="p-6">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-1">No Students Found</h3>
                  <p className="text-gray-500">No students match the selected Branch and Semester criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="px-6 py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </th>
                        <th className="px-6 py-3.5">Enrollment No</th>
                        <th className="px-6 py-3.5">Student Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5 text-center">Semester</th>
                        <th className="px-6 py-3.5">Branch</th>
                        <th className="px-6 py-3.5 text-center">Current Section</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStudents.map((s) => (
                        <tr key={s.enrollmentNo} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(s.enrollmentNo)}
                              onChange={() => handleStudentSelect(s.enrollmentNo)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </td>
                          <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">{s.enrollmentNo}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{`${s.firstName} ${s.middleName || ""} ${s.lastName}`}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                              Sem {s.semester}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{s.branch}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              s.section 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {s.section ? `Sec ${s.section}` : "Unassigned"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD SECTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Dynamic Section</h3>
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  disabled
                  value={selectedBranch}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input
                  type="text"
                  disabled
                  value={`Semester ${semester}`}
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name / Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A, B, C, CSE-1, WIPRO TRAINING"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newSectionCapacity}
                  onChange={(e) => setNewSectionCapacity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-md"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SECTION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rename / Edit Section</h3>
            <form onSubmit={handleUpdateSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  value={editSectionName}
                  onChange={(e) => setEditSectionName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Note: Renaming this section will automatically update all students currently assigned to "{editingSection?.name}".
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editSectionCapacity}
                  onChange={(e) => setEditSectionCapacity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm shadow-md"
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

export default Section;
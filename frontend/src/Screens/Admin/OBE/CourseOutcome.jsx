// components/OBE/CourseOutcome.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { FiBook, FiGitBranch, FiCalendar, FiPlus, FiTrash2, FiEdit, FiFilter, FiAlertCircle } from "react-icons/fi";
import { baseApiURL } from "../../../baseUrl";


const CourseOutcome = ({ branch: lockedBranchName }) => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({
    branch: "",
    semester: "",
    regulation: ""
  });
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newCO, setNewCO] = useState({ coNumber: "", description: "" });
  const [editMode, setEditMode] = useState(false);
  const [editingCO, setEditingCO] = useState(null);
  const [noStudentsMessage, setNoStudentsMessage] = useState("");

  useEffect(() => {
    getSubjectsHandler();
    getBranchesHandler();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, filters]);

  useEffect(() => {
    checkStudentPresence();
  }, [filters.semester, filters.branch, branches, selectedSubject]);

  const checkStudentPresence = async () => {
    const targetSemester = filters.semester || selectedSubject?.semester;
    if (!targetSemester) {
      setNoStudentsMessage("");
      return;
    }

    try {
      const payload = { semester: Number(targetSemester) };
      if (filters.branch) {
        const branchObj = branches.find(b => b._id === filters.branch);
        if (branchObj?.name) {
          payload.branch = branchObj.name;
        }
      } else if (selectedSubject?.branch) {
        const branchName = selectedSubject.branch?.name || selectedSubject.branch;
        if (typeof branchName === 'string') {
          payload.branch = branchName;
        }
      }

      const response = await axios.post(`${baseApiURL()}/student/details/getDetails`, payload);
      if (response.data.success && response.data.user && response.data.user.length > 0) {
        setNoStudentsMessage("");
      } else {
        setNoStudentsMessage("no students are there for that semester");
      }
    } catch (error) {
      setNoStudentsMessage("no students are there for that semester");
    }
  };

  const getBranchesHandler = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          setBranches(response.data.branches);
          if (lockedBranchName) {
            const matchedBranch = response.data.branches.find(b => b.name === lockedBranchName);
            if (matchedBranch) {
              setFilters(prev => ({ ...prev, branch: matchedBranch._id }));
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching branches:", error);
      });
  };

  const filterSubjects = () => {
    let filtered = [...subjects];
    
    if (filters.branch) {
      filtered = filtered.filter(item => {
        const branchId = item.branch?._id || item.branch;
        return branchId === filters.branch;
      });
    }
    
    if (filters.semester) {
      filtered = filtered.filter(item => 
        String(item.semester) === String(filters.semester)
      );
    }

    if (filters.regulation) {
      filtered = filtered.filter(item => 
        item.regulation && item.regulation.toLowerCase().includes(filters.regulation.toLowerCase())
      );
    }
    
    setFilteredSubjects(filtered);
  };

  const clearFilters = () => {
    setFilters({
      branch: lockedBranchName ? filters.branch : "",
      semester: "",
      regulation: ""
    });
  };

  const getSubjectsHandler = () => {
    setLoading(true);
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        if (response.data.success) {
          setSubjects(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setEditMode(false);
    setEditingCO(null);
    setNewCO({ coNumber: "", description: "" });
  };

  const handleAddCourseOutcome = (e) => {
    e.preventDefault();
    
    if (!newCO.coNumber || !newCO.description) {
      toast.error("Please fill all fields");
      return;
    }

    if (!selectedSubject) {
      toast.error("Please select a subject first");
      return;
    }

    setLoading(true);
    axios
      .post(`${baseApiURL()}/subject/addCourseOutcome/${selectedSubject._id}`, newCO)
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          getSubjectsHandler();
          setNewCO({ coNumber: "", description: "" });
          
          // Update selected subject with new data
          const updatedSubjects = subjects.map(sub => 
            sub._id === selectedSubject._id ? response.data.subject : sub
          );
          setSubjects(updatedSubjects);
          setSelectedSubject(response.data.subject);
          setEditMode(false);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error(error.response?.data?.message || error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleEditCourseOutcome = (co) => {
    setEditMode(true);
    setEditingCO(co);
    setNewCO({
      coNumber: co.coNumber,
      description: co.description
    });
  };

  const handleDeleteCourseOutcome = (coNumber) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${coNumber}?`);
    if (!confirmDelete) return;

    if (!selectedSubject) return;

    setLoading(true);
    axios
      .delete(`${baseApiURL()}/subject/deleteCourseOutcome/${selectedSubject._id}/${coNumber}`)
      .then((response) => {
        if (response.data.success) {
          toast.success(response.data.message);
          getSubjectsHandler();
          
          // Update selected subject with new data
          const updatedSubjects = subjects.map(sub => 
            sub._id === selectedSubject._id ? response.data.subject : sub
          );
          setSubjects(updatedSubjects);
          setSelectedSubject(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error(error.response?.data?.message || error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingCO(null);
    setNewCO({ coNumber: "", description: "" });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Course Outcomes Management</h1>
            <p className="text-gray-600 mt-2">Define and manage Course Outcomes for subjects</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Subject Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FiBook className="text-blue-600 text-lg" />
              <h2 className="text-xl font-semibold text-gray-800">Select Subject</h2>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiFilter className="text-blue-600 text-sm" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Filter Subjects</span>
                </div>
                {(filters.branch || filters.semester || filters.regulation) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                  disabled={!!lockedBranchName}
                  className={`w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranchName ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Semester</label>
                <select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                >
                  <option value="">All Semesters</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Regulation</label>
                <input
                  type="text"
                  placeholder="e.g. R20"
                  value={filters.regulation}
                  onChange={(e) => setFilters({ ...filters, regulation: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                />
              </div>

              <div className="text-xs text-gray-500 pt-1">
                Showing {filteredSubjects.length} of {subjects.length} subjects
              </div>

              {noStudentsMessage && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center space-x-2">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-medium">{noStudentsMessage}</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject._id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedSubject?._id === subject._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubjectSelect(subject)}
                  >
                    <h3 className="font-medium text-gray-900">{subject.code} - {subject.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FiGitBranch className="text-green-500" />
                        <span>{subject.branch?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FiCalendar className="text-blue-500" />
                        <span>Sem {subject.semester}</span>
                      </div>
                      {subject.regulation && (
                        <div className="flex items-center space-x-1">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                            {subject.regulation}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {subject.courseOutcomes?.length || 0} COs
                      </span>
                    </div>
                  </div>
                ))}
                
                {filteredSubjects.length === 0 && (
                  <div className="text-center py-8">
                    <FiBook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No subjects found matching your filters.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Course Outcomes */}
        <div className="lg:col-span-2">
          {selectedSubject ? (
            <div className="space-y-8">
              {noStudentsMessage && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-center space-x-3 text-amber-800 shadow-sm">
                  <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Notice</p>
                    <p className="text-sm font-medium text-amber-900">{noStudentsMessage}</p>
                  </div>
                </div>
              )}

              {/* Subject Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedSubject.code} - {selectedSubject.name}</h2>
                    <div className="flex items-center space-x-6 mt-2">
                      <span className="text-gray-600">
                        <FiGitBranch className="inline mr-1" />
                        {selectedSubject.branch?.name}
                      </span>
                      <span className="text-gray-600">
                        <FiCalendar className="inline mr-1" />
                        Semester {selectedSubject.semester}
                      </span>
                      {selectedSubject.regulation && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {selectedSubject.regulation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Course Outcomes</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {selectedSubject.courseOutcomes?.length || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add/Edit Course Outcome Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FiPlus className="text-blue-600 text-lg" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editMode ? `Edit ${editingCO?.coNumber}` : 'Add New Course Outcome'}
                  </h2>
                </div>

                <form onSubmit={handleAddCourseOutcome}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CO Number *
                      </label>
                      <input
                        type="text"
                        value={newCO.coNumber}
                        onChange={(e) => setNewCO({...newCO, coNumber: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="CO1"
                        required
                        disabled={editMode}
                      />
                    </div>
                    <div className="md:col-span-7">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={newCO.description}
                        onChange={(e) => setNewCO({...newCO, description: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Describe the course outcome..."
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : editMode ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </div>
                  {editMode && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 hover:bg-gray-100 rounded"
                      >
                        Cancel Edit
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Course Outcomes List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Course Outcomes List</h2>
                  <span className="text-sm text-gray-500">
                    Total: {selectedSubject.courseOutcomes?.length || 0}
                  </span>
                </div>

                {selectedSubject.courseOutcomes?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSubject.courseOutcomes.map((co) => (
                      <div
                        key={co.coNumber}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start space-x-3">
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                                {co.coNumber}
                              </span>
                              <div>
                                <p className="text-gray-800">{co.description}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Course Outcome for {selectedSubject.name}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditCourseOutcome(co)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourseOutcome(co.coNumber)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Course Outcomes</h3>
                    <p className="text-gray-500">Add your first course outcome using the form above</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FiBook className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-700 mb-3">Select a Subject</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Choose a subject from the list to view and manage its Course Outcomes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseOutcome;
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { baseApiURL } from "../../baseUrl";
import { FiBook, FiCalendar, FiUsers, FiGitBranch, FiFilter, FiAlertCircle } from "react-icons/fi";

const Subjects = ({ branch: lockedBranchName }) => {
  const [data, setData] = useState({ 
    name: "", 
    code: "", 
    total: "", 
    semester: "",
    branch: "",
    regulation: ""
  });
  const [editData, setEditData] = useState(null);
  const [selected, setSelected] = useState("add");
  const [subject, setSubject] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [noStudentsMessage, setNoStudentsMessage] = useState("");
  const [studentRegulations, setStudentRegulations] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    branch: "",
    semester: "",
    regulation: ""
  });

  // Semester options
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    getSubjectHandler();
    getBranchesHandler();
    getStudentRegulationsHandler();
  }, []);

  const getStudentRegulationsHandler = () => {
    axios
      .get(`${baseApiURL()}/student/details/getRegulations`)
      .then((res) => {
        if (res.data.success) {
          setStudentRegulations(res.data.regulations || []);
        }
      })
      .catch((err) => console.error("Error fetching student regulations:", err));
  };

  // Apply filters whenever subjects or filters change
  useEffect(() => {
    filterSubjects();
  }, [subject, filters]);

  useEffect(() => {
    checkStudentPresence();
  }, [filters.semester, filters.branch, branches]);

  const checkStudentPresence = async () => {
    if (!filters.semester) {
      setNoStudentsMessage("");
      return;
    }

    try {
      const payload = { semester: Number(filters.semester) };
      if (filters.branch) {
        const branchObj = branches.find(b => b._id === filters.branch);
        if (branchObj?.name) {
          payload.branch = branchObj.name;
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
              setData(prev => ({ ...prev, branch: matchedBranch._id }));
              setFilters(prev => ({ ...prev, branch: matchedBranch._id }));
            }
          }
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const getSubjectHandler = () => {
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        if (response.data.success) {
          setSubject(response.data.subject);
          setFilteredSubjects(response.data.subject); // Initially show all
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  // Filter subjects based on selected branch and semester
  const filterSubjects = () => {
    let filtered = [...subject];
    
    if (filters.branch) {
      filtered = filtered.filter(item => {
        // Handle both populated branch object and branch ID
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
        item.regulation === filters.regulation
      );
    }
    
    setFilteredSubjects(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      branch: "",
      semester: "",
      regulation: ""
    });
  };

  const addSubjectHandler = () => {
    if (!data.name || !data.code || !data.total || !data.semester || !data.branch || !data.regulation) {
      toast.error("Please fill all fields");
      return;
    }
    toast.loading("Adding Subject...");
    axios
      .post(`${baseApiURL()}/subject/addSubject`, data)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          setData({ name: "", code: "", total: "", semester: "", branch: "", regulation: "" });
          getSubjectHandler();
          setSelected("view");
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Error:", error);
        toast.error(error.response?.data?.message || error.message);
      });
  };

  const deleteSubjectHandler = (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete subject "${name}"?`);
    if (!confirmDelete) return;

    toast.loading("Deleting Subject...");
    axios
      .delete(`${baseApiURL()}/subject/deleteSubject/${id}`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          getSubjectHandler();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || error.message);
      });
  };

  const updateSubjectHandler = () => {
    if (!editData.name || !editData.code || !editData.total || !editData.semester || !editData.branch || !editData.regulation) {
      toast.error("Please fill all fields");
      return;
    }

    toast.loading("Updating Subject...");
    axios
      .put(`${baseApiURL()}/subject/updateSubject/${editData._id}`, editData)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          setEditData(null);
          setSelected("view");
          getSubjectHandler();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || error.message);
      });
  };

  const resetForm = () => {
    setData({ name: "", code: "", total: "", semester: "", branch: "", regulation: "" });
  };

  // Get branch name by ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b._id === branchId);
    return branch ? branch.name : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bento-header-banner flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-xs md:text-sm mt-1">Configure and review academic subjects, total classes & regulations by branch</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bento-card p-2 bg-slate-100/80 border border-slate-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "add"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("add")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiBook className="w-4 h-4" />
              <span>Add Subject</span>
            </div>
          </button>

          <button
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
              selected === "view"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
            onClick={() => setSelected("view")}
          >
            <div className="flex items-center justify-center space-x-2">
              <FiUsers className="w-4 h-4" />
              <span>View Subjects</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {selected === "add" && (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-8">
                {/* Subject Information Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <FiBook className="text-blue-600 text-lg" />
                    <h2 className="text-xl font-semibold text-gray-800">Subject Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Code *
                      </label>
                      <input
                        type="text"
                        id="code"
                        required
                        value={data.code}
                        onChange={(e) => setData({ ...data, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., Introduction to Computer Science"
                      />
                    </div>
                    <div>
                      <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                        Branch *
                      </label>
                      <select
                        id="branch"
                        required
                        value={data.branch}
                        onChange={(e) => setData({ ...data, branch: e.target.value })}
                        disabled={!!lockedBranchName}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranchName ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester *
                      </label>
                      <select
                        id="semester"
                        required
                        value={data.semester}
                        onChange={(e) => setData({ ...data, semester: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Semester</option>
                        {semesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="regulation" className="block text-sm font-medium text-gray-700 mb-2">
                        Regulation *
                      </label>
                      <select
                        id="regulation"
                        required
                        value={data.regulation}
                        onChange={(e) => setData({ ...data, regulation: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Select Regulation</option>
                        {(studentRegulations.length > 0 ? studentRegulations : ["R24", "R23", "R22", "R20"]).map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-2">
                        Total Classes *
                      </label>
                      <input
                        type="number"
                        id="total"
                        required
                        min="1"
                        value={data.total}
                        onChange={(e) => setData({ ...data, total: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., 45"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={addSubjectHandler}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        )}

        {selected === "view" && (
          <div className="p-8">
            {/* Filters Section */}
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <FiFilter className="text-blue-600 text-lg" />
                <h3 className="text-lg font-semibold text-gray-800">Filter Subjects</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="filterBranch" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Branch
                  </label>
                  <select
                    id="filterBranch"
                    value={filters.branch}
                    onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                    disabled={!!lockedBranchName}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranchName ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filterSemester" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Semester
                  </label>
                  <select
                    id="filterSemester"
                    value={filters.semester}
                    onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  <label htmlFor="filterRegulation" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Regulation
                  </label>
                  <select
                    id="filterRegulation"
                    value={filters.regulation}
                    onChange={(e) => setFilters({ ...filters, regulation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">All Regulations</option>
                    {(studentRegulations.length > 0 ? studentRegulations : Array.from(new Set(subject.map(s => s.regulation).filter(Boolean)))).map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredSubjects.length} of {subject.length} subjects
              </div>

              {noStudentsMessage && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center space-x-2">
                  <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-medium">{noStudentsMessage}</span>
                </div>
              )}
            </div>

            {/* Subjects List */}
            <div className="space-y-4">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((item) => (
                  <div
                    key={item._id}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <FiBook className="text-white text-xl" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {item.code} - {item.name}
                          </h3>
                          <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <FiGitBranch className="text-green-500" />
                              <span>{item.branch?.name || getBranchName(item.branch)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FiCalendar className="text-blue-500" />
                              <span>Semester {item.semester}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                {item.regulation}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FiUsers className="text-purple-500" />
                              <span>{item.total} Classes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => {
                            setEditData(item);
                            setSelected("edit");
                          }}
                          title="Edit Subject"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => deleteSubjectHandler(item._id, item.name)}
                          title="Delete Subject"
                        >
                          <MdOutlineDelete size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Subjects Found</h3>
                  <p className="text-gray-500">
                    {subject.length === 0 
                      ? "Add your first subject to get started" 
                      : "No subjects match the selected filters"}
                  </p>
                  {subject.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {selected === "edit" && editData && (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="space-y-8">
                {/* Subject Information Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <FiBook className="text-blue-600 text-lg" />
                    <h2 className="text-xl font-semibold text-gray-800">Edit Subject Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="editCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Code *
                      </label>
                      <input
                        type="text"
                        id="editCode"
                        required
                        value={editData.code}
                        onChange={(e) => setEditData({ ...editData, code: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter subject code"
                      />
                    </div>
                    <div>
                      <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Name *
                      </label>
                      <input
                        type="text"
                        id="editName"
                        required
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter subject name"
                      />
                    </div>
                    <div>
                      <label htmlFor="editBranch" className="block text-sm font-medium text-gray-700 mb-2">
                        Branch *
                      </label>
                      <select
                        id="editBranch"
                        required
                        value={editData.branch?._id || editData.branch || ""}
                        onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                        disabled={!!lockedBranchName}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranchName ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="editSemester" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester *
                      </label>
                      <select
                        id="editSemester"
                        required
                        value={editData.semester}
                        onChange={(e) => setEditData({ ...editData, semester: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Semester</option>
                        {semesters.map((sem) => (
                          <option key={sem} value={sem}>
                            Semester {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="editRegulation" className="block text-sm font-medium text-gray-700 mb-2">
                        Regulation *
                      </label>
                      <select
                        id="editRegulation"
                        required
                        value={editData.regulation}
                        onChange={(e) => setEditData({ ...editData, regulation: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                      >
                        <option value="">Select Regulation</option>
                        {(studentRegulations.length > 0 ? studentRegulations : ["R24", "R23", "R22", "R20"]).map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="editTotal" className="block text-sm font-medium text-gray-700 mb-2">
                        Total Classes *
                      </label>
                      <input
                        type="number"
                        id="editTotal"
                        required
                        min="1"
                        value={editData.total}
                        onChange={(e) => setEditData({ ...editData, total: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter total classes"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditData(null);
                    setSelected("view");
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateSubjectHandler}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Update Subject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
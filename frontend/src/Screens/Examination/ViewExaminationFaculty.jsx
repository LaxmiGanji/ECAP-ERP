import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import { FiEdit2, FiTrash2, FiEye, FiSearch, FiX, FiSave, FiUser, FiMail, FiPhone, FiBriefcase, FiBookOpen } from "react-icons/fi";

const ViewExaminationFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branch, setBranch] = useState([]);
  const [editData, setEditData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: "",
    gender: "",
    experience: "",
    post: "",
    panCard: "",
    jntuId: "",
    aicteId: "",
    batch: "",
  });

  // Fetch branches for dropdown
  const getBranchData = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching branches:", error);
        toast.error("Failed to fetch departments");
      });
  };

  // Fetch all examination faculty
  const fetchFaculty = () => {
    setLoading(true);
    axios
      .post(`${baseApiURL()}/examination/details/getDetails`, {})
      .then((response) => {
        if (response.data.success) {
          setFaculty(response.data.user);
          setFilteredFaculty(response.data.user);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching faculty:", error);
        toast.error("Failed to fetch faculty data");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFaculty();
    getBranchData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredFaculty(faculty);
    } else {
      const filtered = faculty.filter(
        (f) =>
          f.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.post?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFaculty(filtered);
    }
  }, [searchTerm, faculty]);

  // View faculty details
  const handleView = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setIsViewModalOpen(true);
  };

  // Edit faculty
  const handleEdit = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setEditData({
      firstName: facultyMember.firstName || "",
      middleName: facultyMember.middleName || "",
      lastName: facultyMember.lastName || "",
      email: facultyMember.email || "",
      phoneNumber: facultyMember.phoneNumber || "",
      department: facultyMember.department || "",
      gender: facultyMember.gender || "",
      experience: facultyMember.experience || "",
      post: facultyMember.post || "",
      panCard: facultyMember.panCard || "",
      jntuId: facultyMember.jntuId || "",
      aicteId: facultyMember.aicteId || "",
      batch: facultyMember.batch || "",
    });
    setIsEditModalOpen(true);
  };

  // Update faculty
  const updateFaculty = () => {
    toast.loading("Updating faculty...");

    axios
      .put(`${baseApiURL()}/examination/details/updateDetails/${selectedFaculty._id}`, editData)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success("Faculty updated successfully!");
          setIsEditModalOpen(false);
          fetchFaculty(); // Refresh the list
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Error updating faculty:", error);
        toast.error(error.response?.data?.message || "Failed to update faculty");
      });
  };

  // Delete faculty
  const handleDelete = (facultyMember) => {
    setSelectedFaculty(facultyMember);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    toast.loading("Deleting faculty...");

    axios
      .delete(`${baseApiURL()}/examination/details/deleteDetails/${selectedFaculty._id}`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success("Faculty deleted successfully!");
          setIsDeleteModalOpen(false);
          fetchFaculty(); // Refresh the list
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Error deleting faculty:", error);
        toast.error(error.response?.data?.message || "Failed to delete faculty");
      });
  };

  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditData({ ...editData, [id]: value });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiBookOpen className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Examination Faculty</h1>
                  <p className="text-purple-100 text-sm">View and manage all examination faculty members</p>
                </div>
              </div>
              <div className="text-white bg-white/20 px-4 py-2 rounded-lg">
                Total: {filteredFaculty.length}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, employee ID, email, department, designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* Faculty Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No faculty members found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined On
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFaculty.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {member.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.firstName} {member.middleName} {member.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.post}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleView(member)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="View"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination info */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredFaculty.length} of {faculty.length} faculty members
            </p>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 sticky top-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Faculty Details</h2>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedFaculty.profile && (
                  <div className="col-span-2 flex justify-center mb-4">
                    <img
                      src={selectedFaculty.profile}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">Employee ID</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{selectedFaculty.employeeId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {selectedFaculty.firstName} {selectedFaculty.middleName} {selectedFaculty.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Department</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Gender</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.gender}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Designation</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.post}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Experience</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.experience || 0} years</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Batch Year</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.batch || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">PAN Card</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.panCard || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">JNTUH ID</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.jntuId || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">AICTE ID</label>
                  <p className="mt-1 text-gray-900">{selectedFaculty.aicteId || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Joined On</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedFaculty.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-gray-900">{formatDate(selectedFaculty.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 sticky top-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Faculty</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    value={editData.firstName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    id="middleName"
                    value={editData.middleName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    value={editData.lastName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={editData.email}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={editData.phoneNumber}
                    onChange={handleEditInputChange}
                    maxLength="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    id="department"
                    value={editData.department}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select department</option>
                    {branch?.map((branch) => (
                      <option value={branch.name} key={branch._id || branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    id="gender"
                    value={editData.gender}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                  <input
                    type="text"
                    id="post"
                    value={editData.post}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    id="experience"
                    value={editData.experience}
                    onChange={handleEditInputChange}
                    min="0"
                    max="50"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Year</label>
                  <input
                    type="number"
                    id="batch"
                    value={editData.batch}
                    onChange={handleEditInputChange}
                    min="2000"
                    max={new Date().getFullYear() + 10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card</label>
                  <input
                    type="text"
                    id="panCard"
                    value={editData.panCard}
                    onChange={handleEditInputChange}
                    maxLength="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">JNTUH ID</label>
                  <input
                    type="text"
                    id="jntuId"
                    value={editData.jntuId}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AICTE ID</label>
                  <input
                    type="text"
                    id="aicteId"
                    value={editData.aicteId}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateFaculty}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all flex items-center space-x-2"
                >
                  <FiSave />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">Confirm Delete</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-semibold">{selectedFaculty.firstName} {selectedFaculty.lastName}</span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewExaminationFaculty;
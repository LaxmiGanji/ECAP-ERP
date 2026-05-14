import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { FiSearch, FiDownload, FiBriefcase } from "react-icons/fi";
import * as XLSX from "xlsx";

const ViewFaculty = ({ branch: lockedBranch }) => {
  const [faculties, setFaculties] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(lockedBranch || "-- Select --");
  const [sortOrder, setSortOrder] = useState("Ascending");

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/faculty/details/getDetails2`);
        if (response.data.success) {
          setFaculties(response.data.faculties);
          setFilteredFaculties(response.data.faculties);
        } else {
          toast.error("Failed to load faculty");
        }
      } catch (error) {
        toast.error("Error fetching faculty");
        console.error(error);
      }
    };

    fetchFaculties();
  }, []);

  useEffect(() => {
    let filtered = faculties.filter((faculty) => {
      const matchesSearch = searchTerm === "" || 
        faculty.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${faculty.firstName} ${faculty.middleName} ${faculty.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === "-- Select --" || faculty.department === departmentFilter;

      return matchesSearch && matchesDepartment;
    });

    // Sort by employee ID
    filtered.sort((a, b) => {
      const aNum = parseInt(a.employeeId);
      const bNum = parseInt(b.employeeId);
      return sortOrder === "Ascending" ? aNum - bNum : bNum - aNum;
    });

    setFilteredFaculties(filtered);
  }, [faculties, searchTerm, departmentFilter, sortOrder]);

  const downloadExcel = () => {
    if (filteredFaculties.length === 0) {
      toast.error("No faculty to export!");
      return;
    }

    const dataToExport = filteredFaculties.map((faculty) => ({
      "Employee ID": faculty.employeeId,
      "Name": `${faculty.firstName} ${faculty.middleName} ${faculty.lastName}`,
      "Email": faculty.email,
      "Phone": faculty.phoneNumber,
      "Department": faculty.department,
      "Experience": faculty.experience,
      "Post": faculty.post,
      "JNTU ID": faculty.jntuId,
      "AICTE ID": faculty.aicteId,
      "Gender": faculty.gender,
    }));

    // Create and download Excel file
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = "faculty_data.xlsx";
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Excel file downloaded successfully!");
  };

  // Get unique departments for filter
  const departments = [...new Set(faculties.map(faculty => faculty.department))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiBriefcase className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Faculty Management</h1>
                  <p className="text-blue-100 text-sm">View and manage faculty information</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  {filteredFaculties.length} faculty found
                </span>
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <FiDownload className="text-sm" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Faculty
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  disabled={!!lockedBranch}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="-- Select --">All Departments</option>
                  {departments.map((dept) => (
                    <option value={dept} key={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="Ascending">Ascending</option>
                  <option value="Descending">Descending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-8">
            {filteredFaculties.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <FiBriefcase className="mx-auto text-gray-400 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No faculty found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <th className="py-4 px-6 text-left font-semibold">Employee ID</th>
                      <th className="py-4 px-6 text-left font-semibold">Name</th>
                      <th className="py-4 px-6 text-left font-semibold">Email</th>
                      <th className="py-4 px-6 text-left font-semibold">Phone</th>
                      <th className="py-4 px-6 text-left font-semibold">Department</th>
                      <th className="py-4 px-6 text-left font-semibold">Experience</th>
                      <th className="py-4 px-6 text-left font-semibold">Post</th>
                      <th className="py-4 px-6 text-left font-semibold">JNTU ID</th>
                      <th className="py-4 px-6 text-left font-semibold">AICTE ID</th>
                      <th className="py-4 px-6 text-left font-semibold">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaculties.map((faculty, index) => (
                      <tr 
                        key={faculty.employeeId} 
                        className={`border-b hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">{faculty.employeeId}</td>
                        <td className="py-4 px-6">
                          {faculty.firstName} {faculty.middleName} {faculty.lastName}
                        </td>
                        <td className="py-4 px-6">{faculty.email}</td>
                        <td className="py-4 px-6">{faculty.phoneNumber}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {faculty.department}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                            {faculty.experience} years
                          </span>
                        </td>
                        <td className="py-4 px-6">{faculty.post}</td>
                        <td className="py-4 px-6">{faculty.jntuId || '-'}</td>
                        <td className="py-4 px-6">{faculty.aicteId || '-'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            faculty.gender === 'Male' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {faculty.gender}
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
    </div>
  );
};

export default ViewFaculty;
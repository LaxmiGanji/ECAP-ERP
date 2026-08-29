import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { 
  FiSearch, 
  FiDownload, 
  FiBriefcase, 
  FiGrid, 
  FiList, 
  FiMail, 
  FiPhone, 
  FiAward, 
  FiUser,
  FiFilter
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { getFileUrl } from "../../../utils/fileUrl";

const ViewFaculty = ({ branch: lockedBranch }) => {
  const [faculties, setFaculties] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(lockedBranch || "-- Select --");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

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
        `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      "Name": `${faculty.firstName} ${faculty.middleName || ''} ${faculty.lastName}`,
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
    <div className="w-full space-y-6 relative pb-16">
      
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
            <FiBriefcase className="text-indigo-600 text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Faculty Directory
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                {filteredFaculties.length} Faculty
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-xs mt-0.5">View, filter and manage faculty profiles and academic credentials</p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Switcher */}
          <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiGrid className="text-sm" />
              <span className="hidden sm:inline">Bento Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FiList className="text-sm" />
              <span className="hidden sm:inline">Compact Table</span>
            </button>
          </div>

          <button
            onClick={downloadExcel}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <FiDownload className="text-sm" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 🔲 Filter Card */}
      <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, ID, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Department Select */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              disabled={!!lockedBranch}
              className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none ${lockedBranch ? 'bg-slate-100 cursor-not-allowed' : ''}`}
            >
              <option value="-- Select --">All Departments</option>
              {departments.map((dept) => (
                <option value={dept} key={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order Select */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
            >
              <option value="Ascending">Sort Employee ID (Ascending)</option>
              <option value="Descending">Sort Employee ID (Descending)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📦 Main Dual View Content */}
      {filteredFaculties.length === 0 ? (
        <div className="bento-card p-12 text-center bg-white border border-slate-200">
          <FiBriefcase className="mx-auto text-slate-300 text-4xl mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Faculty Members Found</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Try adjusting your department filter or search criteria.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* 🔲 Bento Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculties.map((faculty) => (
            <div
              key={faculty.employeeId}
              className="bento-card p-6 bg-white border border-slate-200 hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header Row: Avatar & Badges */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getFileUrl(faculty.profile)}
                      alt={faculty.firstName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-xs"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shadow-xs" style={{ display: 'none' }}>
                      <FiUser />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {faculty.firstName} {faculty.middleName} {faculty.lastName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Emp ID: <span className="font-bold text-indigo-600">{faculty.employeeId}</span></p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-100">
                    {faculty.department}
                  </span>
                </div>

                {/* Info Pills Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium block">Designation</span>
                    <span className="font-bold text-slate-800 truncate block">{faculty.post || 'Faculty'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Experience</span>
                    <span className="font-bold text-slate-800 block">{faculty.experience || '0'} Years</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">JNTU ID</span>
                    <span className="font-semibold text-slate-700 truncate block">{faculty.jntuId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">AICTE ID</span>
                    <span className="font-semibold text-slate-700 truncate block">{faculty.aicteId || 'N/A'}</span>
                  </div>
                </div>

                {/* Contact Links */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center space-x-2 truncate">
                    <FiMail className="text-slate-400 flex-shrink-0" />
                    <span className="truncate font-medium">{faculty.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiPhone className="text-slate-400 flex-shrink-0" />
                    <span className="font-medium">{faculty.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  faculty.gender === 'Male' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'
                }`}>
                  {faculty.gender}
                </span>
                <span className="text-indigo-600 font-bold">Faculty Member</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 📋 Compact Table View */
        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
          <table className="min-w-[1200px] w-full text-left">
            <thead>
              <tr>
                <th className="py-3 px-4">Emp ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Post</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">JNTU ID</th>
                <th className="py-3 px-4">Gender</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties.map((faculty, index) => (
                <tr key={faculty.employeeId} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="font-bold text-xs text-indigo-600 py-3.5 px-4">{faculty.employeeId}</td>
                  <td className="font-bold text-sm text-slate-900 py-3.5 px-4">
                    {faculty.firstName} {faculty.middleName} {faculty.lastName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs border border-emerald-100">
                      {faculty.department}
                    </span>
                  </td>
                  <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{faculty.post}</td>
                  <td className="text-xs font-semibold text-slate-800 py-3.5 px-4">{faculty.experience} yrs</td>
                  <td className="text-xs text-slate-600 py-3.5 px-4">{faculty.email}</td>
                  <td className="text-xs text-slate-600 py-3.5 px-4">{faculty.phoneNumber}</td>
                  <td className="text-xs font-mono text-slate-700 py-3.5 px-4">{faculty.jntuId || '-'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      faculty.gender === 'Male' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-pink-50 text-pink-700 border border-pink-100'
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
  );
};

export default ViewFaculty;
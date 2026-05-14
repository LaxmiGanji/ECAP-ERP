

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { FiDownload, FiFilter, FiRefreshCw, FiSearch, FiUsers } from "react-icons/fi";
import { baseApiURL } from "../../baseUrl";

const FacultyData = () => {
  const [faculties, setFaculties] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFaculties = () => {
    setLoading(true);
    axios
      .get(`${baseApiURL()}/faculty/details/getDetails2`)
      .then((res) => {
        if (res.data.success) {
          setFaculties(res.data.faculties || []);
        } else {
          toast.error(res.data.message || "Unable to load faculty data");
        }
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load faculty data")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const departments = useMemo(() => {
    const unique = new Set(
      faculties.map((faculty) => faculty.department).filter((dept) => !!dept)
    );
    return ["all", ...unique];
  }, [faculties]);

  const filteredFaculties = useMemo(() => {
    return faculties.filter((faculty) => {
      const matchesDept =
        departmentFilter === "all" ||
        (faculty.department || "").toLowerCase() === departmentFilter.toLowerCase();
      const exp = Number(faculty.experience) || 0;
      const matchesExp =
        !experienceFilter || exp >= Number(experienceFilter || 0);
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        faculty.employeeId?.toLowerCase().includes(term) ||
        faculty.firstName?.toLowerCase().includes(term) ||
        faculty.lastName?.toLowerCase().includes(term) ||
        faculty.email?.toLowerCase().includes(term);
      return matchesDept && matchesExp && matchesSearch;
    });
  }, [faculties, departmentFilter, experienceFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = faculties.length;
    const totalExperience = faculties.reduce(
      (sum, faculty) => sum + (Number(faculty.experience) || 0),
      0
    );
    const avgExperience = total ? (totalExperience / total).toFixed(1) : "0.0";
    const recent = faculties.filter(
      (faculty) => (Number(faculty.experience) || 0) <= 1
    ).length;
    return {
      total,
      avgExperience,
      deptCount: departments.length - 1,
      recent,
    };
  }, [faculties, departments]);

  const exportToExcel = () => {
    if (filteredFaculties.length === 0) {
      toast.error("No faculty records to export");
      return;
    }
    const data = filteredFaculties.map((faculty) => ({
      "Employee ID": faculty.employeeId,
      Name: `${faculty.firstName || ""} ${faculty.lastName || ""}`.trim(),
      Email: faculty.email,
      Phone: faculty.phoneNumber,
      Department: faculty.department,
      Experience: faculty.experience,
      "Designation": faculty.post,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty");
    XLSX.writeFile(workbook, "faculty_directory.xlsx");
    toast.success("Faculty data exported");
  };

  const formatPhone = (value) => {
    if (!value) return "—";
    return value.toString().replace(/(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                <FiUsers className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Faculty Directory</h1>
                <p className="text-indigo-100 text-sm">
                  Quick access to faculty contacts, departments, and experience.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchFaculties}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                disabled={loading}
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                type="button"
                onClick={exportToExcel}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <FiDownload />
                Export
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">Total Faculty</p>
                <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">Departments</p>
                <p className="text-3xl font-semibold text-indigo-600">
                  {stats.deptCount}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">Avg. Experience</p>
                <p className="text-3xl font-semibold text-emerald-600">
                  {stats.avgExperience} yrs
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-sm text-slate-500">New Joinees (&lt;= 1 yr)</p>
                <p className="text-3xl font-semibold text-amber-600">{stats.recent}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <FiFilter />
                Filters
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, or ID"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    placeholder="Min experience (years)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Experience</th>
                    <th className="px-4 py-3 text-left">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFaculties.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        {loading ? "Loading faculty..." : "No matching records found."}
                      </td>
                    </tr>
                  )}
                  {filteredFaculties.map((faculty) => (
                    <tr key={faculty._id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {faculty.firstName} {faculty.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{faculty.employeeId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{faculty.email || "—"}</p>
                        <p className="text-xs text-slate-500">{formatPhone(faculty.phoneNumber)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{faculty.department || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {(Number(faculty.experience) || 0).toFixed(1)} yrs
                      </td>
                      <td className="px-4 py-3 text-slate-600">{faculty.post || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyData;
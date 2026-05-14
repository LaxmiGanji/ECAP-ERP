import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { toast } from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";

const Reports = () => {
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ batch: "", branch: "" });
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [tab, setTab] = useState("students");
  const [loading, setLoading] = useState(false);

  // Custom sorting function for enrollment numbers
  const sortEnrollmentNumbers = (students, order = 'ascending') => {
    return [...students].sort((a, b) => {
      // Extract the numeric and alphabetic parts
      const getSortValue = (enrollment) => {
        if (!enrollment) return '';
        
        // Match the pattern: numbers first, then optional letters
        const match = enrollment.match(/^(\d+)([A-Z]*)(\d*)([A-Z]*)$/);
        if (!match) return enrollment;
        
        const [, prefix, letters1, numbers, letters2] = match;
        
        // Convert to a sortable format
        // Pad numbers with leading zeros for proper numeric sorting
        const paddedPrefix = prefix.padStart(10, '0');
        const letters1Value = letters1 || '';
        const paddedNumbers = numbers.padStart(3, '0');
        const letters2Value = letters2 || '';
        
        return `${paddedPrefix}${letters1Value}${paddedNumbers}${letters2Value}`;
      };

      const valA = getSortValue(a.enrollmentNo);
      const valB = getSortValue(b.enrollmentNo);
      
      return order === 'ascending' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  };

  useEffect(() => {
    // load branches for dropdown
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data?.branches)) {
          setBranches(res.data.branches);
        }
      })
      .catch(() => {});
  }, []);

  const fetchReport = async () => {
    if (!filters.batch && !filters.branch) {
      toast.error("Select at least batch or branch");
      return;
    }
    
    // Validate batch input is a number if provided
    if (filters.batch && isNaN(filters.batch)) {
      toast.error("Batch must be a valid year");
      return;
    }
    
    try {
      setLoading(true);
      const params = {};
      
      // Handle batch parameter correctly
      if (filters.batch) {
        // If batch is provided, send it as is (could be string or number)
        params.batch = filters.batch.toString();
      }
      
      if (filters.branch && filters.branch !== "") {
        params.branch = filters.branch;
      }
      
      const url = tab === "students"
        ? `${baseApiURL()}/student/details/reports/byBatchBranch`
        : `${baseApiURL()}/faculty/details/reports/byBatchBranch`;
      
      console.log("Fetching with params:", params); // For debugging
      
      const res = await axios.get(url, { params });
      
      if (res.data?.success) {
        if (tab === "students") {
          // Sort students by enrollment number
          const sortedStudents = sortEnrollmentNumbers(res.data.students || [], 'ascending');
          setStudents(sortedStudents);
        } else {
          setFaculties(res.data.faculties || []);
        }
        
        if (res.data.students?.length === 0 || res.data.faculties?.length === 0) {
          toast.success("No records found for the selected criteria");
        } else {
          toast.success(`Found ${tab === 'students' ? res.data.students?.length : res.data.faculties?.length} records`);
        }
      }
      else {
        toast.error(res.data?.message || "Failed to load report");
      }
    } catch (e) {
      console.error("Error fetching report:", e);
      toast.error(e.response?.data?.message || "Failed to load report. Please check your filters.");
    } finally {
      setLoading(false);
    }
  };

  const total = tab === "students" ? students.length : faculties.length;

  const batchesPreset = useMemo(() => {
    const current = new Date().getFullYear();
    const list = [];
    for (let y = current; y >= current - 6; y--) list.push(y);
    return list;
  }, []);

  // Function to export to Excel with sorted data
  const exportToExcel = () => {
    const hasData = tab === 'students' ? students.length : faculties.length;
    if (!hasData) {
      toast.error("No data to export");
      return;
    }
    
    // Sort students again before export to ensure correct order
    const dataToExport = tab === 'students' 
      ? sortEnrollmentNumbers(students, 'ascending')
      : faculties;
    
    const exportRows = dataToExport.map((item, idx) => {
      if (tab === 'students') {
        return {
          SNo: idx + 1,
          EnrollmentNo: item.enrollmentNo,
          FirstName: item.firstName || "",
          MiddleName: item.middleName || "",
          LastName: item.lastName || "",
          Branch: item.branch || "",
          Batch: item.batch || "",
          Semester: item.semester || "",
          Section: item.section || "",
          Email: item.email || "",
          Phone: item.phoneNumber || "",
        };
      }
      return {
        SNo: idx + 1,
        EmployeeId: item.employeeId,
        FirstName: item.firstName || "",
        MiddleName: item.middleName || "",
        LastName: item.lastName || "",
        Department: item.department || "",
        Batch: item.batch || "",
        Email: item.email || "",
        Phone: item.phoneNumber || "",
        Post: item.post || "",
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tab === 'students' ? "Student Report" : "Faculty Report");
    
    const nameParts = [];
    if (filters.batch) nameParts.push(`Batch-${filters.batch}`);
    if (filters.branch) nameParts.push(`Branch-${filters.branch}`);
    const fileName = `${tab === 'students' ? 'Student' : 'Faculty'}_Report${nameParts.length ? `_${nameParts.join("_")}` : ""}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    toast.success("Excel file downloaded successfully!");
  };

  return (
    <div className="p-6">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800">Reports</h2>
        <p className="text-sm text-gray-500">Filter by batch and branch</p>
        <div className="mt-4 inline-flex rounded-lg overflow-hidden border">
          <button
            className={`px-4 py-2 text-sm ${tab === 'students' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            onClick={() => setTab('students')}
          >
            Students
          </button>
          <button
            className={`px-4 py-2 text-sm ${tab === 'faculty' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            onClick={() => setTab('faculty')}
          >
            Faculty
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch Year</label>
            <input
              type="text"
              value={filters.batch}
              onChange={(e) => {
                // Allow only numbers and empty string
                if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                  setFilters({ ...filters, batch: e.target.value });
                }
              }}
              placeholder="e.g., 2022"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-xs text-gray-500 mt-2">
              Suggested: {batchesPreset.join(", ")}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id || b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button 
              onClick={fetchReport} 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>
          
          <div className="flex items-end">
            <div className="w-full bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200">
              <span className="text-sm font-medium">Total Records: </span>
              <span className="text-lg font-bold">{total}</span>
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              disabled={total === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        {tab === 'students' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((s, index) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{s.enrollmentNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.batch || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {s.semester}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.section || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phoneNumber}</td>
                  </tr>
                ))}
                {!students.length && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No student data found</p>
                        <p className="text-sm">Try adjusting your filters or generate a new report</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'faculty' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faculties.map((f, index) => (
                  <tr key={f._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{f.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {[f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.batch || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {f.post || "Faculty"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.phoneNumber}</td>
                  </tr>
                ))}
                {!faculties.length && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-lg font-medium">No faculty data found</p>
                        <p className="text-sm">Try adjusting your filters or generate a new report</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
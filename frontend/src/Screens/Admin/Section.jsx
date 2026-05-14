import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { FiUsers, FiFilter, FiCheckCircle } from "react-icons/fi";

const Section = ({ branch: lockedBranch }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(lockedBranch || "-- Select --");
  const [semester, setSemester] = useState("-- Select --");
  const [fromEnrollment, setFromEnrollment] = useState("");
  const [toEnrollment, setToEnrollment] = useState("");
  const [section, setSection] = useState("-- Select --");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Custom sorting function for enrollment numbers
  const sortEnrollmentNumbers = (students, order = 'ascending') => {
    return [...students].sort((a, b) => {
      // Extract the numeric and alphabetic parts
      const getSortValue = (enrollment) => {
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

  // Fetch all students and branches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const branchRes = await axios.get(`${baseApiURL()}/branch/getBranch`);
        if (branchRes.data.success) setBranches(branchRes.data.branches);

        const studentRes = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
        if (studentRes.data.success) {
          // Sort students initially
          const sortedStudents = sortEnrollmentNumbers(studentRes.data.students, 'ascending');
          setAllStudents(sortedStudents);
        }
      } catch (error) {
        toast.error("Error fetching data");
        console.error(error);
      }
    };

    fetchData();
  }, []);

  // Filter students by selected filters and maintain sort order
  useEffect(() => {
    const filter = () => {
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

      // Always maintain ascending order for filtered results
      const sortedResult = sortEnrollmentNumbers(result, 'ascending');
      setFilteredStudents(sortedResult);
      // Clear selected students when filters change
      setSelectedStudents([]);
    };

    filter();
  }, [selectedBranch, semester, fromEnrollment, toEnrollment, allStudents]);

  // Handle individual student selection
  const handleStudentSelect = (enrollmentNo) => {
    setSelectedStudents(prev => 
      prev.includes(enrollmentNo)
        ? prev.filter(id => id !== enrollmentNo)
        : [...prev, enrollmentNo]
    );
  };

  // Handle select all students
  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.enrollmentNo));
    }
  };

  const handleAssignSection = async () => {
    if (
      selectedBranch === "-- Select --" ||
      semester === "-- Select --" ||
      section === "-- Select --"
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
        section,
        studentEnrollments: selectedStudents,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        // Refresh the student list
        const refresh = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
        if (refresh.data.success) {
          // Sort refreshed students
          const sortedStudents = sortEnrollmentNumbers(refresh.data.students, 'ascending');
          setAllStudents(sortedStudents);
        }
        // Clear selected students
        setSelectedStudents([]);
      } else {
        toast.error("Failed to assign section");
      }
    } catch (error) {
      toast.error("Error while assigning section");
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Section Management</h1>
            <p className="text-gray-600 mt-2">Assign sections to students by selecting them individually or using enrollment ranges</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <FiFilter className="text-blue-600 text-lg" />
            <h2 className="text-xl font-semibold text-gray-800">Filter Criteria</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={!!lockedBranch}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option>-- Select --</option>
                {[...Array(8).keys()].map((i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option>-- Select --</option>
                {["A", "B", "C", "D", "SOC","WIPRO TRAINING", "ATT"].map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter enrollment number (e.g., 22N81A0501)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Enrollment No</label>
              <input
                type="text"
                value={toEnrollment}
                onChange={(e) => setToEnrollment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter enrollment number (e.g., 22N81A05B9)"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <button
            onClick={handleAssignSection}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <FiCheckCircle className="w-5 h-5" />
            <span>Assign Section</span>
          </button>
        </div>
      </div>

      {/* Student List Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiUsers className="text-blue-600 text-lg" />
              <h3 className="text-xl font-semibold text-gray-800">Filtered Students</h3>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {selectedStudents.length} of {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-sm text-gray-500">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Students Found</h3>
              <p className="text-gray-500">No students match the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Enrollment No</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Email</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Phone</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-gray-700">Semester</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Branch</th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-gray-700">Section</th>
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
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono font-medium">{s.enrollmentNo}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{`${s.firstName} ${s.middleName || ""} ${s.lastName}`}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-center">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {s.semester}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{s.branch}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.section 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {s.section || "-"}
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
  );
};

export default Section;
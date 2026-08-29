import React, { useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { FiAlertCircle } from "react-icons/fi";

const ExcelTemplateDownload = ({ branch: lockedBranch }) => {
  const [filters, setFilters] = useState({
    branch: lockedBranch || "",
    semester: "",
    section: "",
    subject: ""
  });
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noStudentsMessage, setNoStudentsMessage] = useState("");
  const [sections, setSections] = useState([]);

  // Fetch branches on component mount
  React.useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch subjects & dynamic sections when branch and semester are selected
  React.useEffect(() => {
    if (filters.branch && filters.semester) {
      fetchSubjectsByBranchAndSemester();
      fetchSectionsByBranchAndSemester();
    } else {
      setSubjects([]);
      setSections([]);
      setFilters(prevFilters => ({ ...prevFilters, subject: "", section: "" }));
    }
  }, [filters.branch, filters.semester]);

  const fetchSectionsByBranchAndSemester = async () => {
    try {
      const response = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, {
        params: {
          branch: filters.branch,
          semester: filters.semester,
        },
      });
      if (response.data.success && response.data.sections) {
        setSections(response.data.sections);
        if (filters.section && !response.data.sections.includes(filters.section)) {
          setFilters(prev => ({ ...prev, section: "" }));
        }
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${baseApiURL()}/branch/getBranch`);
      if (response.data.success) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Failed to load branches");
    }
  };

  const fetchSubjectsByBranchAndSemester = async () => {
    try {
      // 1. Fetch student details to detect active cohort regulation
      let studentReg = null;
      let hasStudents = false;
      try {
        const studentRes = await axios.post(`${baseApiURL()}/student/details/getDetails`, {
          branch: filters.branch,
          semester: parseInt(filters.semester)
        });
        if (studentRes.data.success && studentRes.data.user && studentRes.data.user.length > 0) {
          hasStudents = true;
          studentReg = studentRes.data.user[0].regulation;
        }
      } catch (err) {
        console.warn("Could not fetch students for regulation check:", err);
      }

      if (!hasStudents) {
        setSubjects([]);
        setNoStudentsMessage("no students are there for that semester");
        setFilters(prevFilters => ({ ...prevFilters, subject: "" }));
        return;
      }

      setNoStudentsMessage("");

      // 2. Fetch all subjects and filter by branch, semester, AND student regulation
      const response = await axios.get(`${baseApiURL()}/subject/getSubject`);
      if (response.data.success) {
        const filteredSubjects = response.data.subject.filter(subject => {
          const branchMatch = subject.branch?.name === filters.branch;
          const semesterMatch = subject.semester === parseInt(filters.semester);
          const regMatch = !studentReg || subject.regulation?.toUpperCase() === studentReg.toUpperCase();
          return branchMatch && semesterMatch && regMatch;
        });
        
        setSubjects(filteredSubjects);
        
        // Auto-select subject if only one exists
        if (filteredSubjects.length === 1) {
          setFilters(prevFilters => ({ ...prevFilters, subject: filteredSubjects[0].name }));
        }
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  const fetchStudentsByFilters = async () => {
    try {
      // Use the correct endpoint - getDetails2 instead of getDetails
      const response = await axios.get(`${baseApiURL()}/student/details/getDetails2`);
      
      if (response.data.success && response.data.students) {
        // Filter students manually based on our criteria
        const filteredStudents = response.data.students.filter(student => {
          const branchMatch = student.branch === filters.branch;
          const semesterMatch = student.semester === parseInt(filters.semester);
          const sectionMatch = student.section === filters.section;
          
          return branchMatch && semesterMatch && sectionMatch;
        });
        
        return filteredStudents;
      }
      return [];
    } catch (error) {
      console.error("Error fetching students:", error);
      
      // If getDetails2 fails, try alternative approach
      try {
        // Try to get students by batch and branch as fallback
        const currentYear = new Date().getFullYear();
        const batch = currentYear - parseInt(filters.semester) + 1; // Approximate batch calculation
        
        const fallbackResponse = await axios.get(
          `${baseApiURL()}/student/details/reports/byBatchBranch`,
          {
            params: {
              batch: batch,
              branch: filters.branch
            }
          }
        );
        
        if (fallbackResponse.data.success) {
          // Filter by semester and section
          const filteredStudents = fallbackResponse.data.students.filter(student => {
            const semesterMatch = student.semester === parseInt(filters.semester);
            const sectionMatch = student.section === filters.section;
            return semesterMatch && sectionMatch;
          });
          
          return filteredStudents;
        }
        return [];
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        toast.error("Failed to load students. Please check if students exist for the selected filters.");
        return [];
      }
    }
  };

  const createTemplate = async () => {
    if (!filters.branch || !filters.semester || !filters.section || !filters.subject) {
      toast.error("Please select all filters: Branch, Semester, Section, and Subject");
      return;
    }

    setLoading(true);
    toast.loading("Generating template with student data...");

    try {
      // Fetch students based on filters
      const students = await fetchStudentsByFilters();
      
      if (students.length === 0) {
        toast.error(`No students found for: ${filters.branch} - Sem ${filters.semester} - ${filters.section}`);
        setLoading(false);
        toast.dismiss();
        return;
      }

      // Prepare template data with student details
      const templateData = students.map(student => {
        // Combine first, middle, and last names
        const fullName = [student.firstName, student.middleName, student.lastName]
          .filter(name => name && name.trim() !== '')
          .join(' ')
          .trim();

        return {
          enrollmentNo: student.enrollmentNo,
          name: fullName || 'Name not available',
          branch: student.branch,
          semester: student.semester,
          subject: filters.subject,
          section: student.section || filters.section,
          howmanypresent: 0, // Default to 0 - user will edit this
          totalClasses: 0     // Default to 0 - user will edit this
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 15 }, // enrollmentNo
        { wch: 20 }, // name
        { wch: 12 }, // branch
        { wch: 10 }, // semester
        { wch: 25 }, // subject
        { wch: 15 }, // section
        { wch: 15 }, // howmanypresent
        { wch: 15 }  // totalClasses
      ];
      worksheet['!cols'] = colWidths;

      // Add instructions as a second sheet
      const instructions = [
        ["ATTENDANCE IMPORT TEMPLATE - INSTRUCTIONS"],
        [""],
        ["FILTERS USED FOR THIS TEMPLATE:"],
        ["Branch", filters.branch],
        ["Semester", filters.semester],
        ["Section", filters.section],
        ["Subject", filters.subject],
        ["Total Students", students.length],
        ["", ""],
        ["COLUMN DESCRIPTIONS:"],
        ["enrollmentNo", "Student enrollment number (Auto-filled)"],
        ["name", "Student full name (Auto-filled)"],
        ["branch", "Branch name (Auto-filled)"],
        ["semester", "Semester number (Auto-filled)"],
        ["subject", "Subject name (Auto-filled)"],
        ["section", "Section (Auto-filled)"],
        ["howmanypresent", "Number of days student was present - EDIT THIS"],
        ["totalClasses", "Total classes conducted - EDIT THIS"],
        [""],
        ["IMPORTANT INSTRUCTIONS:"],
        ["1. DO NOT change enrollmentNo, name, branch, semester, subject, or section columns"],
        ["2. ONLY edit howmanypresent and totalClasses columns"],
        ["3. For all students in this file, use the SAME totalClasses value"],
        ["4. howmanypresent cannot be greater than totalClasses"],
        ["5. Save the file after editing"],
        ["6. Upload the same file to import attendance"],
        [""],
        ["EXAMPLE:"],
        ["If you conducted 20 classes and a student was present 15 days:"],
        ["howmanypresent = 15, totalClasses = 20"],
        [""],
        ["The system will create attendance records automatically!"]
      ];

      const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
      
      // Set column widths for instructions sheet
      instructionSheet['!cols'] = [
        { wch: 35 }, // First column
        { wch: 70 }  // Second column
      ];

      // Add sheets to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Data");
      XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");

      // Generate and download the file
      const fileName = `attendance_${filters.branch}_sem${filters.semester}_${filters.section}_${filters.subject.replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.dismiss();
      toast.success(`Template downloaded with ${students.length} students`);
      
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to generate template. Please try again.");
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, [field]: value };
      
      // Reset subject if branch or semester changes
      if ((field === 'branch' || field === 'semester') && prevFilters.subject) {
        updatedFilters.subject = "";
      }
      
      return updatedFilters;
    });
  };

  // Get available sections based on selected branch and semester
  const getAvailableSections = () => {
    return sections;
  };

  return (
    <div className="bento-card p-6 bg-white border border-slate-200 shadow-xs space-y-4 mb-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
        <h3 className="text-base font-bold text-slate-900">
          Generate Attendance Excel Template
        </h3>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Branch Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Branch *
          </label>
          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            disabled={!!lockedBranch}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">Select Branch</option>
            {branches.map(branch => (
              <option key={branch._id} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Semester *
          </label>
          <select
            value={filters.semester}
            onChange={(e) => handleFilterChange('semester', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section *
          </label>
          <select
            value={filters.section}
            onChange={(e) => handleFilterChange('section', e.target.value)}
            disabled={!filters.branch || !filters.semester}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!filters.branch || !filters.semester ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">
              {!filters.branch || !filters.semester
                ? "Select Branch & Semester First"
                : sections.length > 0
                ? "Select Section"
                : "No Sections Found"}
            </option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <select
            value={filters.subject}
            onChange={(e) => handleFilterChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!filters.branch || !filters.semester}
          >
            <option value="">
              {!filters.branch || !filters.semester 
                ? "Select Branch & Semester first" 
                : subjects.length === 0 
                  ? "No subjects found" 
                  : "Select Subject"}
            </option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject.name}>
                {subject.name} {subject.code ? `(${subject.code})` : ''} {subject.regulation ? `[${subject.regulation}]` : ''}
              </option>
            ))}
          </select>
          {noStudentsMessage ? (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center space-x-1">
              <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{noStudentsMessage}</span>
            </div>
          ) : filters.branch && filters.semester && subjects.length === 0 && (
            <p className="text-xs text-red-600 mt-1">
              No subjects found for {filters.branch} - Sem {filters.semester}
            </p>
          )}
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={createTemplate}
        disabled={loading || !filters.branch || !filters.semester || !filters.section || !filters.subject}
        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center ${
          loading || !filters.branch || !filters.semester || !filters.section || !filters.subject
            ? 'bg-gray-400 cursor-not-allowed text-gray-600'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Generating Template...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Pre-filled Template
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="mt-4 text-sm text-blue-600">
        <p className="font-semibold mb-2">How it works:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Select Branch, Semester, Section, and Subject</li>
          <li>Download the pre-filled Excel template</li>
          <li>Edit only <strong>howmanypresent</strong> and <strong>totalClasses</strong> columns</li>
          <li>Upload the same file to import attendance</li>
        </ol>
      </div>

      {/* Current Selection Info */}
      {(filters.branch || filters.semester || filters.section || filters.subject) && (
        <div className="mt-3 p-3 bg-white rounded border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-1">Current Selection:</p>
          <div className="text-sm text-blue-700 grid grid-cols-2 gap-1">
            {filters.branch && <span>Branch: {filters.branch}</span>}
            {filters.semester && <span>Semester: {filters.semester}</span>}
            {filters.section && <span>Section: {filters.section}</span>}
            {filters.subject && <span>Subject: {filters.subject}</span>}
          </div>
          {filters.branch && filters.semester && (
            <p className="text-xs text-gray-600 mt-2">
              Available subjects: {subjects.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelTemplateDownload;
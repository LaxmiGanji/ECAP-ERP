import React, { useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import ExcelTemplateDownload from "./ExcelTemplateDownload";

const ImportAttendance = ({ branch: lockedBranch }) => {
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [summary, setSummary] = useState(null);

  // Handle Excel file upload and parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log("Raw Excel Data:", jsonData);

        // Validate required columns
        const requiredColumns = ['enrollmentNo', 'name', 'branch', 'semester', 'subject', 'section', 'howmanypresent', 'totalClasses'];
        const actualColumns = Object.keys(jsonData[0] || {});
        
        console.log("Actual Columns:", actualColumns);
        
        const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
        if (missingColumns.length > 0) {
          toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        // Validate data types
        const validatedData = jsonData.map((row, index) => {
          const errors = [];
          
          if (!row.enrollmentNo || typeof row.enrollmentNo !== 'string') {
            errors.push('enrollmentNo must be a string');
          }
          if (!row.name || typeof row.name !== 'string') {
            errors.push('name must be a string');
          }
          if (!row.branch || typeof row.branch !== 'string') {
            errors.push('branch must be a string');
          }
          if (!row.semester || isNaN(Number(row.semester))) {
            errors.push('semester must be a number');
          }
          if (!row.subject || typeof row.subject !== 'string') {
            errors.push('subject must be a string');
          }
          if (!row.section || typeof row.section !== 'string') {
            errors.push('section must be a string');
          }
          if (row.howmanypresent === undefined || isNaN(Number(row.howmanypresent))) {
            errors.push('howmanypresent must be a number');
          }
          if (!row.totalClasses || isNaN(Number(row.totalClasses))) {
            errors.push('totalClasses must be a number');
          }

          // Validate branch if locked
          if (lockedBranch && row.branch && String(row.branch).trim() !== String(lockedBranch).trim()) {
            errors.push(`Row branch (${row.branch}) does not match your assigned department (${lockedBranch})`);
          }

          if (errors.length > 0) {
            toast.error(`Row ${index + 2}: ${errors.join(', ')}`);
            return null;
          }

          return {
            enrollmentNo: String(row.enrollmentNo).trim(),
            name: String(row.name).trim(),
            branch: String(row.branch).trim(),
            semester: Number(row.semester),
            subject: String(row.subject).trim(),
            section: String(row.section).trim(),
            howmanypresent: Number(row.howmanypresent),
            totalClasses: Number(row.totalClasses)
          };
        }).filter(row => row !== null);

        if (validatedData.length === 0) {
          toast.error("No valid data found in the Excel file");
          return;
        }

        console.log("Validated Data:", validatedData);

        setImportData(validatedData);
        toast.success(`Successfully loaded ${validatedData.length} records`);
        
        // Process data for preview
        processImportData(validatedData);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast.error("Error reading Excel file. Please check the format.");
      }
    };
    
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      toast.error("Error reading file. Please try again.");
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Generate unique dates for attendance records
  const generateAttendanceDates = (daysCount, studentIndex, importId) => {
    const dates = [];
    const baseDate = new Date();
    
    const uniqueStart = (importId % 1000) + (studentIndex * 100);
    
    for (let day = 0; day < daysCount; day++) {
      const attendanceDate = new Date(baseDate);
      attendanceDate.setDate(attendanceDate.getDate() - (uniqueStart + day));
      
      if (isNaN(attendanceDate.getTime())) {
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + day);
        dates.push(fallbackDate.toISOString().split('T')[0]);
      } else {
        dates.push(attendanceDate.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  // Process import data
  const processImportData = (data) => {
    const subjectGroups = {};
    const attendanceRecords = [];
    const processedStudents = [];
    const importId = Date.now();

    data.forEach((row, rowIndex) => {
      const key = `${row.branch}-${row.semester}-${row.subject}-${row.section}`;
      
      if (!subjectGroups[key]) {
        subjectGroups[key] = {
          branch: row.branch,
          semester: row.semester,
          subject: row.subject,
          section: row.section,
          totalClasses: row.totalClasses,
          students: []
        };
      }
      subjectGroups[key].students.push(row);

      const attendanceDates = generateAttendanceDates(row.howmanypresent, rowIndex, importId);

      attendanceDates.forEach((date) => {
        attendanceRecords.push({
          enrollmentNo: row.enrollmentNo,
          name: row.name,
          branch: row.branch,
          semester: row.semester,
          subject: row.subject,
          section: row.section,
          period: "1",
          date: date,
          importBatch: importId
        });
      });

      processedStudents.push({
        ...row,
        attendanceDays: row.howmanypresent
      });
    });

    setProcessedData(processedStudents);
    setSummary({
      totalStudents: processedStudents.length,
      totalAttendanceRecords: attendanceRecords.length,
      subjectGroups: Object.values(subjectGroups),
      attendanceRecords,
      importId
    });
  };

  // Import attendance data
  const handleImport = async () => {
    if (!summary || summary.attendanceRecords.length === 0) {
      toast.error("No data to import");
      return;
    }

    setLoading(true);
    toast.loading("Importing attendance data...");

    try {
      // Update subject total classes
      const subjectUpdates = [];
      const processedSubjects = new Set();

      summary.subjectGroups.forEach(group => {
        const key = `${group.branch}-${group.semester}-${group.subject}-${group.section}`;
        if (!processedSubjects.has(key)) {
          subjectUpdates.push(updateSubjectTotalClasses(group));
          processedSubjects.add(key);
        }
      });

      await Promise.all(subjectUpdates);

      // Add attendance records in batches
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < summary.attendanceRecords.length; i += batchSize) {
        batches.push(summary.attendanceRecords.slice(i, i + batchSize));
      }

      let successfulBatches = 0;
      let totalImportedRecords = 0;

      for (const batch of batches) {
        try {
          const response = await axios.post(
            `${baseApiURL()}/attendence/addBulk`,
            batch
          );
          
          if (response.data.success) {
            successfulBatches++;
            totalImportedRecords += batch.length;
          }
        } catch (error) {
          console.error("Error in batch:", error);
        }
      }

      toast.dismiss();
      setLoading(false);

      if (successfulBatches === batches.length) {
        toast.success(`Successfully imported ${totalImportedRecords} attendance records for ${summary.totalStudents} students`);
        setImportData([]);
        setProcessedData([]);
        setSummary(null);
        document.getElementById("excel-file").value = "";
      } else {
        toast.error(`Imported ${totalImportedRecords} out of ${summary.totalAttendanceRecords} records. Some batches failed.`);
      }
    } catch (error) {
      toast.dismiss();
      setLoading(false);
      console.error("Import error:", error);
      toast.error("Failed to import attendance data");
    }
  };

  const createNewSubject = async (subjectGroup) => {
    try {
      const branchResponse = await axios.get(`${baseApiURL()}/branch/getBranch`);
      const branches = branchResponse.data?.branches || [];
      const branch = branches.find(
        (item) =>
          item.name?.toLowerCase().trim() === subjectGroup.branch?.toLowerCase().trim()
      );

      if (!branch?._id) {
        toast.error(
          `Branch "${subjectGroup.branch}" not found. Please create the branch first.`
        );
        return false;
      }

      const subjectCode = `${subjectGroup.branch}-${subjectGroup.semester}-${subjectGroup.subject}`
        .replace(/[^a-zA-Z0-9]/g, "-")
        .toUpperCase();

      const payload = {
        name: subjectGroup.subject,
        code: subjectCode,
        semester: subjectGroup.semester,
        branch: branch._id,
        sectionTotals: [
          {
            section: subjectGroup.section,
            total: Number(subjectGroup.totalClasses) || 0,
          },
        ],
      };

      const response = await axios.post(`${baseApiURL()}/subject/addSubject`, payload);
      if (response.data.success) {
        toast.success(
          `Created subject "${subjectGroup.subject}" for ${subjectGroup.branch} - ${subjectGroup.section}`
        );
        return true;
      }

      toast.error(response.data.message || "Unable to create subject");
      return false;
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error("Failed to auto-create subject. Please add it manually first.");
      return false;
    }
  };

  // Update subject total classes - always increment for new imports
  const updateSubjectTotalClasses = async (subjectGroup) => {
    try {
        // First, find the subject by name, branch, and semester
        const subjectsResponse = await axios.get(`${baseApiURL()}/subject/getSubject`);
        
        if (subjectsResponse.data.success) {
            const subjects = subjectsResponse.data.subject;
            const subject = subjects.find(sub => 
                sub.name === subjectGroup.subject &&
                sub.branch?.name === subjectGroup.branch &&
                sub.semester === subjectGroup.semester
            );

            if (subject) {
                // For Excel imports, we want to increment by the total value
                const updateResponse = await axios.put(
                    `${baseApiURL()}/subject/updateSectionTotal/${subject._id}`,
                    {
                        section: subjectGroup.section,
                        total: subjectGroup.totalClasses,
                        isIncrement: true,
                        incrementType: 'BY_VALUE' // Explicitly specify increment type
                    }
                );

                if (!updateResponse.data.success) {
                    console.error(`Failed to update total classes for ${subjectGroup.subject} - ${subjectGroup.section}`);
                } else {
                    console.log(`Incremented total classes for ${subjectGroup.subject} - ${subjectGroup.section} by ${subjectGroup.totalClasses}`);
                }
            } else {
                console.warn(`Subject not found: ${subjectGroup.subject} for branch ${subjectGroup.branch}, semester ${subjectGroup.semester}`);
                await createNewSubject(subjectGroup);
                return;
            }
        }
    } catch (error) {
        console.error("Error updating subject total classes:", error);
    }
};

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Import Attendance from Excel</h2>

      {/* Template Download with Filters */}
      <ExcelTemplateDownload />

      {/* File Upload */}
      <div className="mb-6">
        <label className="block font-medium text-gray-700 mb-2">
          Upload Edited Excel File
        </label>
        <input
          id="excel-file"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="w-full px-4 py-2 border rounded"
          disabled={loading}
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload the Excel file after editing howmanypresent and totalClasses columns
        </p>
      </div>

      {/* Preview Section */}
      {processedData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Preview Data</h3>
          
          {summary && (
            <div className="mb-4 p-3 bg-blue-50 rounded border">
              <h4 className="font-semibold mb-2">Import Summary:</h4>
              <p>• Total Students: {summary.totalStudents}</p>
              <p>• Total Attendance Records: {summary.totalAttendanceRecords}</p>
              <p>• Subject/Section Groups: {summary.subjectGroups.length}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2">Enrollment No</th>
                  <th className="border border-gray-300 px-4 py-2">Name</th>
                  <th className="border border-gray-300 px-4 py-2">Branch</th>
                  <th className="border border-gray-300 px-4 py-2">Semester</th>
                  <th className="border border-gray-300 px-4 py-2">Subject</th>
                  <th className="border border-gray-300 px-4 py-2">Section</th>
                  <th className="border border-gray-300 px-4 py-2">Present Days</th>
                  <th className="border border-gray-300 px-4 py-2">Total Classes</th>
                </tr>
              </thead>
              <tbody>
                {processedData.slice(0, 10).map((student, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{student.enrollmentNo}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.branch}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.semester}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.subject}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.section}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.howmanypresent}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.totalClasses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedData.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 10 of {processedData.length} records
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Button */}
      {processedData.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleImport}
            disabled={loading}
            className={`px-8 py-3 rounded-lg text-white font-semibold ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? "Importing..." : `Import ${summary?.totalAttendanceRecords || 0} Attendance Records`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImportAttendance;
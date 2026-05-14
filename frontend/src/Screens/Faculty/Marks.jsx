import axios from "axios";
import { useEffect, useState } from "react";
import Heading from "../../components/Heading";
import toast from "react-hot-toast";
import { BiArrowBack, BiDownload } from "react-icons/bi";
import { FiFileText, FiUpload } from "react-icons/fi";
import { baseApiURL } from "../../baseUrl";
import ViewMarks from "./ViewMarks";
import * as XLSX from "xlsx";

const Marks = () => {
  const [studentData, setStudentData] = useState([]);
  const [branch, setBranch] = useState([]);
  const [subject, setSubject] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [existingMarks, setExistingMarks] = useState({});
  const [sections, setSections] = useState(["A", "B", "C", "D", "WIPRO TRAINING", "ATT", "SOC"]);
  const [selected, setSelected] = useState({
    branch: "-- Select --",
    semester: "-- Select --",
    section: "-- Select --",
    subject: "-- Select --",
    examType: "-- Select --",
    totalInternal: "40",
    totalExternal: "60",
  });
  const [showViewMarks, setShowViewMarks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Function to load existing marks for all students
  const loadExistingMarks = (students) => {
    if (!students || students.length === 0 || selected.subject === "-- Select --" || selected.examType === "-- Select --") {
      return;
    }

    const enrollments = students.map(s => s.enrollmentNo);
    const headers = { "Content-Type": "application/json" };
    
    axios
      .post(
        `${baseApiURL()}/marks/getMarksByEnrollments`,
        { 
          enrollments: enrollments,
          subject: selected.subject,
          examType: selected.examType 
        },
        { headers }
      )
      .then((response) => {
        if (response.data.success) {
          const marksMap = {};
          response.data.marks.forEach(item => {
            const examField = selected.examType === "internal" ? "internal" : "external";
            if (item[examField] && item[examField][selected.subject]) {
              marksMap[item.enrollmentNo] = item[examField][selected.subject];
            }
          });
          setExistingMarks(marksMap);
          
          // Pre-fill input fields with existing marks
          setTimeout(() => {
            Object.keys(marksMap).forEach(enrollment => {
              const inputField = document.getElementById(`${enrollment}marks`);
              if (inputField) {
                inputField.value = marksMap[enrollment];
              }
            });
          }, 100);
        }
      })
      .catch((error) => {
        console.error("Error loading existing marks:", error);
      });
  };

  // Function to load student details and sort them by enrollment number
  const loadStudentDetails = () => {
    if (selected.branch === "-- Select --" || selected.semester === "-- Select --" || selected.section === "-- Select --") {
      toast.error("Please select Branch, Semester, and Section");
      return;
    }

    if (selected.subject === "-- Select --" || selected.examType === "-- Select --") {
      toast.error("Please select Subject and Exam Type");
      return;
    }

    setLoading(true);
    toast.loading("Loading students...");
    
    const headers = { "Content-Type": "application/json" };
    axios
      .post(
        `${baseApiURL()}/student/details/getDetails`,
        { branch: selected.branch, semester: selected.semester, section: selected.section },
        { headers }
      )
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          // Sort student data by enrollment number (ascending order)
          const sortedData = [...response.data.user].sort((a, b) => {
            return (a.enrollmentNo || '').localeCompare(b.enrollmentNo || '', undefined, { numeric: true });
          });
          setStudentData(sortedData);
          
          // Load existing marks for these students
          loadExistingMarks(sortedData);
          
          toast.success(`Loaded ${sortedData.length} students`);
        } else {
          toast.error(response.data.message || "No students found");
          setStudentData([]);
          setExistingMarks({});
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error(error);
        toast.error(error.message);
        setStudentData([]);
        setExistingMarks({});
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Download template
  const downloadTemplate = () => {
    if (selected.branch === "-- Select --" || selected.semester === "-- Select --" || selected.section === "-- Select --") {
      toast.error("Please select Branch, Semester, and Section first");
      return;
    }

    if (selected.subject === "-- Select --" || selected.examType === "-- Select --") {
      toast.error("Please select Subject and Exam Type first");
      return;
    }

    if (studentData.length === 0) {
      toast.error("Please load student data first");
      return;
    }

    toast.loading("Generating template...");
    
    try {
      // Sort students by enrollment number
      const sortedStudents = [...studentData].sort((a, b) => {
        return (a.enrollmentNo || '').localeCompare(b.enrollmentNo || '', undefined, { numeric: true });
      });

      // Create worksheet data
      const wsData = [
        ['S.No', 'Enrollment No', 'Student Name', 'Branch', 'Semester', 'Section', 'Subject', 'Exam Type', 'Marks', 'Remarks']
      ];

      // Add student data rows
      sortedStudents.forEach((student, index) => {
        const fullName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
        
        wsData.push([
          index + 1,
          student.enrollmentNo,
          fullName || 'N/A',
          selected.branch,
          selected.semester,
          selected.section,
          selected.subject,
          selected.examType === 'internal' ? 'Internal' : 'External',
          '', // Empty marks cell
          ''  // Empty remarks cell
        ]);
      });

      // Add instructions row
      wsData.push(['', '', '', '', '', '', '', '', '', '']);
      wsData.push(['INSTRUCTIONS:', '', '', '', '', '', '', '', '', '']);
      wsData.push(['1. Do not modify the Enrollment No column', '', '', '', '', '', '', '', '', '']);
      wsData.push(['2. Enter marks only in the "Marks" column', '', '', '', '', '', '', '', '', '']);
      wsData.push(['3. Marks should be numeric values between 0 and ' + (selected.examType === 'internal' ? selected.totalInternal : selected.totalExternal), '', '', '', '', '', '', '', '', '']);
      wsData.push(['4. Empty marks will be skipped during import', '', '', '', '', '', '', '', '', '']);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 8 },   // S.No
        { wch: 18 },  // Enrollment No
        { wch: 30 },  // Student Name
        { wch: 15 },  // Branch
        { wch: 10 },  // Semester
        { wch: 12 },  // Section
        { wch: 25 },  // Subject
        { wch: 12 },  // Exam Type
        { wch: 12 },  // Marks
        { wch: 25 }   // Remarks
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Marks Template');

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Marks_Template_${selected.branch}_Sem${selected.semester}_Sec${selected.section}_${selected.subject}_${selected.examType}_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.dismiss();
      toast.success(`Template generated with ${studentData.length} students!`);
    } catch (error) {
      toast.dismiss();
      console.error("Template generation error:", error);
      toast.error("Error generating template");
    }
  };

  // Export marks to Excel
  const exportMarks = () => {
    if (!studentData || studentData.length === 0) {
      toast.error("No student data to export");
      return;
    }

    const maxMarks = selected.examType === 'internal' ? selected.totalInternal : selected.totalExternal;
    
    const exportData = studentData.map((student, index) => {
      const inputField = document.getElementById(`${student.enrollmentNo}marks`);
      const marks = inputField?.value || existingMarks[student.enrollmentNo] || '';
      const fullName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
      
      return {
        'S.No': index + 1,
        'Enrollment No': student.enrollmentNo,
        'Student Name': fullName || 'N/A',
        'Branch': selected.branch,
        'Semester': selected.semester,
        'Section': selected.section,
        'Subject': selected.subject,
        'Exam Type': selected.examType === 'internal' ? 'Internal' : 'External',
        'Marks': marks,
        'Status': marks ? (existingMarks[student.enrollmentNo] ? 'Updated' : 'New') : 'Pending',
        'Remarks': existingMarks[student.enrollmentNo] ? 'Previously entered' : ''
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 8 },   // S.No
      { wch: 18 },  // Enrollment No
      { wch: 30 },  // Student Name
      { wch: 15 },  // Branch
      { wch: 10 },  // Semester
      { wch: 12 },  // Section
      { wch: 25 },  // Subject
      { wch: 12 },  // Exam Type
      { wch: 12 },  // Marks
      { wch: 12 },  // Status
      { wch: 25 }   // Remarks
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Export');

    // Add summary sheet
    const summaryData = [
      ['EXPORT SUMMARY'],
      ['Export Date:', new Date().toLocaleString()],
      ['Branch:', selected.branch],
      ['Semester:', selected.semester],
      ['Section:', selected.section],
      ['Subject:', selected.subject],
      ['Exam Type:', selected.examType === 'internal' ? 'Internal' : 'External'],
      ['Max Marks:', maxMarks],
      ['Total Students:', studentData.length],
      ['Students with Existing Marks:', Object.keys(existingMarks).length],
      ['New Entries:', exportData.filter(d => d.Status === 'New').length],
      ['Updated:', exportData.filter(d => d.Status === 'Updated').length],
      ['Pending:', exportData.filter(d => d.Status === 'Pending').length]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `Marks_Export_${selected.branch}_Sem${selected.semester}_Sec${selected.section}_${selected.subject}_${selected.examType}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    toast.success("Marks exported successfully!");
  };

  // Handle file import
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    if (studentData.length === 0) {
      toast.error("Please load student data first before importing marks");
      return;
    }

    setImportFile(file);
    setShowImportModal(true);
    // Reset file input
    e.target.value = '';
  };

  // Process imported marks
  const processImport = () => {
    if (!importFile) {
      toast.error("No file selected");
      return;
    }

    if (studentData.length === 0) {
      toast.error("Please load student data first before importing marks");
      setShowImportModal(false);
      return;
    }

    setIsImporting(true);
    toast.loading("Processing imported file...");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        console.log("Imported JSON Data:", jsonData);

        if (!jsonData || jsonData.length === 0) {
          toast.dismiss();
          toast.error("No data found in the file");
          setShowImportModal(false);
          setIsImporting(false);
          return;
        }

        // Find the correct column names (case insensitive)
        const headers = Object.keys(jsonData[0]);
        console.log("Headers found:", headers);
        
        let enrollmentCol = headers.find(h => 
          h.toLowerCase().includes('enrollment') || 
          h.toLowerCase().includes('enrollmentno')
        );
        
        let marksCol = headers.find(h => 
          h.toLowerCase().includes('marks')
        );

        // If not found with standard names, try to find by position
        if (!enrollmentCol || !marksCol) {
          toast.dismiss();
          toast.error("Could not find 'Enrollment No' and 'Marks' columns in the file");
          setShowImportModal(false);
          setIsImporting(false);
          return;
        }

        // Create a map of current student enrollments for quick lookup
        const currentEnrollments = new Map();
        studentData.forEach(student => {
          currentEnrollments.set(student.enrollmentNo, true);
        });

        const importedMarks = {};
        let validCount = 0;
        let invalidMarksCount = 0;
        let enrollmentNotFoundCount = 0;

        // Process each row
        jsonData.forEach((row, index) => {
          const enrollment = row[enrollmentCol]?.toString().trim();
          let marksValue = row[marksCol];
          
          // Skip rows without enrollment
          if (!enrollment) {
            console.log(`Row ${index + 2}: No enrollment number, skipping`);
            return;
          }

          // Check if enrollment exists in current student list
          if (!currentEnrollments.has(enrollment)) {
            console.log(`Row ${index + 2}: Enrollment ${enrollment} not found in current list`);
            enrollmentNotFoundCount++;
            return;
          }

          // Parse marks
          let marksNum = null;
          
          if (marksValue !== undefined && marksValue !== null && marksValue !== '') {
            // Handle different types of marks input
            if (typeof marksValue === 'number') {
              marksNum = marksValue;
            } else if (typeof marksValue === 'string') {
              const cleanedMarks = marksValue.trim();
              if (cleanedMarks !== '') {
                marksNum = parseFloat(cleanedMarks);
              }
            } else {
              marksNum = parseFloat(marksValue);
            }

            // Validate marks
            const maxMarks = selected.examType === 'internal' 
              ? parseInt(selected.totalInternal) 
              : parseInt(selected.totalExternal);
            
            if (!isNaN(marksNum) && marksNum >= 0 && marksNum <= maxMarks) {
              importedMarks[enrollment] = marksNum.toString();
              validCount++;
              console.log(`✓ Added marks for ${enrollment}: ${marksNum}`);
            } else {
              console.log(`✗ Invalid marks value: ${marksValue} for enrollment ${enrollment}`);
              invalidMarksCount++;
            }
          }
        });

        console.log("Import Results:", {
          valid: validCount,
          invalid: invalidMarksCount,
          notFound: enrollmentNotFoundCount,
          totalRows: jsonData.length
        });

        if (validCount === 0) {
          toast.dismiss();
          let errorMsg = "No valid marks found in the file.";
          if (enrollmentNotFoundCount > 0) {
            errorMsg += ` ${enrollmentNotFoundCount} enrollment(s) not found in current student list.`;
          }
          if (invalidMarksCount > 0) {
            errorMsg += ` ${invalidMarksCount} row(s) had invalid marks.`;
          }
          toast.error(errorMsg);
          setShowImportModal(false);
          setIsImporting(false);
          return;
        }

        // Pre-fill input fields with imported marks
        let filledCount = 0;
        Object.keys(importedMarks).forEach(enrollment => {
          const inputField = document.getElementById(`${enrollment}marks`);
          if (inputField) {
            inputField.value = importedMarks[enrollment];
            // Highlight the field to show it was updated
            inputField.style.backgroundColor = '#fff3cd';
            inputField.style.transition = 'background-color 0.3s';
            setTimeout(() => {
              inputField.style.backgroundColor = '';
            }, 2000);
            filledCount++;
          }
        });

        toast.dismiss();
        let successMsg = `Successfully imported marks for ${validCount} students!`;
        if (filledCount > 0 && filledCount !== validCount) {
          successMsg += ` (${filledCount} fields filled)`;
        }
        if (enrollmentNotFoundCount > 0) {
          successMsg += ` (${enrollmentNotFoundCount} enrollments not found)`;
        }
        if (invalidMarksCount > 0) {
          successMsg += ` (${invalidMarksCount} invalid marks skipped)`;
        }
        toast.success(successMsg);
        
        setShowImportModal(false);
        setImportFile(null);

      } catch (error) {
        toast.dismiss();
        console.error("Import error:", error);
        toast.error("Error processing file: " + error.message);
        setShowImportModal(false);
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.dismiss();
      toast.error("Error reading file");
      setShowImportModal(false);
      setIsImporting(false);
    };

    reader.readAsArrayBuffer(importFile);
  };

  const submitMarksHandler = () => {
    if (selected.subject === "-- Select --" || selected.examType === "-- Select --") {
      toast.error("Please select Subject and Exam Type");
      return;
    }

    if (studentData.length === 0) {
      toast.error("No students to upload marks for");
      return;
    }

    const marksToUpload = [];
    let updatedCount = 0;
    let newCount = 0;
    
    studentData.forEach(student => {
      const inputField = document.getElementById(`${student.enrollmentNo}marks`);
      const marksValue = inputField?.value;
      
      if (marksValue && marksValue.trim() !== "") {
        marksToUpload.push({
          enrollmentNo: student.enrollmentNo,
          marks: marksValue
        });
        
        if (existingMarks[student.enrollmentNo]) {
          updatedCount++;
        } else {
          newCount++;
        }
      }
    });

    if (marksToUpload.length === 0) {
      toast.error("Please enter marks for at least one student");
      return;
    }

    toast.loading(`Processing ${marksToUpload.length} marks...`);
    
    const headers = { "Content-Type": "application/json" };
    const examField = selected.examType === "internal" ? "internal" : "external";
    
    // Create a batch of promises for all students
    const promises = marksToUpload.map(({ enrollmentNo, marks }) => {
      const payload = {
        enrollmentNo: enrollmentNo,
        [examField]: {
          [selected.subject]: parseFloat(marks)
        }
      };
      
      return axios.post(`${baseApiURL()}/marks/addMarks`, payload, { headers });
    });

    // Execute all promises
    Promise.all(promises)
      .then((responses) => {
        toast.dismiss();
        const allSuccess = responses.every(res => res.data.success);
        if (allSuccess) {
          toast.success(
            `Successfully ${updatedCount > 0 ? 'updated' : 'uploaded'} marks for ${marksToUpload.length} students ` +
            `(${newCount} new, ${updatedCount} updated)`
          );
          
          // Update existing marks state with new values
          const updatedMarks = { ...existingMarks };
          marksToUpload.forEach(({ enrollmentNo, marks }) => {
            updatedMarks[enrollmentNo] = marks;
          });
          setExistingMarks(updatedMarks);
        } else {
          const failedCount = responses.filter(res => !res.data.success).length;
          toast.error(`Failed to process marks for ${failedCount} students`);
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error(error);
        toast.error(error.response?.data?.message || "Error uploading marks");
      });
  };

  const getBranchData = () => {
    const headers = { "Content-Type": "application/json" };
    axios
      .get(`${baseApiURL()}/branch/getBranch`, { headers })
      .then((response) => {
        if (response.data.success) {
          setBranch(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.message);
      });
  };

  const getSubjectData = () => {
    toast.loading("Loading Subjects");
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          setSubject(response.data.subject);
          setFilteredSubjects(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.message);
      });
  };

  // Filter subjects when branch or semester changes
  useEffect(() => {
    if (
      selected.branch !== "-- Select --" &&
      selected.semester !== "-- Select --" &&
      subject &&
      subject.length > 0
    ) {
      const filtered = subject.filter(
        (subject) =>
          subject.semester === parseInt(selected.semester) &&
          subject.branch?.name === selected.branch
      );
      setFilteredSubjects(filtered);
      if (
        selected.subject !== "-- Select --" &&
        !filtered.find((s) => s.name === selected.subject)
      ) {
        setSelected((prev) => ({ ...prev, subject: "-- Select --" }));
      }
    } else {
      setFilteredSubjects(subject || []);
    }
  }, [selected.branch, selected.semester, subject]);

  // Update total marks based on exam type
  useEffect(() => {
    if (selected.examType === "internal") {
      setSelected(prev => ({ ...prev, totalInternal: "40", totalExternal: "60" }));
    } else if (selected.examType === "external") {
      setSelected(prev => ({ ...prev, totalInternal: "40", totalExternal: "60" }));
    }
  }, [selected.examType]);

  // Reload existing marks when subject or exam type changes
  useEffect(() => {
    if (studentData.length > 0 && selected.subject !== "-- Select --" && selected.examType !== "-- Select --") {
      loadExistingMarks(studentData);
    }
  }, [selected.subject, selected.examType]);

  useEffect(() => {
    getBranchData();
    getSubjectData();
  }, []);

  const resetValueHandler = () => {
    setStudentData([]);
    setExistingMarks({});
    setSelected({
      branch: "-- Select --",
      semester: "-- Select --",
      section: "-- Select --",
      subject: "-- Select --",
      examType: "-- Select --",
      totalInternal: "40",
      totalExternal: "60",
    });
  };

  const maxMarks = selected.examType === 'internal' 
    ? parseInt(selected.totalInternal) 
    : parseInt(selected.totalExternal);

  return (
    <div className="w-full mx-auto flex justify-center items-start flex-col my-10 px-4">
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Import Marks</h3>
            <p className="text-gray-600 mb-4">
              File: <span className="font-medium">{importFile?.name}</span>
            </p>
            <p className="text-sm text-gray-500 mb-2">
              This will import marks from the file and fill them in the input fields.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Marks will be validated against the maximum marks ({maxMarks}) for {selected.examType === 'internal' ? 'Internal' : 'External'} exam.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                disabled={isImporting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processImport}
                disabled={isImporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewMarks ? (
        <ViewMarks setShowViewMarks={setShowViewMarks} />
      ) : (
        <>
          <div className="relative flex justify-between items-center w-full">
            <Heading title={`Upload Marks`} />
            <div className="absolute right-2 flex gap-2">
              <button
                className="flex justify-center items-center border-2 border-blue-500 px-3 py-2 rounded text-blue-500 hover:bg-blue-50 transition-colors"
                onClick={() => setShowViewMarks(true)}
              >
                View Marks
              </button>
              {studentData.length > 0 && (
                <button
                  className="flex justify-center items-center border-2 border-red-500 px-3 py-2 rounded text-red-500 hover:bg-red-50 transition-colors"
                  onClick={resetValueHandler}
                >
                  <span className="mr-2">
                    <BiArrowBack className="text-red-500" />
                  </span>
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Selection Form - Always visible */}
          <div className="mt-10 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="w-full">
              <label htmlFor="branch" className="leading-7 text-base font-medium text-gray-700">
                Select Branch
              </label>
              <select
                id="branch"
                className="px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.branch}
                onChange={(e) =>
                  setSelected({ ...selected, branch: e.target.value })
                }
              >
                <option>-- Select --</option>
                {branch && branch.length > 0 &&
                  branch.map((branch) => (
                    <option value={branch.name} key={branch.name}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="w-full">
              <label htmlFor="semester" className="leading-7 text-base font-medium text-gray-700">
                Select Semester
              </label>
              <select
                id="semester"
                className="px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.semester}
                onChange={(e) =>
                  setSelected({ ...selected, semester: e.target.value })
                }
              >
                <option>-- Select --</option>
                {[...Array(8).keys()].map((i) => (
                  <option value={i + 1} key={i}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label htmlFor="section" className="leading-7 text-base font-medium text-gray-700">
                Select Section
              </label>
              <select
                id="section"
                className="px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.section}
                onChange={(e) =>
                  setSelected({ ...selected, section: e.target.value })
                }
              >
                <option>-- Select --</option>
                {sections.map((section) => (
                  <option value={section} key={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label htmlFor="subject" className="leading-7 text-base font-medium text-gray-700">
                Select Subject
              </label>
              <select
                id="subject"
                className={`px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  selected.branch === "-- Select --" || selected.semester === "-- Select --"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                value={selected.subject}
                onChange={(e) =>
                  setSelected({ ...selected, subject: e.target.value })
                }
                disabled={selected.branch === "-- Select --" || selected.semester === "-- Select --"}
              >
                <option>-- Select --</option>
                {filteredSubjects && filteredSubjects.length > 0 &&
                  filteredSubjects.map((subject) => (
                    <option value={subject.name} key={subject.name}>
                      {subject.name}
                    </option>
                  ))}
              </select>
              {filteredSubjects.length === 0 && selected.branch !== "-- Select --" && selected.semester !== "-- Select --" && (
                <p className="text-xs text-red-500 mt-1">No subjects found for this branch and semester</p>
              )}
            </div>

            <div className="w-full">
              <label htmlFor="examType" className="leading-7 text-base font-medium text-gray-700">
                Select Exam Type
              </label>
              <select
                id="examType"
                className="px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.examType}
                onChange={(e) =>
                  setSelected({ ...selected, examType: e.target.value })
                }
              >
                <option>-- Select --</option>
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </select>
            </div>

            <div className="w-full">
              <label htmlFor="totalInternal" className="leading-7 text-base font-medium text-gray-700">
                Internal Max Marks
              </label>
              <input
                type="number"
                id="totalInternal"
                className="px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.totalInternal}
                onChange={(e) => {
                  const internal = parseInt(e.target.value) || 0;
                  const external = 100 - internal;
                  setSelected({ 
                    ...selected, 
                    totalInternal: e.target.value,
                    totalExternal: external.toString()
                  });
                }}
                min="0"
                max="100"
              />
            </div>

            <div className="w-full">
              <label htmlFor="totalExternal" className="leading-7 text-base font-medium text-gray-700">
                External Max Marks
              </label>
              <input
                type="number"
                id="totalExternal"
                className="px-2 bg-blue-50 py-3 rounded-lg text-base w-full mt-1 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.totalExternal}
                onChange={(e) => {
                  const external = parseInt(e.target.value) || 0;
                  const internal = 100 - external;
                  setSelected({ 
                    ...selected, 
                    totalExternal: e.target.value,
                    totalInternal: internal.toString()
                  });
                }}
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Action Buttons - Always visible */}
          <div className="flex flex-wrap justify-center gap-4 w-full mt-8">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={loadStudentDetails}
              disabled={
                selected.branch === "-- Select --" ||
                selected.semester === "-- Select --" ||
                selected.section === "-- Select --" ||
                selected.subject === "-- Select --" ||
                selected.examType === "-- Select --" ||
                loading
              }
            >
              {loading ? "Loading..." : "Load Student Data"}
            </button>

            <button
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={downloadTemplate}
              disabled={
                selected.branch === "-- Select --" ||
                selected.semester === "-- Select --" ||
                selected.section === "-- Select --" ||
                selected.subject === "-- Select --" ||
                selected.examType === "-- Select --" ||
                studentData.length === 0
              }
            >
              <FiFileText /> Download Template
            </button>

            <label
              className={`bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer ${
                (selected.branch === "-- Select --" ||
                selected.semester === "-- Select --" ||
                selected.section === "-- Select --" ||
                selected.subject === "-- Select --" ||
                selected.examType === "-- Select --" ||
                studentData.length === 0)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <FiUpload /> Import Marks
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleImportFile}
                disabled={
                  selected.branch === "-- Select --" ||
                  selected.semester === "-- Select --" ||
                  selected.section === "-- Select --" ||
                  selected.subject === "-- Select --" ||
                  selected.examType === "-- Select --" ||
                  studentData.length === 0
                }
              />
            </label>
          </div>

          {/* Info Box - Always visible */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 w-full">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Internal + External = 100 marks total. 
              You can adjust the distribution above. The marks you enter will be stored separately 
              without calculating the total. Previously entered marks will be displayed in the input fields.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Import Instructions:</strong> 
              1. First select branch, semester, section, subject, and exam type <br/>
              2. Click "Load Student Data" to see the student list <br/>
              3. Click "Download Template" to get the Excel template with student data <br/>
              4. Fill in marks in the "Marks" column of the Excel file <br/>
              5. Click "Import Marks" and select the filled Excel file
            </p>
          </div>

          {/* Student Marks Input Section - Only visible when student data is loaded */}
          {studentData.length > 0 && (
            <>
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 w-full">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-medium text-green-800">
                      Uploading {selected.examType === "internal" ? "Internal" : "External"} Marks for {selected.branch} - Semester {selected.semester} - Section {selected.section}
                    </p>
                    <p className="text-base text-green-700 mt-1">
                      Subject: {selected.subject} | Max Marks: {maxMarks}
                    </p>
                    {Object.keys(existingMarks).length > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {Object.keys(existingMarks).length} students already have marks entered for this subject/exam type
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportMarks}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <BiDownload /> Export
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
                id="markContainer"
              >
                {studentData.map((student) => {
                  const hasExistingMark = existingMarks[student.enrollmentNo];
                  return (
                    <div
                      key={student.enrollmentNo}
                      className={`w-full flex items-center border-2 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                        hasExistingMark ? 'border-green-500 bg-green-50' : 'border-blue-500'
                      }`}
                      id={student.enrollmentNo}
                    >
                      <p className={`text-lg px-4 py-3 w-1/2 font-mono font-medium ${
                        hasExistingMark ? 'bg-green-100' : 'bg-blue-50'
                      }`}>
                        {student.enrollmentNo}
                      </p>
                      <input
                        type="number"
                        className={`px-4 py-3 focus:ring-0 outline-none w-1/2 ${
                          hasExistingMark ? 'bg-green-50' : 'bg-white'
                        }`}
                        placeholder={`Enter marks (0-${maxMarks})`}
                        id={`${student.enrollmentNo}marks`}
                        min="0"
                        max={maxMarks}
                        step="0.01"
                        defaultValue={hasExistingMark || ''}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-4 w-full mt-8">
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  onClick={resetValueHandler}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                  onClick={submitMarksHandler}
                >
                  {Object.keys(existingMarks).length > 0 
                    ? `Update Marks for ${studentData.length} Students` 
                    : `Upload Marks for ${studentData.length} Students`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Marks;
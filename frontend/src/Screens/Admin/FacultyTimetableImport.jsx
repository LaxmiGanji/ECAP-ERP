// FacultyTimetableImport.jsx - Updated with UI examples
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { baseApiURL } from "../../baseUrl";

const FacultyTimetableImport = ({ onSuccess }) => {
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clashErrors, setClashErrors] = useState([]);
  const [facultyInfo, setFacultyInfo] = useState(null);
  
  const fileInputRef = useRef(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '9:00am - 10:00am',
    '10:00am - 10:50am',
    '10:50am - 11:00am',
    '11:00am - 11:50am',
    '11:50am - 12:40pm',
    '12:40pm - 1:30pm',
    '1:30pm - 2:20pm',
    '2:20pm - 3:10pm',
    '3:10pm - 4:00pm'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      loadFacultyInfo();
    }
  }, [selectedFaculty]);

  const fetchInitialData = () => {
    // Fetch faculties
    axios.get(`${baseApiURL()}/faculty/details/getDetails2`)
      .then((res) => {
        if (res.data.success) {
          setFaculties(res.data.faculties);
        }
      })
      .catch(() => toast.error("Failed to fetch faculties"));

    // Fetch branches
    axios.get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data.success) {
          setBranches(res.data.branches);
        }
      })
      .catch(() => toast.error("Failed to fetch branches"));

    // Fetch subjects
    axios.get(`${baseApiURL()}/subject/getSubject`)
      .then((res) => {
        if (res.data.success) {
          setSubjects(res.data.subject);
        }
      })
      .catch(() => toast.error("Failed to fetch subjects"));
  };

  const loadFacultyInfo = async () => {
    try {
      const response = await axios.post(`${baseApiURL()}/faculty/details/getDetails`, { 
        employeeId: selectedFaculty 
      });

      if (response.data.success && response.data.user[0]) {
        const faculty = response.data.user[0];
        setFacultyInfo({
          name: `${faculty.firstName} ${faculty.middleName ? faculty.middleName + " " : ""}${faculty.lastName}`,
          department: faculty.department,
          employeeId: faculty.employeeId
        });
      }
    } catch (error) {
      console.error("Error loading faculty info:", error);
    }
  };

  const getFilteredSubjects = (branch, semester, regulation) => {
    if (!branch || !semester) return [];
    
    return subjects.filter(
      (subject) => 
        subject.semester === parseInt(semester) && 
        subject.branch?.name === branch &&
        (!regulation || subject.regulation?.toUpperCase() === regulation.toUpperCase())
    );
  };

  const downloadTemplate = () => {
    if (!selectedFaculty) {
      toast.error("Please select a faculty member first");
      return;
    }

    if (!facultyInfo) {
      toast.error("Faculty information not loaded");
      return;
    }

    // Create template data
    const templateData = [];

    // Header with faculty information
    templateData.push([`FACULTY TIMETABLE TEMPLATE`]);
    templateData.push([`Faculty Name: ${facultyInfo.name}`]);
    templateData.push([`Employee ID: ${facultyInfo.employeeId}`]);
    templateData.push([`Department: ${facultyInfo.department}`]);
    templateData.push([]);
    
    // INSTRUCTIONS
    templateData.push(['INSTRUCTIONS:']);
    templateData.push(['1. Fill in the subject for each time slot']);
    templateData.push(['2. For regular subjects, use format: Subject|Branch|Semester|Section|Regulation']);
    templateData.push(['3. For special periods, just enter: Break, Sports, Library, or Other']);
    templateData.push(['4. LUNCH break is from 12:40pm - 1:30pm']);
    templateData.push(['5. Make sure to use correct branch codes: CSE, ECE, EEE, MECH, CIVIL, etc.']);
    templateData.push(['6. Regulation is mandatory for subject auto-population in attendance (e.g. R22, R23)']);
    templateData.push([]);

    // Main timetable table headers
    const headerRow = ['Day/Time', ...timeSlots];
    templateData.push(headerRow);

    // Add each day with empty periods
    daysOfWeek.forEach(day => {
      const row = [day];
      for (let i = 0; i < timeSlots.length; i++) {
        row.push('');
      }
      templateData.push(row);
    });

    // Add available subjects reference
    templateData.push([]);
    templateData.push(['AVAILABLE SUBJECTS BY BRANCH AND SEMESTER:']);
    
    branches.forEach(branch => {
      templateData.push([`${branch.name}:`]);
      [1, 2, 3, 4, 5, 6, 7, 8].forEach(sem => {
        const semSubjects = subjects.filter(
          s => s.semester === sem && s.branch?.name === branch.name
        );
        if (semSubjects.length > 0) {
          templateData.push([`  Semester ${sem}:`]);
          semSubjects.forEach(subject => {
            templateData.push([`    ${subject.code} - ${subject.name} [${subject.regulation || "N/A"}]`]);
          });
        }
      });
      templateData.push([]);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Day/Time
      ...Array.from({ length: timeSlots.length }, () => ({ wch: 30 })) // Time slots
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Faculty Timetable Template");
    
    // Download file
    XLSX.writeFile(wb, `Faculty_Timetable_${facultyInfo.name.replace(/\s+/g, '_')}_${facultyInfo.employeeId}.xlsx`);
    
    toast.success("Template downloaded successfully");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    setClashErrors([]);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        // Parse the data
        const parsedSchedule = parseExcelData(jsonData);
        
        // Auto-enrich with regulations if missing
        toast.loading("Enriching data with regulations...");
        const enrichedSchedule = await enrichDataWithRegulations(parsedSchedule);
        toast.dismiss();
        
        setPreviewData(enrichedSchedule);
        
        toast.success("File parsed and regulation-aware. Please review the data.");
      } catch (error) {
        toast.dismiss();
        console.error("Error parsing Excel:", error);
        toast.error("Failed to parse Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const enrichDataWithRegulations = async (schedule) => {
    const enrichedSchedule = JSON.parse(JSON.stringify(schedule));
    const dayEntries = Object.entries(enrichedSchedule);
    
    for (const [day, periods] of dayEntries) {
      for (let i = 0; i < periods.length; i++) {
        const period = periods[i];
        const isSpecialPeriod = ["Break", "Sports", "Library", "Other"].includes(period.subject);
        
        if (!isSpecialPeriod && !period.regulation && period.branch && period.semester && period.section) {
          try {
            const res = await axios.post(`${baseApiURL()}/student/details/getDetails`, {
              branch: period.branch,
              semester: period.semester,
              section: period.section,
            });
            if (res.data.success && res.data.user.length > 0) {
              const detected = res.data.user[0].regulation;
              if (detected) {
                enrichedSchedule[day][i].regulation = detected.toUpperCase();
              }
            }
          } catch (err) {
            console.error("Error auto-fetching regulation for imported period:", err);
          }
        }
      }
    }
    return enrichedSchedule;
  };

  const parseExcelData = (data) => {
    const schedule = {};
    let startParsing = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Find the start of the timetable table
      if (row[0] === 'Day/Time') {
        startParsing = true;
        continue;
      }

      if (startParsing && daysOfWeek.includes(row[0])) {
        const day = row[0];
        const periods = [];
        
        for (let j = 1; j < row.length && j < timeSlots.length + 1; j++) {
          const cellValue = row[j]?.toString().trim();
          if (cellValue) {
            // Parse the period data (format: "Subject|Branch|Semester|Section" or just "Subject")
            const parts = cellValue.split('|');
            
            const periodData = {
              periodNumber: j,
              timeSlot: timeSlots[j-1],
              subject: parts[0].trim(),
              branch: parts[1]?.trim() || "",
              semester: parts[2]?.trim() || "",
              section: parts[3]?.trim() || "",
              regulation: parts[4]?.trim() || "",
              startTime: timeSlots[j-1].split(' - ')[0],
              endTime: timeSlots[j-1].split(' - ')[1]
            };

            // For special periods, clear branch/semester/section
            if (["Break", "Sports", "Library", "Other"].includes(periodData.subject)) {
              periodData.branch = "";
              periodData.semester = "";
              periodData.section = "";
              periodData.regulation = "";
            }
            
            periods.push(periodData);
          }
        }
        
        if (periods.length > 0) {
          schedule[day] = periods;
        }
      }
    }
    
    return schedule;
  };

  const validateSchedule = () => {
    if (!previewData) return false;

    let isValid = true;
    const errors = [];

    Object.entries(previewData).forEach(([day, periods]) => {
      periods.forEach(period => {
        const subject = period.subject;
        const isSpecialPeriod = ["Break", "Sports", "Library", "Other"].includes(subject);
        
        if (!subject) {
          errors.push(`Subject is required for period on ${day}`);
          isValid = false;
          return;
        }

        // For non-special periods, validate branch, semester, and section
        if (!isSpecialPeriod) {
          if (!period.branch) {
            errors.push(`Branch is required for subject "${subject}" on ${day}`);
            isValid = false;
          }
          if (!period.semester) {
            errors.push(`Semester is required for subject "${subject}" on ${day}`);
            isValid = false;
          }
          if (!period.section) {
            errors.push(`Section is required for subject "${subject}" on ${day}`);
            isValid = false;
          }

          // Check if subject exists for the branch, semester and regulation
          if (period.branch && period.semester) {
            const availableSubjects = getFilteredSubjects(period.branch, period.semester, period.regulation);
            const subjectExists = availableSubjects.some(
              s => s.name === subject || s.code === subject
            );
            
            if (!subjectExists && subject) {
              errors.push(`Subject "${subject}" is not available for ${period.branch} - Semester ${period.semester}`);
              isValid = false;
            }
          }
        }
      });
    });

    if (!isValid) {
      errors.forEach(error => toast.error(error));
    }

    return isValid;
  };

  const checkForClashes = async () => {
    if (!previewData || !selectedFaculty) return false;

    setIsUploading(true);
    setClashErrors([]);

    // Format timetable for clash checking
    const timetableToCheck = Object.entries(previewData).map(([day, periods]) => ({
      day,
      periods: periods.map(period => ({
        periodNumber: period.periodNumber,
        subject: period.subject,
        branch: period.branch,
        semester: period.semester,
        section: period.section,
        startTime: period.startTime,
        endTime: period.endTime
      }))
    }));

    try {
      const response = await axios.post(`${baseApiURL()}/faculty/details/validateTimetable`, {
        employeeId: selectedFaculty,
        timetable: timetableToCheck
      });

      if (response.data.clashes && response.data.clashes.length > 0) {
        setClashErrors(response.data.clashes);
        toast.error("Timetable clashes detected! Please review the conflicts below.");
        return false;
      }

      return true;
    } catch (error) {
      if (error.response?.data?.clashes) {
        setClashErrors(error.response.data.clashes);
        toast.error("Timetable clashes detected! Please review the conflicts below.");
        return false;
      }
      console.error("Error checking clashes:", error);
      toast.error("Error validating timetable");
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const saveTimetableToDatabase = async () => {
    if (!selectedFaculty) {
      toast.error("Please select a faculty member");
      return;
    }

    if (!previewData) {
      toast.error("No data to import");
      return;
    }

    if (!validateSchedule()) {
      return;
    }

    // Check for clashes first
    const noClashes = await checkForClashes();
    if (!noClashes) return;

    setIsSaving(true);

    // Format timetable for backend - matching the model structure
    const timetableToSave = Object.entries(previewData).map(([day, periods]) => ({
      day,
      periods: periods.map(period => ({
        periodNumber: period.periodNumber,
        subject: period.subject,
        branch: period.branch,
        semester: period.semester,
        section: period.section,
        startTime: period.startTime,
        endTime: period.endTime,
        regulation: period.regulation
      }))
    }));

    toast.loading("Saving faculty timetable...");

    axios
      .put(`${baseApiURL()}/faculty/details/updateTimetable/${selectedFaculty}`, { 
        timetable: timetableToSave 
      })
      .then((res) => {
        toast.dismiss();
        if (res.data.success) {
          toast.success("Faculty timetable imported successfully");
          resetForm();
          if (onSuccess) onSuccess();
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        toast.dismiss();
        console.error(err);
        
        if (err.response?.data?.clashes) {
          setClashErrors(err.response.data.clashes);
          toast.error("Faculty timetable clash detected! Please check the conflicts below.");
        } else {
          toast.error(err.response?.data?.message || "Failed to save faculty timetable");
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData(null);
    setClashErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSubjectDisplay = (subject) => {
    const subjectInfo = subjects.find(s => s.name === subject || s.code === subject);
    return subjectInfo ? `${subjectInfo.name} (${subjectInfo.code})` : subject;
  };

  return (
    <div className="space-y-6">
      {/* Faculty Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Faculty
          </label>
          <select
            className="w-full px-4 py-2 border rounded-md"
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
          >
            <option value="">Select Faculty</option>
            {faculties.map((faculty) => (
              <option key={faculty._id} value={faculty.employeeId}>
                {faculty.firstName} {faculty.middleName} {faculty.lastName} ({faculty.employeeId}) - {faculty.department}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={downloadTemplate}
            disabled={!selectedFaculty}
            className={`w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
              !selectedFaculty && "opacity-50 cursor-not-allowed"
            }`}
          >
            Download Template
          </button>
        </div>
      </div>

      {/* Faculty Info Display */}
      {facultyInfo && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-600">Faculty Name:</span>
              <p className="font-semibold">{facultyInfo.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Employee ID:</span>
              <p className="font-semibold">{facultyInfo.employeeId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Department:</span>
              <p className="font-semibold">{facultyInfo.department}</p>
            </div>
          </div>
        </div>
      )}

      {/* Examples Section - UI */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-yellow-800">Format Examples</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border border-yellow-200">
            <h4 className="font-medium text-gray-800 mb-2">Regular Periods:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Example 1</span>
                <code className="text-gray-700">Compiler Design|CSE|7|A|R18</code>
              </div>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Example 2</span>
                <code className="text-gray-700">Data Structures|CSE|3|B|R22</code>
              </div>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Example 3</span>
                <code className="text-gray-700">DBMS|CSE|4|A|R22</code>
              </div>
              <div className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">Example 4</span>
                <code className="text-gray-700">Operating Systems|CSE|5|B|R22</code>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-yellow-200">
            <h4 className="font-medium text-gray-800 mb-2">Special Periods:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">Break</span>
                <code className="text-gray-700">Break</code>
              </div>
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">Sports</span>
                <code className="text-gray-700">Sports</code>
              </div>
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">Library</span>
                <code className="text-gray-700">Library</code>
              </div>
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">Other</span>
                <code className="text-gray-700">Other</code>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          <p className="font-medium">Format: <span className="font-normal">Subject|Branch|Semester|Section|Regulation</span></p>
          <p className="text-xs text-gray-500 mt-1">Note: Use pipe symbol (|) as separator. Regulation is required for correct subject detection in attendance.</p>
        </div>
      </div>

      {/* File Upload Section */}
      {selectedFaculty && !previewData && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <input
              ref={fileInputRef}
              id="faculty-file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="faculty-file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Choose Excel File
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Clash Error Display */}
      {clashErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-800">Timetable Clashes Detected</h3>
          </div>
          <p className="text-red-700 mb-4">Please resolve these conflicts before importing:</p>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {clashErrors.map((clash, index) => (
              <div key={index} className="bg-white border border-red-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-800">{clash.day}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{clash.time}</span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Your class:</span> {clash.branch} - Semester {clash.semester} - Section {clash.section}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Your subject:</span> {getSubjectDisplay(clash.subject)}
                    </div>
                    <div className="text-sm text-red-600">
                      <span className="font-medium">Conflicts with:</span> {clash.conflictingFaculty.name} ({clash.conflictingFaculty.employeeId}) - {getSubjectDisplay(clash.conflictingFaculty.subject)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setClashErrors([])}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Preview Timetable</h3>
              <p className="text-sm text-gray-600">
                Review the data before importing. Regular periods show branch, semester, and section details.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
          
          <div className="overflow-x-auto p-4">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">Day</th>
                  {timeSlots.map((slot, idx) => (
                    <th key={idx} className="px-4 py-2 border text-sm">{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((day) => (
                  <tr key={day}>
                    <td className="px-4 py-2 border font-semibold bg-gray-50">{day}</td>
                    {timeSlots.map((slot, idx) => {
                      const period = previewData[day]?.find(p => p.timeSlot === slot);
                      const isSpecialPeriod = ["Break", "Sports", "Library", "Other"].includes(period?.subject);
                      
                      return (
                        <td key={idx} className="px-4 py-2 border text-center align-top">
                          {period ? (
                            <div className={`p-2 rounded ${isSpecialPeriod ? 'bg-green-50' : 'bg-blue-50'}`}>
                              <div className={`font-medium ${isSpecialPeriod ? 'text-green-700' : 'text-blue-700'}`}>
                                {period.subject}
                              </div>
                              {!isSpecialPeriod && period.branch && (
                                <div className="text-xs text-gray-600 mt-1">
                                  <div>{period.branch}</div>
                                  <div>Sem {period.semester} - Sec {period.section}</div>
                                  <div className="text-gray-500 mt-1">
                                    {period.startTime} - {period.endTime}
                                  </div>
                                </div>
                              )}
                              {isSpecialPeriod && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {period.startTime} - {period.endTime}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-4">
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveTimetableToDatabase}
              disabled={isSaving || isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {(isSaving || isUploading) ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isUploading ? 'Checking Clashes...' : 'Importing...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Timetable
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyTimetableImport;
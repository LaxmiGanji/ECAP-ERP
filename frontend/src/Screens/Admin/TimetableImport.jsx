// TimetableImport.jsx (Fixed version)
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { baseApiURL } from "../../baseUrl";

const TimetableImport = ({ onSuccess }) => {
  const [selected, setSelected] = useState({ branch: "", semester: "", section: "", regulation: "" });
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultyMap, setFacultyMap] = useState({});
  const [facultyDetailsMap, setFacultyDetailsMap] = useState({});
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classIncharge, setClassIncharge] = useState("");
  const [classInchargeId, setClassInchargeId] = useState("");
  const [lectureHall, setLectureHall] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [theorySubjects, setTheorySubjects] = useState([]);
  const [existingTimetable, setExistingTimetable] = useState(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [sectionsList, setSectionsList] = useState(["A", "B", "C", "D"]);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        let params = {};
        if (selected.branch) params.branch = selected.branch;
        if (selected.semester) params.semester = selected.semester;
        const res = await axios.get(`${baseApiURL()}/section/getSectionsByBranchAndSemester`, { params });
        if (res.data.success && res.data.sections?.length > 0) {
          setSectionsList(res.data.sections);
        }
      } catch (err) {
        console.error("Error fetching dynamic sections:", err);
      }
    };
    fetchSections();
  }, [selected.branch, selected.semester]);
  
  // Create a ref for the file input
  const fileInputRef = useRef(null);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
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

  // Filter subjects when branch, semester or regulation changes
  useEffect(() => {
    if (selected.branch && selected.semester) {
      const filtered = subjects.filter(
        (subject) => 
          subject.semester === parseInt(selected.semester) && 
          subject.branch?.name === selected.branch &&
          (!selected.regulation || subject.regulation?.toUpperCase() === selected.regulation.toUpperCase())
      );
      setFilteredSubjects(filtered);
    } else {
      setFilteredSubjects([]);
    }
  }, [selected.branch, selected.semester, selected.regulation, subjects]);

  // Auto-detect regulation based on students in the selected class
  useEffect(() => {
    if (selected.branch && selected.semester && selected.section) {
      axios
        .post(`${baseApiURL()}/student/details/getDetails`, {
          branch: selected.branch,
          semester: selected.semester,
          section: selected.section,
        })
        .then((res) => {
          if (res.data.success && res.data.user.length > 0) {
            const detectedRegulation = res.data.user[0].regulation;
            if (detectedRegulation) {
              setSelected(prev => ({ ...prev, regulation: detectedRegulation.toUpperCase() }));
            }
          }
        })
        .catch((err) => console.error("Error fetching students for regulation:", err));
    }
  }, [selected.branch, selected.semester, selected.section]);

  // Create faculty details map for easy lookup
  useEffect(() => {
    const map = {};
    faculties.forEach(faculty => {
      map[faculty._id] = faculty;
      // Also map by name for matching
      map[`${faculty.firstName} ${faculty.lastName}`] = faculty;
    });
    setFacultyDetailsMap(map);
  }, [faculties]);

  const fetchInitialData = () => {
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

    // Fetch faculties
    axios.get(`${baseApiURL()}/faculty/details/getDetails2`)
      .then((res) => {
        if (res.data.success) {
          setFaculties(res.data.faculties);
        }
      })
      .catch(() => toast.error("Failed to fetch faculty data"));
  };

  const checkExistingTimetable = () => {
    if (!selected.branch || !selected.semester || !selected.section) {
      toast.error("Please select branch, semester and section");
      return false;
    }

    toast.loading("Checking existing timetable...");
    
    axios
      .post(`${baseApiURL()}/timetable/getTimetable`, {
        branch: selected.branch,
        semester: selected.semester,
        section: selected.section,
      })
      .then((res) => {
        toast.dismiss();
        if (res.data.success && res.data.timetable && res.data.timetable.length > 0) {
          setExistingTimetable(res.data.timetable[0]);
          setShowOverwriteConfirm(true);
        } else {
          // No existing timetable, proceed with save
          saveTimetableToDatabase();
        }
      })
      .catch((err) => {
        toast.dismiss();
        console.error("Error checking existing timetable:", err);
        // If error, assume no existing timetable and proceed with save
        saveTimetableToDatabase();
      });
  };

  const downloadTemplate = () => {
    if (!selected.branch || !selected.semester) {
      toast.error("Please select branch and semester first");
      return;
    }

    // Create template data matching the image format
    const templateData = [];

    // Header with branch and semester
    templateData.push([`${selected.branch}-${selected.section || 'ATT'} ${getSemesterText(selected.semester)} AY 2025-2026`]);
    templateData.push([]);

    // Lecture Hall
    templateData.push(['Lecture Hall:', '_________________']);
    templateData.push([]);

    // With Effect From
    templateData.push(['With Effect From:', '_________________']);
    templateData.push([]);

    // Class Incharge
    templateData.push(['Class Incharge:', '_________________']);
    templateData.push([]);

    // Main timetable table headers
    const headerRow = ['Time/Day', ...timeSlots];
    templateData.push(headerRow);

    // Add each day with empty periods
    daysOfWeek.forEach(day => {
      const row = [day];
      for (let i = 0; i < timeSlots.length; i++) {
        row.push('');
      }
      templateData.push(row);
    });

    // Add empty rows for spacing
    templateData.push([]);
    templateData.push([]);

    // Theory Subjects section
    templateData.push(['THEORY']);
    templateData.push(['CODE', 'Name of the Subject', 'Name of the Faculty', 'Phone No']);
    
    // Add empty rows for subjects (users will fill these)
    for (let i = 0; i < 5; i++) {
      templateData.push(['', '', '', '']);
    }

    // Add footer
    templateData.push([]);
    templateData.push(['Time Table Co-ordinator', 'HOD', 'PRINCIPAL']);

    // Add instructions and available subjects
    templateData.push([]);
    templateData.push(['INSTRUCTIONS:']);
    templateData.push(['1. Fill in the subject codes/names for each time slot']);
    templateData.push(['2. Use subject codes like CS801PC, CS864PE, etc.']);
    templateData.push(['3. Special periods: Break (10:50am - 11:00am is BREAK by default)', 'LIBRARY', 'SPORTS']);
    templateData.push(['4. Fill the THEORY section with subject details and faculty information']);
    templateData.push(['5. LUNCH break is from 12:40pm - 1:30pm']);
    templateData.push([]);
    templateData.push(['Available Subjects for this semester:']);
    filteredSubjects.forEach(subject => {
      templateData.push([`${subject.code} - ${subject.name}`]);
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Time/Day
      ...Array.from({ length: timeSlots.length }, () => ({ wch: 18 })) // Time slots
    ];
    ws['!cols'] = colWidths;

    // Merge cells for header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: timeSlots.length } } // Main header
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Timetable Template");
    
    // Download file
    XLSX.writeFile(wb, `Timetable_${selected.branch}_Sem${selected.semester}_${selected.section || 'ATT'}.xlsx`);
    
    toast.success("Template downloaded successfully");
  };

  const getSemesterText = (sem) => {
    const suffix = sem === 1 ? 'I' : sem === 2 ? 'II' : sem === 3 ? 'III' : sem === 4 ? 'IV' : 
                   sem === 5 ? 'V' : sem === 6 ? 'VI' : sem === 7 ? 'VII' : 'VIII';
    return `${suffix} B.TECH ${sem % 2 === 0 ? 'II' : 'I'} SEMESTER`;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

        // Parse the data
        const parsedData = parseExcelData(jsonData);
        setPreviewData(parsedData.schedule);
        setClassIncharge(parsedData.classIncharge);
        setLectureHall(parsedData.lectureHall);
        setEffectiveDate(parsedData.effectiveDate);
        setTheorySubjects(parsedData.theorySubjects);
        
        toast.success("File parsed successfully. Please review the data and map faculty.");
      } catch (error) {
        console.error("Error parsing Excel:", error);
        toast.error("Failed to parse Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseExcelData = (data) => {
    const schedule = {};
    let classIncharge = "";
    let lectureHall = "";
    let effectiveDate = "";
    const theorySubjects = [];
    
    let inTheorySection = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Parse header info
      if (row[0] && row[0].includes('Lecture Hall:')) {
        lectureHall = row[1] || '';
      }
      if (row[0] && row[0].includes('With Effect From:')) {
        effectiveDate = row[1] || '';
      }
      if (row[0] && row[0].includes('Class Incharge:')) {
        classIncharge = row[1] || '';
        // Try to find faculty ID from name
        const faculty = faculties.find(f => 
          `${f.firstName} ${f.lastName}`.toLowerCase().includes(classIncharge.toLowerCase())
        );
        if (faculty) {
          setClassInchargeId(faculty._id);
        }
      }

      // Parse timetable
      if (row[0] && daysOfWeek.includes(row[0].trim())) {
        const day = row[0].trim();
        const periods = [];
        
        // Start from index 1 (after Day column)
        for (let j = 1; j < row.length && j < timeSlots.length + 1; j++) {
          const subject = row[j]?.toString().trim();
          if (subject) {
            periods.push({
              periodNumber: j,
              timeSlot: timeSlots[j-1],
              subject: subject,
              faculty: "",
              startTime: timeSlots[j-1].split(' - ')[0],
              endTime: timeSlots[j-1].split(' - ')[1]
            });
          }
        }
        
        if (periods.length > 0) {
          schedule[day] = periods;
        }
      }

      // Parse theory subjects section
      if (row[0] === 'THEORY') {
        inTheorySection = true;
        continue;
      }

      if (inTheorySection && row[0] && row[0] !== 'CODE' && row[0] !== 'Time Table Co-ordinator') {
        if (row[0] && row[0].length > 0 && !row[0].includes('Time Table')) {
          const facultyName = row[2] || '';
          // Try to find faculty ID from name
          const faculty = faculties.find(f => 
            `${f.firstName} ${f.lastName}`.toLowerCase().includes(facultyName.toLowerCase())
          );
          
          theorySubjects.push({
            code: row[0] || '',
            subject: row[1] || '',
            faculty: facultyName,
            facultyId: faculty?._id || '',
            phone: row[3] || ''
          });

          // Auto-map faculty if found
          if (faculty) {
            setFacultyMap(prev => ({
              ...prev,
              [row[1] || '']: faculty._id
            }));
          }
        }
      }

      // Exit theory section
      if (inTheorySection && row[0] && row[0].includes('Time Table Co-ordinator')) {
        inTheorySection = false;
      }
    }
    
    return { schedule, classIncharge, lectureHall, effectiveDate, theorySubjects };
  };

  const validateSchedule = () => {
    if (!previewData) return false;

    let isValid = true;
    const errors = [];

    Object.entries(previewData).forEach(([day, periods]) => {
      periods.forEach(period => {
        const subject = period.subject;
        const subjectUpper = subject?.toUpperCase() || '';
        
        // Skip validation for special periods
        if (["BREAK", "LIBRARY", "SPORTS", "LUNCH"].includes(subjectUpper)) {
          return;
        }

        // Check if subject exists in filtered subjects (by code or name)
        const subjectExists = filteredSubjects.some(
          s => s.code === subject || s.name === subject
        );
        
        if (!subjectExists && subject) {
          errors.push(`Subject "${subject}" on ${day} is not available for ${selected.branch} - Semester ${selected.semester}`);
          isValid = false;
        }

        // Check if faculty is mapped for regular subjects
        if (subject && !["BREAK", "LIBRARY", "SPORTS", "LUNCH"].includes(subjectUpper)) {
          if (!facultyMap[subject]) {
            errors.push(`Please map faculty for subject "${subject}" on ${day}`);
            isValid = false;
          }
        }
      });
    });

    if (!isValid) {
      errors.forEach(error => toast.error(error));
    }

    return isValid;
  };

  const saveTimetableToDatabase = () => {
    if (!selected.section) {
      toast.error("Please select section");
      return;
    }

    if (!previewData) {
      toast.error("No data to import");
      return;
    }

    if (!validateSchedule()) {
      return;
    }

    setIsSaving(true);

    // Format schedule for backend with the correct structure
    const formattedSchedule = Object.entries(previewData).map(([day, periods]) => {
      // Convert day from short to full name
      const fullDayName = getFullDayName(day);
      
      return {
        day: fullDayName,
        periods: periods.map(period => {
          const subjectUpper = period.subject?.toUpperCase() || '';
          const isSpecialPeriod = ["BREAK", "LIBRARY", "SPORTS", "LUNCH"].includes(subjectUpper);
          
          // Get faculty ID from map
          let facultyId = facultyMap[period.subject] || "";
          let facultyName = "";
          
          if (facultyId) {
            const faculty = faculties.find(f => f._id === facultyId);
            facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : "";
          }
          
          // If no faculty mapped, try to find from theory subjects
          if (!facultyId && !isSpecialPeriod) {
            const theorySubject = theorySubjects.find(ts => 
              ts.subject === period.subject || ts.code === period.subject
            );
            facultyId = theorySubject?.facultyId || "";
            if (theorySubject?.faculty) {
              facultyName = theorySubject.faculty;
            }
          }

          return {
            periodNumber: period.periodNumber,
            subject: period.subject,
            faculty: facultyId,
            facultyName: facultyName,
            startTime: period.startTime,
            endTime: period.endTime,
            timeSlot: period.timeSlot,
            regulation: selected.regulation
          };
        })
      };
    });

    // Prepare complete timetable data
    const timetableData = {
      branch: selected.branch,
      semester: parseInt(selected.semester),
      section: selected.section,
      schedule: JSON.stringify(formattedSchedule),
      metadata: {
        lectureHall: lectureHall || "",
        effectiveDate: effectiveDate || "",
        classIncharge: classInchargeId || classIncharge || "",
        theorySubjects: theorySubjects.map(ts => ({
          code: ts.code || "",
          subject: ts.subject || "",
          faculty: ts.faculty || "",
          facultyId: facultyMap[ts.subject] || ts.facultyId || "",
          phone: ts.phone || ""
        }))
      }
    };

    toast.loading("Saving timetable to database...");

    axios
      .post(`${baseApiURL()}/timetable/addTimetable`, timetableData)
      .then((res) => {
        toast.dismiss();
        if (res.data.success) {
          toast.success(res.data.message);
          // Reset form using the ref instead of getElementById
          resetForm();
          
          if (onSuccess) onSuccess(res.data.timetable);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        toast.dismiss();
        console.error("Error saving timetable:", err);
        toast.error(err.response?.data?.message || "Error saving timetable");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const proceedWithImport = () => {
    setShowOverwriteConfirm(false);
    saveTimetableToDatabase();
  };

  const getFullDayName = (shortDay) => {
    const dayMap = {
      'MON': 'Monday',
      'TUE': 'Tuesday',
      'WED': 'Wednesday',
      'THUR': 'Thursday',
      'FRI': 'Friday',
      'SAT': 'Saturday'
    };
    return dayMap[shortDay] || shortDay;
  };

  const updateFacultyMapping = (subject, facultyId) => {
    setFacultyMap(prev => ({
      ...prev,
      [subject]: facultyId
    }));
  };

  const getFacultyName = (facultyId) => {
    if (!facultyId) return '';
    const faculty = faculties.find(f => f._id === facultyId);
    return faculty ? `${faculty.firstName} ${faculty.lastName}` : '';
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData(null);
    setFacultyMap({});
    setTheorySubjects([]);
    setClassIncharge("");
    setClassInchargeId("");
    setLectureHall("");
    setEffectiveDate("");
    setExistingTimetable(null);
    
    // Reset file input using ref instead of getElementById
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Branch
          </label>
          <select
            className="w-full px-4 py-2 border rounded-md"
            value={selected.branch}
            onChange={(e) => setSelected({ ...selected, branch: e.target.value, semester: "", section: "" })}
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Semester
          </label>
          <select
            className="w-full px-4 py-2 border rounded-md"
            value={selected.semester}
            onChange={(e) => setSelected({ ...selected, semester: e.target.value })}
            disabled={!selected.branch}
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section
          </label>
          <select
            className="w-full px-4 py-2 border rounded-md"
            value={selected.section}
            onChange={(e) => setSelected({ ...selected, section: e.target.value })}
          >
            <option value="">Select Section</option>
            {sectionsList.map((sec) => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Regulation
          </label>
          <input
            type="text"
            placeholder="Auto-detected"
            className="w-full px-4 py-2 border rounded-md bg-gray-50 font-semibold text-blue-700 cursor-not-allowed"
            value={selected.regulation}
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Class Incharge
          </label>
          <select
            className="w-full px-4 py-2 border rounded-md"
            value={classInchargeId}
            onChange={(e) => {
              setClassInchargeId(e.target.value);
              const faculty = faculties.find(f => f._id === e.target.value);
              setClassIncharge(faculty ? `${faculty.firstName} ${faculty.lastName}` : '');
            }}
          >
            <option value="">Select Class Incharge</option>
            {faculties.map((f) => (
              <option key={f._id} value={f._id}>
                {[f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ")} ({f.employeeId})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={downloadTemplate}
            disabled={!selected.branch || !selected.semester}
            className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
              (!selected.branch || !selected.semester) && "opacity-50 cursor-not-allowed"
            }`}
          >
            Download Template
          </button>
          
          {previewData && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* File Upload Section */}
      {selected.branch && selected.semester && !previewData && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
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

      {/* Overwrite Confirmation Modal */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Timetable Already Exists</h3>
            <p className="text-gray-600 mb-4">
              A timetable already exists for {selected.branch} - Semester {selected.semester} - Section {selected.section}.
              Do you want to overwrite it?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowOverwriteConfirm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithImport}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Header Info */}
      {previewData && (
        <div className="bg-gray-50 border rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Lecture Hall</label>
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={lectureHall}
              onChange={(e) => setLectureHall(e.target.value)}
              placeholder="Enter Lecture Hall"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Effective From</label>
            <input
              type="date"
              className="mt-1 w-full px-3 py-2 border rounded-md"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Incharge</label>
            <input
              type="text"
              className="mt-1 w-full px-3 py-2 border rounded-md bg-gray-100"
              value={classIncharge}
              readOnly
            />
          </div>
        </div>
      )}

      {/* Faculty Mapping Section */}
      {previewData && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Map Faculty to Subjects</h3>
          
          {/* Get unique subjects from preview data */}
          {Array.from(new Set(
            Object.values(previewData)
              .flat()
              .map(p => p.subject)
              .filter(s => s && !["BREAK", "LIBRARY", "SPORTS", "LUNCH"].includes(s?.toUpperCase()))
          )).map(subject => {
            const subjectInfo = filteredSubjects.find(s => s.code === subject || s.name === subject);
            return (
              <div key={subject} className="flex items-center gap-4 mb-3 p-2 bg-gray-50 rounded">
                <div className="w-48">
                  <span className="font-medium block">{subject}</span>
                  {subjectInfo && (
                    <span className="text-xs text-gray-500">{subjectInfo.code}</span>
                  )}
                </div>
                <select
                  className="flex-1 px-3 py-2 border rounded-md"
                  value={facultyMap[subject] || ""}
                  onChange={(e) => updateFacultyMapping(subject, e.target.value)}
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.firstName} {faculty.lastName} ({faculty.employeeId})
                    </option>
                  ))}
                </select>
                {facultyMap[subject] && (
                  <button
                    onClick={() => updateFacultyMapping(subject, "")}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Theory Subjects Section */}
      {theorySubjects.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Theory Subjects</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">Code</th>
                  <th className="px-4 py-2 border">Subject Name</th>
                  <th className="px-4 py-2 border">Faculty</th>
                  <th className="px-4 py-2 border">Phone No</th>
                </tr>
              </thead>
              <tbody>
                {theorySubjects.map((subject, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{subject.code}</td>
                    <td className="px-4 py-2 border">{subject.subject}</td>
                    <td className="px-4 py-2 border">
                      <select
                        className="w-full px-2 py-1 border rounded-md"
                        value={facultyMap[subject.subject] || subject.facultyId || ""}
                        onChange={(e) => updateFacultyMapping(subject.subject, e.target.value)}
                      >
                        <option value="">Select Faculty</option>
                        {faculties.map((f) => (
                          <option key={f._id} value={f._id}>
                            {[f.firstName, f.middleName, f.lastName].filter(Boolean).join(" ")} ({f.employeeId})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 border">{subject.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">Preview Timetable</h3>
            <p className="text-sm text-gray-600">
              Please review the data before saving to database
            </p>
          </div>
          
          <div className="overflow-x-auto p-4">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">Time/Day</th>
                  {timeSlots.map((slot, idx) => (
                    <th key={idx} className="px-4 py-2 border text-sm">{slot}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(previewData).map(([day, periods]) => (
                  <tr key={day}>
                    <td className="px-4 py-2 border font-semibold bg-gray-50">{day}</td>
                    {timeSlots.map((slot, idx) => {
                      const period = periods.find(p => p.timeSlot === slot);
                      const subjectUpper = period?.subject?.toUpperCase() || '';
                      const isSpecialPeriod = ["BREAK", "LIBRARY", "SPORTS", "LUNCH"].includes(subjectUpper);
                      
                      return (
                        <td key={idx} className="px-4 py-2 border text-center">
                          {period ? (
                            <div>
                              <div className={`font-medium ${isSpecialPeriod ? 'text-green-600' : ''}`}>
                                {period.subject}
                              </div>
                              {!isSpecialPeriod && period.subject && (
                                <div className="text-xs text-gray-600">
                                  {getFacultyName(facultyMap[period.subject]) || 
                                   (period.faculty ? period.faculty : 'No faculty mapped')}
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

          {/* Save to Database Button */}
          <div className="px-4 py-3 bg-gray-50 border-t flex justify-end gap-4">
            <button
              onClick={resetForm}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={checkExistingTimetable}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save to Database
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!previewData && existingTimetable && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">
            Timetable already exists. You can upload a new file to overwrite it.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimetableImport;
import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { FiAlertCircle } from "react-icons/fi";
import { baseApiURL } from "../../baseUrl";

const COAttainment = () => {
  // Step 1: Filter Selection
  const [formStep, setFormStep] = useState(1); // 1: Filters, 2: Configuration, 3: Upload Results
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [noStudentsMessage, setNoStudentsMessage] = useState("");
  const [studentRegulations, setStudentRegulations] = useState([]);

  useEffect(() => {
    axios
      .get(`${baseApiURL()}/student/details/getRegulations`)
      .then((res) => {
        if (res.data.success) {
          setStudentRegulations(res.data.regulations || []);
        }
      })
      .catch((err) => console.error("Error fetching student regulations:", err));
  }, []);

  useEffect(() => {
    checkStudentPresence();
  }, [selectedSemester, selectedBranch, branches]);

  const checkStudentPresence = async () => {
    if (!selectedSemester) {
      setNoStudentsMessage("");
      return;
    }

    try {
      let bName = selectedBranch;
      if (selectedBranch) {
        const bObj = branches.find(b => b._id === selectedBranch || b.name === selectedBranch);
        if (bObj?.name) bName = bObj.name;
      }

      const response = await axios.post(`${baseApiURL()}/student/details/getCohortRegulation`, {
        semester: Number(selectedSemester),
        branch: bName
      });

      if (response.data.success && response.data.count > 0 && response.data.regulations?.length > 0) {
        const studentReg = response.data.regulation || response.data.regulations[0];
        if (studentReg) {
          setSelectedRegulation(studentReg);
        }
        setNoStudentsMessage("");
      } else {
        setNoStudentsMessage("no student in that semester");
        setSelectedRegulation("");
        setSelectedSubject("");
      }
    } catch (error) {
      console.error("COAttainment checkStudentPresence error:", error);
      setNoStudentsMessage("no student in that semester");
      setSelectedRegulation("");
      setSelectedSubject("");
    }
  };
  const [subjectCOs, setSubjectCOs] = useState([]);

  // Step 2: Assessment Configuration
  const [questions, setQuestions] = useState([{ questionNum: 1, totalMarks: 0, subQuestions: 1, coNumber: "" }]);
  const [assignments, setAssignments] = useState([{ assignmentNum: 1, totalMarks: 0 }]);
  const [totalMarksForCO, setTotalMarksForCO] = useState(0);

  // Step 3: File Upload and Results
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [coSummary, setCoSummary] = useState([]);
  const [assessmentConfig, setAssessmentConfig] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [rawExcelData, setRawExcelData] = useState(null);

  // Fetch subjects and branches on component mount
  useEffect(() => {
    fetchSubjectsAndBranches();
  }, []);

  // Fetch CO when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchSubjectCOs(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchSubjectsAndBranches = async () => {
    try {
      const [subjectsRes, branchesRes] = await Promise.all([
        axios.get(`${baseApiURL()}/subject/getSubject`),
        axios.get(`${baseApiURL()}/branch/getBranch`),
      ]);
      setSubjects(subjectsRes.data?.subject || []);
      setBranches(branchesRes.data?.branches || branchesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch subjects and branches");
    }
  };

  const fetchSubjectCOs = async (subjectId) => {
    try {
      const response = await axios.get(`${baseApiURL()}/subject/${subjectId}`);
      const courseOutcomes = response.data?.subject?.courseOutcomes || response.data?.courseOutcomes || [];
      setSubjectCOs(courseOutcomes);
    } catch (error) {
      console.error("Error fetching COs:", error);
      toast.error("Failed to fetch course outcomes");
      setSubjectCOs([]);
    }
  };

  // Handle question change
  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === "totalMarks") {
      newQuestions[index][field] = parseFloat(value) || 0;
    } else if (field === "subQuestions") {
      newQuestions[index][field] = parseInt(value) || 0;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  // Handle assignment change
  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = parseFloat(value) || 0;
    setAssignments(newAssignments);
  };

  // Add new question
  const addQuestion = () => {
    const nextNum = Math.max(...questions.map(q => q.questionNum), 0) + 1;
    setQuestions([...questions, { questionNum: nextNum, totalMarks: 0, subQuestions: 1, coNumber: "" }]);
  };

  // Remove question
  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast.error("At least one question is required");
    }
  };

  // Add new assignment
  const addAssignment = () => {
    const nextNum = Math.max(...assignments.map(a => a.assignmentNum), 0) + 1;
    setAssignments([...assignments, { assignmentNum: nextNum, totalMarks: 0 }]);
  };

  // Remove assignment
  const removeAssignment = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  // Validate filters
  const validateFilters = () => {
    if (!selectedSubject || !selectedBranch || !selectedSemester) {
      toast.error("Please select all filters (Subject, Branch, Semester)");
      return false;
    }
    return true;
  };

  // Validate configuration
  const validateConfiguration = () => {
    const totalQuestionMarks = questions.reduce((sum, q) => sum + (q.totalMarks || 0), 0);
    const totalAssignmentMarks = assignments.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
    const calculatedTotal = totalQuestionMarks + totalAssignmentMarks;

    if (calculatedTotal === 0) {
      toast.error("Please add questions and/or assignments with marks");
      return false;
    }

    if (!(totalMarksForCO && Number(totalMarksForCO) > 0)) {
      toast.error('Please enter Total Marks for CO');
      return false;
    }

    // Check if all questions are mapped to COs
    const unmappedQuestions = questions.filter(q => !q.coNumber || q.coNumber === "");
    if (unmappedQuestions.length > 0) {
      toast.error(`Please map all questions to COs. Unmapped questions: ${unmappedQuestions.map(q => q.questionNum).join(', ')}`);
      return false;
    }

    return true;
  };

  // Generate Excel template
  const generateExcelTemplate = async () => {
    try {
      const selectedBranchObj = branches.find(b => b._id === selectedBranch);
      const branchName = selectedBranchObj?.name || selectedBranch;
      
      const mappedQuestions = questions.map((q) => ({
        questionNumber: q.questionNum,
        totalMarks: q.totalMarks,
        coNumber: q.coNumber || null,
        subQuestions: Array.from({ length: q.subQuestions }, (_, i) => ({
          subQuestionNumber: String.fromCharCode(97 + i),
          totalMarks: q.totalMarks && q.subQuestions ? +(q.totalMarks / q.subQuestions).toFixed(2) : 0,
        })),
      }));

      const mappedAssignments = assignments.map((a) => ({
        assignmentNumber: a.assignmentNum,
        totalMarks: a.totalMarks,
      }));

      const payload = {
        subjectId: selectedSubject,
        coNumber: (mappedQuestions[0] && mappedQuestions[0].coNumber) || null,
        branchId: branchName,
        semester: selectedSemester,
        questions: mappedQuestions,
        assignments: mappedAssignments,
        academicYear: new Date().getFullYear(),
      };

      const res = await axios.post(`${baseApiURL()}/coattainment/calculate-coattainment`, payload);
      const assessment = res.data?.assessment || res.data;
      if (!assessment) {
        toast.error('Failed to create assessment for template');
        return;
      }
      setAssessmentId(assessment._id || assessment.id || null);

      let studentMarks = assessment.studentMarks || [];
      if (!studentMarks || studentMarks.length === 0) {
        try {
          const selectedBranchObj = branches.find(b => b._id === selectedBranch);
          const branchName = selectedBranchObj?.name || selectedBranch;
          
          const studentsRes = await axios.post(`${baseApiURL()}/student/details/getDetails`, {
            branch: branchName,
            semester: selectedSemester,
          });
          const fetched = studentsRes.data?.user || studentsRes.data?.students || [];
          studentMarks = fetched.map((st) => ({
            enrollmentNo: st.enrollmentNo,
            studentName: st.name || `${st.firstName || ''} ${st.middleName || ''} ${st.lastName || ''}`.trim().replace(/\s+/g, ' '),
          }));
        } catch (err) {
          console.error('Failed to fetch students for template:', err);
          toast.error('Failed to fetch students for template');
          return;
        }
      }

      const headers = ['Enrollment No', 'Student Name'];
      
      (assessment.questions || []).forEach((q) => {
        if (q.subQuestions && q.subQuestions.length > 0) {
          q.subQuestions.forEach((sq) => {
            headers.push(`Q${q.questionNumber}${sq.subQuestionNumber}`);
          });
        } else {
          headers.push(`Q${q.questionNumber}`);
        }
      });
      
      (assessment.assignments || []).forEach((a) => {
        headers.push(`A${a.assignmentNumber}`);
      });
      
      headers.push('Total', 'Percentage %', 'Attainment Level');

      const mappingRow = ['CO Mapping:', ''];
      (assessment.questions || []).forEach((q) => {
        if (q.subQuestions && q.subQuestions.length > 0) {
          q.subQuestions.forEach(() => {
            mappingRow.push(q.coNumber || '-');
          });
        } else {
          mappingRow.push(q.coNumber || '-');
        }
      });
      (assessment.assignments || []).forEach(() => {
        mappingRow.push('-');
      });
      mappingRow.push('-', '-', '-');
      
      const maxMarksRow = ['Marks:', 'Max→'];
      
      (assessment.questions || []).forEach((q) => {
        if (q.subQuestions && q.subQuestions.length > 0) {
          q.subQuestions.forEach((sq) => {
            maxMarksRow.push(sq.totalMarks || 0);
          });
        } else {
          maxMarksRow.push(q.totalMarks || 0);
        }
      });
      
      (assessment.assignments || []).forEach((a) => {
        maxMarksRow.push(a.totalMarks || 0);
      });
      
      maxMarksRow.push(assessment.totalMarks || 0, '100', '-');
      
      const dataRows = (studentMarks || []).map((s) => {
        const row = [s.enrollmentNo, s.studentName];
        
        (assessment.questions || []).forEach((q) => {
          if (q.subQuestions && q.subQuestions.length > 0) {
            q.subQuestions.forEach(() => {
              row.push('');
            });
          } else {
            row.push('');
          }
        });
        
        (assessment.assignments || []).forEach(() => {
          row.push('');
        });
        
        row.push('', '', '');
        
        return row;
      });
      
      const allRows = [headers, mappingRow, maxMarksRow, ...dataRows];
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allRows);
      
      const columnWidths = [];
      columnWidths.push({ wch: 15 });
      columnWidths.push({ wch: 20 });
      
      (assessment.questions || []).forEach((q) => {
        if (q.subQuestions && q.subQuestions.length > 0) {
          q.subQuestions.forEach(() => {
            columnWidths.push({ wch: 12 });
          });
        } else {
          columnWidths.push({ wch: 12 });
        }
      });
      
      (assessment.assignments || []).forEach(() => {
        columnWidths.push({ wch: 12 });
      });
      
      columnWidths.push({ wch: 12 }, { wch: 14 }, { wch: 16 });
      
      ws['!cols'] = columnWidths;
      
      const instructionData = [
        ['CO ATTAINMENT EXCEL TEMPLATE - INSTRUCTIONS'],
        [''],
        ['SUBJECT INFO:'],
        ['Subject Code', assessment.subjectCode],
        ['Subject Name', assessment.subjectName],
        ['Question to CO Mapping', ''],
        ...(mappedQuestions || []).map(mq => ([`Q${mq.questionNumber}`, mq.coNumber || '-'])),
        ['Branch', assessment.branchName],
        ['Semester', assessment.semester],
        ['Academic Year', assessment.academicYear],
        ['Total Marks', assessment.totalMarks],
        [''],
        ['INSTRUCTIONS:'],
        ['1. Fill in student marks in the columns (starting from row 4)'],
        ['2. Row 1 = Column headers, Row 2 = CO Mapping, Row 3 = Max marks for each column'],
        ['3. For each sub-question (Q{n}{letter}), enter marks out of the max marks shown'],
        ['4. For each assignment (A{n}), enter marks out of the max marks shown'],
        ['5. DO NOT modify Enrollment No, Student Name, or the max marks row'],
        ['6. Total should be sum of all obtained marks'],
        ['7. Percentage = (Total / Max Total) × 100'],
        ['8. Attainment Level: >50%=3, 30-50%=2, <30%=1'],
        ['9. Save and upload back to the system'],
      ];
      
      const instructionWs = XLSX.utils.aoa_to_sheet(instructionData);
      instructionWs['!cols'] = [{ wch: 35 }, { wch: 50 }];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Data Entry');
      XLSX.utils.book_append_sheet(wb, instructionWs, 'Instructions');
      
      const subjObj = subjects.find(s => s._id === selectedSubject) || {};
      const subjTag = subjObj.code || subjObj.name || selectedSubject || 'subject';
      XLSX.writeFile(wb, `CO_Attainment_Template_${subjTag}.xlsx`);
      toast.success('Excel template downloaded! Fill in marks and upload back');
    } catch (error) {
      console.error('Template generation error:', error);
      toast.error('Error generating template from server');
    }
  };

  // Parse Excel file
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          if (rawData.length > 3) {
            const headers = rawData[0];
            const studentDataRows = rawData.slice(3);
            
            const jsonData = studentDataRows.map(row => {
              const obj = {};
              headers.forEach((header, idx) => {
                obj[header] = row[idx];
              });
              return obj;
            }).filter(row => row['Enrollment No']);
            
            resolve({
              data: jsonData,
              headers,
              rawData
            });
          } else {
            reject(new Error('Invalid Excel format: Expected at least 4 rows (headers, mapping, max marks, data)'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  // Calculate CO attainment manually from raw data
  const calculateCOAttainmentManually = (excelData, questions, assignments) => {
    // Initialize CO map
    const coStudentMap = {};
    
    questions.forEach(q => {
      if (q.coNumber && !coStudentMap[q.coNumber]) {
        coStudentMap[q.coNumber] = {};
      }
    });

    // For each student, calculate CO-specific attainment
    excelData.forEach((row) => {
      const enrollmentNo = row["Enrollment No"];
      if (!enrollmentNo) return;
      
      questions.forEach(q => {
        if (!q.coNumber) return;
        
        if (!coStudentMap[q.coNumber][enrollmentNo]) {
          coStudentMap[q.coNumber][enrollmentNo] = {
            obtained: 0,
            possible: 0
          };
        }
        
        // Calculate marks for this question (all sub-questions)
        let questionObtained = 0;
        let questionPossible = 0;
        
        // Check if there are sub-questions
        const hasSubQuestions = q.subQuestions > 1 || 
          Object.keys(row).some(key => key.startsWith(`Q${q.questionNum}`) && key.length > 2);
        
        if (hasSubQuestions) {
          for (let i = 0; i < q.subQuestions; i++) {
            const subKey = `Q${q.questionNum}${String.fromCharCode(97 + i)}`;
            const subMarks = parseFloat(row[subKey]) || 0;
            questionObtained += subMarks;
            const subMax = q.totalMarks / q.subQuestions;
            questionPossible += subMax;
          }
        } else {
          // Single question without sub-parts
          const questionKey = `Q${q.questionNum}`;
          questionObtained = parseFloat(row[questionKey]) || 0;
          questionPossible = q.totalMarks;
        }
        
        coStudentMap[q.coNumber][enrollmentNo].obtained += questionObtained;
        coStudentMap[q.coNumber][enrollmentNo].possible += questionPossible;
      });
    });

    // Build CO summary without level counts
    const coSummary = Object.keys(coStudentMap).map(coNumber => {
      const students = coStudentMap[coNumber];
      const studentEntries = Object.entries(students);
      
      let totalAttainmentLevel = 0;
      let totalPercentage = 0;
      
      studentEntries.forEach(([enroll, marks]) => {
        // Calculate percentage for this student for this CO
        const percentage = marks.possible > 0 ? (marks.obtained / marks.possible) * 100 : 0;
        
        // Ensure percentage doesn't exceed 100
        const cappedPercentage = Math.min(percentage, 100);
        
        let level = 1;
        if (cappedPercentage > 50) level = 3;
        else if (cappedPercentage >= 30) level = 2;
        
        totalAttainmentLevel += level;
        totalPercentage += cappedPercentage;
      });
      
      const averageAttainment = studentEntries.length > 0 ? 
        parseFloat((totalAttainmentLevel / studentEntries.length).toFixed(2)) : 0;
      
      // Calculate average percentage capped at 100
      const averagePercentage = studentEntries.length > 0 ? 
        parseFloat((totalPercentage / studentEntries.length).toFixed(2)) : 0;
      
      return {
        coNumber,
        averageAttainment,
        averagePercentage: Math.min(averagePercentage, 100), // Ensure it doesn't exceed 100
        studentCount: studentEntries.length
      };
    });
    
    return coSummary;
  };

  // Handle file upload and process data
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    setLoading(true);
    try {
      console.log('Parsing Excel file...');
      const { data: excelData, rawData } = await parseExcelFile(selectedFile);
      setRawExcelData(excelData);
      console.log('Excel data parsed, rows:', excelData.length);
      console.log('First row sample:', excelData[0]);

      const selectedBranchObj = branches.find(b => b._id === selectedBranch);
      const branchName = selectedBranchObj?.name || selectedBranch;

      // Calculate CO attainment manually first (as fallback)
      const manualCoSummary = calculateCOAttainmentManually(excelData, questions, assignments);
      console.log('Manual CO Summary:', manualCoSummary);

      // Send uploaded marks to backend
      const payload = {
        assessmentId: assessmentId,
        marksData: excelData,
        subjectId: selectedSubject,
        branchId: branchName,
        semester: selectedSemester,
        questions: questions.map(q => ({ 
          questionNumber: q.questionNum, 
          totalMarks: q.totalMarks, 
          coNumber: q.coNumber || null, 
          subQuestions: Array.from({length: q.subQuestions}, (_,i)=>({ 
            subQuestionNumber: String.fromCharCode(97+i), 
            totalMarks: q.totalMarks && q.subQuestions ? +(q.totalMarks / q.subQuestions).toFixed(2) : 0 
          })) 
        })),
        assignments: assignments.map(a => ({ 
          assignmentNumber: a.assignmentNum, 
          totalMarks: a.totalMarks 
        })),
        totalMarks: Number(totalMarksForCO)
      };

      const res = await axios.post(`${baseApiURL()}/coattainment/calculate-coattainment`, payload);
      console.log('Server response received');
      const assessment = res.data?.assessment || res.data;
      
      if (!assessment) {
        toast.error('Server failed to process uploaded marks');
        setLoading(false);
        return;
      }

      setAssessmentResult(assessment);

      // Try to use backend CO summary, but if it's incorrect, use manual calculation
      let finalCoSummary = [];
      
      if (assessment.studentMarks && assessment.studentMarks.length > 0) {
        // Check if backend provided proper CO results
        const hasProperCOResults = assessment.studentMarks.some(s => 
          s.coResults && s.coResults.length > 0 && 
          s.coResults.some(cr => cr.percentage !== undefined)
        );
        
        if (hasProperCOResults) {
          console.log('Using backend CO results');
          // Build CO summary from backend coResults without level counts
          const coMap = {};
          
          assessment.studentMarks.forEach((s) => {
            const crs = s.coResults || s.co_results || [];
            crs.forEach((cr) => {
              const co = String(cr.coNumber || 'UNMAPPED');
              if (!coMap[co]) {
                coMap[co] = { 
                  totalPercentage: 0,
                  totalLevel: 0, 
                  count: 0
                };
              }
              
              // Use CO-specific percentage and cap at 100
              const perc = Math.min(Number(cr.percentage) || 0, 100);
              
              // Determine level based on CO-specific percentage
              let lvl = 1;
              if (perc > 50) lvl = 3;
              else if (perc >= 30) lvl = 2;
              
              coMap[co].totalPercentage += perc;
              coMap[co].totalLevel += lvl;
              coMap[co].count += 1;
            });
          });

          finalCoSummary = Object.keys(coMap).map((co) => {
            const e = coMap[co];
            return {
              coNumber: co,
              averagePercentage: e.count > 0 ? parseFloat((e.totalPercentage / e.count).toFixed(2)) : 0,
              averageAttainment: e.count > 0 ? parseFloat((e.totalLevel / e.count).toFixed(2)) : 0,
              studentCount: e.count
            };
          });
        } else {
          console.log('Backend CO results missing or incorrect, using manual calculation');
          finalCoSummary = manualCoSummary;
        }
      } else {
        console.log('No student marks in backend response, using manual calculation');
        finalCoSummary = manualCoSummary;
      }

      setCoSummary(finalCoSummary);

      // Process student-wise results
      const processedResults = (assessment.studentMarks || []).map(s => {
        const rawTotal = (s.totalObtainedMarks ?? s.totalObtained) || 0;
        const numTotal = Number(rawTotal);
        const formattedTotal = Number.isFinite(numTotal) ? numTotal.toFixed(2) : rawTotal;

        const rawPerc = (s.percentage ?? 0) || 0;
        const numPerc = Number(rawPerc);
        // Cap percentage at 100
        const cappedPerc = Math.min(numPerc, 100);
        const formattedPerc = Number.isFinite(cappedPerc) ? cappedPerc.toFixed(2) : rawPerc;

        return {
          enrollmentNo: s.enrollmentNo,
          totalObtainedMarks: formattedTotal,
          totalPossibleMarks: assessment.totalMarks || totalMarksForCO,
          percentage: formattedPerc,
          attainmentLevel: s.attainmentLevel || 1,
        };
      });

      setResults(processedResults);
      setFormStep(4);
      toast.success('Marks uploaded and saved successfully');
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Error uploading marks to server');
    } finally {
      setLoading(false);
    }
  };

  // Process student marks and calculate attainment
  const processStudentMarks = (excelData) => {
    return excelData.map((row) => {
      let totalObtainedMarks = 0;
      let totalPossibleMarks = 0;

      questions.forEach((q) => {
        totalPossibleMarks += q.totalMarks;
        let questionObtained = 0;
        
        for (let i = 0; i < q.subQuestions; i++) {
          const subKey = `Q${q.questionNum}${String.fromCharCode(97 + i)}`;
          questionObtained += parseFloat(row[subKey]) || 0;
        }
        totalObtainedMarks += Math.min(questionObtained, q.totalMarks);
      });

      assignments.forEach((a) => {
        totalPossibleMarks += a.totalMarks;
        const assignmentKey = `A${a.assignmentNum}`;
        totalObtainedMarks += Math.min(parseFloat(row[assignmentKey]) || 0, a.totalMarks);
      });

      const percentage = totalPossibleMarks > 0 ? (totalObtainedMarks / totalPossibleMarks) * 100 : 0;
      
      // Cap percentage at 100
      const cappedPercentage = Math.min(percentage, 100);

      let attainmentLevel = 1;
      if (cappedPercentage > 50) attainmentLevel = 3;
      else if (cappedPercentage >= 30) attainmentLevel = 2;

      return {
        enrollmentNo: row["Enrollment No"],
        totalObtainedMarks: totalObtainedMarks.toFixed(2),
        totalPossibleMarks,
        percentage: cappedPercentage.toFixed(2),
        attainmentLevel,
      };
    });
  };

  // Calculate average attainment with correct percentage
  const calculateAverageAttainment = () => {
    if (!results || results.length === 0) return null;
    
    // Calculate average attainment level
    const totalLevels = results.reduce((sum, r) => sum + (Number(r.attainmentLevel) || 0), 0);
    const avgLevelMean = totalLevels / results.length;
    const avgLevel = Math.round(avgLevelMean);

    // Calculate average percentage correctly (already capped at 100 per student)
    const totalPercentage = results.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0);
    const avgPercentage = totalPercentage / results.length;
    
    // Ensure average percentage doesn't exceed 100
    const cappedAvgPercentage = Math.min(avgPercentage, 100);

    return {
      avgLevel,
      avgLevelMean: avgLevelMean.toFixed(2),
      avgPercentage: cappedAvgPercentage.toFixed(2),
      totalStudents: results.length,
    };
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 3:
        return "bg-green-100 text-green-800 border-green-300";
      case 2:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 1:
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getLevelBgColor = (level) => {
    switch (level) {
      case 3:
        return "bg-green-50";
      case 2:
        return "bg-yellow-50";
      case 1:
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  const exportResults = () => {
    const exportData = results.map((r) => ({
      "Enrollment No": r.enrollmentNo,
      "Total Marks Obtained": r.totalObtainedMarks,
      "Max Possible Marks": r.totalPossibleMarks,
      "Percentage (%)": r.percentage,
      "Attainment Level": `Level ${r.attainmentLevel}`,
    }));

    const avgData = calculateAverageAttainment();
    const summaryRow = {
      "Enrollment No": "AVERAGE",
      "Total Marks Obtained": "-",
      "Max Possible Marks": "-",
      "Percentage (%)": avgData?.avgPercentage || '-',
      "Attainment Level": `Level ${avgData?.avgLevel ?? '-'}`,
    };
    exportData.push(summaryRow);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    const subjObj = subjects.find(s => s._id === selectedSubject) || {};
    const subjTag = subjObj.code || subjObj.name || assessmentId || 'results';
    XLSX.writeFile(wb, `CO_Attainment_Results_${subjTag}.xlsx`);
    toast.success("Results exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CO Attainment Calculator</h1>
          <p className="text-gray-600">Calculate Course Outcome attainment levels for your subjects</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <button
                onClick={() => formStep >= step && setFormStep(step)}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  formStep >= step
                    ? "bg-blue-600 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {step}
              </button>
              {step < 4 && (
                <div
                  className={`flex-1 h-2 mx-2 rounded ${
                    formStep > step ? "bg-blue-600" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Filter Selection */}
        {formStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 1: Select Filters</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Regulation Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-semibold">Regulation</label>
                  {selectedRegulation && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-100">
                      Auto-fetched
                    </span>
                  )}
                </div>
                <select
                  value={selectedRegulation}
                  onChange={(e) => setSelectedRegulation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Regulations</option>
                  {(studentRegulations.length > 0 ? studentRegulations : Array.from(new Set(subjects.map(s => s.regulation).filter(Boolean)))).map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Subject *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!!noStudentsMessage}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    noStudentsMessage ? "border-red-300 bg-red-50 text-red-700 font-medium" : "border-gray-300"
                  }`}
                >
                  <option value="">
                    {noStudentsMessage ? "no student in that semester" : "Select Subject"}
                  </option>
                  {(noStudentsMessage ? [] : subjects
                    .filter(s => !selectedRegulation || s.regulation?.toUpperCase() === selectedRegulation.toUpperCase())
                  ).map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code}) {subject.regulation ? `[${subject.regulation}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Branch *</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Semester *</label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {noStudentsMessage && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center space-x-2 w-full">
                <FiAlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-medium">{noStudentsMessage}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (validateFilters()) {
                  setFormStep(2);
                }
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue to Configuration →
            </button>
          </div>
        )}

        {/* Step 2: Assessment Configuration */}
        {formStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 2: Configure Assessment</h2>

            {/* Questions Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Questions</h3>
                <button
                  onClick={addQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Question
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-gray-700 font-medium mb-2">Question {q.questionNum}</label>
                      <input
                        type="number"
                        placeholder="Total Marks"
                        value={q.totalMarks}
                        onChange={(e) => handleQuestionChange(index, "totalMarks", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-gray-700 font-medium mb-2">Sub-Questions</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Number of sub-questions"
                        value={q.subQuestions}
                        onChange={(e) => handleQuestionChange(index, "subQuestions", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-gray-700 font-medium mb-2">Map to CO</label>
                      <select
                        value={q.coNumber}
                        onChange={(e) => handleQuestionChange(index, 'coNumber', e.target.value)}
                        disabled={!selectedSubject || (subjectCOs || []).length === 0}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      >
                        <option value="">Select CO</option>
                        {(subjectCOs || []).map((co, idx) => (
                          <option key={idx} value={co.coNumber}>{co.coNumber}: {co.description}</option>
                        ))}
                      </select>
                    </div>

                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(index)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Assignments Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Assignments</h3>
                <button
                  onClick={addAssignment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + Add Assignment
                </button>
              </div>

              <div className="space-y-4">
                {assignments.map((a, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-gray-700 font-medium mb-2">Assignment {a.assignmentNum}</label>
                      <input
                        type="number"
                        placeholder="Total Marks"
                        value={a.totalMarks}
                        onChange={(e) => handleAssignmentChange(index, "totalMarks", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => removeAssignment(index)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Marks */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-gray-700 font-semibold mb-2">Total Marks for CO</label>
              <p className="text-sm text-gray-600 mb-2">
                Enter the total marks for this CO (required). A suggested value is auto-calculated below.
              </p>
              <input
                type="number"
                placeholder="Enter total marks for CO"
                value={totalMarksForCO}
                onChange={(e) => setTotalMarksForCO(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-blue-700 mt-2 font-medium">
                Suggested Total: {questions.reduce((sum, q) => sum + (Number(q.totalMarks) || 0), 0) + assignments.reduce((sum, a) => sum + (Number(a.totalMarks) || 0), 0)} marks
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setFormStep(1)}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors flex-1"
              >
                ← Back
              </button>

              <button
                onClick={() => {
                  if (!validateConfiguration()) return;

                  setAssessmentConfig({
                    selectedSubject,
                    selectedBranch,
                    selectedSemester,
                    questions,
                    assignments,
                    totalMarks: Number(totalMarksForCO),
                  });
                  setFormStep(3);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex-1"
              >
                Continue to Upload →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload Student Marks */}
        {formStep === 3 && assessmentConfig && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Step 3: Upload Student Marks</h2>

            {/* Configuration Summary */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Assessment Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Subject:</p>
                  <p className="font-semibold">{subjects.find((s) => s._id === selectedSubject)?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">CO Mapping:</p>
                  <p className="font-semibold">{assessmentConfig.questions.map(q => `Q${q.questionNum}->${q.coNumber}`).join(', ')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Branch:</p>
                  <p className="font-semibold">{branches.find((b) => b._id === selectedBranch)?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Semester:</p>
                  <p className="font-semibold">{selectedSemester}</p>
                </div>
                <div>
                  <p className="text-gray-600">Questions:</p>
                  <p className="font-semibold">{assessmentConfig.questions.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Assignments:</p>
                  <p className="font-semibold">{assessmentConfig.assignments.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Marks:</p>
                  <p className="font-semibold">{assessmentConfig.totalMarks}</p>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-8v8m0 0l-3-3m3 3l3-3m-11 11H9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="flex justify-center mb-4">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Choose Excel File
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setSelectedFile(e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {selectedFile && (
                  <p className="text-green-600 font-medium">✓ {selectedFile.name} selected</p>
                )}
              </div>
            </div>

            {/* Template Instructions */}
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-3">Excel Template Format</h3>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>• Column 1: "Enrollment No" (student roll numbers)</li>
                <li>• Column 2: "Student Name" (student names)</li>
                <li>• Question columns: Q1a, Q1b, Q2a, etc. (based on your configuration)</li>
                <li>• Assignment columns: A1, A2, etc.</li>
                <li>• Each row represents one student's marks</li>
                <li>• Download the template below to see the exact format</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setFormStep(2)}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors flex-1"
              >
                ← Back
              </button>

              <button
                onClick={generateExcelTemplate}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex-1"
              >
                ⬇ Download Template
              </button>

              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || loading}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors flex-1 ${
                  !selectedFile || loading
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? "Processing..." : "Process Marks →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {formStep === 4 && results && (
          <div className="space-y-8">
            {/* CO Summary Table - Without Level Counts */}
            {coSummary && coSummary.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Per-CO Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">CO</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Average Percentage</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Average Attainment</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Students</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coSummary.map((c, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{c.coNumber}</td>
                          <td className="px-4 py-3 text-center font-semibold">
                            {typeof c.averagePercentage !== 'undefined' && c.averagePercentage !== null 
                              ? `${Number(c.averagePercentage).toFixed(2)}%` 
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              c.averageAttainment >= 3 ? 'bg-green-100 text-green-800' :
                              c.averageAttainment >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Level {Number(c.averageAttainment).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-medium">{c.studentCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Cards - Updated with correct average percentage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                const avg = calculateAverageAttainment();
                return (
                  <>
                    <div className={`p-6 rounded-lg border-2 ${getLevelColor(avg.avgLevel)}`}>
                      <p className="text-sm font-medium mb-2">Average Attainment Level</p>
                      <p className="text-3xl font-bold">Level {avg.avgLevel}</p>
                      <p className="text-sm mt-2">Mean: {avg.avgLevelMean}</p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-300">
                      <p className="text-sm font-medium mb-2 text-blue-900">Average Percentage</p>
                      <p className="text-3xl font-bold text-blue-600">{avg.avgPercentage}%</p>
                    </div>

                    <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-300">
                      <p className="text-sm font-medium mb-2 text-purple-900">Total Students</p>
                      <p className="text-3xl font-bold text-purple-600">{avg.totalStudents}</p>
                    </div>
                  </>
                );
              })}
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Student-wise Results</h3>
              
              {/* Info about max marks */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Max Possible Marks:</strong> {results.length > 0 ? results[0].totalPossibleMarks : 'N/A'}
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Enrollment No</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Total Marks Obtained</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Percentage</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Attainment Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, idx) => (
                      <tr key={idx} className={`border-b border-gray-200 ${getLevelBgColor(result.attainmentLevel)}`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{result.enrollmentNo}</td>
                        <td className="px-4 py-3 text-center">{result.totalObtainedMarks}</td>
                        <td className="px-4 py-3 text-center font-semibold">{result.percentage}%</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(
                              result.attainmentLevel
                            )}`}
                          >
                            Level {result.attainmentLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-100 border-t-2 border-gray-300 font-bold">
                      <td className="px-4 py-3 text-left text-gray-800">Average (All Students)</td>
                      <td className="px-4 py-3 text-center text-gray-800">
                        {(results.reduce((sum, r) => sum + parseFloat(r.totalObtainedMarks), 0) / results.length).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-800">
                        {calculateAverageAttainment()?.avgPercentage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(calculateAverageAttainment()?.avgLevel)}`}>
                          Level {calculateAverageAttainment()?.avgLevel}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Export and Actions */}
            <div className="flex gap-4">
              <button
                onClick={exportResults}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                ⬇ Export Results to Excel
              </button>

              <button
                onClick={() => {
                  setFormStep(1);
                  setResults(null);
                  setSelectedFile(null);
                  setSelectedSubject("");
                  setSelectedBranch("");
                  setSelectedSemester("");
                  setQuestions([{ questionNum: 1, totalMarks: 0, subQuestions: 1, coNumber: "" }]);
                  setAssignments([{ assignmentNum: 1, totalMarks: 0 }]);
                  setAssessmentResult(null);
                  setCoSummary([]);
                  setRawExcelData(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Calculate Another CO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default COAttainment;
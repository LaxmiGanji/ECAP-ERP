import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { baseApiURL } from "../../baseUrl";
import Heading from "../../components/Heading";
import { FiPlus, FiTrash2, FiBarChart2, FiDownload, FiUpload, FiSettings, FiCheckCircle } from "react-icons/fi";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

const FinalCOPOAttainment = () => {
  useEffect(() => {
    console.log("FinalCOPOAttainment Component Loaded - Interactive Version");
  }, []);

  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  
  const userData = useSelector((state) => state.userData);
  const [facultyName, setFacultyName] = useState("");

  useEffect(() => {
    if (userData?.fullname) {
      setFacultyName(userData.fullname);
    }
  }, [userData]);

  // Files
  const [iaFile, setIaFile] = useState(null);
  const [seeFile, setSeeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  // Interactive UI Tabs
  const [activeTab, setActiveTab] = useState("survey"); // survey, co, po, actionPlan, poActionPlan

  // Question Configurations
  const [iaQuestions, setIaQuestions] = useState([{ qName: "1a", co: "CO1", maxMarks: 5 }]);
  const [seeQuestions, setSeeQuestions] = useState([{ qName: "1a", co: "CO1", maxMarks: 10 }]);
  const [assignmentQuestions, setAssignmentQuestions] = useState([
    { qName: "CIA1", co: "CO1", maxMarks: 10 },
    { qName: "CIA2", co: "CO2", maxMarks: 10 }
  ]);

  // Interactive user inputs
  const [cesCounts, setCesCounts] = useState({});
  const [manualIndirect, setManualIndirect] = useState({});
  const [actionPlan, setActionPlan] = useState({});
  const [caym1Actions, setCaym1Actions] = useState(
    Array.from({ length: 7 }, (_, i) => ({ action: "", change: "" }))
  );
  const [poActionPlan, setPoActionPlan] = useState({});

  const addQuestion = (type) => {
    const newQ = { qName: "", co: "", maxMarks: 0 };
    if (type === "IA") setIaQuestions([...iaQuestions, newQ]);
    else if (type === "SEE") setSeeQuestions([...seeQuestions, newQ]);
    else setAssignmentQuestions([...assignmentQuestions, newQ]);
  };

  const removeQuestion = (type, index) => {
    if (type === "IA") {
      setIaQuestions(iaQuestions.filter((_, i) => i !== index));
    } else if (type === "SEE") {
      setSeeQuestions(seeQuestions.filter((_, i) => i !== index));
    } else {
      setAssignmentQuestions(assignmentQuestions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (type, index, field, value) => {
    if (type === "IA") {
      const updated = [...iaQuestions];
      updated[index][field] = value;
      setIaQuestions(updated);
    } else if (type === "SEE") {
      const updated = [...seeQuestions];
      updated[index][field] = value;
      setSeeQuestions(updated);
    } else {
      const updated = [...assignmentQuestions];
      updated[index][field] = value;
      setAssignmentQuestions(updated);
    }
  };

  useEffect(() => {
    fetchSubjectsAndBranches();
  }, []);

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

  const filteredSubjects = subjects.filter(
    (sub) =>
      sub.semester === parseInt(selectedSemester) &&
      (sub.branch?.name === selectedBranch || sub.branch === selectedBranch)
  );

  const selectedSubjectData = subjects.find(s => s._id === selectedSubject);
  const subjectCOs = selectedSubjectData?.courseOutcomes || [];

  // Generate IA/SEE Templates
  const handleDownloadTemplate = async (templateType) => {
    if (!selectedBranch || !selectedSemester || !selectedSubject) {
      toast.error("Please select Branch, Semester, and Subject");
      return;
    }

    try {
      setLoading(true);
      toast.loading(`Generating ${templateType.toUpperCase()} template with student data...`);
      
      const branchObj = branches.find(b => b.name === selectedBranch || b._id === selectedBranch);
      const branchVal = branchObj?.name || selectedBranch;

      const payload = {
        branch: branchVal,
        semester: selectedSemester,
        subjectId: selectedSubject,
        facultyName: facultyName,
        academicYear: academicYear,
        iaQuestions: iaQuestions,
        seeQuestions: seeQuestions,
        assignmentQuestions: assignmentQuestions,
        templateType: templateType
      };

      const response = await axios.post(`${baseApiURL()}/obe/template/final-copo/template`, payload, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${templateType.toUpperCase()}_Marks_Template_${branchVal}_Sem${selectedSemester}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success(`${templateType.toUpperCase()} template downloaded successfully! Please fill and upload.`);
    } catch (error) {
      toast.dismiss();
      console.error("Error downloading template:", error);
      toast.error("Failed to generate template. Ensure students exist for this branch/semester.");
    } finally {
      setLoading(false);
    }
  };

  // Upload IA and SEE sheets to calculate Direct CO Attainment
  const handleFileUpload = async () => {
    if (!iaFile || !seeFile) {
      toast.error("Please select both IA Marks and SEE Marks files");
      return;
    }
    if (!selectedSubject) {
      toast.error("Please select a Subject");
      return;
    }

    const formData = new FormData();
    formData.append("iaFile", iaFile);
    formData.append("seeFile", seeFile);
    formData.append("subjectId", selectedSubject);

    try {
      setLoading(true);
      toast.loading("Calculating initial Direct CO-PO Attainment...");

      const response = await axios.post(
        `${baseApiURL()}/obe/template/final-copo/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.dismiss();
        toast.success(response.data.message);
        
        const initialResults = response.data.results;
        setResults(initialResults);

        // Initialize user inputs
        const initialCes = {};
        const initialIndirect = {};
        const initialActionPlan = {};
        const initialPOAction = {};

        subjectCOs.forEach(co => {
          initialCes[co.coNumber] = { rating1: 0, rating2: 0, rating3: 0 };
          
          // Pre-fill indirect level from calculated initial results
          const calcCo = initialResults.coAttainments.find(c => c.coNumber === co.coNumber);
          initialIndirect[co.coNumber] = calcCo ? calcCo.indirectAttainment : 2;

          initialActionPlan[co.coNumber] = { target: 2.5, observation: "", action: "" };
        });

        // Initialize PO action plan text
        const pos = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3'];
        pos.forEach(po => {
          initialPOAction[po] = "";
        });

        setCesCounts(initialCes);
        setManualIndirect(initialIndirect);
        setActionPlan(initialActionPlan);
        setPoActionPlan(initialPOAction);
        
      } else {
        toast.dismiss();
        toast.error(response.data.message || "Failed to calculate");
      }
    } catch(err) {
      toast.dismiss();
      console.error(err);
      toast.error("Failed to parse and calculate Excel sheets.");
    } finally {
      setLoading(false);
    }
  };

  // Recalculate dynamic CO overall and PO attainments on frontend
  const getRecalculatedData = () => {
    if (!results) return null;

    const coPoMappings = results.coPoMappings || [];
    const studentCount = results.studentCount || 100;
    const directWeight = 0.8;
    const indirectWeight = 0.2;

    // Recalculate CO Attainments
    const newCoAttainments = results.coAttainments.map(co => {
      // Find manual indirect or computed from CES counts
      let indLevel = Number(manualIndirect[co.coNumber]);
      if (isNaN(indLevel)) indLevel = co.indirectAttainment;

      const direct = co.directAttainment;
      const overall = Number((directWeight * direct + indirectWeight * indLevel).toFixed(2));

      return {
        ...co,
        indirectAttainment: indLevel,
        overallAttainment: overall
      };
    });

    // Recalculate PO Attainments
    const pos = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3'];
    const newPoAttainments = [];

    for (const po of pos) {
      const mappings = coPoMappings.filter(m => m.poNumber === po);
      if (mappings.length > 0) {
        let sumDirect = 0;
        let sumIndirect = 0;
        let countMapped = 0;

        mappings.forEach(mapping => {
          const coResult = newCoAttainments.find(r => r.coNumber === mapping.coNumber);
          if (coResult && mapping.strength > 0) {
            sumDirect += (mapping.strength * coResult.directAttainment / 3);
            sumIndirect += (mapping.strength * coResult.indirectAttainment / 3);
            countMapped++;
          }
        });

        if (countMapped > 0) {
          const poDirect = Number((sumDirect / countMapped).toFixed(2));
          const poIndirect = Number((sumIndirect / countMapped).toFixed(2));
          const poAtt = Number((directWeight * poDirect + indirectWeight * poIndirect).toFixed(2));

          newPoAttainments.push({
            poNumber: po,
            attainment: poAtt,
            directAttainment: poDirect,
            indirectAttainment: poIndirect
          });
        }
      }
    }

    return {
      coAttainments: newCoAttainments,
      poAttainments: newPoAttainments
    };
  };

  const currentDynamicData = getRecalculatedData() || results;

  // Handle Course End Survey Input changes
  const handleCesChange = (coNumber, ratingField, value) => {
    const valNum = Math.max(0, parseInt(value) || 0);
    const updatedCes = {
      ...cesCounts,
      [coNumber]: {
        ...cesCounts[coNumber],
        [ratingField]: valNum
      }
    };
    setCesCounts(updatedCes);

    // Dynamic Level Calculation
    const counts = updatedCes[coNumber];
    const totalCount = results?.studentCount || 100;
    const weightedSum = (counts.rating1 * 0.3) + (counts.rating2 * 0.5) + (counts.rating3 * 1.0);
    const percentage = totalCount > 0 ? (weightedSum / totalCount) * 100 : 0;
    
    let indirectLevel = 1;
    if (percentage < 40) indirectLevel = 0;
    else if (percentage >= 60) indirectLevel = 3;
    else if (percentage >= 50) indirectLevel = 2;

    setManualIndirect(prev => ({
      ...prev,
      [coNumber]: indirectLevel
    }));
  };

  // Export fully compiled Excel Report
  const handleExport = async () => {
    if (!iaFile || !seeFile || !results || !selectedSubject) {
      toast.error("Required data missing for export");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Generating Final Excel Report...");

      const formData = new FormData();
      formData.append("iaFile", iaFile);
      formData.append("seeFile", seeFile);
      formData.append("subjectId", selectedSubject);
      formData.append("academicYear", academicYear);
      formData.append("facultyName", facultyName);
      formData.append("branch", selectedBranch);
      formData.append("semester", selectedSemester);
      
      // Send the recalculated results
      formData.append("results", JSON.stringify(currentDynamicData));
      
      // Send all the UI inputs
      formData.append("uiData", JSON.stringify({
        cesCounts,
        manualIndirect,
        actionPlan,
        caym1Actions,
        poActionPlan
      }));

      const response = await axios.post(
        `${baseApiURL()}/obe/template/final-copo/export`,
        formData,
        {
          responseType: 'blob',
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Final_COPO_Report_${selectedSubjectData?.code || 'Results'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success("Final report generated and DB updated successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Export error:", error);
      toast.error("Failed to generate Excel report.");
    } finally {
      setLoading(false);
    }
  };

  // Helper mapping for PO names
  const poKeywords = {
    PO1: "Apply Knowledge",
    PO2: "Solve Problems",
    PO3: "Design/ Development of Solution",
    PO4: "Conduct Investigations",
    PO5: "Use Modern Tools",
    PO6: "Engineer and Society",
    PO7: "Environment and Sustainability",
    PO8: "Professional Ethics",
    PO9: "Individual and Team Work",
    PO10: "Communicate Effectively",
    PO11: "Project Management and Finance",
    PO12: "Life-long Learning",
    PSO1: "PSO 1",
    PSO2: "PSO 2",
    PSO3: "PSO 3"
  };

  return (
    <div className="w-full mx-auto flex justify-center items-start flex-col my-10 px-4">
      <Heading title="Simplified CO-PO Attainment & Interactive Planner" />

      {/* STEP 1: Select Details */}
      <div className="bg-white rounded-xl shadow-md p-8 w-full mt-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FiSettings className="text-blue-500" /> Step 1: Mappings & Selection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="e.g. 2024-2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">-- Select Branch --</option>
              {branches.map((b) => (
                <option key={b._id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">-- Select Semester --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedBranch || !selectedSemester}
            >
              <option value="">-- Select Subject --</option>
              {filteredSubjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              placeholder="e.g. Dr. Kiran B. Malagi"
            />
          </div>
        </div>

        {/* STEP 2: Configure Questions */}
        <div className="border-t border-gray-100 pt-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Step 2: Mapped Exam Configuration</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* IA Config */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">IA Questions</h3>
                <button
                  onClick={() => addQuestion("IA")}
                  className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors font-medium"
                >
                  <FiPlus /> Add Row
                </button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {iaQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-1/3">
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Q. No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 1a"
                        value={q.qName}
                        onChange={(e) => handleQuestionChange("IA", idx, "qName", e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">CO Mapped</label>
                      <select
                        value={q.co}
                        onChange={(e) => handleQuestionChange("IA", idx, "co", e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select CO</option>
                        {subjectCOs.map((coItem) => (
                          <option key={coItem.coNumber} value={coItem.coNumber}>
                            {coItem.coNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Max Marks</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={q.maxMarks}
                        onChange={(e) => handleQuestionChange("IA", idx, "maxMarks", Number(e.target.value))}
                        className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion("IA", idx)}
                      className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SEE Config */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">SEE Questions</h3>
                <button
                  onClick={() => addQuestion("SEE")}
                  className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors font-medium"
                >
                  <FiPlus /> Add Row
                </button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {seeQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-1/3">
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Q. No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 1a"
                        value={q.qName}
                        onChange={(e) => handleQuestionChange("SEE", idx, "qName", e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">CO Mapped</label>
                      <select
                        value={q.co}
                        onChange={(e) => handleQuestionChange("SEE", idx, "co", e.target.value)}
                        className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select CO</option>
                        {subjectCOs.map((coItem) => (
                          <option key={coItem.coNumber} value={coItem.coNumber}>
                            {coItem.coNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Max Marks</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={q.maxMarks}
                        onChange={(e) => handleQuestionChange("SEE", idx, "maxMarks", Number(e.target.value))}
                        className="w-full text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion("SEE", idx)}
                      className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiPlus className="text-blue-600" /> Assignment / CIA Configuration
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">Configure continuous internal assessments (CIA1-CIA7)</p>
                <button
                  onClick={() => addQuestion("Assignment")}
                  className="flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors font-medium"
                >
                  <FiPlus /> Add CIA
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[250px] overflow-y-auto pr-2">
                {assignmentQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="CIA Name"
                        value={q.qName}
                        onChange={(e) => handleQuestionChange("Assignment", idx, "qName", e.target.value)}
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 mt-1">
                        <select
                          value={q.co}
                          onChange={(e) => handleQuestionChange("Assignment", idx, "co", e.target.value)}
                          className="w-1/2 text-[10px] px-1 py-1 border border-gray-300 rounded"
                        >
                          <option value="">CO</option>
                          {subjectCOs.map((coItem) => (
                            <option key={coItem.coNumber} value={coItem.coNumber}>{coItem.coNumber}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Max"
                          value={q.maxMarks}
                          onChange={(e) => handleQuestionChange("Assignment", idx, "maxMarks", Number(e.target.value))}
                          className="w-1/2 text-[10px] px-1 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    <button onClick={() => removeQuestion("Assignment", idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: Download Split Templates */}
        <div className="flex flex-wrap gap-4 justify-between border-b pb-8">
          <div>
            <h3 className="font-bold text-gray-800">Download Simplified Excel Templates</h3>
            <p className="text-xs text-gray-500">Fill IA and SEE marks separately with student names pre-populated.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleDownloadTemplate("ia")}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2 border border-blue-200 transition-colors"
            >
              <FiDownload /> Download IA Marks Template
            </button>
            <button
              onClick={() => handleDownloadTemplate("see")}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-2 border border-emerald-200 transition-colors"
            >
              <FiDownload /> Download SEE Marks Template
            </button>
          </div>
        </div>

        {/* STEP 4: Upload Marks and Calculate */}
        <div className="pt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiUpload className="text-green-600" /> Step 3: Upload filled Marks sheets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">IA Marks Filled File</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setIaFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-lg cursor-pointer"
              />
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-semibold text-gray-700 mb-2">SEE Marks Filled File</label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setSeeFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleFileUpload}
              disabled={loading || !iaFile || !seeFile}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-md flex items-center gap-2"
            >
              <FiCheckCircle /> Calculate Direct Attainment
            </button>
          </div>
        </div>
      </div>

      {/* STEP 5: Interactive Calculation & Data Tabs */}
      {results && currentDynamicData && (
        <div className="w-full mt-10 space-y-8">
          
          {/* TAB NAVIGATION */}
          <div className="flex flex-wrap border-b border-gray-200 bg-white p-2 rounded-t-xl gap-2 shadow-sm">
            {[
              { id: "survey", label: "Course End Survey (CES)" },
              { id: "co", label: "CO Attainment Summary" },
              { id: "po", label: "PO Attainment & Charts" },
              { id: "actionPlan", label: "CO Action Plan" },
              { id: "poActionPlan", label: "PO Action Plan" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-xl shadow-md p-6 border border-gray-100 min-h-[400px]">
            
            {/* TAB 1: COURSE END SURVEY */}
            {activeTab === "survey" && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Course End Survey (CES) Inputs</h3>
                <p className="text-xs text-gray-500 mb-6">
                  Provide student counts for each rating level. Class strength is tracked as <span className="font-bold text-blue-600">{results.studentCount} students</span>.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-blue-50 text-blue-800 border-b border-blue-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Course Outcome</th>
                        <th className="px-6 py-3 font-semibold text-center">Rating 1: Some Ability</th>
                        <th className="px-6 py-3 font-semibold text-center">Rating 2: Adequate</th>
                        <th className="px-6 py-3 font-semibold text-center">Rating 3: More than Adequate</th>
                        <th className="px-6 py-3 font-semibold text-center">Total Responses</th>
                        <th className="px-6 py-3 font-semibold text-center">CES Weighted %</th>
                        <th className="px-6 py-3 font-semibold text-center text-blue-700">Calculated Indirect Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subjectCOs.map(co => {
                        const counts = cesCounts[co.coNumber] || { rating1: 0, rating2: 0, rating3: 0 };
                        const totalRes = counts.rating1 + counts.rating2 + counts.rating3;
                        const wSum = (counts.rating1 * 0.3) + (counts.rating2 * 0.5) + (counts.rating3 * 1.0);
                        const perc = results.studentCount > 0 ? ((wSum / results.studentCount) * 100).toFixed(2) : 0;
                        const indLevel = manualIndirect[co.coNumber] || 0;

                        return (
                          <tr key={co.coNumber} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-semibold text-gray-900">{co.coNumber}</td>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="number"
                                value={counts.rating1}
                                onChange={(e) => handleCesChange(co.coNumber, "rating1", e.target.value)}
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="number"
                                value={counts.rating2}
                                onChange={(e) => handleCesChange(co.coNumber, "rating2", e.target.value)}
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="number"
                                value={counts.rating3}
                                onChange={(e) => handleCesChange(co.coNumber, "rating3", e.target.value)}
                                className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-center font-medium text-gray-700">{totalRes}</td>
                            <td className="px-6 py-4 text-center font-medium text-gray-700">{perc}%</td>
                            <td className="px-6 py-4 text-center font-bold text-blue-700 text-lg">
                              {indLevel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: CO ATTAINMENT */}
            {activeTab === "co" && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Final CO Attainment Summary</h3>
                <p className="text-xs text-gray-500 mb-6">
                  Direct Attainment is computed from uploads. Modify the **Indirect Attainment** level below if you need manual overrides; Overall CO and PO values update live.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-700 border-b">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Course Outcome</th>
                        <th className="px-6 py-3 font-semibold text-center">IA Level</th>
                        <th className="px-6 py-3 font-semibold text-center">Assignment Level</th>
                        <th className="px-6 py-3 font-semibold text-center">SEE Level</th>
                        <th className="px-6 py-3 font-semibold text-center">Direct Attainment (80%)</th>
                        <th className="px-6 py-3 font-semibold text-center text-orange-600">Indirect Attainment (20%) [Editable]</th>
                        <th className="px-6 py-3 font-bold text-blue-700 text-right">Overall CO Attainment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentDynamicData.coAttainments.map((co) => (
                        <tr key={co.coNumber} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-gray-900">{co.coNumber}</td>
                          <td className="px-6 py-4 text-center">{co.iaLevel}</td>
                          <td className="px-6 py-4 text-center text-purple-600 font-medium">{co.assignmentLevel || 0}</td>
                          <td className="px-6 py-4 text-center">{co.seeLevel}</td>
                          <td className="px-6 py-4 text-center font-medium">{co.directAttainment}</td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="3"
                              step="0.1"
                              value={manualIndirect[co.coNumber] ?? co.indirectAttainment}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setManualIndirect(prev => ({
                                  ...prev,
                                  [co.coNumber]: isNaN(val) ? "" : val
                                }));
                              }}
                              className="w-24 px-2 py-1 text-center font-bold text-orange-700 border border-orange-200 bg-orange-50 rounded focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="px-6 py-4 font-bold text-blue-700 text-right text-lg">{co.overallAttainment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: PO ATTAINMENT */}
            {activeTab === "po" && (
              <div>
                <h3 className="text-xl font-bold text-purple-800 mb-6">PO/PSO Attainment Summary</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-purple-50 text-purple-800 border-b border-purple-200">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Program Outcome</th>
                          <th className="px-6 py-3 font-semibold text-center">Direct Attainment</th>
                          <th className="px-6 py-3 font-semibold text-center">Indirect Attainment</th>
                          <th className="px-6 py-3 font-bold text-right text-purple-900">Total Attainment (Max 3.0)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {currentDynamicData.poAttainments.map((po) => (
                          <tr key={po.poNumber} className="hover:bg-purple-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              <span className="font-bold">{po.poNumber}:</span> {poKeywords[po.poNumber] || ""}
                            </td>
                            <td className="px-6 py-4 text-center text-blue-600 font-medium">{po.directAttainment || "-"}</td>
                            <td className="px-6 py-4 text-center text-orange-600 font-medium">{po.indirectAttainment || "-"}</td>
                            <td className="px-6 py-4 font-bold text-purple-700 text-right text-lg">{po.attainment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* PO Attainment Chart */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[400px] flex flex-col justify-between">
                    <h4 className="text-md font-bold text-gray-800 text-center mb-4">Attainment Chart</h4>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={currentDynamicData.poAttainments} margin={{ bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="poNumber" angle={-45} textAnchor="end" interval={0} height={50} />
                          <YAxis domain={[0, 3]} ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} />
                          <Tooltip />
                          <Legend verticalAlign="top" height={36}/>
                          <Bar name="Direct" dataKey="directAttainment" fill="#5B9BD5" radius={[2, 2, 0, 0]} />
                          <Bar name="Indirect" dataKey="indirectAttainment" fill="#ED7D31" radius={[2, 2, 0, 0]} />
                          <Bar name="Overall Attainment" dataKey="attainment" fill="#4472C4" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACTION PLAN */}
            {activeTab === "actionPlan" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Observations and Action Plan (Direct)</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-700 border-b">
                        <tr>
                          <th className="px-6 py-3 font-semibold w-1/12">Course Outcome</th>
                          <th className="px-6 py-3 font-semibold text-center w-2/12">Target [Set Manually]</th>
                          <th className="px-6 py-3 font-semibold text-center w-2/12">Attainment</th>
                          <th className="px-6 py-3 font-semibold text-center w-2/12">Gap</th>
                          <th className="px-6 py-3 font-semibold w-3/12">Observation</th>
                          <th className="px-6 py-3 font-semibold w-3/12">Action Proposed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentDynamicData.coAttainments.map(co => {
                          const plan = actionPlan[co.coNumber] || { target: 2.5, observation: "", action: "" };
                          const gap = Number((plan.target - co.overallAttainment).toFixed(2));

                          return (
                            <tr key={co.coNumber} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-semibold text-gray-900">{co.coNumber}</td>
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={plan.target}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setActionPlan(prev => ({
                                      ...prev,
                                      [co.coNumber]: {
                                        ...prev[co.coNumber],
                                        target: isNaN(val) ? "" : val
                                      }
                                    }));
                                  }}
                                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 text-center font-medium text-gray-700">{co.overallAttainment}</td>
                              <td className="px-6 py-4 text-center font-bold text-red-600">{gap > 0 ? gap : 0}</td>
                              <td className="px-6 py-4">
                                <textarea
                                  value={plan.observation}
                                  onChange={(e) => setActionPlan(prev => ({
                                    ...prev,
                                    [co.coNumber]: {
                                      ...prev[co.coNumber],
                                      observation: e.target.value
                                    }
                                  }))}
                                  placeholder="Observations..."
                                  rows="2"
                                  className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <textarea
                                  value={plan.action}
                                  onChange={(e) => setActionPlan(prev => ({
                                    ...prev,
                                    [co.coNumber]: {
                                      ...prev[co.coNumber],
                                      action: e.target.value
                                    }
                                  }))}
                                  placeholder="Action plan proposed..."
                                  rows="2"
                                  className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Secondary Table: Outcomes on Actions for CAYm1 Observations/Suggestions */}
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Outcomes on Actions for CAYm1 Observations/Suggestions</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-700 border-b">
                        <tr>
                          <th className="px-6 py-3 font-semibold w-1/12 text-center">SI. No.</th>
                          <th className="px-6 py-3 font-semibold w-5/12">Action Taken</th>
                          <th className="px-6 py-3 font-semibold w-6/12">Change Observed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {caym1Actions.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-center font-bold text-gray-500">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={item.action}
                                onChange={(e) => {
                                  const updated = [...caym1Actions];
                                  updated[idx].action = e.target.value;
                                  setCaym1Actions(updated);
                                }}
                                placeholder={`Action ${idx + 1}`}
                                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={item.change}
                                onChange={(e) => {
                                  const updated = [...caym1Actions];
                                  updated[idx].change = e.target.value;
                                  setCaym1Actions(updated);
                                }}
                                placeholder="Change observed..."
                                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PO ATTAINMENT ACTION PLAN */}
            {activeTab === "poActionPlan" && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Observations and Action Plan (POs & PSOs)</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-700 border-b">
                      <tr>
                        <th className="px-6 py-3 font-semibold w-2/12">Program Outcome</th>
                        <th className="px-6 py-3 font-semibold text-center w-2/12">Attained</th>
                        <th className="px-6 py-3 font-semibold text-center w-2/12">Target (Avg Map Strength)</th>
                        <th className="px-6 py-3 font-semibold w-6/12">Action Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentDynamicData.poAttainments.map((po) => {
                        // Target is calculated as average mapping strength for that PO/PSO
                        const maps = results.coPoMappings.filter(m => m.poNumber === po.poNumber);
                        const targetVal = maps.length > 0
                          ? Number((maps.reduce((s, m) => s + m.strength, 0) / maps.length).toFixed(2))
                          : 0;

                        return (
                          <tr key={po.poNumber} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              <span className="font-bold">{po.poNumber}:</span> {poKeywords[po.poNumber] || ""}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-purple-700 text-lg">{po.attainment}</td>
                            <td className="px-6 py-4 text-center font-medium text-gray-500">{targetVal}</td>
                            <td className="px-6 py-4">
                              <textarea
                                value={poActionPlan[po.poNumber] || ""}
                                onChange={(e) => setPoActionPlan(prev => ({
                                  ...prev,
                                  [po.poNumber]: e.target.value
                                }))}
                                placeholder={`Action plan details for ${po.poNumber}...`}
                                rows="2"
                                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* FINAL EXPORT REPORT BUTTON */}
          <div className="flex justify-center mt-10 mb-20 bg-blue-50 p-6 rounded-xl border border-blue-200">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-blue-900">Compile Calculations & Download Final Report</h3>
              <p className="text-xs text-blue-700 max-w-lg mx-auto">
                This will save the final calculated Overall CO and PO Attainments into the Subject Database, compile all tabs (CES survey counts, Observations, Action Plans) into the base multi-sheet Excel file containing analysis graphs, and prompt for download.
              </p>
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center gap-2 transform hover:-translate-y-1 mx-auto"
              >
                <FiBarChart2 className="text-xl" /> {loading ? "Generating Report..." : "Download Final CO-PO Excel Report"}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default FinalCOPOAttainment;

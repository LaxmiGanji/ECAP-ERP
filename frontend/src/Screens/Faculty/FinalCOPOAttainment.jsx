import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { baseApiURL } from "../../baseUrl";
import Heading from "../../components/Heading";
import { FiPlus, FiTrash2, FiBarChart2 } from "react-icons/fi";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

const FinalCOPOAttainment = () => {
  useEffect(() => {
    console.log("FinalCOPOAttainment Component Loaded - New Version");
  }, []);
  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  
  const userData = useSelector((state) => state.userData);
  const facultyName = userData?.fullname || "";

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const [iaQuestions, setIaQuestions] = useState([{ qName: "1a", co: "CO1", maxMarks: 5 }]);
  const [seeQuestions, setSeeQuestions] = useState([{ qName: "1a", co: "CO1", maxMarks: 10 }]);
  const [assignmentQuestions, setAssignmentQuestions] = useState([
    { qName: "CIA1", co: "CO1", maxMarks: 10 },
    { qName: "CIA2", co: "CO2", maxMarks: 10 }
  ]);

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

  const handleDownloadTemplate = async () => {
    if (!selectedBranch || !selectedSemester || !selectedSubject) {
      toast.error("Please select Branch, Semester, and Subject");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Generating template with student data...");
      
      // Determine actual branch name or ID needed by backend
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
        assignmentQuestions: assignmentQuestions
      };

      const response = await axios.post(`${baseApiURL()}/obe/template/final-copo/template`, payload, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Final_COPO_Template_${branchVal}_Sem${selectedSemester}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success("Template downloaded successfully! Please fill and upload.");
    } catch (error) {
      toast.dismiss();
      console.error("Error downloading template:", error);
      toast.error("Failed to generate template. Ensure students exist for this branch/semester.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select an Excel file to upload");
      return;
    }
    if (!selectedSubject) {
      toast.error("Please select a Subject");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", selectedSubject);

    try {
      setLoading(true);
      toast.loading("Calculating CO-PO Attainment...");

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
        setResults(response.data.results);
        console.log("Calculated Results:", response.data.results);
      } else {
        toast.dismiss();
        toast.error(response.data.message || "Failed to calculate");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!file || !results || !selectedSubject) {
      toast.error("Required data missing for export");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Generating Final Excel Report...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", selectedSubject);
      formData.append("results", JSON.stringify(results));

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
      toast.success("Final report generated successfully!");
    } catch (error) {
      toast.dismiss();
      console.error("Export error:", error);
      toast.error("Failed to generate Excel report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto flex justify-center items-start flex-col my-10 px-4">
      <Heading title="Final CO-PO Attainment Calculation (Updated)" />

      <div className="bg-white rounded-xl shadow-md p-8 w-full mt-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Step 1: Select Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>

        <div className="border-t border-gray-100 pt-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Step 2: Configure Questions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* IA Questions Config */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {iaQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Q. No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 1a"
                        value={q.qName}
                        onChange={(e) => handleQuestionChange("IA", idx, "qName", e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">CO Mapped</label>
                      <select
                        value={q.co}
                        onChange={(e) => handleQuestionChange("IA", idx, "co", e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={q.maxMarks}
                        onChange={(e) => handleQuestionChange("IA", idx, "maxMarks", Number(e.target.value))}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
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

            {/* SEE Questions Config */}
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {seeQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Q. No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 1a"
                        value={q.qName}
                        onChange={(e) => handleQuestionChange("SEE", idx, "qName", e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="w-1/3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">CO Mapped</label>
                      <select
                        value={q.co}
                        onChange={(e) => handleQuestionChange("SEE", idx, "co", e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        value={q.maxMarks}
                        onChange={(e) => handleQuestionChange("SEE", idx, "maxMarks", Number(e.target.value))}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
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
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {assignmentQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="CIA Name"
                        value={q.qName}
                        onChange={(e) => handleQuestionChange("Assignment", idx, "qName", e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
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

        <div className="flex justify-end border-b pb-8">
          <button
            onClick={handleDownloadTemplate}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
          >
            Download Pre-filled Template
          </button>
        </div>

        <div className="pt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Step 3: Upload Final Excel</h2>
          <p className="text-gray-600 mb-4 text-sm">
            Fill out the IA Marks, SEE Marks, and Course End Survey (CES) sheets in the downloaded template and upload it back here to automatically calculate and save the Final CO and PO attainments.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full md:w-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg cursor-pointer"
            />
            <button
              onClick={handleFileUpload}
              disabled={loading || !file}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-sm whitespace-nowrap"
            >
              Calculate & Generate Charts
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="w-full mt-10 space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Final CO Attainment Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Course Outcome</th>
                    <th className="px-6 py-3 font-semibold">IA Level</th>
                    <th className="px-6 py-3 font-semibold">Assignment Level</th>
                    <th className="px-6 py-3 font-semibold">SEE Level</th>
                    <th className="px-6 py-3 font-semibold">Direct Attainment (80%)</th>
                    <th className="px-6 py-3 font-semibold">Indirect Attainment (20%)</th>
                    <th className="px-6 py-3 font-semibold text-blue-700">Overall CO Attainment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.coAttainments.map((co) => (
                    <tr key={co.coNumber} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{co.coNumber}</td>
                      <td className="px-6 py-4 text-center">{co.iaLevel}</td>
                      <td className="px-6 py-4 text-center text-purple-600 font-medium">{co.assignmentLevel || 0}</td>
                      <td className="px-6 py-4 text-center">{co.seeLevel}</td>
                      <td className="px-6 py-4 text-center">{co.directAttainment}</td>
                      <td className="px-6 py-4 text-center">{co.indirectAttainment}</td>
                      <td className="px-6 py-4 font-bold text-blue-700 text-right">{co.overallAttainment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-purple-800 mb-4 border-b border-purple-100 pb-2">PO Attainment Summary</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-purple-50 text-purple-700">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Program Outcome</th>
                    <th className="px-6 py-3 font-semibold text-center">Direct Attainment</th>
                    <th className="px-6 py-3 font-semibold text-center">Indirect Attainment</th>
                    <th className="px-6 py-3 font-semibold text-right text-purple-900">Total Attainment (Max 3.0)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {results.poAttainments.map((po) => (
                    <tr key={po.poNumber} className="hover:bg-purple-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{po.poNumber}</td>
                      <td className="px-6 py-4 text-center text-blue-600 font-medium">{po.directAttainment || "-"}</td>
                      <td className="px-6 py-4 text-center text-orange-600 font-medium">{po.indirectAttainment || "-"}</td>
                      <td className="px-6 py-4 font-bold text-purple-700 text-right">{po.attainment}</td>
                    </tr>
                  ))}
                  {results.poAttainments.length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                        No PO mappings found for this subject. Configure mappings in the Admin module.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Charts Section */}
          <div key={results.coAttainments.length + results.poAttainments.length} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            {/* Direct Attainment Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">Total Attainment Direct</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.coAttainments}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="coNumber" label={{ value: 'COs', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 4]} ticks={[0, 2, 4]} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="directAttainment" radius={[4, 4, 0, 0]}>
                      {results.coAttainments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#5B9BD5', '#ED7D31', '#A5A5A5', '#FFC000', '#4472C4', '#70AD47'][index % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Indirect Attainment Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">CO Attainment Indirect</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.coAttainments}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="coNumber" label={{ value: 'COs', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="indirectAttainment" fill="#4472C4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overall CO Attainment Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">CO Attainment Total</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.coAttainments}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="coNumber" label={{ value: 'COs', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="overallAttainment" fill="#4472C4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* PO Attainment Chart */}
          <div className="bg-white rounded-xl shadow-md p-8 mt-8 border border-gray-100 min-h-[500px]">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-2">
              <FiBarChart2 className="text-blue-600" /> PO Attainment Chart
            </h3>
            <div className="h-[400px] w-full" style={{ minHeight: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results.poAttainments} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="poNumber" angle={-45} textAnchor="end" interval={0} height={60} />
                  <YAxis domain={[0, 3]} ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3]} label={{ value: 'Attainment Level', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar name="Attainment" dataKey="attainment" fill="#4472C4" radius={[2, 2, 0, 0]} hide={results.poAttainments[0]?.directAttainment !== undefined} />
                  <Bar name="Direct Attainment" dataKey="directAttainment" fill="#5B9BD5" radius={[2, 2, 0, 0]} />
                  <Bar name="Indirect Attainment" dataKey="indirectAttainment" fill="#ED7D31" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Final Export Button at the Bottom */}
          <div className="flex justify-center mt-10 mb-20">
            <button
              onClick={handleExport}
              disabled={loading}
              className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center gap-2 transform hover:-translate-y-1"
            >
              <FiBarChart2 /> {loading ? "Generating Report..." : "Download Final CO-PO Excel Report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalCOPOAttainment;

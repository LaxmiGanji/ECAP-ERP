import axios from "axios";
import { useEffect, useState } from "react";
import Heading from "../../components/Heading";
import { IoMdLink } from "react-icons/io";
import { HiOutlineCalendar, HiOutlineSearch, HiSparkles } from "react-icons/hi";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { useLocation } from "react-router-dom";

const Material = () => {
  const router = useLocation();
  const [studentInfo, setStudentInfo] = useState({
    branch: "",
    semester: "",
    regulation: "",
  });
  const [subject, setSubject] = useState([]);
  const [selected, setSelected] = useState("all");
  const [material, setMaterial] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Logged-in Student Details & Initial Curriculum Materials
  useEffect(() => {
    const fetchStudentAndMaterials = async () => {
      try {
        setLoading(true);
        const loginId = router.state?.loginid || localStorage.getItem("enrollmentNo") || "";

        let currentStudent = null;

        if (loginId) {
          try {
            const detailRes = await axios.post(
              `${baseApiURL()}/student/details/getDetails`,
              { enrollmentNo: loginId },
              { headers: { "Content-Type": "application/json" } }
            );
            if (detailRes.data.success && detailRes.data.user && detailRes.data.user[0]) {
              currentStudent = detailRes.data.user[0];
              setStudentInfo({
                branch: currentStudent.branch || "",
                semester: currentStudent.semester || "",
                regulation: currentStudent.regulation || "R20",
              });
            }
          } catch (dErr) {
            console.warn("Could not fetch student details directly:", dErr.message);
          }
        }

        // Fetch subjects
        try {
          const subRes = await axios.get(`${baseApiURL()}/subject/getSubject`);
          if (subRes.data.success) {
            setSubject(subRes.data.subject);
          }
        } catch (sErr) {}

        // Fetch curriculum materials for student's Branch, Semester & Regulation
        const queryBody = {};
        if (currentStudent) {
          if (currentStudent.branch) queryBody.branch = currentStudent.branch;
          if (currentStudent.semester) queryBody.semester = currentStudent.semester;
          if (currentStudent.regulation) queryBody.regulation = currentStudent.regulation;
        }

        const matRes = await axios.post(
          `${baseApiURL()}/material/getMaterial`,
          queryBody,
          { headers: { "Content-Type": "application/json" } }
        );

        if (matRes.data.success && matRes.data.material) {
          setMaterial(matRes.data.material);
        }
      } catch (err) {
        console.error("Error loading curriculum materials:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndMaterials();
  }, [router.state]);

  // 2. Get materials for selected subject or filter
  const handleSubjectFilter = (subName) => {
    setSelected(subName);
    toast.loading(`Filtering materials for ${subName === "all" ? "Curriculum" : subName}...`);

    const queryBody = {};
    if (studentInfo.branch) queryBody.branch = studentInfo.branch;
    if (studentInfo.semester) queryBody.semester = studentInfo.semester;
    if (studentInfo.regulation) queryBody.regulation = studentInfo.regulation;

    if (subName !== "all") {
      queryBody.subject = subName;
    }

    axios
      .post(`${baseApiURL()}/material/getMaterial`, queryBody, {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          setMaterial(response.data.material || []);
          toast.success(`Found ${response.data.material?.length || 0} materials`);
        } else {
          setMaterial([]);
          toast.error(response.data.message || "No materials found");
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Error loading materials:", error);
        toast.error("Failed to load materials");
      });
  };

  const onSelectChangeHandler = (e) => {
    const val = e.target.value;
    handleSubjectFilter(val);
  };

  // Enhanced download handler - fetches blob to guarantee proper file download with extension
  const handleDownload = async (item) => {
    if (!item || !item.link) {
      toast.error("No file link available");
      return;
    }

    const url = item.link;
    const toastId = toast.loading("Downloading material PDF...");

    try {
      if (!url.includes("cloudinary.com") && !url.includes("amazonaws.com")) {
        toast.dismiss(toastId);
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      
      let extension = ".pdf";
      const contentType = response.headers.get("content-type") || blob.type;
      
      if (contentType.includes("image/jpeg")) extension = ".jpg";
      else if (contentType.includes("image/png")) extension = ".png";
      else if (contentType.includes("spreadsheet") || contentType.includes("excel")) extension = ".xlsx";
      else if (contentType.includes("word") || contentType.includes("document")) extension = ".docx";
      else if (url.endsWith(".pdf") || url.includes(".pdf")) extension = ".pdf";

      let fileName = item.title || "Study_Material";
      if (!fileName.toLowerCase().endsWith(extension)) {
        fileName += extension;
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.dismiss(toastId);
      toast.success(`Downloaded: ${fileName}`);
    } catch (err) {
      toast.dismiss(toastId);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recent";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (error) {
      return "Recent";
    }
  };

  return (
    <div className="w-full mx-auto mt-6 flex justify-center items-start flex-col mb-10 px-4 md:px-8">
      <Heading title="Study Materials & Notes" />

      {/* Curriculum Filter Info Banner */}
      <div className="w-full mt-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-cyan-950 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <HiSparkles className="w-4 h-4 text-cyan-300 animate-pulse" /> Automatically Filtered for Your Curriculum
          </span>
          <h2 className="text-lg font-bold mt-1 text-slate-100">
            {studentInfo.branch ? `Branch: ${studentInfo.branch}` : "All Branches"}{" "}
            {studentInfo.semester && `| Semester ${studentInfo.semester}`}{" "}
            {studentInfo.regulation && `| Regulation ${studentInfo.regulation}`}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Materials uploaded by faculty strictly matching your current Branch, Semester & Regulation are displayed below.
          </p>
        </div>

        {/* AI Assistant Callout */}
        <div className="w-full md:w-auto bg-indigo-950/80 p-3 rounded-xl border border-indigo-500/30 text-right flex flex-col items-end">
          <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
            💡 Want materials from other subjects or semesters?
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5">
            Ask the **ECAP AI Assistant** in the right panel to search any database notes!
          </span>
        </div>
      </div>

      <div className="mt-6 w-full flex justify-center items-center flex-col">
        {/* Subject Selection */}
        <div className="flex justify-center items-center w-full md:w-[50%] gap-2">
          <select
            value={selected}
            name="subject"
            id="subject"
            onChange={onSelectChangeHandler}
            className="px-4 bg-slate-900 text-slate-100 border border-slate-700 py-3 rounded-xl text-sm focus:outline-none focus:border-indigo-500 flex-grow shadow-inner"
          >
            <option value="all">-- All Subjects ({studentInfo.branch} Sem {studentInfo.semester}) --</option>
            {subject &&
              subject.map((item) => (
                <option value={item.name} key={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          <button
            onClick={() => handleSubjectFilter(selected)}
            className="py-3 px-5 text-xl rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
          >
            <HiOutlineSearch />
          </button>
        </div>

        {/* Materials List */}
        <div className="mt-8 w-full">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Fetching curriculum materials...</p>
            </div>
          ) : material && material.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {material.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg relative transition-all hover:shadow-indigo-500/10 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold bg-indigo-950 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-800">
                        {item.branch || studentInfo.branch || "General"} | Sem {item.semester || studentInfo.semester || 1}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <HiOutlineCalendar /> {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* Material Title */}
                    <h3
                      className={`text-base font-semibold text-slate-100 flex items-center gap-1.5 ${
                        item.link ? "cursor-pointer hover:text-cyan-400 transition" : ""
                      }`}
                      onClick={() => item.link && handleDownload(item)}
                    >
                      {item.title}
                      {item.link && <IoMdLink className="text-cyan-400 text-lg flex-shrink-0" />}
                    </h3>

                    <p className="text-xs text-slate-400 mt-1">
                      Subject: <span className="text-slate-200 font-medium">{item.subject}</span> | Faculty: <span className="text-slate-200 font-medium">{item.faculty}</span>
                    </p>
                  </div>

                  {/* Download Button */}
                  {item.link && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">PDF Attachment</span>
                      <button
                        onClick={() => handleDownload(item)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow transition"
                      >
                        📄 Download PDF
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 px-6">
              <p className="text-base text-slate-300 font-semibold">No materials found for current selection</p>
              <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                If your faculty hasn't uploaded notes for this specific subject yet, simply ask the **ECAP AI Assistant** in the side panel to search all database materials!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Material;
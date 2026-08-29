import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { setUserData } from "../../redux/actions";
import { getFileUrl } from "../../utils/fileUrl";

const ViewCertification = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true); // Start loading
        const headers = {
          "Content-Type": "application/json",
        };
        const response = await axios.post(
          `${baseApiURL()}/${router.state.type}/details/getDetails`,
          { enrollmentNo: router.state.loginid },
          { headers }
        );
        if (response.data.success) {
          const userData = response.data.user[0];
          setStudent(userData);

          // Dispatch user data to Redux if needed
          dispatch(
            setUserData({
              fullname: `${userData.firstName} ${userData.middleName} ${userData.lastName}`,
              semester: userData.semester,
              enrollmentNo: userData.enrollmentNo,
              branch: userData.branch,
            })
          );
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching student details.");
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchStudentData();
  }, [dispatch, router.state.loginid, router.state.type]);

  // Download / View certificate handler with blob support
  const handleDownloadCertificate = async (cert) => {
    const fileUrl = getFileUrl(cert);
    if (!fileUrl) return;

    const toastId = toast.loading("Opening certificate...");

    try {
      if (!fileUrl.includes('cloudinary.com') && !fileUrl.includes('amazonaws.com')) {
        toast.dismiss(toastId);
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch certificate");

      const blob = await response.blob();
      let extension = ".pdf";
      const contentType = response.headers.get("content-type") || blob.type;

      if (contentType.includes("image/jpeg")) extension = ".jpg";
      else if (contentType.includes("image/png")) extension = ".png";
      else if (fileUrl.endsWith(".pdf") || fileUrl.includes(".pdf")) extension = ".pdf";

      let fileName = cert.split('/').pop() || "certificate";
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
      console.error("Certificate download failed, opening directly:", err);
      toast.dismiss(toastId);
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Renders a certification file preview based on file extension
  const renderCertification = (cert, index) => {
    const fileUrl = getFileUrl(cert);
    const lower = cert.toLowerCase();
    const isImage = ["png", "jpg", "jpeg", "gif", "bmp", "webp"].some((ext) => lower.endsWith("." + ext)) || lower.includes("image/upload");
    
    // Extract clean display title
    const rawFileName = cert.split("/").pop() || `Certificate ${index + 1}`;
    const cleanTitle = decodeURIComponent(rawFileName).replace(/_\d+(\.[a-z]+)?$/i, '');

    return (
      <div key={index} className="bento-card bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
        {isImage ? (
          <div className="w-full h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
            <img src={fileUrl} alt={cleanTitle} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        ) : (
          <div className="w-full h-44 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-sm">
              📄
            </div>
            <span className="text-xs font-semibold text-indigo-900 line-clamp-2">{cleanTitle}</span>
            <span className="text-[10px] text-indigo-500 font-mono mt-1">Verified Document</span>
          </div>
        )}

        <div>
          <h4 className="text-xs font-bold text-slate-800 truncate mb-1" title={cleanTitle}>{cleanTitle}</h4>
          <p className="text-[11px] text-slate-500 truncate font-mono">{student?.enrollmentNo || "Student Credentials"}</p>
        </div>

        <button
          onClick={() => handleDownloadCertificate(cert)}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
        >
          <span>View / Download</span>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bento-card bg-white p-6 border border-slate-200/80 rounded-2xl">
        <h2 className="text-base font-bold text-slate-900 border-l-4 border-indigo-600 pl-3 mb-1">
          Uploaded Certifications
        </h2>
        <p className="text-xs text-slate-500 pl-4">Review and download all verified student course & workshop certificates</p>
      </div>

      {student && student.certifications && student.certifications.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {student.certifications.map((cert, idx) => renderCertification(cert, idx))}
        </div>
      ) : (
        <div className="bento-card bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <p className="text-sm font-semibold text-slate-600">No certifications found for this student.</p>
          <p className="text-xs text-slate-400 mt-1">Use the "Add Certification" tab to upload your first certificate!</p>
        </div>
      )}
    </div>
  );
};

export default ViewCertification;


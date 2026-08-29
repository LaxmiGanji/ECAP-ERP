import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { FiUpload } from "react-icons/fi";

const AddCertification = () => {
  const [studentId, setStudentId] = useState("");
  const [certificationTitle, setCertificationTitle] = useState("");
  const [file, setFile] = useState(null);
  const [previewFile, setPreviewFile] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreviewFile(previewUrl);
    } else {
      setPreviewFile("");
    }
  };

  // Submit the certification update
  const addCertification = async (e) => {
    e.preventDefault();

    if (!studentId) {
      toast.error("Please enter the Student ID.");
      return;
    }
    if (!file) {
      toast.error("Please select a certification file to upload.");
      return;
    }

    toast.loading("Adding Certification...");

    const formData = new FormData();
    formData.append("type", "certification");
    formData.append("certificationTitle", certificationTitle);
    // Reusing "profile" as the field name for file upload
    formData.append("profile", file);

    axios
      .put(`${baseApiURL()}/student/details/updateDetails2/${studentId}`, formData)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          // Reset form fields
          setStudentId("");
          setCertificationTitle("");
          setFile(null);
          setPreviewFile("");
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(
          error.response?.data?.message || "Error adding certification."
        );
      });
  };

  return (
    <div className="bento-card p-6 md:p-8 bg-white max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base font-bold text-slate-900 border-l-4 border-indigo-600 pl-3">
          Add New Certification
        </h2>
        <p className="text-xs text-slate-500 mt-1 pl-4">Upload course certificates, workshop credentials or internship completion documents</p>
      </div>

      <form onSubmit={addCertification} className="space-y-4">
        {/* Student ID Field */}
        <div>
          <label htmlFor="studentId" className="block text-xs font-bold text-slate-700 mb-1">
            Student ID / Roll No *
          </label>
          <input
            type="text"
            id="studentId"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium font-mono"
            placeholder="e.g. 22N81A0501"
          />
        </div>

        {/* Certification Title */}
        <div>
          <label htmlFor="certificationTitle" className="block text-xs font-bold text-slate-700 mb-1">
            Certification Title (Optional)
          </label>
          <input
            type="text"
            id="certificationTitle"
            value={certificationTitle}
            onChange={(e) => setCertificationTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
            placeholder="e.g. AWS Certified Cloud Practitioner / Python Masterclass"
          />
        </div>

        {/* Certification File Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Certification File (PDF / Image) *
          </label>
          <div className="relative border-2 border-dashed border-indigo-200 bg-indigo-50/40 rounded-2xl p-6 text-center hover:border-indigo-500 transition-all cursor-pointer">
            <input
              type="file"
              id="certificationFile"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center space-y-2 text-indigo-600">
              <FiUpload className="w-8 h-8 text-indigo-500" />
              {file ? (
                <span className="text-xs font-bold text-indigo-700">{file.name}</span>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-700">Click to browse or drop certificate file</span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {previewFile && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">File Preview:</p>
            <div className="w-40 h-32 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <img src={previewFile} alt="Certificate Preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-200"
          >
            Upload Certification
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCertification;

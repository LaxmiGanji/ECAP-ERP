import axios from "axios";
import { useEffect, useState } from "react";
import { FiUpload, FiEye, FiDownload, FiTrash2 } from "react-icons/fi";
import { HiOutlineCalendar } from "react-icons/hi";
import Heading from "../../components/Heading";
import { AiOutlineClose } from "react-icons/ai";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { baseApiURL } from "../../baseUrl";

const Material = ({ branch: lockedBranch }) => {
  const { fullname } = useSelector((state) => state.userData);
  const [allSubjects, setAllSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [file, setFile] = useState();
  const [selected, setSelected] = useState({
    title: "",
    subject: "",
    branch: lockedBranch || "",
    semester: "",
    faculty: fullname?.split(" ")[0] + " " + fullname?.split(" ")[2] || fullname,
  });
  
  // State for viewing materials
  const [viewMode, setViewMode] = useState("upload"); // "upload" or "view"
  const [materials, setMaterials] = useState([]);
  const [selectedViewSubject, setSelectedViewSubject] = useState("");

  // Load subjects and branches on mount
  useEffect(() => {
    loadSubjects();
    loadBranches();
  }, []);

  // Load materials when filters change in view mode
  useEffect(() => {
    if (viewMode === "view") {
      getFacultyMaterials();
    }
  }, [viewMode, selectedViewSubject]);

  const loadSubjects = () => {
    toast.loading("Loading Subjects...");
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          console.log("Subjects loaded:", response.data.subject);
          setAllSubjects(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.message);
      });
  };

  const loadBranches = () => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((response) => {
        if (response.data.success) {
          console.log("Branches loaded:", response.data.branches);
          setBranches(response.data.branches);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  // Get materials (HODs see all in branch, Faculty see only theirs)
  const getFacultyMaterials = () => {
    let queryParams = new URLSearchParams();
    
    // If lockedBranch exists, we are in HOD mode - show all materials for the branch
    if (lockedBranch) {
      queryParams.append("branch", lockedBranch);
      if (selectedViewSubject) {
        queryParams.append("subject", selectedViewSubject);
      }
      toast.loading("Loading department materials...");
      
      axios
        .get(`${baseApiURL()}/material/getAllMaterials?${queryParams.toString()}`)
        .then((response) => {
          toast.dismiss();
          if (response.data.success) {
            setMaterials(response.data.materials);
            if (response.data.materials.length > 0) {
              toast.success(`Found ${response.data.materials.length} departmental materials`);
            }
          } else {
            toast.error(response.data.message || "No materials found for this department");
            setMaterials([]);
          }
        })
        .catch((error) => {
          toast.dismiss();
          console.error("Error loading department materials:", error);
          toast.error(error.response?.data?.message || "Network error");
          setMaterials([]);
        });
    } else {
      // Original faculty mode - show only their own materials
      const facultyName = selected.faculty;
      queryParams.append("faculty", facultyName);
      if (selectedViewSubject) {
        queryParams.append("subject", selectedViewSubject);
      }
      
      toast.loading("Loading your materials...");
      
      axios
        .get(`${baseApiURL()}/material/getFacultyMaterials?${queryParams.toString()}`)
        .then((response) => {
          toast.dismiss();
          if (response.data.success) {
            setMaterials(response.data.materials);
            if (response.data.materials.length > 0) {
              toast.success(`Found ${response.data.materials.length} materials`);
            }
          } else {
            toast.error(response.data.message || "Failed to load materials");
            setMaterials([]);
          }
        })
        .catch((error) => {
          toast.dismiss();
          console.error("Error loading faculty materials:", error);
          toast.error(error.response?.data?.message || "Network error");
          setMaterials([]);
        });
    }
  };

  // Add material handler
  const addMaterialHandler = () => {
    if (!selected.branch || !selected.semester) {
      return toast.error("Please select both Branch and Semester!");
    }

    if (!file) {
      return toast.error("Please select a file to upload!");
    }

    if (!selected.title) {
      return toast.error("Please enter material title!");
    }

    if (!selected.subject) {
      return toast.error("Please select a subject!");
    }

    const formData = new FormData();
    formData.append("title", selected.title);
    formData.append("subject", selected.subject);
    formData.append("branch", selected.branch);
    formData.append("semester", selected.semester);
    formData.append("faculty", selected.faculty);
    formData.append("material", file);

    toast.loading("Uploading Material...");
    
    axios
      .post(`${baseApiURL()}/material/addMaterial`, formData)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          setSelected({
            title: "",
            subject: "",
            branch: "",
            semester: "",
            faculty: selected.faculty,
          });
          setFile(null);
          
          // Refresh materials if in view mode
          if (viewMode === "view") {
            getFacultyMaterials();
          }
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Upload error:", error);
        toast.error(error.response?.data?.message || error.response?.data?.details || "Upload failed");
      });
  };

  // Delete material handler
  const deleteMaterialHandler = (materialId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    toast.loading("Deleting material...");
    
    axios
      .delete(`${baseApiURL()}/material/deleteMaterial/${materialId}`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success("Material deleted successfully!");
          getFacultyMaterials(); // Refresh the list
        } else {
          toast.error(response.data.message || "Failed to delete material");
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Error deleting material");
      });
  };

  // Download handler
  const handleDownload = async (item) => {
    if (!item.link) return;
    
    try {
      let url = item.link;
      
      if (url.includes('cloudinary.com')) {
        if (!url.includes('upload/')) {
          toast.error("Invalid file URL");
          return;
        }
        
        const downloadUrl = url + (url.includes('?') ? '&' : '?') + 'fl=attachment';
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        let filename = item.title || 'download';
        if (url.includes('/')) {
          const urlParts = url.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart.includes('.')) {
            filename = lastPart.split('?')[0];
          }
        }
        
        filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!filename.includes('.')) {
          filename += '.pdf';
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Downloading ${filename}...`);
      } else {
        window.open(url, '_blank');
        toast.success("Opening file...");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to access file. Please try again.");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Date not available";
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 px-4">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-6">
        <Heading title="Material Management" />
      </div>

      {/* Tab Navigation */}
      <div className="w-full flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setViewMode("upload")}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              viewMode === "upload"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiUpload className="inline mr-2" />
            Upload Material
          </button>
          <button
            onClick={() => {
              setViewMode("view");
              getFacultyMaterials();
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              viewMode === "view"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <FiEye className="inline mr-2" />
            {lockedBranch ? "Department Materials" : "My Materials"}
          </button>
        </div>
      </div>

      {/* Upload View */}
      {viewMode === "upload" && (
        <div className="w-full flex justify-center items-center mt-4">
          <div className="w-full max-w-2xl flex flex-col justify-center items-center bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            {/* Material Title */}
            <div className="w-full mt-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Material Title *
              </label>
              <input
                type="text"
                id="title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={selected.title}
                onChange={(e) =>
                  setSelected({ ...selected, title: e.target.value })
                }
                placeholder="Enter material title"
              />
            </div>

            {/* Select Branch */}
            <div className="w-full mt-4">
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                Select Branch *
              </label>
              <select
                value={selected.branch}
                id="branch"
                disabled={!!lockedBranch}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${lockedBranch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                onChange={(e) =>
                  setSelected({ ...selected, branch: e.target.value })
                }
              >
                <option value="">-- Select Branch --</option>
                {branches.map((branch) => (
                  <option key={branch._id || branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Semester */}
            <div className="w-full mt-4">
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                Select Semester *
              </label>
              <select
                value={selected.semester}
                id="semester"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                onChange={(e) =>
                  setSelected({ ...selected, semester: e.target.value })
                }
              >
                <option value="">-- Select Semester --</option>
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semester {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Subject */}
            <div className="w-full mt-4">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Select Subject *
              </label>
              <select
                value={selected.subject}
                id="subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                onChange={(e) =>
                  setSelected({ ...selected, subject: e.target.value })
                }
              >
                <option value="">-- Select Subject --</option>
                {allSubjects.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="w-full mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File *
              </label>
              {!file ? (
                <label
                  htmlFor="upload"
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <FiUpload className="text-3xl text-gray-400 mb-2" />
                  <span className="text-gray-600">Click to upload or drag and drop</span>
                  <span className="text-sm text-gray-500 mt-1">PDF, PPT, DOC (Max 50MB)</span>
                </label>
              ) : (
                <div className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <AiOutlineClose />
                  </button>
                </div>
              )}
              <input
                type="file"
                id="upload"
                hidden
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white mt-8 px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              onClick={addMaterialHandler}
            >
              Upload Material
            </button>
          </div>
        </div>
      )}

      {/* View Materials View */}
      {viewMode === "view" && (
        <div className="w-full">
          {/* Filters Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Your Materials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Subject
                </label>
                <select
                  value={selectedViewSubject}
                  onChange={(e) => setSelectedViewSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Subjects</option>
                  {allSubjects.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedViewSubject("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="space-y-4">
            {materials.length > 0 ? (
              materials.map((item) => (
                <div
                  key={item._id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {item.subject}
                        </span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                          {item.branch}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                          Semester {item.semester}
                        </span>
                        <span className="flex items-center text-gray-500 ml-auto">
                          <HiOutlineCalendar className="mr-1" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Uploaded by: {item.faculty}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {item.link && (
                        <button
                          onClick={() => handleDownload(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <FiDownload size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMaterialHandler(item._id, item.title)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <div className="text-gray-400 mb-3">
                  <FiEye className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No materials found</h3>
                <p className="text-gray-500">
                  {selectedViewSubject
                    ? "Try selecting a different subject"
                    : "You haven't uploaded any materials yet"}
                </p>
                {!selectedViewSubject && (
                  <button
                    onClick={() => setViewMode("upload")}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Your First Material
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {materials.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Showing {materials.length} material{materials.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Material;
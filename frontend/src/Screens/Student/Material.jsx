import axios from "axios";
import { useEffect, useState } from "react";
import Heading from "../../components/Heading";
import { IoMdLink } from "react-icons/io";
import { HiOutlineCalendar, HiOutlineSearch } from "react-icons/hi";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";

const Material = () => {
  const [subject, setSubject] = useState();
  const [selected, setSelected] = useState();
  const [material, setMaterial] = useState([]);

  // Load subjects on component mount
  useEffect(() => {
    toast.loading("Loading Subjects");
    axios
      .get(`${baseApiURL()}/subject/getSubject`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          setSubject(response.data.subject);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.message);
      });
  }, []);

  // Get materials for selected subject
  const getSubjectMaterial = () => {
    if (!selected || selected === "select") {
      toast.error("Please select a subject first!");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
    };
    
    toast.loading(`Loading materials for ${selected}...`);
    
    axios
      .post(
        `${baseApiURL()}/material/getMaterial`,
        { subject: selected },
        { headers }
      )
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          setMaterial(response.data.material);
          toast.success(`Found ${response.data.material.length} materials`);
        } else {
          toast.error(response.data.message || "Failed to load materials");
        }
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Error loading materials:", error);
        toast.error(error.response?.data?.message || "Network error");
      });
  };

  const onSelectChangeHandler = (e) => {
    setMaterial([]);
    setSelected(e.target.value);
  };

  // Enhanced download handler - fetches blob to guarantee proper file download with extension
  const handleDownload = async (item) => {
    if (!item || !item.link) {
      toast.error("No file link available");
      return;
    }

    const url = item.link;
    const toastId = toast.loading("Downloading material...");

    try {
      // If it's a external standard link or non-cloud file, open directly in new tab
      if (!url.includes('cloudinary.com') && !url.includes('amazonaws.com')) {
        toast.dismiss(toastId);
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      // For Cloudinary or AWS S3 files, fetch as blob so we can force a named download with proper extension
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file from cloud storage");
      
      const blob = await response.blob();
      
      // Determine file extension from Content-Type or title or URL
      let extension = ".pdf";
      const contentType = response.headers.get("content-type") || blob.type;
      
      if (contentType.includes("image/jpeg")) extension = ".jpg";
      else if (contentType.includes("image/png")) extension = ".png";
      else if (contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("xlsx")) extension = ".xlsx";
      else if (contentType.includes("word") || contentType.includes("document") || contentType.includes("docx")) extension = ".docx";
      else if (contentType.includes("presentation") || contentType.includes("pptx")) extension = ".pptx";
      else if (url.endsWith(".pdf") || url.includes(".pdf")) extension = ".pdf";

      let fileName = item.title || "material";
      if (!fileName.toLowerCase().endsWith(extension)) {
        fileName += extension;
      }

      // Create Blob Object URL and trigger download
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
      console.error("Blob download failed, falling back to direct tab:", err);
      toast.dismiss(toastId);
      window.open(url, '_blank', 'noopener,noreferrer');
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
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <Heading title="Study Materials" />
      <div className="mt-8 w-full flex justify-center items-center flex-col">
        {/* Subject Selection */}
        <div className="flex justify-center items-center w-[90%] md:w-[40%] gap-2">
          <select
            value={selected}
            name="subject"
            id="subject"
            onChange={onSelectChangeHandler}
            className="px-2 bg-blue-50 py-3 rounded-sm text-base accent-blue-700 flex-grow"
          >
            <option value="select">-- Select Subject --</option>
            {subject &&
              subject.map((item) => (
                <option value={item.name} key={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
          <button
            onClick={getSubjectMaterial}
            disabled={!selected || selected === "select"}
            className={`py-3 px-4 text-2xl rounded-sm flex items-center justify-center ${
              !selected || selected === "select"
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            <HiOutlineSearch />
          </button>
        </div>

        {/* Search Info */}
        {selected && selected !== "select" && (
          <p className="mt-2 text-sm text-gray-600">
            Showing materials for: <span className="font-semibold">{selected}</span>
          </p>
        )}

        {/* Materials List */}
        <div className="mt-8 w-full px-4">
          {material && material.length > 0 ? (
            material.reverse().map((item, index) => (
              <div
                key={index}
                className="border-blue-200 border-2 w-full rounded-md shadow-sm py-4 px-6 relative mb-4 hover:shadow-md transition-shadow duration-200 bg-white"
              >
                {/* Material Title with Download Link */}
                <p
                  className={`text-xl font-medium flex justify-start items-center ${
                    item.link && "cursor-pointer hover:text-blue-600"
                  } group transition-colors duration-200`}
                  onClick={() => item.link && handleDownload(item)}
                  title={item.link ? "Click to download" : "No file available"}
                >
                  {item.title}{" "}
                  {item.link && (
                    <span className="text-2xl group-hover:text-blue-500 ml-1 transition-colors duration-200">
                      <IoMdLink />
                    </span>
                  )}
                </p>
                
                {/* Subject and Faculty Info */}
                <p className="text-base font-normal mt-1 text-gray-700">
                  {item.subject} - {item.faculty}
                </p>
                
                {/* File Info */}
                {item.link && (
                  <p className="text-sm text-gray-500 mt-1">
                    {item.link.includes('cloudinary.com') ? 'Cloud Storage' : 'Direct Link'}
                  </p>
                )}
                
                {/* Upload Date */}
                <p className="text-sm absolute top-4 right-4 flex justify-center items-center text-gray-600">
                  <span className="text-base mr-1">
                    <HiOutlineCalendar />
                  </span>
                  {formatDate(item.createdAt)}
                </p>
              </div>
            ))
          ) : selected && selected !== "select" ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">No materials found for {selected}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please check back later or contact your faculty
              </p>
            </div>
          ) : selected === "select" ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-600">
                Please select a subject to view materials
              </p>
            </div>
          ) : null}
        </div>

        {/* Instructions */}
        {material && material.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 px-4">
            <p className="text-center">
              💡 <strong>Tip:</strong> Click on any material title to download it. 
              Files are stored securely in the cloud.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Material;
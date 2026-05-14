import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { FiUpload, FiDownload } from "react-icons/fi";

const ImportFaculty = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [batchSize, setBatchSize] = useState(10); // Default batch size
  const [overwrite, setOverwrite] = useState(true);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const downloadTemplateHandler = () => {
    toast.loading("Downloading template file");
    
    // Create template with 5 sample records
    const currentYear = new Date().getFullYear();
    const templateData = Array.from({ length: 5 }, (_, i) => ({
      employeeId: `EMP00${i+1}`,
      firstName: `First${i+1}`,
      middleName: `M${i+1}`,
      lastName: `Last${i+1}`,
      email: `faculty${i+1}@example.com`,
      phoneNumber: `9876543210${10+i}`,
      department: ["CSE", "CSE-CS", "CSE-DS", "CSE-AIML", "CSE-IOT"][i%5],
      batch: `${currentYear - (i % 4)}`,
      gender: i%2 === 0 ? "Male" : "Female",
      experience: `${i+1}`,
      post: ["Asst. Prof", "Assoc. Prof", "Professor", "Lecturer", "HOD"][i%5],
      panCard: `ABCDE123${i}F`,
      jntuId: `JNTU1234${i}`,
      aicteId: `AICTE5432${i}`
    }));

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty Template");
    XLSX.writeFile(wb, "Faculty_Import_Template.xlsx");
    toast.dismiss();
    toast.success("Template downloaded successfully!");
  };

  // Process a single faculty member
  const processSingleFaculty = async (faculty) => {
    try {
      if (!faculty.employeeId) {
        return { success: false, message: "Missing employeeId" };
      }
      const formData = new FormData();
      Object.entries(faculty).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('type', 'excel-import');
      formData.append('overwrite', overwrite ? 'true' : 'false');

      // Add faculty details
      const detailsResponse = await axios.post(
        `${baseApiURL()}/faculty/details/addDetails`,
        formData
      );

      if (detailsResponse.data.success) {
        try {
          // Create credentials idempotently
          await axios.post(`${baseApiURL()}/faculty/auth/register`, {
            loginid: faculty.employeeId,
            password: faculty.employeeId,
          });
        } catch (regErr) {
          const msg = regErr?.response?.data?.message?.toString().toLowerCase() || "";
          const isAlreadyExists = msg.includes("already exists") || msg.includes("exists");
          if (!isAlreadyExists) {
            return { success: false, message: regErr?.response?.data?.message || regErr.message };
          }
        }
        return { success: true };
      }
      return { success: false, message: detailsResponse.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  };

  // Process a batch of faculty members
  const processBatch = async (batch, startIndex) => {
    const results = [];
    for (let i = 0; i < batch.length; i++) {
      const result = await processSingleFaculty(batch[i]);
      results.push({
        index: startIndex + i,
        success: result.success,
        message: result.message || (result.success ? "Success" : "Failed"),
        employeeId: batch[i].employeeId
      });
    }
    return results;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first!");
      return;
    }

    setIsLoading(true);
    toast.loading(`Processing faculty data in batches of ${batchSize}...`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.dismiss();
        setIsLoading(false);
        return toast.error("No data found in the Excel file!");
      }

      let successCount = 0;
      let errorCount = 0;
      const errorMessages = [];
      const totalBatches = Math.ceil(jsonData.length / batchSize);

      // Process in batches
      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        const batchResults = await processBatch(batch, i + 2); // +2 for header row and 1-based index
        
        for (let j = 0; j < batchResults.length; j++) {
  const result = batchResults[j];
  if (result.success) {
    successCount++;
  } else {
    errorCount++;
    errorMessages.push(`Row ${result.index}: ${result.employeeId} - ${result.message}`);
  }
}

        // Update progress
        const currentBatch = Math.ceil((i + batchSize) / batchSize);
        toast.loading(`Processing batch ${currentBatch} of ${totalBatches}...`);
      }

      toast.dismiss();
      setIsLoading(false);
      
      if (errorCount > 0) {
        toast.error(
          `Processed ${successCount} faculty, ${errorCount} errors. See console for details.`,
          { duration: 8000 }
        );
        console.error("Import errors:", errorMessages);
      } else {
        toast.success(`Successfully imported ${successCount} faculty members!`);
      }

      setFile(null);
      setFileName("");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.dismiss();
      setIsLoading(false);
      toast.error("Failed to process faculty data!");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Bulk Faculty Import</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <button
              onClick={downloadTemplateHandler}
              className="flex items-center justify-center w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors mb-4"
            >
              <FiDownload className="mr-2" />
              Download Template
            </button>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <FiUpload className="text-4xl text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">
                  {fileName || "Drag & drop your Excel file here or click to browse"}
                </p>
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md transition-colors"
                >
                  Browse Files
                </label>
              </div>
            </div>

            {fileName && (
              <div className="mt-4">
                <p className="text-sm font-medium">Selected file: {fileName}</p>
                <p className="text-sm text-gray-600">
                  Batch size: {batchSize} records at a time
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-6">
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" className="form-checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
                <span className="text-sm">Overwrite existing faculty on import</span>
              </label>
            </div>
            <div className="mb-6">
              <label htmlFor="batch-size" className="block text-sm font-medium text-gray-700 mb-2">
                Records per batch
              </label>
              <select
                id="batch-size"
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="5">5 records</option>
                <option value="10">10 records</option>
                <option value="20">20 records</option>
                <option value="50">50 records</option>
                <option value="100">100 records</option>
                <option value="200">200 records</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Larger batches are faster but may overload your server
              </p>
            </div>

            <button
              onClick={handleImport}
              disabled={!file || isLoading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                !file || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              } transition-colors`}
            >
              {isLoading ? "Processing..." : `Import Faculty (Batch size: ${batchSize})`}
            </button>

            <div className="mt-6 p-4 bg-yellow-50 rounded-md">
              <h3 className="font-medium text-yellow-800 mb-2">Batch Import Tips:</h3>
              <ul className="text-sm text-yellow-700 list-disc pl-5">
                <li>Start with smaller batches (5-10) for testing</li>
                <li>Increase batch size for faster imports with stable connections</li>
                <li>Monitor server performance during large imports</li>
                <li>Check console for detailed error reports</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportFaculty;
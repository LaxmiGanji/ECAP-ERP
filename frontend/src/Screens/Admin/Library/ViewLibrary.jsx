import { useEffect, useState } from "react";
import axios from "axios";
import { baseApiURL } from "../../../baseUrl";
import toast from "react-hot-toast";
import { FiBook, FiSearch, FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx";

const ViewLibrary = () => {
  const [librarians, setLibrarians] = useState([]);
  const [filteredLibrarians, setFilteredLibrarians] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("Ascending");

  useEffect(() => {
    const fetchLibrarians = async () => {
      try {
        const response = await axios.get(`${baseApiURL()}/library/details/getDetails2`);
        if (response.data.success) {
          setLibrarians(response.data.librarians);
          setFilteredLibrarians(response.data.librarians);
        } else {
          toast.error("Failed to load librarians");
        }
      } catch (error) {
        toast.error("Error fetching librarians");
        console.error(error);
      }
    };

    fetchLibrarians();
  }, []);

  useEffect(() => {
    let filtered = librarians.filter((librarian) => {
      const matchesSearch = searchTerm === "" || 
        librarian.libraryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${librarian.firstName} ${librarian.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        librarian.email.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    // Sort by library ID
    filtered.sort((a, b) => {
      const aNum = parseInt(a.libraryId);
      const bNum = parseInt(b.libraryId);
      return sortOrder === "Ascending" ? aNum - bNum : bNum - aNum;
    });

    setFilteredLibrarians(filtered);
  }, [librarians, searchTerm, sortOrder]);

  const downloadExcel = () => {
    if (filteredLibrarians.length === 0) {
      toast.error("No librarians to export!");
      return;
    }

    const dataToExport = filteredLibrarians.map((librarian) => ({
      "Library ID": librarian.libraryId,
      "Name": `${librarian.firstName} ${librarian.lastName}`,
      "Email": librarian.email,
      "Phone": librarian.phoneNumber,
      "Gender": librarian.gender,
    }));

    // Create and download Excel file
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Librarians");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = "librarians_data.xlsx";
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("Excel file downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiBook className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Library Management</h1>
                  <p className="text-blue-100 text-sm">View and manage librarian information</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  {filteredLibrarians.length} librarians found
                </span>
                <button
                  onClick={downloadExcel}
                  className="flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <FiDownload className="text-sm" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-8 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Librarians
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="Ascending">Ascending</option>
                  <option value="Descending">Descending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-8">
            {filteredLibrarians.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <FiBook className="mx-auto text-gray-400 text-4xl mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No librarians found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-lg">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <th className="py-4 px-6 text-left font-semibold">Library ID</th>
                      <th className="py-4 px-6 text-left font-semibold">Name</th>
                      <th className="py-4 px-6 text-left font-semibold">Email</th>
                      <th className="py-4 px-6 text-left font-semibold">Phone</th>
                      <th className="py-4 px-6 text-left font-semibold">Gender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLibrarians.map((librarian, index) => (
                      <tr 
                        key={librarian.libraryId} 
                        className={`border-b hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="py-4 px-6 font-medium">{librarian.libraryId}</td>
                        <td className="py-4 px-6">
                          {librarian.firstName} {librarian.lastName}
                        </td>
                        <td className="py-4 px-6">{librarian.email}</td>
                        <td className="py-4 px-6">{librarian.phoneNumber}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            librarian.gender === 'Male' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {librarian.gender}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLibrary;
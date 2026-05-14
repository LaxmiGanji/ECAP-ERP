import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import { FiBook, FiBarChart2, FiUploadCloud, FiSearch } from "react-icons/fi";
import { MdOutlineDelete, MdEdit } from "react-icons/md";
import { baseApiURL } from "../../baseUrl";

const initialForm = {
  bookName: "",
  bookCode: "",
  author: "",
  genre: "",
  quantity: "",
  rackNumber: "",
  publisher: "",
  publishedYear: "",
  notes: "",
};

const AddBook = () => {
  const [formData, setFormData] = useState(initialForm);
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedTab, setSelectedTab] = useState("add");
  const [editData, setEditData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredBooks(books);
      return;
    }
    const term = searchTerm.toLowerCase();
    setFilteredBooks(
      books.filter(
        (book) =>
          book.bookName.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          String(book.bookCode).includes(term)
      )
    );
  }, [books, searchTerm]);

  const stats = useMemo(() => {
    const totalCopies = books.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const totalIssued = books.reduce((acc, item) => acc + (item.issuedCount || 0), 0);
    const available = Math.max(totalCopies - totalIssued, 0);
    const lowStock = books.filter(
      (item) => item.quantity - (item.issuedCount || 0) <= 2
    );
    const topBorrowed = [...books]
      .sort((a, b) => (b.issuedCount || 0) - (a.issuedCount || 0))
      .slice(0, 5);
    return { totalCopies, totalIssued, available, lowStock, topBorrowed };
  }, [books]);

  const fetchBooks = () => {
    axios
      .get(`${baseApiURL()}/library/getLibraryBook`)
      .then((response) => {
        if (response.data.success) {
          setBooks(response.data.book || []);
          setFilteredBooks(response.data.book || []);
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => toast.error(error.response?.data?.message || error.message));
  };

  const handleSubmit = (payload, isUpdate = false) => {
    if (!payload.bookName || !payload.bookCode || !payload.author || !payload.quantity) {
      toast.error("Please fill all mandatory fields");
      return;
    }

    toast.loading(isUpdate ? "Updating book..." : "Adding book...");
    const request = isUpdate
      ? axios.put(`${baseApiURL()}/library/updateLibraryBook/${payload._id}`, payload)
      : axios.post(`${baseApiURL()}/library/addLibraryBook`, payload);

    request
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          fetchBooks();
          if (isUpdate) {
            setEditData(null);
            setSelectedTab("view");
          } else {
            setFormData(initialForm);
            setSelectedTab("view");
          }
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || error.message);
      });
  };

  const deleteBookHandler = (id) => {
    toast.loading("Deleting book...");
    axios
      .delete(`${baseApiURL()}/library/deleteLibraryBook/${id}`)
      .then((response) => {
        toast.dismiss();
        if (response.data.success) {
          toast.success(response.data.message);
          fetchBooks();
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        toast.dismiss();
        toast.error(error.response?.data?.message || error.message);
      });
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload a valid Excel file (.xlsx)");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "library-books-excel");

    setImporting(true);
    setImportSummary(null);

    axios
      .post(`${baseApiURL()}/library/bulkUpload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        setImporting(false);
        if (response.data.success) {
          toast.success("Books imported successfully");
          setImportSummary(response.data.summary);
          fetchBooks();
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          toast.error(response.data.message);
        }
      })
      .catch((error) => {
        setImporting(false);
        toast.error(error.response?.data?.message || error.message);
      });
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        "Book Name": "Blockchain Basics",
        "Book Code": 1001,
        Author: "Mary Stone",
        Genre: "CSE",
        Quantity: 5,
        Rack: "R-12",
        Publisher: "TechPress",
        "Published Year": 2023,
        Notes: "Reference copy",
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
    XLSX.writeFile(workbook, "library_books_template.xlsx");
    toast.success("Template downloaded");
  };

  const renderForm = (data, setData, title, onSubmit, onCancel) => (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-8">
        <div>
          <div className="flex items-center space-x-2 mb-6">
            <FiBook className="text-blue-600 text-lg" />
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Name *
              </label>
              <input
                type="text"
                value={data.bookName}
                onChange={(e) => setData({ ...data, bookName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter book name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Code *
              </label>
              <input
                type="number"
                value={data.bookCode}
                onChange={(e) => setData({ ...data, bookCode: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter book code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author *
              </label>
              <input
                type="text"
                value={data.author}
                onChange={(e) => setData({ ...data, author: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter author name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <input
                type="text"
                value={data.genre}
                onChange={(e) => setData({ ...data, genre: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g. ECE, MECH, Fiction"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={data.quantity}
                onChange={(e) => setData({ ...data, quantity: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter available copies"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rack / Location
              </label>
              <input
                type="text"
                value={data.rackNumber}
                onChange={(e) => setData({ ...data, rackNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g. Rack 3 - Shelf B"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publisher
              </label>
              <input
                type="text"
                value={data.publisher}
                onChange={(e) => setData({ ...data, publisher: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Publisher name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Published Year
              </label>
              <input
                type="number"
                value={data.publishedYear}
                onChange={(e) => setData({ ...data, publishedYear: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g. 2024"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={data.notes}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Add any remarks (optional)"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Save
        </button>
      </div>
    </div>
  );

  const renderImportCard = () => (
    <div className="mt-10 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FiUploadCloud /> Import from Excel
          </h3>
          <p className="text-sm text-slate-500">
            Bulk upload or update books using the provided template.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Download Template
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
            {importing ? "Uploading..." : "Upload Excel"}
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>
      {importSummary && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-slate-500">Inserted</p>
            <p className="text-2xl font-semibold text-slate-800">{importSummary.inserted}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-slate-500">Updated</p>
            <p className="text-2xl font-semibold text-slate-800">{importSummary.updated}</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-sm text-slate-500">Total Processed</p>
            <p className="text-2xl font-semibold text-slate-800">
              {importSummary.totalProcessed}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderViewTable = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, author, or code..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <p className="text-sm text-slate-500">{filteredBooks.length} books found</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Author</th>
              <th className="px-6 py-3">Genre</th>
              <th className="px-6 py-3">Rack</th>
              <th className="px-6 py-3">Available</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBooks.map((item) => {
              const available = (item.quantity || 0) - (item.issuedCount || 0);
              return (
                <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{item.bookCode}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{item.bookName}</p>
                    <p className="text-sm text-slate-500">{item.publisher || "Publisher N/A"}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{item.author}</td>
                  <td className="px-6 py-4 text-slate-700">{item.genre || "-"}</td>
                  <td className="px-6 py-4 text-slate-700">{item.rackNumber || "-"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        available > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {available} / {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        onClick={() => {
                          setEditData(item);
                          setSelectedTab("edit");
                        }}
                        title="Edit"
                      >
                        <MdEdit size={20} />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 transition-colors"
                        onClick={() => deleteBookHandler(item._id)}
                        title="Delete"
                      >
                        <MdOutlineDelete size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredBooks.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-12 text-slate-500">
                  No books match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Total Titles</p>
          <p className="text-3xl font-semibold text-slate-800">{books.length}</p>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Total Copies</p>
          <p className="text-3xl font-semibold text-slate-800">{stats.totalCopies}</p>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Currently Issued</p>
          <p className="text-3xl font-semibold text-indigo-600">{stats.totalIssued}</p>
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Available</p>
          <p className="text-3xl font-semibold text-green-600">{stats.available}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <FiBarChart2 /> Top Borrowed Titles
          </h3>
          {stats.topBorrowed.length === 0 ? (
            <p className="text-slate-500">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topBorrowed.map((book, idx) => (
                <li
                  key={book._id}
                  className="flex items-center justify-between p-3 border border-slate-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {idx + 1}. {book.bookName}
                    </p>
                    <p className="text-sm text-slate-500">{book.author}</p>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">
                    {book.issuedCount || 0} issued
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            Low Stock Alerts
          </h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-slate-500">All titles have sufficient stock.</p>
          ) : (
            <ul className="space-y-3">
              {stats.lowStock.map((book) => {
                const available = (book.quantity || 0) - (book.issuedCount || 0);
                return (
                  <li
                    key={book._id}
                    className="flex items-center justify-between p-3 border border-red-100 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-red-800">{book.bookName}</p>
                      <p className="text-sm text-red-500">
                        Available {available} / {book.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                      Restock Soon
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiBook className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Library Catalogue</h1>
                  <p className="text-blue-100 text-sm">
                    Add, import, and keep track of every title with ease.
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {["add", "view", "analytics"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                      selectedTab === tab
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white/20"
                    }`}
                    onClick={() => {
                      setSelectedTab(tab);
                      if (tab === "add") {
                        setFormData(initialForm);
                      }
                    }}
                  >
                    {tab === "add" ? "Add Book" : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8">
            {selectedTab === "add" && (
              <>
                {renderForm(
                  formData,
                  setFormData,
                  "Book Information",
                  () => handleSubmit(formData),
                  () => setFormData(initialForm)
                )}
                {renderImportCard()}
              </>
            )}

            {selectedTab === "view" && renderViewTable()}

            {selectedTab === "analytics" && renderAnalytics()}

            {selectedTab === "edit" && editData && (
              <div className="space-y-6">
                {renderForm(
                  editData,
                  setEditData,
                  "Update Book Details",
                  () => handleSubmit(editData, true),
                  () => {
                    setEditData(null);
                    setSelectedTab("view");
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBook;

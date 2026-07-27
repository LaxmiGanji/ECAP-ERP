import React, { useState, useEffect } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import {
  FiDatabase,
  FiUploadCloud,
  FiPlus,
  FiTrash2,
  FiBookOpen,
  FiFileText,
  FiLayers,
  FiCheckCircle,
  FiRefreshCw,
  FiSearch,
  FiGlobe,
  FiExternalLink,
  FiPlusCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

const RAGManager = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [branches, setBranches] = useState([]);

  // Web Scraper State
  const [onlineQuery, setOnlineQuery] = useState("Operating Systems");
  const [onlineBooks, setOnlineBooks] = useState([]);
  const [fetchingOnline, setFetchingOnline] = useState(false);

  // Load branches dynamically from API
  useEffect(() => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data?.success) {
          setBranches(res.data.branches || []);
          if (res.data.branches?.length > 0) {
            setForm((prev) => ({ ...prev, branch: res.data.branches[0].name }));
          }
        }
      })
      .catch((err) => console.error("Error loading branches:", err));
  }, []);

  // Ingestion Form state
  const [form, setForm] = useState({
    title: "",
    documentType: "catalog",
    content: "",
    summary: "",
    author: "",
    journal: "",
    publisher: "",
    publishedYear: new Date().getFullYear(),
    branch: "",
    subject: "",
    semester: 3,
    examType: "Semester Exam",
    rackNumber: "",
    bookCode: "",
    quantity: 1,
    fileUrl: "",
    tags: "",
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseApiURL()}/library/rag/documents`, {
        params: { documentType: filterType },
      });
      if (res.data?.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error("RAG fetch error:", err);
      toast.error("Failed to load RAG documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  const handleScrapeOnline = async () => {
    if (!onlineQuery.trim()) return;
    setFetchingOnline(true);
    try {
      const res = await axios.get(`${baseApiURL()}/library/rag/web-search`, {
        params: { query: onlineQuery.trim() },
      });
      if (res.data?.success) {
        setOnlineBooks(res.data.books || []);
        toast.success(`Scraped ${res.data.count || 0} books online!`);
      }
    } catch (err) {
      console.error("Scrape Error:", err);
      toast.error("Failed to scrape online books");
    } finally {
      setFetchingOnline(false);
    }
  };

  const handleQuickIngestOnlineBook = async (book) => {
    const toastId = toast.loading(`Ingesting "${book.title}"...`);
    try {
      const res = await axios.post(`${baseApiURL()}/library/rag/ingest`, {
        title: book.title,
        documentType: "catalog",
        content: `${book.title} Author: ${book.author}. Published: ${book.publishedYear}. Summary: ${book.summary}`,
        summary: book.summary,
        author: book.author,
        publishedYear: book.publishedYear !== "N/A" ? Number(book.publishedYear) : undefined,
        branch: "General",
        fileUrl: book.readUrl,
        tags: book.subjects || [],
      });
      if (res.data?.success) {
        toast.success(`"${book.title}" added to RAG Database!`, { id: toastId });
        fetchDocuments();
      }
    } catch (err) {
      toast.error("Failed to ingest book", { id: toastId });
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Title and Content are required!");
      return;
    }

    const toastId = toast.loading("Ingesting & Vectorizing into Pinecone DB...");
    try {
      const res = await axios.post(`${baseApiURL()}/library/rag/ingest`, {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });

      if (res.data?.success) {
        toast.success("Document Vectorized & Ingested into Pinecone!", { id: toastId });
        setForm({
          title: "",
          documentType: "catalog",
          content: "",
          summary: "",
          author: "",
          journal: "",
          publisher: "",
          publishedYear: new Date().getFullYear(),
          branch: "Computer Science Engineering",
          subject: "",
          semester: 3,
          examType: "Semester Exam",
          rackNumber: "",
          bookCode: "",
          quantity: 1,
          fileUrl: "",
          tags: "",
        });
        fetchDocuments();
      }
    } catch (err) {
      console.error("Ingestion Error:", err);
      toast.error("Failed to ingest document", { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this RAG vector document?")) return;
    try {
      const res = await axios.delete(`${baseApiURL()}/library/rag/document/${id}`);
      if (res.data?.success) {
        toast.success("Document removed from RAG Database");
        fetchDocuments();
      }
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleReSeed = async () => {
    const toastId = toast.loading("Re-indexing Pinecone Vector DB with Seed & Library Data...");
    try {
      const res = await axios.post(`${baseApiURL()}/library/rag/seed`, { force: true });
      if (res.data?.success) {
        toast.success(`Seeded & Vectorized ${res.data.count} documents!`, { id: toastId });
        fetchDocuments();
      }
    } catch (err) {
      toast.error("Failed to re-seed vector store", { id: toastId });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-slate-800 text-white flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FiDatabase className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
              Pinecone RAG Vector Index Manager
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage Vector Embeddings, Scrape Online Books, & Ingest Research Papers/PYQs
            </p>
          </div>
        </div>

        <button
          onClick={handleReSeed}
          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4 text-cyan-400" /> Re-index & Sync MongoDB Books
        </button>
      </div>

      {/* WEB SCRAPER BAR */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-teal-300 flex items-center gap-2">
            <FiGlobe className="w-4 h-4 text-teal-400" /> Scrape Online Books (Zero Local Storage Overhead)
          </h2>
          <span className="text-[10px] text-slate-400">Fetches live books from Open Library & Google Books</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={onlineQuery}
            onChange={(e) => setOnlineQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScrapeOnline()}
            placeholder="Type any topic (e.g. Data Structures, Cloud Computing, Neural Networks)..."
            className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={handleScrapeOnline}
            disabled={fetchingOnline}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <FiSearch className="w-4 h-4" /> Search & Scrape
          </button>
        </div>

        {onlineBooks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {onlineBooks.slice(0, 6).map((b) => (
              <div key={b.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs gap-2">
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-200 truncate">{b.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">By {b.author}</p>
                </div>
                <button
                  onClick={() => handleQuickIngestOnlineBook(b)}
                  className="bg-teal-950 hover:bg-teal-900 text-teal-300 border border-teal-800 px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap flex items-center gap-1"
                >
                  <FiPlusCircle className="w-3 h-3 text-teal-400" /> Vectorize
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INGESTION FORM */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <FiUploadCloud className="text-indigo-600 w-5 h-5" /> Ingest & Vectorize Document
          </h2>

          <form onSubmit={handleIngest} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Document Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Advanced Operating Systems 2024 Exam Paper"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Type</label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="catalog">Book Catalog</option>
                  <option value="research_paper">Research Paper</option>
                  <option value="pyq">Question Paper (PYQ)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Branch</label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b._id || b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Author / Publisher</label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="e.g. Author name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                />
              </div>

              {form.documentType === "catalog" ? (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Rack Location</label>
                  <input
                    type="text"
                    value={form.rackNumber}
                    onChange={(e) => setForm({ ...form, rackNumber: e.target.value })}
                    placeholder="e.g. CS-A12"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Data Structures"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">PDF / File URL</label>
              <input
                type="text"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://domain.com/paper.pdf"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Content / Full Text *</label>
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Paste the full text, questions, or abstract to be embedded into vectors..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 resize-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. Algorithms, Sorting, 2024"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <FiPlus className="w-4 h-4" /> Vectorize & Ingest
            </button>
          </form>
        </div>

        {/* VECTOR DOCUMENTS TABLE */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FiBookOpen className="text-indigo-600 w-5 h-5" /> Indexed RAG Documents ({documents.length})
            </h2>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-100 border border-gray-200 text-xs text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="catalog">Catalogs</option>
              <option value="research_paper">Research Papers</option>
              <option value="pyq">PYQs</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3">Title</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Branch / Subject</th>
                    <th className="p-3">Location / Code</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-semibold text-gray-800 max-w-[200px] truncate">{doc.title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                          {doc.documentType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{doc.branch}</td>
                      <td className="p-3 text-gray-600 font-mono">
                        {doc.rackNumber ? `Rack ${doc.rackNumber}` : doc.bookCode || "Digital"}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Delete document"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
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
  );
};

export default RAGManager;

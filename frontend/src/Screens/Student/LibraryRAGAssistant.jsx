import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { baseApiURL } from "../../baseUrl";
import {
  FiMessageSquare,
  FiBookOpen,
  FiFileText,
  FiSearch,
  FiSend,
  FiCpu,
  FiDatabase,
  FiDownload,
  FiExternalLink,
  FiMapPin,
  FiCheckCircle,
  FiTag,
  FiLayers,
  FiRefreshCw,
  FiBookmark,
  FiGlobe,
  FiPlusCircle,
  FiShare2,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const LibraryRAGAssistant = () => {
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'catalog' | 'papers' | 'pyq' | 'web'
  const [queryInput, setQueryInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [branchesList, setBranchesList] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState("all");

  // Browse Catalog / Papers / PYQ State
  const [documents, setDocuments] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedDocModal, setSelectedDocModal] = useState(null);

  // Online Web Scraper State
  const [onlineQuery, setOnlineQuery] = useState("Data Structures");
  const [onlineBooks, setOnlineBooks] = useState([]);
  const [fetchingOnline, setFetchingOnline] = useState(false);
  const [vectorizingId, setVectorizingId] = useState(null);

  const messagesEndRef = useRef(null);

  // Load branches dynamically from Backend API
  useEffect(() => {
    axios
      .get(`${baseApiURL()}/branch/getBranch`)
      .then((res) => {
        if (res.data?.success) {
          setBranchesList(res.data.branches || []);
        }
      })
      .catch((err) => console.error("Error fetching branches:", err));
  }, []);

  // Initial Seed & Welcome Message
  useEffect(() => {
    axios
      .post(`${baseApiURL()}/library/rag/seed`, { force: false })
      .catch((err) => console.log("RAG auto-seed check complete:", err.message));

    const welcomeMsg = {
      id: "welcome-rag",
      sender: "bot",
      text: `👋 Welcome to the **ECAP Intelligent Library Assistant** powered by **Pinecone Vector Database** & **RAG Architecture**!

You can ask me questions in natural language about:
- 📚 **Library Catalog Books** (Rack location, availability, authors, book codes)
- 🔬 **Research Papers** (Transformer models, ResNet, Federated Learning, IoT Edge AI)
- 📝 **Previous Year Question Papers** (2023-2024 Exam papers, answer breakdowns, topics)
- 🌐 **Online Web Scraped Books** (Search & fetch open books on demand without local database storage overhead)

Try typing a question below or click one of the quick suggestions!`,
      sources: [],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([welcomeMsg]);
  }, []);

  // Fetch Documents when switching tab to catalog, papers, or pyq
  useEffect(() => {
    if (activeTab !== "chat" && activeTab !== "web") {
      fetchLibraryDocuments();
    } else if (activeTab === "web" && onlineBooks.length === 0) {
      fetchOnlineBooks("Data Structures");
    }
  }, [activeTab, selectedBranch, selectedDocType]);

  const fetchLibraryDocuments = async () => {
    setFetchingDocs(true);
    try {
      let typeParam = "all";
      if (activeTab === "catalog") typeParam = "catalog";
      if (activeTab === "papers") typeParam = "research_paper";
      if (activeTab === "pyq") typeParam = "pyq";

      const res = await axios.get(`${baseApiURL()}/library/rag/documents`, {
        params: {
          documentType: typeParam,
          branch: selectedBranch,
          search: searchFilter,
        },
      });

      if (res.data?.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching library documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setFetchingDocs(false);
    }
  };

  // Live Web Scraper Search for Online Books
  const fetchOnlineBooks = async (customQuery) => {
    const q = customQuery || onlineQuery;
    if (!q || !q.trim()) return;

    setFetchingOnline(true);
    try {
      const res = await axios.get(`${baseApiURL()}/library/rag/web-search`, {
        params: { query: q.trim() },
      });

      if (res.data?.success) {
        setOnlineBooks(res.data.books || []);
        toast.success(`Found ${res.data.count || 0} online books for "${q}"`);
      }
    } catch (err) {
      console.error("Web Search Error:", err);
      toast.error("Failed to scrape online books");
    } finally {
      setFetchingOnline(false);
    }
  };

  // 1-Click Vectorize Online Book into RAG Database
  const handleVectorizeOnlineBook = async (book) => {
    setVectorizingId(book.id);
    const toastId = toast.loading(`Vectorizing "${book.title}" into RAG DB...`);

    try {
      const res = await axios.post(`${baseApiURL()}/library/rag/ingest`, {
        title: book.title,
        documentType: "catalog",
        content: `${book.title} Author: ${book.author} Published: ${book.publishedYear}. Summary: ${book.summary}`,
        summary: book.summary,
        author: book.author,
        publishedYear: book.publishedYear !== "N/A" ? Number(book.publishedYear) : undefined,
        branch: "General",
        subject: book.subjects?.[0] || "General",
        fileUrl: book.readUrl,
        tags: book.subjects || [],
      });

      if (res.data?.success) {
        toast.success(`"${book.title}" is now added to AI RAG Vector Index!`, { id: toastId });
      }
    } catch (err) {
      console.error("Vectorize Online Book Error:", err);
      toast.error("Failed to vectorize online book", { id: toastId });
    } finally {
      setVectorizingId(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, loading, activeTab]);

  const handleSendQuery = async (customText) => {
    const textToSend = customText || queryInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQueryInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${baseApiURL()}/library/rag/query`, {
        query: textToSend,
        documentType: selectedDocType,
        branch: selectedBranch,
        topK: 4,
      });

      if (res.data?.success) {
        const botMsg = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: res.data.answer,
          sources: res.data.sources || [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
        setSources(res.data.sources || []);
      }
    } catch (err) {
      console.error("RAG Query Error:", err);
      toast.error("Error retrieving answer from RAG vector index");
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I ran into an error querying the Pinecone vector index. Please try again.",
        sources: [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  const quickPrompts = [
    { label: "📍 Where is Cormen Algorithms book?", text: "What rack number is Introduction to Algorithms by Cormen in, and how many copies are available?" },
    { label: "🔬 Summarize Transformer Research Paper", text: "Summarize the 'Attention Is All You Need' Transformer research paper." },
    { label: "📝 2024 Data Structures PYQ", text: "What questions were asked in the 2024 Data Structures End Semester Examination?" },
    { label: "⚡ DBMS Normalization Questions", text: "Show previous year question paper topics related to 3NF and BCNF normalization." },
    { label: "🤖 AI Modern Approach availability", text: "Is Artificial Intelligence A Modern Approach book available in the library?" },
  ];

  return (
    <div className="min-h-[85vh] bg-slate-950 text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <FiCpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                Intelligent Library Assistant
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-semibold border border-cyan-800/60 flex items-center gap-1">
                <FiDatabase className="w-3 h-3 text-cyan-400" /> Pinecone Vector DB (RAG)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural Language Information Retrieval across Library Catalogs, Research Papers, Question Papers & Live Web Scraped Books
            </p>
          </div>
        </div>

        {/* Global Filters & Seed Sync */}
        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Departments</option>
            {branchesList.map((b) => (
              <option key={b._id || b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              toast.promise(axios.post(`${baseApiURL()}/library/rag/seed`, { force: true }), {
                loading: "Re-indexing Pinecone Vector DB...",
                success: "Vector Database successfully synced!",
                error: "Failed to sync vector database",
              }).then(() => {
                if (activeTab !== "chat" && activeTab !== "web") fetchLibraryDocuments();
              });
            }}
            title="Re-index Vector Database"
            className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl transition"
          >
            <FiRefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Sync Vectors
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/80 px-6 py-2 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === "chat"
              ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FiMessageSquare className="w-4 h-4" />
          <span>💬 RAG AI Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === "catalog"
              ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FiBookOpen className="w-4 h-4" />
          <span>📚 Library Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab("web")}
          className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === "web"
              ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FiGlobe className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>🌐 Online Book Web Scraper</span>
        </button>

        <button
          onClick={() => setActiveTab("papers")}
          className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === "papers"
              ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FiLayers className="w-4 h-4" />
          <span>🔬 Research Papers</span>
        </button>

        <button
          onClick={() => setActiveTab("pyq")}
          className={`flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all ${
            activeTab === "pyq"
              ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <FiFileText className="w-4 h-4" />
          <span>📝 Previous Year Papers (PYQ)</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* VIEW 1: RAG CHATBOT */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-[70vh]">
            {/* Chat Messages */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-lg ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none"
                        : "bg-slate-900/90 text-slate-100 rounded-bl-none border border-slate-800"
                    }`}
                  >
                    {/* Render Text Content */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text.split("\n").map((line, i) => {
                        if (line.startsWith("### ")) {
                          return (
                            <h3 key={i} className="text-base font-bold text-cyan-300 mt-3 mb-1.5">
                              {line.replace("### ", "")}
                            </h3>
                          );
                        }
                        if (line.startsWith("#### ")) {
                          return (
                            <h4 key={i} className="text-sm font-semibold text-teal-300 mt-2 mb-1">
                              {line.replace("#### ", "")}
                            </h4>
                          );
                        }
                        if (line.startsWith("- ")) {
                          return (
                            <li key={i} className="ml-3 my-0.5 list-disc text-slate-200">
                              {line.substring(2)}
                            </li>
                          );
                        }
                        return <p key={i} className="min-h-[1em]">{line}</p>;
                      })}
                    </div>

                    {/* Source References Cards */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FiDatabase className="w-3 h-3" /> Retrieved Pinecone Vector Sources ({msg.sources.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => setSelectedDocModal(src)}
                              className="bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 p-2.5 rounded-xl transition cursor-pointer group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold border border-indigo-800/50 uppercase">
                                  {src.documentType.replace("_", " ")}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  {src.score}% Match
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-200 mt-1.5 group-hover:text-cyan-300 transition truncate">
                                {src.title}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                                <span>{src.rackNumber ? `📍 Rack ${src.rackNumber}` : src.branch}</span>
                                <span className="text-cyan-400 font-medium">View Details &rarr;</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-[9px] text-right mt-2 opacity-50">{msg.time}</div>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
                      <span className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-slate-400">
                      Querying Pinecone Vector Index & Synthesizing Response...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-900 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
                {quickPrompts.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(chip.text)}
                    className="text-xs bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 text-slate-300 px-3.5 py-1.5 rounded-full transition shadow-sm"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-900 flex items-center gap-3">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask any question about library books, research papers, or exam question papers..."
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSendQuery()}
                disabled={loading || !queryInput.trim()}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white hover:from-cyan-400 hover:to-indigo-500 transition disabled:opacity-40 shadow-lg shadow-cyan-500/10"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: ONLINE WEB SCRAPED BOOKS FINDER */}
        {activeTab === "web" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Search Header */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-emerald-400 flex items-center gap-2">
                    <FiGlobe className="w-5 h-5" /> Live Web Scraping Online Book Search
                  </h2>
                  <p className="text-xs text-slate-400">
                    Search millions of open-access books on demand across Open Library & Google Books. Saves server storage & time!
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-800/60">
                  Zero Local Storage Overhead
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={onlineQuery}
                  onChange={(e) => setOnlineQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchOnlineBooks()}
                  placeholder="Enter any topic or book name (e.g. Data Structures, Operating Systems, Machine Learning)..."
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => fetchOnlineBooks()}
                  disabled={fetchingOnline}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSearch className="w-4 h-4" /> Scrape Online Books
                </button>
              </div>
            </div>

            {fetchingOnline ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
                <p className="text-xs text-slate-400">Scraping Open Library & Google Books repositories...</p>
              </div>
            ) : onlineBooks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
                <FiGlobe className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-base font-semibold text-slate-300">No online books found for "{onlineQuery}".</p>
                <p className="text-xs text-slate-500 mt-1">Try searching another topic like "Algorithms", "Python", or "Artificial Intelligence".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onlineBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="flex gap-3 mb-3">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-14 h-20 object-cover rounded-lg bg-slate-950 border border-slate-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-20 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 flex-shrink-0">
                            <FiBookOpen className="w-6 h-6" />
                          </div>
                        )}

                        <div className="overflow-hidden">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 uppercase">
                            {book.source}
                          </span>
                          <h3 className="font-bold text-slate-100 group-hover:text-emerald-300 transition line-clamp-2 text-xs mt-1">
                            {book.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            By <span className="text-slate-300">{book.author}</span>
                          </p>
                          <p className="text-[10px] text-slate-500">Published: {book.publishedYear}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {book.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs gap-2">
                      <a
                        href={book.readUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" /> Read / Preview
                      </a>

                      <button
                        onClick={() => handleVectorizeOnlineBook(book)}
                        disabled={vectorizingId === book.id}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiPlusCircle className="w-3.5 h-3.5 text-emerald-400" /> Vectorize & Add to RAG
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CATALOG / PAPERS / PYQ EXPLORER GRID */}
        {activeTab !== "chat" && activeTab !== "web" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Search & Filter Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative flex-1 min-w-[240px]">
                <FiSearch className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLibraryDocuments()}
                  placeholder={`Search ${activeTab === "catalog" ? "books by title, author, or rack" : activeTab === "papers" ? "research papers by title, author, or keyword" : "question papers by subject or year"}...`}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={fetchLibraryDocuments}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
              >
                <FiSearch className="w-4 h-4" /> Search Documents
              </button>
            </div>

            {fetchingDocs ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
                <FiBookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-base font-semibold text-slate-300">No documents match your filter.</p>
                <p className="text-xs text-slate-500 mt-1">Try clicking 'Sync Vectors' or changing your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDocModal(doc)}
                    className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition cursor-pointer flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/50 uppercase">
                          {doc.documentType.replace("_", " ")}
                        </span>
                        {doc.rackNumber && (
                          <span className="text-xs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded font-semibold border border-amber-800/40 flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" /> Rack {doc.rackNumber}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-100 group-hover:text-cyan-300 transition line-clamp-2 text-sm">
                        {doc.title}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1">
                        By <span className="text-slate-300">{doc.author || doc.publisher}</span>
                      </p>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {doc.summary || doc.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{doc.branch}</span>
                      <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition">
                        Inspect Document &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL FOR RAG DOCUMENTS */}
      {selectedDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                {selectedDocModal.documentType?.replace("_", " ")}
              </span>
              <button
                onClick={() => setSelectedDocModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <h2 className="text-xl font-bold text-cyan-300">{selectedDocModal.title}</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div>
                <span className="text-slate-500 block">Author / Publisher:</span>
                <span className="font-semibold text-slate-200">{selectedDocModal.author || "Library"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Branch & Subject:</span>
                <span className="font-semibold text-slate-200">{selectedDocModal.branch} - {selectedDocModal.subject}</span>
              </div>
              {selectedDocModal.rackNumber && (
                <div>
                  <span className="text-slate-500 block">Location / Rack:</span>
                  <span className="font-bold text-amber-400">Rack {selectedDocModal.rackNumber}</span>
                </div>
              )}
              {selectedDocModal.bookCode && (
                <div>
                  <span className="text-slate-500 block">Book Code:</span>
                  <span className="font-mono text-cyan-300">{selectedDocModal.bookCode}</span>
                </div>
              )}
              {selectedDocModal.publishedYear && (
                <div>
                  <span className="text-slate-500 block">Year:</span>
                  <span className="font-semibold text-slate-200">{selectedDocModal.publishedYear}</span>
                </div>
              )}
              {selectedDocModal.availableCount !== undefined && (
                <div>
                  <span className="text-slate-500 block">Available Copies:</span>
                  <span className="font-bold text-emerald-400">{selectedDocModal.availableCount} / {selectedDocModal.quantity}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Content / Abstract Details</h4>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedDocModal.content || selectedDocModal.summary}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {selectedDocModal.fileUrl ? (
                <a
                  href={selectedDocModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition"
                >
                  <FiDownload className="w-4 h-4" /> Download / View PDF Document
                </a>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendQuery(`Tell me more details about "${selectedDocModal.title}"`);
                    setSelectedDocModal(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
                >
                  <FiMessageSquare className="w-4 h-4" /> Ask RAG AI About This Item
                </button>
              )}

              <button
                onClick={() => setSelectedDocModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryRAGAssistant;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { baseApiURL } from "../baseUrl";
import {
  FiCpu,
  FiX,
  FiSend,
  FiBookOpen,
  FiFileText,
  FiSearch,
  FiDatabase,
  FiDownload,
  FiExternalLink,
  FiGlobe,
  FiPaperclip,
  FiZap,
  FiFile,
  FiLayers
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const GlobalAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("chat"); // 'chat' | 'rag' | 'web'
  const [inputMsg, setInputMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // RAG & Materials State
  const [ragQuery, setRagQuery] = useState("");
  const [ragResults, setRagResults] = useState(null);
  const [loadingRag, setLoadingRag] = useState(false);

  // Web Scraper State
  const [webQuery, setWebQuery] = useState("");
  const [webBooks, setWebBooks] = useState([]);
  const [loadingWeb, setLoadingWeb] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    const welcome = {
      id: "welcome-global",
      sender: "bot",
      text: `👋 **Hello! I am your ECAP AI & RAG Assistant.**

I am here to help you with:
- 🎓 **Attendance, Marks & Timetable**
- 📚 **Database Study Materials & PYQs** (Find PDF links uploaded by faculty)
- 📍 **Library Catalog Books & Rack Locations**
- ✍️ **Leave Applications, Code Explanations & Study Guidance**

Ask me any question or pick a quick suggestion below!`,
      sources: [],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([welcome]);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && activeMode === "chat") {
      scrollToBottom();
    }
  }, [messages, loading, isOpen, activeMode]);

  // Handle File Selection for Multimodal Analysis
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      setSelectedFile({
        base64: base64Data,
        mimeType: file.type,
        name: file.name
      });
      setFilePreview(reader.result);
      toast.success(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // 1. Send Message in Smart Chat (Combines AI + RAG + Student Context)
  const handleSendMessage = async (customText) => {
    const text = customText || inputMsg;
    if (!text.trim() && !selectedFile) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim() || (selectedFile ? `[Attached file: ${selectedFile.name}]` : ""),
      file: selectedFile ? { name: selectedFile.name, preview: filePreview } : null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMsg("");
    const fileToSend = selectedFile;
    setSelectedFile(null);
    setFilePreview(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Determine whether to call RAG or AI Chat
      const isMaterialQuery = /material|pyq|paper|question paper|book|rack|pdf|download|library/i.test(text);

      let res;
      if (isMaterialQuery && !fileToSend) {
        // Call RAG Endpoint
        res = await axios.post(
          `${baseApiURL()}/library/rag/query`,
          { query: text, topK: 4 },
          { headers }
        );

        if (res.data?.success) {
          const botMsg = {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: res.data.answer,
            sources: res.data.sources || [],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      } else {
        // Call AI Chat Endpoint
        res = await axios.post(
          `${baseApiURL()}/ai/chat`,
          { message: text, file: fileToSend },
          { headers }
        );

        if (res.data?.success) {
          const botMsg = {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: res.data.reply,
            mode: res.data.mode,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      }
    } catch (err) {
      console.error("Global AI Assistant Error:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I encountered an issue connecting to the AI server. Please verify your connection or try again.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Search Database RAG Materials Directly
  const handleRAGSearch = async (customQ) => {
    const q = customQ || ragQuery;
    if (!q.trim()) return;

    setLoadingRag(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.post(
        `${baseApiURL()}/library/rag/query`,
        { query: q, topK: 6 },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success) {
        setRagResults(res.data);
      }
    } catch (err) {
      console.error("RAG Search Error:", err);
      toast.error("Failed to query vector database");
    } finally {
      setLoadingRag(false);
    }
  };

  // 3. Search Live Web Books
  const handleWebSearch = async (customQ) => {
    const q = customQ || webQuery;
    if (!q.trim()) return;

    setLoadingWeb(true);
    try {
      const res = await axios.get(`${baseApiURL()}/library/rag/web-search`, {
        params: { query: q }
      });
      if (res.data?.success) {
        setWebBooks(res.data.books || []);
      }
    } catch (err) {
      console.error("Web Search Error:", err);
      toast.error("Failed to scrape online books");
    } finally {
      setLoadingWeb(false);
    }
  };

  const quickPrompts = [
    { label: "📚 Search Study Materials", text: "What study materials and PDFs are available for my branch?" },
    { label: "📊 Check My Attendance", text: "What is my attendance percentage and subject breakdown?" },
    { label: "📝 2024 Question Papers", text: "Find previous year question papers for my subjects" },
    { label: "📍 Where is Cormen Book?", text: "Where is the Cormen Introduction to Algorithms book in the library?" },
    { label: "✍️ Write Leave Application", text: "Generate a leave application for my HOD" }
  ];

  return (
    <>
      {/* 1. FLOATING SIDE TAB TRIGGER ICON (Side Docked on Right Edge) */}
      {!isOpen && (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed top-1/2 -translate-y-1/2 right-0 z-50 flex items-center"
        >
          <button
            onClick={() => setIsOpen(true)}
            title="Open ECAP AI & RAG Assistant"
            className="group relative flex items-center gap-2 bg-gradient-to-l from-indigo-600 via-purple-600 to-indigo-700 text-white font-bold text-xs px-3.5 py-3 rounded-l-2xl shadow-2xl border-l border-t border-b border-indigo-400/30 hover:px-5 transition-all duration-300 backdrop-blur-md"
          >
            <div className="relative">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
              <span className="relative w-2.5 h-2.5 bg-cyan-300 rounded-full block" />
            </div>

            {/* Sparkle Flame Icon matching screenshot */}
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <FiZap className="w-3.5 h-3.5 fill-current text-amber-300 animate-pulse" />
            </div>

            <span className="hidden group-hover:inline-block tracking-wide font-extrabold text-[11px] whitespace-nowrap">
              AI & RAG Assistant
            </span>
          </button>
        </motion.div>
      )}

      {/* 2. SLIDING SIDE AI DRAWER (Floating from Right) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay for mobile screens */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-50 bg-slate-950/95 text-slate-100 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl"
            >
              {/* Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <FiCpu className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      ECAP AI Assistant
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-extrabold border border-cyan-800/50">
                        RAG Active
                      </span>
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Vector Database & Campus Intelligence Engine
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="p-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1">
                <button
                  onClick={() => setActiveMode("chat")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition ${
                    activeMode === "chat"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <FiZap className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Chat</span>
                </button>

                <button
                  onClick={() => setActiveMode("rag")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition ${
                    activeMode === "rag"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <FiDatabase className="w-3.5 h-3.5" />
                  <span>RAG Materials</span>
                </button>

                <button
                  onClick={() => setActiveMode("web")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition ${
                    activeMode === "web"
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <FiGlobe className="w-3.5 h-3.5" />
                  <span>Web Books</span>
                </button>
              </div>

              {/* BODY 1: CHAT MODE */}
              {activeMode === "chat" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                            msg.sender === "user"
                              ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-br-none"
                              : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
                          }`}
                        >
                          {/* Attached Image/File Preview */}
                          {msg.file && (
                            <div className="mb-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2">
                              {msg.file.preview ? (
                                <img
                                  src={msg.file.preview}
                                  alt="Attached"
                                  className="w-10 h-10 object-cover rounded-lg"
                                />
                              ) : (
                                <FiFile className="w-5 h-5 text-cyan-400" />
                              )}
                              <span className="text-[11px] font-mono text-slate-300 truncate">
                                {msg.file.name}
                              </span>
                            </div>
                          )}

                          {/* Message Text with PDF Download Card Parser */}
                          <div className="text-xs leading-relaxed whitespace-pre-wrap space-y-1">
                            {msg.text.split("\n").map((line, lIdx) => {
                              if (!line || !line.trim()) return null;

                              // Detect HTTP/Cloudinary/S3 PDF Links
                              const urlMatch = line.match(/(https?:\/\/[^\s\)\"]+)/i);
                              if (urlMatch) {
                                const rawUrl = urlMatch[1];
                                const cleanUrl = rawUrl.replace(/[\)\>\]]+$/, "");

                                let fileTitle = line.replace(/\[\s*(https?:\/\/[^\s\]]+)\s*\]\([^\)]+\)/i, "")
                                                    .replace(/(https?:\/\/[^\s\)\"]+)/gi, "")
                                                    .replace(/\*+|\-+|\:|Link/gi, "")
                                                    .trim();
                                if (!fileTitle || fileTitle.length < 3) {
                                  const parts = cleanUrl.split("/");
                                  fileTitle = decodeURIComponent(parts[parts.length - 1] || "Study Material PDF").replace(/_\d+$/, "");
                                }

                                return (
                                  <div key={lIdx} className="my-2 p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition flex items-center justify-between gap-2 shadow-md">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 flex-shrink-0">
                                        <FiFileText className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-slate-200 truncate">
                                          {fileTitle || "Study Material PDF"}
                                        </p>
                                        <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/50 inline-block">
                                          PDF Document
                                        </span>
                                      </div>
                                    </div>

                                    <a
                                      href={cleanUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex-shrink-0 inline-flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                                    >
                                      <FiDownload className="w-3 h-3" />
                                      <span>Download PDF</span>
                                    </a>
                                  </div>
                                );
                              }

                              if (line.startsWith("### ") || line.startsWith("## ")) {
                                return (
                                  <h3 key={lIdx} className="font-bold text-cyan-300 mt-2 mb-1 text-xs">
                                    {line.replace(/#+\s/, "")}
                                  </h3>
                                );
                              }
                              if (line.startsWith("- ")) {
                                return (
                                  <li key={lIdx} className="ml-2 my-0.5 list-disc text-slate-200">
                                    {line.substring(2)}
                                  </li>
                                );
                              }
                              return <p key={lIdx} className="my-0.5">{line}</p>;
                            })}
                          </div>

                          {/* Source Cards if returned by RAG */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                                <FiDatabase className="w-3 h-3" /> Vector Retrieved Sources ({msg.sources.length})
                              </span>
                              {msg.sources.map((src, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-2 bg-slate-950/90 rounded-xl border border-slate-800 text-[11px] space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-200 truncate">
                                      {src.title}
                                    </span>
                                    <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                                      {src.score}% Match
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">
                                    {src.rackNumber ? `📍 Rack ${src.rackNumber}` : src.branch} | {src.author || "Faculty"}
                                  </p>
                                  {src.fileUrl && (
                                    <a
                                      href={src.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline font-bold mt-1"
                                    >
                                      <FiDownload className="w-3 h-3" /> Download Attachment PDF
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="text-[9px] text-right mt-1 opacity-50">{msg.time}</div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          <span className="text-[11px] text-slate-400 ml-1">AI Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Chips */}
                  {messages.length <= 2 && (
                    <div className="px-3 py-2 bg-slate-900/40 border-t border-slate-900 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                      {quickPrompts.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => handleSendMessage(chip.text)}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 px-2.5 py-1 rounded-full transition"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* File Attachment Bar if file selected */}
                  {filePreview && (
                    <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={filePreview} alt="Preview" className="w-8 h-8 object-cover rounded-md" />
                        <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]">
                          {selectedFile?.name}
                        </span>
                      </div>
                      <button onClick={removeAttachedFile} className="text-red-400 text-xs hover:underline font-bold">
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Input Footer */}
                  <div className="p-3 bg-slate-950 border-t border-slate-900 flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach Image or PDF Note"
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-400 transition"
                    >
                      <FiPaperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Ask anything or request materials..."
                      className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                    />

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={loading || (!inputMsg.trim() && !selectedFile)}
                      className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 flex items-center justify-center text-white hover:opacity-90 transition disabled:opacity-40"
                    >
                      <FiSend className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* BODY 2: RAG MATERIALS SEARCH MODE */}
              {activeMode === "rag" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <FiDatabase className="w-4 h-4" /> Direct RAG Vector Database Search
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ragQuery}
                        onChange={(e) => setRagQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRAGSearch()}
                        placeholder="Search materials, PYQs, research papers, rack books..."
                        className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={() => handleRAGSearch()}
                        disabled={loadingRag}
                        className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiSearch className="w-3.5 h-3.5" /> Search
                      </button>
                    </div>
                  </div>

                  {loadingRag ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-2">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-cyan-400" />
                      <span className="text-xs text-slate-400">Querying Pinecone Vector Index...</span>
                    </div>
                  ) : ragResults ? (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span>Retrieved {ragResults.sources?.length || 0} Matches</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Vector Cosine Similarity</span>
                      </div>

                      <div className="space-y-2.5">
                        {ragResults.sources?.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-3 rounded-xl space-y-1.5 transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                                {item.documentType?.replace("_", " ")}
                              </span>
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                                {item.score}% Match
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-100 leading-snug">
                              {item.title}
                            </h4>

                            <p className="text-[10px] text-slate-400 line-clamp-2">
                              {item.summary}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-850">
                              <span>{item.rackNumber ? `📍 Rack ${item.rackNumber}` : item.branch}</span>
                              {item.fileUrl ? (
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-cyan-400 hover:underline font-bold flex items-center gap-1"
                                >
                                  <FiDownload className="w-3 h-3" /> Download PDF
                                </a>
                              ) : (
                                <span className="text-amber-400 font-semibold">{item.bookCode || "Library Ref"}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 space-y-2">
                      <FiLayers className="w-10 h-10 mx-auto text-slate-700" />
                      <p className="text-xs font-semibold">Enter a search query to search database materials and vector documents.</p>
                    </div>
                  )}
                </div>
              )}

              {/* BODY 3: LIVE WEB BOOK SCRAPER MODE */}
              {activeMode === "web" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <FiGlobe className="w-4 h-4" /> Live Open Library & Google Books Search
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webQuery}
                        onChange={(e) => setWebQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleWebSearch()}
                        placeholder="Search millions of online books (e.g. Operating Systems)..."
                        className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleWebSearch()}
                        disabled={loadingWeb}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiSearch className="w-3.5 h-3.5" /> Scrape
                      </button>
                    </div>
                  </div>

                  {loadingWeb ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-2">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-400" />
                      <span className="text-xs text-slate-400">Scraping Open Library repository...</span>
                    </div>
                  ) : webBooks.length > 0 ? (
                    <div className="space-y-3">
                      {webBooks.map((book) => (
                        <div
                          key={book.id}
                          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-xl flex gap-3 items-start transition"
                        >
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded bg-slate-950 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-14 bg-slate-950 rounded flex items-center justify-center text-slate-600 flex-shrink-0">
                              <FiBookOpen className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-1">
                            <span className="text-[8px] uppercase font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">
                              {book.source}
                            </span>
                            <h4 className="text-xs font-bold text-slate-100 truncate">
                              {book.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate">By {book.author}</p>
                            <a
                              href={book.readUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline font-bold"
                            >
                              <FiExternalLink className="w-3 h-3" /> Read Online
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 space-y-2">
                      <FiGlobe className="w-10 h-10 mx-auto text-slate-700" />
                      <p className="text-xs font-semibold">Search for open-access books online directly without server storage overhead.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalAIAssistant;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { baseApiURL } from "../../baseUrl";
import {
  FiSend,
  FiCpu,
  FiMessageSquare,
  FiInfo,
  FiPaperclip,
  FiX,
  FiFileText,
  FiDatabase,
  FiDownload,
  FiGlobe,
  FiExternalLink,
  FiSearch,
  FiLayers,
  FiPlusCircle,
  FiCheckCircle,
  FiZap
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const AIAssistant = () => {
  const router = useLocation();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'rag' | 'web'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // RAG & Materials State
  const [ragQuery, setRagQuery] = useState("");
  const [ragResults, setRagResults] = useState(null);
  const [loadingRag, setLoadingRag] = useState(false);

  // Open Source Web Scraper State
  const [webQuery, setWebQuery] = useState("Data Structures");
  const [webBooks, setWebBooks] = useState([]);
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [vectorizingId, setVectorizingId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const userRole = router.state?.type?.toLowerCase() || "student";

  const suggestions = [
    { label: "📊 Check my attendance", text: "What is my current attendance percentage?" },
    { label: "📚 Search Study Materials", text: "What study materials and PDFs are available for my branch?" },
    { label: "📅 Show my timetable", text: "Show my class schedule / timetable for the semester." },
    { label: "📝 Leave application format", text: "Give me a leave application format." },
    { label: "🏆 Predict academic risk", text: "Am I currently at any academic or attendance risk?" }
  ];

  // Welcome message
  useEffect(() => {
    const welcomeMsg = {
      id: "welcome",
      sender: "bot",
      text: `👋 **Welcome to the ECAP AI & RAG Academic Assistant!**

I can answer general questions (coding, math, writing, etc.) and analyze uploaded images or documents (PDF, Text).

I also have direct access to:
- 📊 **Attendance, Marks & Timetables**
- 📚 **Uploaded Faculty Study Materials & Question Papers (with direct PDF links)**
- 📍 **Library Catalog Books & Rack Locations**
- 🌐 **Open Source Web Scraped Textbooks**

How can I help you today? You can type a question, upload a file, or select one of the quick options below!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([welcomeMsg]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, activeTab]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: file.name,
        mimeType: file.type,
        base64: reader.result.split(",")[1]
      });
      toast.success(`Attached: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 1. Send Message (Auto-detects Material queries & routes to RAG or AI)
  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim() && !selectedFile) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      attachment: selectedFile ? { ...selectedFile } : null,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    const filePayload = selectedFile ? { ...selectedFile } : null;
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const isMaterialQuery = /material|pyq|paper|question paper|book|rack|pdf|download|notes/i.test(queryText);

      let response;
      if (isMaterialQuery && !filePayload) {
        response = await axios.post(
          `${baseApiURL()}/library/rag/query`,
          { query: queryText, topK: 4 },
          { headers }
        );

        if (response.data?.success) {
          setIsAiMode(true);
          const botMsg = {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: response.data.answer,
            sources: response.data.sources || [],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      } else {
        const chatHistory = messages.map((m) => ({
          sender: m.sender,
          text: m.text
        }));

        response = await axios.post(
          `${baseApiURL()}/ai/chat`,
          { message: queryText, history: chatHistory, file: filePayload },
          { headers }
        );

        if (response.data?.success) {
          setIsAiMode(response.data.mode === "AI");
          const botMsg = {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: response.data.reply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I encountered an issue connecting to the AI service. Please try again in a few moments.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct RAG Search
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
      toast.error("Failed to query RAG database");
    } finally {
      setLoadingRag(false);
    }
  };

  // 3. Open Source Web Scraper Search
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
        toast.success(`Found ${res.data.count || 0} online books for "${q}"`);
      }
    } catch (err) {
      console.error("Web Search Error:", err);
      toast.error("Failed to scrape online books");
    } finally {
      setLoadingWeb(false);
    }
  };

  // Vectorize Online Book into RAG
  const handleVectorizeBook = async (book) => {
    setVectorizingId(book.id);
    const toastId = toast.loading(`Vectorizing "${book.title}"...`);
    try {
      const res = await axios.post(`${baseApiURL()}/library/rag/ingest`, {
        title: book.title,
        documentType: "catalog",
        content: `${book.title} Author: ${book.author} Published: ${book.publishedYear}. Summary: ${book.summary}`,
        summary: book.summary,
        author: book.author,
        publishedYear: book.publishedYear !== "N/A" ? Number(book.publishedYear) : undefined,
        branch: "General",
        fileUrl: book.readUrl,
        tags: book.subjects || []
      });
      if (res.data?.success) {
        toast.success(`"${book.title}" added to AI RAG Index!`, { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to vectorize book", { id: toastId });
    } finally {
      setVectorizingId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 🌟 Header Banner */}
      <div className="bento-header-banner flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
              <FiCpu className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-ping" />
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                ECAP Campus AI & RAG Assistant
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 flex items-center gap-1">
                <FiZap className="w-3 h-3 text-amber-500" /> {isAiMode ? "LLM Powered Engine" : "Active Standard Engine"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ask about timetables, attendance, study materials, PYQs, and open-source web books
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 font-medium">
          <FiInfo className="mr-1.5 text-indigo-600 w-4 h-4" />
          <span>Supports image/PDF upload & RAG vector search</span>
        </div>
      </div>

      {/* 🔲 Navigation Tabs */}
      <div className="bento-card p-1.5 bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === "chat"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <FiMessageSquare className="w-4 h-4" />
          <span>AI Academic Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab("rag")}
          className={`flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === "rag"
              ? "bg-white text-cyan-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <FiDatabase className="w-4 h-4 text-cyan-600" />
          <span>RAG Database & Materials</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("web");
            if (webBooks.length === 0) handleWebSearch("Data Structures");
          }}
          className={`flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === "web"
              ? "bg-white text-emerald-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <FiGlobe className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>Open Source Web Scraper</span>
        </button>
      </div>

      {/* Main Glassmorphic Dark Content Box */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden shadow-xl min-h-[600px] flex flex-col">

        {/* VIEW 1: AI ACADEMIC CHAT */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col h-[600px]">
            {/* Messages area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-md ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                          : "bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60"
                      }`}
                    >
                      {/* Attachment Render */}
                      {msg.attachment && (
                        <div className="mb-2.5 pb-2 border-b border-white/10 max-w-full">
                          {msg.attachment.mimeType.startsWith("image/") ? (
                            <img
                              src={`data:${msg.attachment.mimeType};base64,${msg.attachment.base64}`}
                              alt="Attachment"
                              className="max-h-48 rounded-lg object-contain bg-slate-950/40 p-1 border border-white/10"
                            />
                          ) : (
                            <div className="flex items-center gap-2.5 p-2.5 bg-slate-950/40 rounded-xl border border-white/5">
                              <FiFileText className="text-cyan-400 w-5 h-5 flex-shrink-0" />
                              <div className="overflow-hidden">
                                <p className="text-xs font-semibold truncate text-slate-200">{msg.attachment.name}</p>
                                <p className="text-[9px] text-slate-400 capitalize">{msg.attachment.mimeType.split("/")[1]} Document</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text Render with PDF Download Card Interceptor */}
                      <div className="text-sm leading-relaxed whitespace-pre-wrap space-y-1">
                        {msg.text.split("\n").map((line, lIdx) => {
                          if (!line || !line.trim()) return null;

                          // Detect Cloudinary / S3 / HTTP PDF Links and render interactive PDF cards!
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
                              <div key={lIdx} className="my-2 p-3 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-cyan-500/50 transition flex items-center justify-between gap-3 shadow-md">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 flex-shrink-0">
                                    <FiFileText className="w-4 h-4" />
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-slate-200 truncate">
                                      {fileTitle || "Study Material PDF"}
                                    </p>
                                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50 inline-block mt-0.5">
                                      PDF Document
                                    </span>
                                  </div>
                                </div>

                                <a
                                  href={cleanUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
                                >
                                  <FiDownload className="w-3.5 h-3.5" />
                                  <span>View / Download PDF</span>
                                </a>
                              </div>
                            );
                          }

                          if (line.startsWith("### ") || line.startsWith("## ")) {
                            return <h3 key={lIdx} className="font-bold text-cyan-300 mt-2 mb-1 text-sm">{line.replace(/#+\s/, "")}</h3>;
                          }
                          if (line.startsWith("- ") || line.startsWith("* ")) {
                            return <li key={lIdx} className="ml-3 list-disc my-0.5">{line.substring(2)}</li>;
                          }
                          return <p key={lIdx} className="my-0.5">{line}</p>;
                        })}
                      </div>

                      {/* Vector Sources Cards if returned */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <FiDatabase className="w-3 h-3" /> Vector Retrieved Sources ({msg.sources.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <div key={sIdx} className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-200 truncate">{src.title}</span>
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
                        </div>
                      )}

                      <div className="text-[9px] text-right mt-1.5 opacity-60">{msg.time}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <div className="flex justify-start items-center space-x-2">
                  <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl px-4 py-3 rounded-bl-none flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <span className="text-xs text-slate-400">ECAP AI Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && !selectedFile && (
              <div className="px-4 md:px-6 py-3 bg-slate-900 border-t border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.text)}
                    className="inline-flex items-center text-xs bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white px-3.5 py-1.5 rounded-full border border-slate-700 hover:border-indigo-500 transition-all duration-200 shadow-sm font-medium"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Selected File Drawer */}
            {selectedFile && (
              <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-hidden">
                  {selectedFile.mimeType.startsWith("image/") ? (
                    <img
                      src={`data:${selectedFile.mimeType};base64,${selectedFile.base64}`}
                      alt="Upload preview"
                      className="w-10 h-10 rounded object-cover bg-slate-800 border border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-850 border border-slate-700 flex items-center justify-center">
                      <FiFileText className="text-cyan-400 w-5 h-5" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-200 truncate font-semibold">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{selectedFile.mimeType.split("/")[1]}</p>
                  </div>
                </div>
                <button
                  onClick={removeSelectedFile}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-750 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input panel */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-900/60 flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf,text/plain"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                title="Upload image or document"
                className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-40"
              >
                <FiPaperclip className="w-5 h-5" />
              </button>

              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything, request study materials or upload notes..."
                className="flex-1 bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-none max-h-24 scrollbar-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || (!inputText.trim() && !selectedFile)}
                className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 disabled:opacity-40 shadow-lg shadow-blue-500/10 hover:shadow-cyan-500/20 transform active:scale-95 disabled:pointer-events-none"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: RAG DATABASE MATERIALS MODE */}
        {activeTab === "rag" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <FiDatabase className="w-5 h-5" /> Direct Vector RAG Search across Study Materials & Question Papers
              </h3>
              <p className="text-xs text-slate-400">
                Type any subject or topic to search faculty-uploaded PDFs, previous year question papers (PYQs), and library books.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRAGSearch()}
                  placeholder="Enter subject or topic (e.g. HCI, Data Structures, DBMS, Machine Learning)..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleRAGSearch()}
                  disabled={loadingRag}
                  className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSearch className="w-4 h-4" /> Search Vectors
                </button>
              </div>
            </div>

            {loadingRag ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
                <span className="text-xs text-slate-400">Querying Pinecone Vector Index & MongoDB Materials...</span>
              </div>
            ) : ragResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold">Retrieved {ragResults.sources?.length || 0} Material Results</span>
                  <span className="text-cyan-400 font-mono text-[10px]">Pinecone Vector Engine</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ragResults.sources?.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-2xl transition space-y-2.5 flex flex-col justify-between shadow-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-indigo-950 text-indigo-300 rounded-full border border-indigo-800">
                            {item.documentType?.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                            {item.score}% Match
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100 leading-snug">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {item.summary}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">{item.rackNumber ? `📍 Rack ${item.rackNumber}` : item.branch}</span>
                        {item.fileUrl ? (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition hover:opacity-90"
                          >
                            <FiDownload className="w-3.5 h-3.5" /> View / Download PDF
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
              <div className="text-center py-16 text-slate-500 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800">
                <FiDatabase className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">Search for study notes, lecture PDFs, and question papers directly.</p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: OPEN SOURCE WEB SCRAPER MODE */}
        {activeTab === "web" && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <FiGlobe className="w-5 h-5" /> Live Open Source Web Textbooks Scraper
              </h3>
              <p className="text-xs text-slate-400">
                Search Open Library & Google Books live. Read online or vectorize directly into your RAG database.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={webQuery}
                  onChange={(e) => setWebQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleWebSearch()}
                  placeholder="Enter topic or textbook name (e.g. Operating Systems, Computer Networks)..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleWebSearch()}
                  disabled={loadingWeb}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                >
                  <FiSearch className="w-4 h-4" /> Scrape Online
                </button>
              </div>
            </div>

            {loadingWeb ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
                <span className="text-xs text-slate-400">Scraping Open Library repository...</span>
              </div>
            ) : webBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {webBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl transition flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        {book.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded bg-slate-900 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-16 bg-slate-900 rounded flex items-center justify-center text-slate-600 flex-shrink-0">
                            <FiGlobe className="w-6 h-6" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">
                            {book.source}
                          </span>
                          <h4 className="text-xs font-bold text-slate-100 truncate mt-1">{book.title}</h4>
                          <p className="text-[10px] text-slate-400 truncate">By {book.author}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{book.summary}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between text-xs">
                      <a
                        href={book.readUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline font-bold flex items-center gap-1 text-xs"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" /> Read Online
                      </a>
                      <button
                        onClick={() => handleVectorizeBook(book)}
                        disabled={vectorizingId === book.id}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[10px] transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <FiPlusCircle className="w-3 h-3 text-emerald-400" /> Vectorize
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800">
                <FiGlobe className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-sm font-semibold text-slate-400">Search for open-access books online directly.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AIAssistant;

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { baseApiURL } from "../../baseUrl";
import { FiSend, FiCpu, FiMessageSquare, FiInfo, FiPaperclip, FiX, FiFileText } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const AIAssistant = () => {
  const router = useLocation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(false); // Indicates if backend is running in full AI mode
  const [selectedFile, setSelectedFile] = useState(null); // { name, mimeType, base64 }
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Quick suggestion chips depending on user type
  const userRole = router.state?.type?.toLowerCase() || "student";
  
  const getSuggestions = () => {
    if (userRole === "student") {
      return [
        { label: "📊 Check my attendance", text: "What is my current attendance percentage?" },
        { label: "📅 Show my timetable", text: "Show my class schedule / timetable for the semester." },
        { label: "📝 Leave application format", text: "Give me a leave application format." },
        { label: "📚 My issued books", text: "Do I have any books currently issued from the library?" },
        { label: "🏆 Predict academic risk", text: "Am I currently at any academic or attendance risk?" }
      ];
    } else if (userRole === "faculty") {
      return [
        { label: "📋 Student risk rules", text: "How is student risk calculated?" },
        { label: "📅 Leave approval guide", text: "How can I apply for leave?" },
        { label: "🔍 Check section anomalies", text: "How can I detect attendance anomalies in my classes?" }
      ];
    } else {
      return [
        { label: "💡 System status", text: "What are the capabilities of the ECAP AI engine?" }
      ];
    }
  };

  const suggestions = getSuggestions();

  // Welcome message on mount
  useEffect(() => {
    const welcomeMsg = {
      id: "welcome",
      sender: "bot",
      text: `Hello! I am your ECAP Academic AI Assistant. 

I can answer general questions (coding, math, writing, etc.) and analyze uploaded images or documents (PDF, Text).

I also have access to your college context including your current courses, attendance history, timetable, and library records.

How can I help you today? You can type a question, upload a file, or select one of the quick options below!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 5MB
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

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim() && !selectedFile) return;

    // Add user message with optional attachment details
    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: queryText,
      attachment: selectedFile ? { ...selectedFile } : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

      // We send both the query and a brief history slice
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await axios.post(
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
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Sorry, I encountered an issue connecting to the AI service. Please try again in a few moments.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[75vh] md:h-[80vh] bg-gradient-to-br from-slate-900 to-indigo-950 text-slate-100 rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
      
      {/* Upper header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-950/70 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <FiCpu className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-ping" />
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>
          <div>
            <h2 className="font-bold text-sm md:text-base bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              ECAP Campus AI Assistant
            </h2>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-slate-400">Status: Active</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-semibold border border-slate-700">
                {isAiMode ? "LLM Powered" : "Standard Engine"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <FiInfo className="mr-1 text-cyan-400" />
          <span>Supports uploading Images & PDF/Text documents directly.</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                    : "bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/60"
                }`}
              >
                {/* File Attachment Render */}
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

                {/* Text render with simple markdown helper */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text.split("\n").map((line, i) => {
                    // Render bold headings
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return <strong key={i} className="block text-cyan-300 mt-2 mb-1">{line.replace(/\*\*/g, "")}</strong>;
                    }
                    if (line.startsWith("- ")) {
                      return <li key={i} className="ml-3 list-disc my-0.5">{line.substring(2)}</li>;
                    }
                    return <p key={i} className="min-h-[1em]">{line}</p>;
                  })}
                </div>
                <div className="text-[9px] text-right mt-1.5 opacity-60">
                  {msg.time}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start items-center space-x-2"
          >
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl px-4 py-3 rounded-bl-none flex items-center space-x-2">
              <div className="flex space-x-1">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-slate-400">ECAP AI is processing...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 2 && !selectedFile && (
        <div className="px-4 md:px-6 py-2 bg-slate-950/20 border-t border-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(s.text)}
              className="inline-flex items-center text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 px-3.5 py-1.5 rounded-full border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Selected File Preview Drawer */}
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
        
        {/* Attachment button */}
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
          placeholder="Ask me anything, upload images or documents..."
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
  );
};

export default AIAssistant;

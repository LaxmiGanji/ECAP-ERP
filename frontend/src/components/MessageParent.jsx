import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../baseUrl";
import { 
  FiSearch, FiSend, FiUser, FiPhone, FiMail, FiBookOpen, 
  FiCalendar, FiMessageSquare, FiCopy, FiCheck, FiClock, 
  FiCheckCircle, FiAlertCircle, FiRefreshCw, FiExternalLink, FiShare2
} from "react-icons/fi";

const MessageParent = ({ userType = "Faculty", currentUser, initialEnrollmentNo = "" }) => {
  const [activeTab, setActiveTab] = useState("compose");
  const [searchRoll, setSearchRoll] = useState(initialEnrollmentNo);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [parentPortalLink, setParentPortalLink] = useState("");
  const [studentMessages, setStudentMessages] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [recipientType, setRecipientType] = useState("Primary");
  const [category, setCategory] = useState("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedChannels, setSelectedChannels] = useState(["PORTAL", "SMS", "WHATSAPP", "EMAIL"]);
  const [sending, setSending] = useState(false);

  // History tab state
  const [historyMessages, setHistoryMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilterCategory, setHistoryFilterCategory] = useState("All");

  useEffect(() => {
    if (initialEnrollmentNo) {
      setSearchRoll(initialEnrollmentNo);
      fetchStudentByRoll(initialEnrollmentNo);
    }
  }, [initialEnrollmentNo]);

  // Lookup student details by enrollment roll number
  const fetchStudentByRoll = async (roll) => {
    const queryRoll = roll || searchRoll;
    if (!queryRoll || !queryRoll.trim()) {
      toast.error("Please enter a valid student enrollment roll number.");
      return;
    }

    setLoadingStudent(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseApiURL()}/parent-message/lookup/${queryRoll.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setStudentData(res.data.student);
        setParentPortalLink(res.data.parentPortalLink);
        setStudentMessages(res.data.recentMessages || []);
        toast.success(`Found student: ${res.data.student.fullName}`);
      } else {
        setStudentData(null);
        toast.error(res.data.message || "Student not found");
      }
    } catch (err) {
      console.error(err);
      setStudentData(null);
      toast.error(err.response?.data?.message || "No student record found with this enrollment roll.");
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudentByRoll(searchRoll);
  };

  // Quick Message Templates
  const applyTemplate = (tplType) => {
    if (!studentData) {
      toast.error("Please search and select a student first!");
      return;
    }

    const sName = studentData.firstName || studentData.fullName;
    const sRoll = studentData.enrollmentNo;

    switch (tplType) {
      case "ATTENDANCE":
        setCategory("Attendance");
        setSubject(`Attendance Alert for ${sName} (${sRoll})`);
        setMessage(
          `Dear Parent,\nThis is to inform you that your ward ${sName} (${sRoll}) has accumulated low attendance in recent classes. Kindly ensure regular attendance to avoid academic detention.\nRegards,\n${userType} Office, Sphoorthy Engineering College.`
        );
        break;
      case "ACADEMIC":
        setCategory("Academic");
        setSubject(`Academic Progress Update - ${sName}`);
        setMessage(
          `Dear Parent,\nWe request you to review the recent internal examination performance for ${sName} (${sRoll}). Please visit the Parent Portal or meet the faculty during office hours to discuss progress.\nRegards,\nFaculty Incharge.`
        );
        break;
      case "DISCIPLINE":
        setCategory("Discipline");
        setSubject(`Important Discipline Notice - ${sName}`);
        setMessage(
          `Dear Parent,\nThis notice is issued regarding a conduct matter involving your ward ${sName} (${sRoll}) on campus. You are requested to contact the HOD / Mentor office at the earliest.\nRegards,\nCampus Administrative Office.`
        );
        break;
      case "FEE":
        setCategory("Fee");
        setSubject(`Fee Due Reminder for ${sName}`);
        setMessage(
          `Dear Parent,\nThis is a gentle reminder regarding pending academic/hostel/transport fee dues for your ward ${sName} (${sRoll}). Kindly clear the dues at the accounts section to prevent any disruption.\nThank you.`
        );
        break;
      case "MEETING":
        setCategory("General");
        setSubject(`Parent-Teacher Meeting Invitation - ${sName}`);
        setMessage(
          `Dear Parent,\nYou are cordially invited to attend the upcoming Parent-Teacher Meeting to discuss the academic growth and career development of ${sName} (${sRoll}).\nDate & Time: Saturday 10:00 AM.\nVenue: Department Seminar Hall.`
        );
        break;
      case "PRAISE":
        setCategory("General");
        setSubject(`Academic Appreciation for ${sName}!`);
        setMessage(
          `Dear Parent,\nWe are pleased to share that your ward ${sName} (${sRoll}) has demonstrated outstanding performance and commendable dedication in recent academic activities! Keep up the great work.\nRegards,\nDepartment Faculty.`
        );
        break;
      default:
        break;
    }
    toast.success("Template applied successfully!");
  };

  // Toggle notification channel chip
  const toggleChannel = (channel) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length === 1) {
        toast.error("At least one notification channel must be selected.");
        return;
      }
      setSelectedChannels(selectedChannels.filter(c => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  // Send message submit
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!studentData) {
      toast.error("Please search and select a valid student first.");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a message subject.");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter the message body.");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        enrollmentNo: studentData.enrollmentNo,
        recipientType,
        subject: subject.trim(),
        message: message.trim(),
        category,
        channels: selectedChannels,
        senderId: currentUser?.loginid || currentUser?._id || "admin",
        senderName: currentUser?.name || currentUser?.loginid || `${userType} Staff`,
        senderRole: userType
      };

      const res = await axios.post(`${baseApiURL()}/parent-message/send`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(res.data.message || "Message dispatched successfully!");
        setSubject("");
        setMessage("");
        // Add new message to local student messages
        if (res.data.data) {
          setStudentMessages([res.data.data, ...studentMessages]);
        }
      } else {
        toast.error(res.data.message || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error sending message to parent.");
    } finally {
      setSending(false);
    }
  };

  // Copy parent portal link
  const copyLinkToClipboard = () => {
    if (!parentPortalLink) return;
    navigator.clipboard.writeText(parentPortalLink);
    setCopiedLink(true);
    toast.success("Parent Portal link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Fetch all history messages for tab 2
  const fetchAllHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${baseApiURL()}/parent-message/history?limit=100`;
      if (historyFilterCategory !== "All") {
        url += `&category=${historyFilterCategory}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistoryMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load global messaging history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchAllHistory();
    }
  }, [activeTab, historyFilterCategory]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
            <FiMessageSquare className="text-[280px]" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/20 mb-3">
                <FiMessageSquare /> Parent Communications Hub
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Message Parent by Enrollment Roll
              </h1>
              <p className="text-blue-100 text-sm mt-1 max-w-2xl">
                Lookup any student by roll number to communicate directly with parents via Parent Portal, SMS, WhatsApp, or Email.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center bg-black/20 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm self-start md:self-auto">
              <button
                onClick={() => setActiveTab("compose")}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                  activeTab === "compose"
                    ? "bg-white text-blue-900 shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <FiSend /> Compose Message
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                  activeTab === "history"
                    ? "bg-white text-blue-900 shadow-md"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <FiClock /> Communication Logs
              </button>
            </div>
          </div>
        </div>

        {activeTab === "compose" && (
          <div className="space-y-6">
            
            {/* Enrollment Roll Search Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    value={searchRoll}
                    onChange={(e) => setSearchRoll(e.target.value.toUpperCase())}
                    placeholder="Enter Student Enrollment Roll Number (e.g. 21TK1A0501)..."
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-semibold tracking-wide outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingStudent}
                  className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {loadingStudent ? (
                    <>
                      <FiRefreshCw className="animate-spin" /> Searching...
                    </>
                  ) : (
                    <>
                      <FiSearch /> Search Roll
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Main Split Grid: Student Summary & Message Form */}
            {studentData ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Card: Student & Parent Profile */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Student Details Card */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md space-y-6">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-500/20 shrink-0">
                        {studentData.firstName ? studentData.firstName.charAt(0) : "S"}
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Active Student
                        </span>
                        <h2 className="text-lg font-extrabold text-gray-900 mt-1 leading-tight">
                          {studentData.fullName}
                        </h2>
                        <p className="text-xs font-mono font-bold text-gray-500">{studentData.enrollmentNo}</p>
                      </div>
                    </div>

                    {/* Academic Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Branch</span>
                        <span className="font-extrabold text-gray-800">{studentData.branch}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Semester</span>
                        <span className="font-extrabold text-gray-800">Sem {studentData.semester}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Section</span>
                        <span className="font-extrabold text-gray-800">Section {studentData.section}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Regulation</span>
                        <span className="font-extrabold text-gray-800">{studentData.regulation || "R20"}</span>
                      </div>
                    </div>

                    {/* Parents & Contact Details */}
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Parent Contact Details</h3>
                      
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-blue-900">Father:</span>
                          <span className="font-semibold text-gray-700">{studentData.FatherName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-blue-700 font-mono font-bold">
                          <FiPhone size={12} /> {studentData.FatherPhoneNumber}
                        </div>
                      </div>

                      <div className="p-3 bg-pink-50/60 rounded-xl border border-pink-100 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-pink-900">Mother:</span>
                          <span className="font-semibold text-gray-700">{studentData.MotherName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-pink-700 font-mono font-bold">
                          <FiPhone size={12} /> {studentData.MotherPhoneNumber}
                        </div>
                      </div>

                      {studentData.email && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-bold">Email:</span>
                          <span className="font-semibold text-gray-700 truncate max-w-[180px]">{studentData.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Parent Portal Link Box */}
                    {parentPortalLink && (
                      <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 border border-slate-800 shadow-inner">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-400 flex items-center gap-1.5">
                            <FiShare2 /> Dedicated Parent Portal
                          </span>
                          <button
                            onClick={copyLinkToClipboard}
                            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded border border-slate-700 transition-all flex items-center gap-1"
                          >
                            {copiedLink ? <FiCheck className="text-green-400" /> : <FiCopy />}
                            {copiedLink ? "Copied" : "Copy Link"}
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 break-all bg-slate-950 p-2 rounded border border-slate-800/80">
                          {parentPortalLink}
                        </div>
                        <a
                          href={parentPortalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline font-semibold"
                        >
                          Open Parent View <FiExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: Message Composer Form */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-md space-y-6">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <FiSend className="text-blue-600" /> Compose Message to Parent
                      </h2>
                      <p className="text-xs text-gray-500">Fill in message details or choose a quick template below.</p>
                    </div>

                    {/* Target Recipient Pills */}
                    <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                      {["Primary", "Father", "Mother", "Both"].map((rType) => (
                        <button
                          key={rType}
                          type="button"
                          onClick={() => setRecipientType(rType)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            recipientType === rType
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {rType}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Template Chips */}
                  <div>
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
                      ⚡ Quick Message Templates
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyTemplate("ATTENDANCE")}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl transition-all"
                      >
                        ⚠️ Low Attendance Warning
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("ACADEMIC")}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-all"
                      >
                        📊 Academic Progress Alert
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("DISCIPLINE")}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-all"
                      >
                        🚨 Discipline Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("FEE")}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition-all"
                      >
                        💳 Fee Due Reminder
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("MEETING")}
                        className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold rounded-xl transition-all"
                      >
                        🤝 Parent Meeting Request
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("PRAISE")}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl transition-all"
                      >
                        🌟 Appreciation Note
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSendMessage} className="space-y-5">
                    
                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Message Category / Tag
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs font-bold text-gray-800 outline-none transition-all"
                      >
                        <option value="General">General Notice</option>
                        <option value="Attendance">Attendance Alert</option>
                        <option value="Academic">Academic Performance</option>
                        <option value="Discipline">Behavior / Discipline</option>
                        <option value="Fee">Fee Reminder</option>
                        <option value="Emergency">Urgent Emergency</option>
                      </select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Urgent Notice Regarding Attendance Shortage..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs font-semibold text-gray-800 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Message Body */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Message Content
                        </label>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {message.length} characters
                        </span>
                      </div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows="5"
                        placeholder="Write message content here..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent text-xs text-gray-800 leading-relaxed outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Notification Channel Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                        Delivery Channels
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[
                          { id: "PORTAL", label: "In-App Parent Portal", desc: "Stored in student's dashboard" },
                          { id: "SMS", label: "SMS Gateway", desc: "Phone SMS alert" },
                          { id: "WHATSAPP", label: "WhatsApp Business", desc: "WhatsApp message" },
                          { id: "EMAIL", label: "Email Alert", desc: "Parent/student email" }
                        ].map((ch) => {
                          const isSelected = selectedChannels.includes(ch.id);
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => toggleChannel(ch.id)}
                              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                isSelected
                                  ? "bg-blue-50 border-blue-500 text-blue-800 shadow-sm"
                                  : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"
                              }`}>
                                {isSelected && <FiCheck size={10} />}
                              </div>
                              <span>{ch.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Send Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        {sending ? (
                          <>
                            <FiRefreshCw className="animate-spin text-base" /> Dispatching Message...
                          </>
                        ) : (
                          <>
                            <FiSend className="text-base" /> Send Message to Parent
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>

              </div>
            ) : (
              /* Placeholder state before searching */
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-md">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-100">
                  <FiSearch />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Search for a Student by Enrollment Roll</h3>
                <p className="text-gray-500 text-xs mt-1 max-w-md mx-auto">
                  Enter an enrollment roll number in the search bar above to fetch student details and start composing a message to their parent.
                </p>
              </div>
            )}

            {/* Student Recent Messages Table */}
            {studentData && studentMessages.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md space-y-4">
                <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                  <FiClock className="text-blue-600" /> Past Communication Log for {studentData.fullName}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Recipient</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Sent By</th>
                        <th className="py-3 px-4">Channels</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentMessages.map((msg) => (
                        <tr key={msg._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                            {new Date(msg.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              msg.category === "Attendance" ? "bg-amber-100 text-amber-800" :
                              msg.category === "Academic" ? "bg-blue-100 text-blue-800" :
                              msg.category === "Discipline" ? "bg-rose-100 text-rose-800" :
                              msg.category === "Fee" ? "bg-emerald-100 text-emerald-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {msg.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-800">
                            {msg.recipientName || msg.recipientType}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 max-w-xs truncate">
                            {msg.subject}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {msg.senderName} ({msg.senderRole})
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              {(msg.sentVia || ["PORTAL"]).map((ch, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                  {ch}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Global History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <FiClock className="text-blue-600" /> Communication Dispatch History Log
                </h2>
                <p className="text-xs text-gray-500">Review all messages sent to parents by faculty and administrators.</p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500">Filter Category:</span>
                <select
                  value={historyFilterCategory}
                  onChange={(e) => setHistoryFilterCategory(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="General">General</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Academic">Academic</option>
                  <option value="Discipline">Discipline</option>
                  <option value="Fee">Fee</option>
                  <option value="Emergency">Emergency</option>
                </select>
                <button
                  onClick={fetchAllHistory}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors"
                  title="Refresh Log"
                >
                  <FiRefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : historyMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No communication records found for the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[10px] tracking-wider">
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Sender</th>
                      <th className="py-3 px-4">Channels</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyMessages.map((msg) => (
                      <tr key={msg._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                          {new Date(msg.createdAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {msg.enrollmentNo}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          {msg.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700">
                          {msg.recipientName || msg.recipientType}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            msg.category === "Attendance" ? "bg-amber-100 text-amber-800" :
                            msg.category === "Academic" ? "bg-blue-100 text-blue-800" :
                            msg.category === "Discipline" ? "bg-rose-100 text-rose-800" :
                            msg.category === "Fee" ? "bg-emerald-100 text-emerald-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {msg.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800 max-w-xs truncate">
                          {msg.subject}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          {msg.senderName} ({msg.senderRole})
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex gap-1">
                            {(msg.sentVia || ["PORTAL"]).map((ch, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageParent;

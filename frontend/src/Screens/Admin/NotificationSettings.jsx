import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";
import { 
  FiMail, FiMessageCircle, FiPhone, FiCheck, FiSettings, 
  FiClock, FiSliders, FiFileText, FiActivity, FiServer 
} from "react-icons/fi";

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    smsEnabled: false,
    emailEnabled: false,
    whatsappEnabled: false,
    autoAbsentAlert: true,
    absentAlertMode: "DAILY_CONSOLIDATED",
    autoResultAlert: true,
    smsGatewayUrl: "",
    smsApiKey: "",
    twilioSid: "",
    twilioToken: "",
    twilioFromNumber: "",
    whatsappToken: "",
    whatsappPhoneNumberId: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    absentInstantTemplate: "",
    absentConsolidatedTemplate: "",
    resultsTemplate: ""
  });

  const [activeTab, setActiveTab] = useState("settings"); // "settings" or "logs"

  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [testPhoneNum, setTestPhoneNum] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

  // Fetch settings from API
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseApiURL()}/notification/settings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  // Dispatch Test Email
  const handleTestEmail = async () => {
    if (!testEmailAddr.trim()) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    setTestingEmail(true);
    const testToast = toast.loading("Sending test email...");
    try {
      const res = await axios.post(`${baseApiURL()}/notification/test-email`, { targetEmail: testEmailAddr.trim() }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.dismiss(testToast);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || "Failed to send test email");
      }
    } catch (err) {
      toast.dismiss(testToast);
      toast.error(err.response?.data?.message || err.message || "Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  // Dispatch Test SMS
  const handleTestSMS = async () => {
    if (!testPhoneNum.trim()) {
      toast.error("Please enter a recipient phone number.");
      return;
    }
    setTestingSMS(true);
    const testToast = toast.loading("Sending test SMS...");
    try {
      const res = await axios.post(`${baseApiURL()}/notification/test-sms`, { targetPhone: testPhoneNum.trim() }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      toast.dismiss(testToast);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || "Failed to send test SMS");
      }
    } catch (err) {
      toast.dismiss(testToast);
      toast.error(err.response?.data?.message || err.message || "Failed to send test SMS");
    } finally {
      setTestingSMS(false);
    }
  };

  // Fetch logs from API
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await axios.get(`${baseApiURL()}/notification/logs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.data.success) {
        setLogs(response.data.logs);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch notification logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab]);

  // Handle setting updates locally
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Handle custom dropdowns or toggles
  const setDirectValue = (name, value) => {
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save settings to DB
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const saveToast = toast.loading("Saving configuration...");
    try {
      const response = await axios.post(
        `${baseApiURL()}/notification/settings/update`,
        settings,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      toast.dismiss(saveToast);
      if (response.data.success) {
        toast.success("Settings updated successfully!");
        setSettings(response.data.settings);
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.dismiss(saveToast);
      console.error(error);
      toast.error(error.response?.data?.error || "Error saving configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header section with styling */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Notification Console
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Configure automated alerts, communication gateways, templates, and track message logs.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl shadow-lg mt-6 md:mt-0 max-w-fit mx-auto md:mx-0 border border-slate-700">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "settings"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FiSettings /> Configuration
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              activeTab === "logs"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FiActivity /> Dispatch Logs
          </button>
        </div>
      </div>

      {activeTab === "settings" ? (
        <form onSubmit={handleSave} className="space-y-8 max-w-6xl mx-auto">
          {/* Card 1: Channel Status Toggles */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl">
            <h2 className="text-xl font-bold flex items-center gap-3 text-blue-400 mb-6">
              <FiSliders /> Active Communication Channels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SMS Toggle */}
              <label className={`relative flex flex-col justify-between p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                settings.smsEnabled 
                  ? "border-blue-500 bg-blue-950/20" 
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 text-2xl">
                    <FiPhone />
                  </div>
                  <input
                    type="checkbox"
                    name="smsEnabled"
                    checked={settings.smsEnabled}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    settings.smsEnabled ? "border-blue-500 bg-blue-500 text-white" : "border-slate-700"
                  }`}>
                    {settings.smsEnabled && <FiCheck size={14} />}
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="font-bold text-lg">SMS Alerts</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Send updates to parent phone numbers via Twilio or an API Gateway.
                  </p>
                </div>
              </label>

              {/* WhatsApp Toggle */}
              <label className={`relative flex flex-col justify-between p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                settings.whatsappEnabled 
                  ? "border-emerald-500 bg-emerald-950/20" 
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 text-2xl">
                    <FiMessageCircle />
                  </div>
                  <input
                    type="checkbox"
                    name="whatsappEnabled"
                    checked={settings.whatsappEnabled}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    settings.whatsappEnabled ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-700"
                  }`}>
                    {settings.whatsappEnabled && <FiCheck size={14} />}
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="font-bold text-lg">WhatsApp Portal</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Send automated chat details using official Meta Business Cloud API.
                  </p>
                </div>
              </label>

              {/* Email Toggle */}
              <label className={`relative flex flex-col justify-between p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                settings.emailEnabled 
                  ? "border-purple-500 bg-purple-950/20" 
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 text-2xl">
                    <FiMail />
                  </div>
                  <input
                    type="checkbox"
                    name="emailEnabled"
                    checked={settings.emailEnabled}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    settings.emailEnabled ? "border-purple-500 bg-purple-500 text-white" : "border-slate-700"
                  }`}>
                    {settings.emailEnabled && <FiCheck size={14} />}
                  </div>
                </div>
                <div className="mt-5">
                  <h3 className="font-bold text-lg">Email Reports</h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Send HTML report cards and full statements using Nodemailer SMTP.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Card 2: System Trigger Logic */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl">
            <h2 className="text-xl font-bold flex items-center gap-3 text-indigo-400 mb-6">
              <FiClock /> Automation Schedules & Triggers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Attendance triggers */}
              <div className="space-y-4 bg-slate-900/30 p-5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">Absence Alerts</h3>
                    <p className="text-xs text-slate-400">Trigger warnings when a student is absent.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoAbsentAlert"
                      checked={settings.autoAbsentAlert}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.autoAbsentAlert && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Alert Delivery Strategy</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDirectValue("absentAlertMode", "INSTANT")}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          settings.absentAlertMode === "INSTANT"
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Instant (Per Period)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDirectValue("absentAlertMode", "DAILY_CONSOLIDATED")}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          settings.absentAlertMode === "DAILY_CONSOLIDATED"
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Consolidated (Daily 5 PM)
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {settings.absentAlertMode === "DAILY_CONSOLIDATED" 
                        ? "✓ Recommended. Collects all absentees and sends one daily message to parents."
                        : "⚠ Sends separate SMS for every absent period immediately when class is marked."}
                    </p>
                  </div>
                )}
              </div>

              {/* Result Triggers */}
              <div className="space-y-4 bg-slate-900/30 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">Results Publishing Alerts</h3>
                    <p className="text-xs text-slate-400">Send notifications when midterm or external marks are uploaded.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoResultAlert"
                      checked={settings.autoResultAlert}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="text-[11px] text-slate-400 pt-4 border-t border-slate-800">
                  Runs instantly in the background as soon as faculty saves student marks.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Gateway Credentials */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl space-y-8">
            <h2 className="text-xl font-bold flex items-center gap-3 text-purple-400 mb-2">
              <FiServer /> Gateway Credentials
            </h2>

            {/* Twilio SMS Setup */}
            {settings.smsEnabled && (
              <div className="space-y-4 p-5 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <h3 className="font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FiPhone /> Twilio SMS Provider Config
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account SID</label>
                    <input
                      type="text"
                      name="twilioSid"
                      value={settings.twilioSid}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Auth Token</label>
                    <input
                      type="password"
                      name="twilioToken"
                      value={settings.twilioToken}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Twilio Phone Number / Sender ID</label>
                    <input
                      type="text"
                      name="twilioFromNumber"
                      value={settings.twilioFromNumber}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                
                {/* Fallback API URL */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Alternative Custom SMS HTTP URL Gateway (Optional)</label>
                  <input
                    type="text"
                    name="smsGatewayUrl"
                    value={settings.smsGatewayUrl}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="https://api.smshorizon.in/api/v2/sendsms.php?apikey={apikey}&to={to}&message={message}"
                  />
                  <small className="text-[10px] text-slate-400 mt-1 block">
                    Use placeholders: <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-400">{`{to}`}</code> for student phone and <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-400">{`{message}`}</code> for templates.
                  </small>
                </div>

                {/* Test SMS Widget */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={testPhoneNum}
                    onChange={(e) => setTestPhoneNum(e.target.value)}
                    placeholder="Enter phone number to test (e.g. +919876543210)"
                    className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleTestSMS}
                    disabled={testingSMS}
                    className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md transition-all shrink-0"
                  >
                    {testingSMS ? "Testing SMS..." : "Test SMS Connection"}
                  </button>
                </div>
              </div>
            )}

            {/* Meta WhatsApp Setup */}
            {settings.whatsappEnabled && (
              <div className="space-y-4 p-5 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <h3 className="font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FiMessageCircle /> Meta WhatsApp Business API Config
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      name="whatsappPhoneNumberId"
                      value={settings.whatsappPhoneNumberId}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="109283749827364"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">System User Access Token</label>
                    <input
                      type="password"
                      name="whatsappToken"
                      value={settings.whatsappToken}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="EAAGxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nodemailer SMTP Config */}
            {settings.emailEnabled && (
              <div className="space-y-4 p-5 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <h3 className="font-bold text-purple-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FiMail /> Nodemailer SMTP Mail Gateway Config
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SMTP Host Server</label>
                    <input
                      type="text"
                      name="smtpHost"
                      value={settings.smtpHost}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SMTP Port</label>
                    <input
                      type="number"
                      name="smtpPort"
                      value={settings.smtpPort}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">From Sender Address</label>
                    <input
                      type="email"
                      name="smtpFrom"
                      value={settings.smtpFrom}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="no-reply@college.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SMTP User / Username</label>
                    <input
                      type="text"
                      name="smtpUser"
                      value={settings.smtpUser}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="college.portal@gmail.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">SMTP Password / Google App Password</label>
                    <input
                      type="password"
                      name="smtpPass"
                      value={settings.smtpPass}
                      onChange={handleChange}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>

                {/* Test Email Widget */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={testEmailAddr}
                    onChange={(e) => setTestEmailAddr(e.target.value)}
                    placeholder="Enter email address to test (e.g. yourname@gmail.com)"
                    className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    className="w-full md:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs shadow-md transition-all shrink-0"
                  >
                    {testingEmail ? "Testing Mail..." : "Test Mail Connection"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Customize Message Templates */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3 text-blue-400 mb-2">
              <FiFileText /> Custom Message Templates
            </h2>
            <p className="text-xs text-slate-400 -mt-2">
              Manage what alerts parents see. You can inject placeholders: 
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{student_name}`}</code>,
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{period}`}</code>,
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{subject}`}</code>,
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{date}`}</code>,
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{absent_count}`}</code>,
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{exam_type}`}</code>,
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{marks_summary}`}</code>, and 
              <code className="text-blue-400 bg-slate-900 px-1 py-0.5 rounded mx-1">{`{portal_link}`}</code>.
            </p>

            <div className="space-y-5">
              {/* Template 1 */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Absent (Instant Alert) Text</label>
                <textarea
                  name="absentInstantTemplate"
                  value={settings.absentInstantTemplate}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Template 2 */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Absent (Daily Consolidated Alert) Text</label>
                <textarea
                  name="absentConsolidatedTemplate"
                  value={settings.absentConsolidatedTemplate}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Template 3 */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Results Publishing Text</label>
                <textarea
                  name="resultsTemplate"
                  value={settings.resultsTemplate}
                  onChange={handleChange}
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={fetchSettings}
              className="px-6 py-3 bg-slate-800 text-slate-300 hover:text-slate-100 rounded-xl font-semibold border border-slate-700 transition-all"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      ) : (
        /* Logs Section */
        <div className="max-w-6xl mx-auto bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3 text-blue-400">
              <FiActivity /> Active Dispatch History
            </h2>
            <button
              onClick={fetchLogs}
              className="text-xs px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all font-semibold"
            >
              Refresh Table
            </button>
          </div>

          {logsLoading ? (
            <div className="flex justify-center items-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
              <span>Reading logs from DB...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No alert logs registered in the database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pr-4">Student</th>
                    <th className="pb-3 px-4">Channel</th>
                    <th className="pb-3 px-4">Type</th>
                    <th className="pb-3 px-4">Recipient</th>
                    <th className="pb-3 px-4">Sent Time</th>
                    <th className="pb-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-800/50 hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold">{log.recipientName}</div>
                        <div className="text-xs text-slate-400">{log.enrollmentNo}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          log.channel === "SMS" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          log.channel === "WHATSAPP" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {log.channel}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold">
                        {log.type}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-300">
                        {log.recipientContact}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {log.status === "SENT" ? (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                            Delivered
                          </span>
                        ) : log.status === "FAILED" ? (
                          <div>
                            <span className="text-red-400 font-bold block">Failed</span>
                            <span className="text-[10px] text-slate-500 max-w-xs block truncate">{log.errorMessage}</span>
                          </div>
                        ) : (
                          <span className="text-yellow-400 font-bold">Pending</span>
                        )}
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
  );
};

export default NotificationSettings;

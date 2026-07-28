import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaGraduationCap,
  FaUserTie,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaBus,
  FaBook,
  FaBriefcase,
  FaCalculator,
  FaRobot,
  FaShieldAlt,
  FaFileExcel,
  FaCheckCircle,
  FaRocket,
  FaTimes,
  FaArrowRight,
  FaSearch,
  FaClock,
  FaAward,
  FaServer,
  FaCloud,
  FaMicrochip,
  FaChartLine,
  FaBolt,
  FaTag,
  FaHdd
} from "react-icons/fa";

const Portfolio3D = () => {
  // Canvas 3D background reference
  const canvasRef = useRef(null);

  // State management
  const [selectedModule, setSelectedModule] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Pricing & AWS state
  const [billingCycle, setBillingCycle] = useState("annual"); // "annual" | "multiyear"
  const [awsDetailTab, setAwsDetailTab] = useState("graviton");

  // ROI Calculator state
  const [studentCount, setStudentCount] = useState(2500);
  const [facultyCount, setFacultyCount] = useState(150);

  // Simulators state
  const [obeInternalMark, setObeInternalMark] = useState(85);
  const [obeCesRating, setObeCesRating] = useState(4.2);

  // RAG AI Simulator state
  const [ragQuery, setRagQuery] = useState("What are the key concepts of Data Structures?");
  const [ragResponse, setRagResponse] = useState(null);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // WebGL 3D Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create 3D particles & nodes
    const numParticles = 95;
    const particles = Array.from({ length: numParticles }, () => ({
      x: (Math.random() - 0.5) * width * 1.6,
      y: (Math.random() - 0.5) * height * 1.6,
      z: Math.random() * 1000,
      radius: Math.random() * 2.5 + 1,
      color: Math.random() > 0.5 ? "rgba(99, 102, 241," : "rgba(14, 165, 233,",
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      vz: (Math.random() - 0.5) * 0.6
    }));

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      mouseX = (e.clientX - width / 2) * 0.06;
      mouseY = (e.clientY - height / 2) * 0.06;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let angle = 0;

    const render = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
      ctx.fillRect(0, 0, width, height);

      const fov = 420;
      const cx = width / 2 + mouseX;
      const cy = height / 2 + mouseY;

      angle += 0.002;

      particles.forEach((p, idx) => {
        p.z -= p.vz;
        p.x += p.vx + Math.sin(angle + idx) * 0.05;
        p.y += p.vy;

        if (p.z <= 0) p.z = 1000;
        if (p.z > 1000) p.z = 1;

        const scale = fov / (fov + p.z);
        const x2d = cx + p.x * scale;
        const y2d = cy + p.y * scale;
        const alpha = (1 - p.z / 1000) * 0.85;

        if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
          ctx.beginPath();
          ctx.arc(x2d, y2d, p.radius * scale * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${alpha})`;
          ctx.shadowBlur = 12 * scale;
          ctx.shadowColor = p.color + "1)";
          ctx.fill();

          // Draw connections between nearby nodes
          for (let j = idx + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const scale2 = fov / (fov + p2.z);
            const x2d_2 = cx + p2.x * scale2;
            const y2d_2 = cy + p2.y * scale2;
            const dist = Math.hypot(x2d - x2d_2, y2d - y2d_2);

            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(x2d, y2d);
              ctx.lineTo(x2d_2, y2d_2);
              ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 110) * 0.18 * alpha})`;
              ctx.lineWidth = 0.9 * scale;
              ctx.stroke();
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // Module data definitions
  const modules = [
    {
      id: "obe",
      category: "academic",
      badge: "Core USP",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      title: "OBE Attainment & Excel Engine",
      icon: <FaCalculator className="text-3xl text-amber-400" />,
      tagline: "Automated NAAC/NBA Accreditation Excel Report Compiler",
      description:
        "Revolutionary Outcome-Based Education (OBE) module that recalculates 80% direct exam attainment and 20% indirect Course End Survey levels in real-time. Features native ExcelJS chart compilation producing 7-sheet formula workbooks.",
      highlights: [
        "Dynamic 80:20 Direct & Indirect Attainment calculation engine",
        "CO-PO & PSO Mapping strength matrix (1: Weak, 2: Medium, 3: Strong)",
        "Pre-filled IA1, IA2 & SEE split template export/import",
        "Native Excel chart generation with zero formulas broken",
        "Automated Gap Analysis & CAYm1 Action Plan compilation"
      ],
      kpi: "98% Reduction in NAAC Audit Prep Time"
    },
    {
      id: "rag",
      category: "ai",
      badge: "AI Powered",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      title: "AI RAG Library Assistant",
      icon: <FaRobot className="text-3xl text-emerald-400" />,
      tagline: "Natural Language Vector Document Query Engine",
      description:
        "Integrated Retrieval Augmented Generation (RAG) assistant leveraging Pinecone vector embeddings and Google Gemini AI. Students and faculty ask natural language questions about syllabus, past papers, and reference books.",
      highlights: [
        "Vector search powered by Pinecone & Google Gemini 1.5 Pro",
        "Sub-second document snippet retrieval across thousands of books",
        "Filter by Branch, Subject, Regulation, and Document Category",
        "Instant citation links pointing directly to source pages",
        "24/7 AI tutor for students and research support for faculty"
      ],
      kpi: "3.5x Faster Research & Study Material Discovery"
    },
    {
      id: "principal",
      category: "admin",
      badge: "Executive",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      title: "Principal & Executive Console",
      icon: <FaUserTie className="text-3xl text-indigo-400" />,
      tagline: "Institutional Bird's-Eye Dashboard & Compliance Monitor",
      description:
        "High-level executive cockpit giving campus leaders instant visibility into overall attendance percentages, pass rates, accreditation readiness, faculty workloads, and financial metrics across all departments.",
      highlights: [
        "Real-time institutional attendance & mark trends",
        "Department-wise performance benchmarks and comparative charts",
        "NAAC/NBA accreditation audit compliance scorecards",
        "Global Notice broadcasting & critical alert escalation",
        "Cross-departmental faculty substitution oversight"
      ],
      kpi: "100% Executive Governance Transparency"
    },
    {
      id: "hod",
      category: "academic",
      badge: "Departmental",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      title: "HOD Workspace & Substitution",
      icon: <FaGraduationCap className="text-3xl text-cyan-400" />,
      tagline: "Automated Workload & Class Substitution Routing",
      description:
        "Department heads can review and approve faculty leave applications while automatically assigning substitute teachers to prevent lost class hours. Features departmental timetables, subject allocation, and student rosters.",
      highlights: [
        "Smart faculty leave approval workflow with substitution check",
        "Real-time class period coverage & conflict detection",
        "Departmental attendance & mark override approvals",
        "Course outcome target setting & CES survey reviews",
        "Automated faculty performance metrics"
      ],
      kpi: "Zero Unassigned Class Periods"
    },
    {
      id: "faculty",
      category: "academic",
      badge: "Faculty Core",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      title: "Faculty Workspace & Marks",
      icon: <FaChalkboardTeacher className="text-3xl text-purple-400" />,
      tagline: "Streamlined Attendance, Excel Marks & Study Material Hub",
      description:
        "Empowers teachers with rapid daily attendance logging, one-click absentee marking, bulk Excel marks import with validation, study material uploads (PDFs, links, notes), and personalized class timetables.",
      highlights: [
        "Instant daily attendance tracker with percentage calculation",
        "Bulk Excel mark import with automatic max mark boundary validation",
        "Question-wise CO mapping for internal and assignment tests",
        "Study Material Repository with student download statistics",
        "Personal leave management with substitute request routing"
      ],
      kpi: "15+ Hours Saved Per Faculty Monthly"
    },
    {
      id: "student",
      category: "portal",
      badge: "Student Hub",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      title: "Student Portal & Parent View",
      icon: <FaUserGraduate className="text-3xl text-blue-400" />,
      tagline: "Interactive Dashboard, Parent Magic-Link & Pass Center",
      description:
        "Centralized portal for students to track subject-wise attendance, view mark sheets, download study materials, apply for placement drives, and generate digital bus passes. Includes secure tokenized parent view.",
      highlights: [
        "Real-time attendance percentage alerts & deficit warnings",
        "Subject-wise marks & internal assessment gradebook",
        "Magic-token secure Parent Portal requiring zero registration hassle",
        "Digital Bus Pass viewer with live route & seat status",
        "Direct access to AI RAG Library Assistant"
      ],
      kpi: "95% Active Daily Student Engagement"
    },
    {
      id: "transport",
      category: "services",
      badge: "Logistics",
      badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      title: "Smart Transport Management",
      icon: <FaBus className="text-3xl text-yellow-400" />,
      tagline: "Bus Route Stop Builder, Seat Count & Pass Generator",
      description:
        "Comprehensive campus fleet manager allowing admins to configure routes, stops, and dynamic fares. Students select stops, submit fee payment references, and download verified digital bus passes.",
      highlights: [
        "Dynamic route, stop, and distance-based fare tiering",
        "Real-time seat capacity reservation & availability counters",
        "Transport Admin payment verification console",
        "Automated Digital QR Bus Pass generation",
        "Student transport fee logging & breakdown"
      ],
      kpi: "100% Digital Fleet Pass Accounting"
    },
    {
      id: "placement",
      category: "services",
      badge: "Career Hub",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      title: "Placement Cell & Drive Tracking",
      icon: <FaBriefcase className="text-3xl text-rose-400" />,
      tagline: "Corporate Recruitment Publisher & Candidate Pipeline",
      description:
        "Streamlines campus placement drives. Placement officers post company profiles, eligibility criteria (min CGPA, backlogs), CTC packages, and manage multi-stage interview selection rounds.",
      highlights: [
        "One-click job drive posting with branch & CGPA filters",
        "Student application portal with automated eligibility checks",
        "Multi-stage interview round tracking (Aptitude, Tech, HR)",
        "Offer letter logging & company placement statistics",
        "Placement analytics for NAAC/NIRF reporting"
      ],
      kpi: "30% Increase in Placement Operational Speed"
    },
    {
      id: "library",
      category: "services",
      badge: "Digital Catalog",
      badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
      title: "Library System & Cataloging",
      icon: <FaBook className="text-3xl text-teal-400" />,
      tagline: "Book Circulation Ledger, Newspaper & Overdue Alerts",
      description:
        "Digital library management tracking book inventory, authors, ISBN numbers, borrow requests, issue dates, and return deadlines. Integrated with the AI RAG Assistant for content searching.",
      highlights: [
        "Comprehensive book cataloging with quantity & edition control",
        "Student checkout console with live overdue calculation",
        "Newspaper & periodic subscription logging",
        "Barcode/Accession number lookup",
        "AI RAG index sync for automatic document embedding"
      ],
      kpi: "Zero Lost Book Records"
    },
    {
      id: "accounts",
      category: "admin",
      badge: "Governance",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      title: "Accounts & Fee Governance",
      icon: <FaShieldAlt className="text-3xl text-pink-400" />,
      tagline: "Centralized Academic & Transport Fee Reconciliation",
      description:
        "Complete financial administration workspace for tracking tuition fees, transport fees, payment reference verification, invoice generation, and pending fee reminders.",
      highlights: [
        "Multi-tier fee structure configuration (Branch/Regulation/Transport)",
        "Student payment reference approval workflow",
        "Automated fee receipt generation & payment ledger",
        "Pending fee alerts sent directly to parent portal",
        "Financial reporting export for campus audits"
      ],
      kpi: "100% Audited Fee Collection Accuracy"
    }
  ];

  // Filtered modules
  const filteredModules =
    activeTab === "all"
      ? modules
      : modules.filter((m) => m.category === activeTab);

  // RAG query simulation handler
  const handleSimulateRag = () => {
    setIsSearchingRag(true);
    setRagResponse(null);
    setTimeout(() => {
      setIsSearchingRag(false);
      setRagResponse({
        answer:
          "Data Structures are fundamental methods of organizing and storing data efficiently in computer memory. Key concepts include: 1. Linear Structures (Arrays, Linked Lists, Stacks, Queues) 2. Non-Linear Structures (Binary Trees, Heaps, Graphs) 3. Hash Tables for O(1) average lookup times.",
        sources: [
          { title: "Core Data Structures & Algorithms - 4th Ed", page: "Page 42-58", confidence: "98.4%" },
          { title: "Syllabus Paper 2024 - Branch CSE", page: "Section 2.1", confidence: "94.1%" }
        ]
      });
    }, 1200);
  };

  // Calculate ROI stats
  const calculateRoi = () => {
    const hoursSavedPerFacultyMonth = 16;
    const totalFacultyHoursSavedYearly =
      facultyCount * hoursSavedPerFacultyMonth * 10;
    const printingPaperCostSavedYearly = Math.round(studentCount * 320);
    const naacDaysSaved = 45;
    return {
      facultyHours: totalFacultyHoursSavedYearly.toLocaleString(),
      moneySaved: (printingPaperCostSavedYearly / 1000).toFixed(1) + "k",
      naacDays: naacDaysSaved
    };
  };

  const roiStats = calculateRoi();

  // OBE Calculated Attainment
  const calculateObeAttainment = () => {
    const directAttainment = (obeInternalMark / 100) * 3;
    const indirectAttainment = (obeCesRating / 5) * 3;
    const overallAttainment = directAttainment * 0.8 + indirectAttainment * 0.2;
    return {
      direct: directAttainment.toFixed(2),
      indirect: indirectAttainment.toFixed(2),
      overall: overallAttainment.toFixed(2)
    };
  };

  const obeResults = calculateObeAttainment();

  // Price Calculation helper
  const isMultiYear = billingCycle === "multiyear";

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* 3D WebGL Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* Radial Gradient Glow Overlays */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-glow" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[140px] pointer-events-none z-0 animate-pulse-glow" />

      {/* Main Container */}
      <div className="relative z-10">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-6 py-4 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <FaGraduationCap className="text-xl text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                  ECAP ERP
                </span>
                <span className="block text-[10px] font-mono text-indigo-400 tracking-widest uppercase">
                  3D Commercial Showcase
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#modules" className="hover:text-cyan-400 transition-colors">
                Modules
              </a>
              <a href="#obe-engine" className="hover:text-cyan-400 transition-colors">
                OBE Engine
              </a>
              <a href="#ai-rag" className="hover:text-cyan-400 transition-colors">
                AI RAG
              </a>
              <a href="#aws-architecture" className="hover:text-cyan-400 transition-colors">
                AWS EC2 Advantage
              </a>
              <a href="#pricing" className="hover:text-cyan-400 transition-colors">
                Reduced Pricing Tiers
              </a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              >
                Sign In Portal
              </Link>
              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Schedule Commercial Demo
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32 max-w-7xl mx-auto text-center">
          {/* Price Cut Alert Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md animate-float-slow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <FaBolt className="text-amber-400" />
            <span>AWS EC2 Powered: <strong>80%+ Ultra-Reduced Commercial Pricing</strong> Now Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight max-w-5xl mx-auto mb-6">
            The Next-Generation{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              AI & OBE Powered
            </span>{" "}
            Campus ERP System
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Automate accreditation with zero-formula 7-sheet ExcelJS compilers, AI RAG vector tutors, digital bus pass systems, and <strong>drastically reduced AWS EC2 cloud pricing</strong> starting at just ₹24,999/yr.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setShowInquiryModal(true)}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all transform hover:-translate-y-1 flex items-center gap-3"
            >
              <FaRocket className="text-base" /> Request Commercial Quote & Live Demo
            </button>
            <a
              href="#pricing"
              className="px-8 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/90 transition-all backdrop-blur-md flex items-center gap-2"
            >
              View Reduced Pricing <FaArrowRight className="text-xs text-indigo-400" />
            </a>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { num: "₹24,999/yr", label: "Starting Reduced Price", icon: <FaTag className="text-emerald-400" /> },
              { num: "80% OFF", label: "Cost Cut via AWS EC2", icon: <FaServer className="text-cyan-400" /> },
              { num: "7-Sheet", label: "Native Excel Compiler", icon: <FaFileExcel className="text-indigo-400" /> },
              { num: "99.9%", label: "AWS Cloud Uptime SLA", icon: <FaCloud className="text-amber-400" /> }
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md glow-card-hover text-center"
              >
                <div className="flex justify-center mb-2 text-xl">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-extrabold text-white mb-1 font-mono">
                  {stat.num}
                </div>
                <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 10 MODULES DIRECTORY SECTION */}
        <section id="modules" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Comprehensive Institutional Modules
            </h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              Every stakeholder—from the Principal to Students, Faculty, and Transport Admins—gets a tailored, high-performance workspace.
            </p>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {[
                { id: "all", label: "All 10 Modules" },
                { id: "academic", label: "Academic & OBE" },
                { id: "admin", label: "Admin & Executive" },
                { id: "ai", label: "AI & Innovation" },
                { id: "services", label: "Campus Services" },
                { id: "portal", label: "Student & Parent" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className="group relative p-6 rounded-3xl bg-slate-900/70 border border-slate-800/90 hover:border-indigo-500/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 group-hover:scale-110 transition-transform">
                      {mod.icon}
                    </div>
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border ${mod.badgeColor}`}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {mod.title}
                  </h3>

                  <p className="text-xs font-medium text-indigo-400/90 mb-3">
                    {mod.tagline}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {mod.kpi}
                  </span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore Details <FaArrowRight className="text-[10px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CORE USP DEMO: OBE ATTAINMENT ENGINE SIMULATOR */}
        <section id="obe-engine" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-amber-500/30 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Flagship USP Feature
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Outcome-Based Education (OBE) & ExcelJS Attainment Engine
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-3xl mb-8 leading-relaxed">
              Traditional ERPs require manual formulas in Excel. ECAP ERP automates the entire CO-PO calculation matrix, combining 80% Direct Exam Attainment with 20% Indirect Survey feedback, and outputs a native 7-sheet workbook complete with Excel charts.
            </p>

            {/* Interactive OBE Simulator Console */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-950/80 p-6 md:p-8 rounded-2xl border border-slate-800">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <FaCalculator /> Interactive OBE Attainment Simulator
                </h3>

                {/* Internal Marks Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Direct Exam Marks Average (Internal + SEE)</span>
                    <span className="text-indigo-400 font-mono">{obeInternalMark}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={obeInternalMark}
                    onChange={(e) => setObeInternalMark(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* CES Rating Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Course End Survey (CES) Rating</span>
                    <span className="text-cyan-400 font-mono">{obeCesRating} / 5.0</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={obeCesRating}
                    onChange={(e) => setObeCesRating(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="text-slate-300 font-semibold">Formula Applied:</p>
                  <p className="font-mono">Direct Level (80%) = ({obeInternalMark}% / 100) × 3.0 = {obeResults.direct}</p>
                  <p className="font-mono">Indirect Level (20%) = ({obeCesRating} / 5.0) × 3.0 = {obeResults.indirect}</p>
                </div>
              </div>

              {/* Calculated Results Display */}
              <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-amber-500/20 text-center relative">
                <div className="text-xs uppercase font-mono tracking-widest text-slate-400 mb-2">
                  Final Calculated PO Attainment Score
                </div>
                <div className="text-5xl md:text-6xl font-black text-amber-400 mb-3 font-mono">
                  {obeResults.overall} <span className="text-xl text-slate-400 font-normal">/ 3.00</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <FaCheckCircle /> Target Attainment (2.50) Met
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700/60 grid grid-cols-2 gap-4 text-xs">
                  <div className="text-left">
                    <span className="text-slate-400 block">7-Sheet Excel Export</span>
                    <span className="text-white font-bold">Auto-Compiled</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Native Charts</span>
                    <span className="text-emerald-400 font-bold">Generated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI RAG LIBRARY ASSISTANT SIMULATOR */}
        <section id="ai-rag" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                Pinecone + Gemini 1.5 Pro
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              AI RAG Library & Study Assistant
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-3xl mb-8">
              Transform library books and course syllabi into an instant AI knowledge retrieval bot. Students ask natural language questions and receive accurate AI answers grounded in verified campus text references.
            </p>

            {/* Interactive RAG Demo Console */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="Ask a study question..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleSimulateRag}
                  disabled={isSearchingRag}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isSearchingRag ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Searching Vector Index...
                    </>
                  ) : (
                    <>
                      <FaSearch /> Query AI RAG
                    </>
                  )}
                </button>
              </div>

              {/* RAG Answer Display */}
              {ragResponse && (
                <div className="p-6 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-4 animate-fade-in">
                  <div>
                    <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider block mb-1">
                      AI Generated Answer (Grounded Context)
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {ragResponse.answer}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <span className="text-xs font-mono uppercase text-slate-400 block mb-2">
                      Verified Library Sources matched (Top K=2):
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ragResponse.sources.map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center"
                        >
                          <div>
                            <div className="font-semibold text-indigo-300">{src.title}</div>
                            <div className="text-slate-500">{src.page}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                            {src.confidence}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SPECIAL SECTION: WHY COST IS SO LOW USING AWS EC2 */}
        <section id="aws-architecture" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/40 border-2 border-cyan-500/40 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <FaServer className="text-cyan-400 animate-pulse" /> AWS EC2 Cloud Cost Breakdown
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Why Is ECAP ERP So Affordable? <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">The AWS EC2 Advantage</span>
            </h2>

            <p className="text-slate-300 text-base md:text-lg max-w-3xl mb-10 leading-relaxed font-normal">
              By replacing traditional legacy on-premise physical servers with optimized AWS EC2 Graviton cloud instances, we cut campus infrastructure overhead by over <strong>80%</strong>. We pass every rupee of these server savings straight to your institution.
            </p>

            {/* AWS Architectural Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div
                onClick={() => setAwsDetailTab("graviton")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "graviton"
                    ? "bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/10 scale-105"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl mb-4">
                  <FaMicrochip />
                </div>
                <h3 className="text-base font-bold text-white mb-1">1. Graviton3 ARM Compute</h3>
                <p className="text-xs text-cyan-300/80 font-mono mb-2">40% Price-Performance Boost</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AWS Graviton ARM-based EC2 instances (`t4g.small` / `c6g.xlarge`) use 60% less energy and provide 40% higher throughput per dollar than legacy x86 CPUs.
                </p>
              </div>

              <div
                onClick={() => setAwsDetailTab("autoscale")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "autoscale"
                    ? "bg-slate-900 border-indigo-400 shadow-xl shadow-indigo-500/10 scale-105"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-2xl mb-4">
                  <FaChartLine />
                </div>
                <h3 className="text-base font-bold text-white mb-1">2. Auto-Scaling Clusters</h3>
                <p className="text-xs text-indigo-300/80 font-mono mb-2">70% Peak Load Savings</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traffic peaks during 9 AM morning attendance & exam entries. AWS Auto-Scaling adds EC2 nodes only during peak hours and scales down to baseline off-hours.
                </p>
              </div>

              <div
                onClick={() => setAwsDetailTab("capex")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "capex"
                    ? "bg-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/10 scale-105"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mb-4">
                  <FaHdd />
                </div>
                <h3 className="text-base font-bold text-white mb-1">3. Zero Hardware CapEx</h3>
                <p className="text-xs text-emerald-300/80 font-mono mb-2">Zero Campus Rack Buying</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eliminates ₹15L - ₹25L upfront server purchases, UPS battery maintenance, dedicated server rooms, and full-time on-site server sysadmin salaries.
                </p>
              </div>

              <div
                onClick={() => setAwsDetailTab("cdn")}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "cdn"
                    ? "bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 scale-105"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mb-4">
                  <FaCloud />
                </div>
                <h3 className="text-base font-bold text-white mb-1">4. S3 & CloudFront CDN</h3>
                <p className="text-xs text-amber-300/80 font-mono mb-2">Zero EC2 RAM Overload</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Study materials, PDFs, student photos, and digital bus passes are served via S3 & CloudFront edge nodes, keeping EC2 server RAM footprint near zero.
                </p>
              </div>
            </div>

            {/* Visual Side-by-Side Cost Comparison Graphic */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FaBolt className="text-amber-400" /> Cost Breakdown Comparison: Traditional On-Premise vs ECAP on AWS EC2
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Traditional On-Premise Box */}
                <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 relative">
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-wider">
                    Legacy Hardware Model
                  </div>
                  <h4 className="text-lg font-bold text-red-300 mb-2">Traditional Legacy ERP</h4>
                  <div className="text-3xl font-black text-red-400 font-mono mb-4">₹3,50,000 / year</div>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">❌ On-premise server hardware depreciation: ₹1,50,000</li>
                    <li className="flex items-center gap-2">❌ On-site server sysadmin salary share: ₹1,20,000</li>
                    <li className="flex items-center gap-2">❌ AC server room power & UPS batteries: ₹80,000</li>
                    <li className="flex items-center gap-2">❌ Manual backup risks & hardware failures</li>
                  </ul>
                </div>

                {/* ECAP AWS EC2 Box */}
                <div className="p-6 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500 relative shadow-xl shadow-emerald-500/10">
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    80%+ Reduced Cloud Rate
                  </div>
                  <h4 className="text-lg font-bold text-emerald-300 mb-2">ECAP ERP on AWS EC2</h4>
                  <div className="text-3xl font-black text-white font-mono mb-4 flex items-baseline gap-2">
                    <span>₹24,999 / year</span>
                    <span className="text-xs text-emerald-400 font-sans font-semibold">(Starting Tier)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> AWS Graviton EC2 compute node: ₹12,000</li>
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> AWS S3 Automated Backups & CDN: ₹4,999</li>
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Full ERP License & Quarterly Updates: ₹8,000</li>
                    <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> 99.9% Cloud Uptime SLA & zero campus IT hassle</li>
                  </ul>
                </div>
              </div>

              {/* Net Savings Bar */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <div>
                  <span className="text-xs font-mono uppercase text-emerald-400 tracking-widest block">Net Campus Cost Reduction</span>
                  <span className="text-xl md:text-2xl font-black text-white">Save over ₹3,25,000 / Year per Institution</span>
                </div>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg"
                >
                  Get Instant AWS Cloud Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* INSTITUTIONAL ROI & COST-SAVINGS CALCULATOR */}
        <section id="roi-calculator" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Institutional ROI & Savings Calculator
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Calculate exact time and monetary savings achieved by replacing legacy manual workflows with ECAP ERP.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-slate-900/80 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl">
            {/* Sliders */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <label className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Student Capacity</span>
                  <span className="text-indigo-400 font-mono">{studentCount} Students</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="250"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Faculty & Staff Strength</span>
                  <span className="text-cyan-400 font-mono">{facultyCount} Members</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={facultyCount}
                  onChange={(e) => setFacultyCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 text-xs">
                <span className="text-slate-400 block mb-1">Calculated ERP Cost for {studentCount} Students:</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  ₹{Math.round(studentCount * (isMultiYear ? 8.5 : 10)).toLocaleString()} / year
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (Just ₹{(isMultiYear ? 8.5 : 10).toFixed(2)} per student per year!)
                </span>
              </div>
            </div>

            {/* Savings Output Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center glow-card-hover">
                <FaClock className="text-3xl text-indigo-400 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white mb-1 font-mono">
                  {roiStats.facultyHours}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Faculty Administrative Hours Saved / Year
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center glow-card-hover">
                <FaFileExcel className="text-3xl text-emerald-400 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white mb-1 font-mono">
                  ₹{roiStats.moneySaved}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Estimated Paper & Audit Printing Costs Saved
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center glow-card-hover">
                <FaAward className="text-3xl text-amber-400 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-white mb-1 font-mono">
                  {roiStats.naacDays} Days
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Saved during NAAC / NBA Audit Cycle
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING & ACCURATELY REDUCED COMMERCIAL LICENSING TIERS */}
        <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4">
              <FaTag /> Transparent & Accurately Reduced Cloud Pricing
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              Commercial Licensing Tiers
            </h2>
            <p className="text-slate-400 text-base max-w-2xl mx-auto mb-8">
              Thanks to AWS EC2 Graviton efficiency, we offer the most competitive pricing in the education tech market. Zero hidden fees.
            </p>

            {/* Billing Toggle (Annual vs 3-Year Institutional Contract) */}
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  billingCycle === "annual"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Standard Annual Billing
              </button>
              <button
                onClick={() => setBillingCycle("multiyear")}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  billingCycle === "multiyear"
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3-Year Contract <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">SAVE EXTRA 15%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Standard Campus Tier */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all flex flex-col justify-between glow-card-hover">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-bold text-white">Standard Campus</h3>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    🔥 83% PRICE CUT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Ideal for single engineering or degree colleges up to 2,500 students.</p>
                
                {/* Reduced Price Header */}
                <div className="mb-6">
                  <div className="text-xs text-slate-400 line-through mb-0.5 font-mono">Original: ₹1,50,000 / yr</div>
                  <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹{isMultiYear ? "21,249" : "24,999"}
                    <span className="text-xs text-slate-400 font-sans font-normal">/ year</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                    Only ~₹9.99 per student / year
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Full 10 ERP Workspaces Included</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Automated OBE 7-Sheet Excel Generator</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Transport Digital Pass Generator</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Parent Portal Tokenized Access</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Standard Email & Phone Support</li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
              >
                Inquire Standard Tier
              </button>
            </div>

            {/* Enterprise Autonomous University (Featured) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-950 border-2 border-indigo-500 backdrop-blur-xl transition-all flex flex-col justify-between relative shadow-2xl shadow-indigo-500/20 transform md:-translate-y-4 glow-card-hover">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-lg">
                Most Popular for Autonomous Institutions
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 mt-2">
                  <h3 className="text-xl font-bold text-white">Enterprise University</h3>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-bold">
                    ⚡ 86% SAVINGS
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mb-6">Designed for autonomous colleges & multi-branch universities up to 8,000 students.</p>
                
                {/* Reduced Price Header */}
                <div className="mb-6">
                  <div className="text-xs text-indigo-300/60 line-through mb-0.5 font-mono">Original: ₹4,50,000 / yr</div>
                  <div className="text-4xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹{isMultiYear ? "50,999" : "59,999"}
                    <span className="text-xs text-indigo-200 font-sans font-normal">/ year</span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-semibold mt-1">
                    Only ~₹7.50 per student / year
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 mb-8">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Everything in Standard Tier</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Integrated AI RAG Library Assistant</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Custom Regulation Mapping (R22, R18, Autonomous)</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Custom Domain Integration & Branding</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Dedicated On-Site Faculty Training & 24/7 SLA</li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-extrabold transition-all shadow-lg shadow-indigo-500/30"
              >
                Request Enterprise Proposal
              </button>
            </div>

            {/* SaaS Managed Cloud Tier (AWS EC2) */}
            <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all flex flex-col justify-between glow-card-hover">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-bold text-white">SaaS Managed Cloud</h3>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    ☁️ AWS EC2 HOSTED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Fully managed cloud hosting with automated quarterly feature updates & 0 maintenance.</p>
                
                {/* Reduced Price Header */}
                <div className="mb-6">
                  <div className="text-xs text-slate-400 line-through mb-0.5 font-mono">Original: ₹99,999 / yr</div>
                  <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹{isMultiYear ? "33,999" : "39,999"}
                    <span className="text-xs text-slate-400 font-sans font-normal">/ year</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-semibold mt-1">
                    Includes AWS EC2 Server & Storage Costs
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 mb-8">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> Managed AWS EC2 Graviton Instance</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> Automated Daily Database Backups (S3)</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> Unlimited Parent Magic-Link Traffic</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> CloudFront CDN Static File Hosting</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> 24/7 Priority Cloud Infrastructure Support</li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
              >
                Inquire Cloud SaaS
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                E
              </div>
              <span className="font-bold text-slate-200 text-sm">ECAP ERP</span>
              <span>— Market Sales & Commercial Portfolio</span>
            </div>
            <div>Developed & Designed by Laxmi Ganji</div>
            <div className="flex gap-4">
              <button onClick={() => setShowInquiryModal(true)} className="hover:text-indigo-400">
                Commercial Inquiry
              </button>
              <Link to="/" className="hover:text-indigo-400">
                Institutional Login
              </Link>
            </div>
          </div>
        </footer>
      </div>

      {/* MODULE DETAIL MODAL */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 relative shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-slate-800">{selectedModule.icon}</div>
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedModule.badgeColor}`}>
                  {selectedModule.badge}
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">{selectedModule.title}</h3>
              </div>
            </div>

            <p className="text-sm text-indigo-300 font-medium mb-4">{selectedModule.tagline}</p>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">{selectedModule.description}</p>

            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Capabilities:</h4>
              {selectedModule.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Impact Metric:</span>
              <span className="font-bold text-indigo-300">{selectedModule.kpi}</span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedModule(null);
                  setShowInquiryModal(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Inquire About This Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALES INQUIRY MODAL */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 md:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <FaTimes />
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">Schedule Commercial Demo</h3>
            <p className="text-xs text-slate-400 mb-6">
              Submit your institution details to receive reduced AWS EC2 commercial quotes, feature walk-throughs, and sample 7-sheet Excel reports.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Thank you for your commercial inquiry! Our team will contact your institution shortly with reduced AWS EC2 pricing details.");
                setShowInquiryModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Robert Smith"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="St. Peter's Engineering College"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="principal@institution.edu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Student Capacity</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                  <option>Under 1,000 Students (₹24,999/yr)</option>
                  <option>1,000 - 3,000 Students (Standard Campus)</option>
                  <option>3,000 - 8,000 Students (Enterprise Tier - ₹59,999/yr)</option>
                  <option>8,000+ Students (University Tier)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Specific Requirements / Message</label>
                <textarea
                  rows="3"
                  placeholder="Looking for NAAC OBE Excel export automation, reduced AWS EC2 cloud pricing, and AI Library Bot..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-all"
              >
                Submit Commercial Inquiry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio3D;

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
  FaHdd,
  FaMagic,
  FaTerminal,
  FaBars
} from "react-icons/fa";

const Portfolio3D = () => {
  // Canvas 3D background reference
  const canvasRef = useRef(null);

  // State management
  const [selectedModule, setSelectedModule] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pricing & AWS state
  const [billingCycle, setBillingCycle] = useState("annual"); // "annual" | "multiyear"
  const [awsDetailTab, setAwsDetailTab] = useState("graviton");

  // ROI Calculator state
  const [studentCount, setStudentCount] = useState(2500);
  const [facultyCount, setFacultyCount] = useState(150);

  // Form submit notification message state
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Smooth scroll handler helper
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // WebGL/3D Canvas Engine with Moving 3D Books, Buses, Laptops, Caps & Cubes
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

    // Mouse & Touch Interaction setup
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX - width / 2) * 0.35;
      targetMouseY = (e.clientY - height / 2) * 0.35;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        targetMouseX = (e.touches[0].clientX - width / 2) * 0.35;
        targetMouseY = (e.touches[0].clientY - height / 2) * 0.35;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    // Define 3D Mesh Items (Books, Buses, Laptops, Graduation Caps, Cubes)
    const types = ["book", "bus", "laptop", "cap", "cube"];
    const isMobile = width < 640;
    const numObjects = isMobile ? 24 : 42;

    const objects3D = Array.from({ length: numObjects }, (_, i) => {
      const type = types[i % types.length];
      return {
        type,
        x: (Math.random() - 0.5) * (isMobile ? 1000 : 1700),
        y: (Math.random() - 0.5) * (isMobile ? 1000 : 1300),
        z: Math.random() * 1200 - 300,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.4,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        vRotX: (Math.random() - 0.5) * 0.016,
        vRotY: (Math.random() - 0.5) * 0.016,
        vRotZ: (Math.random() - 0.5) * 0.016,
        size: isMobile ? Math.random() * 12 + 16 : Math.random() * 18 + 24,
        color:
          type === "book"
            ? "#38bdf8"
            : type === "bus"
            ? "#f59e0b"
            : type === "laptop"
            ? "#818cf8"
            : type === "cap"
            ? "#c084fc"
            : "#34d399"
      };
    });

    let cameraRotY = 0;
    let cameraRotX = 0;

    // Helper: 3D Point Projection onto 2D Canvas
    const project3D = (x, y, z, cx, cy, fov) => {
      let cosY = Math.cos(cameraRotY);
      let sinY = Math.sin(cameraRotY);
      let cosX = Math.cos(cameraRotX);
      let sinX = Math.sin(cameraRotX);

      let x1 = x * cosY - z * sinY;
      let z1 = z * cosY + x * sinY;

      let y1 = y * cosX - z1 * sinX;
      let z2 = z1 * cosX + y * sinX;

      const depth = z2 + 850;
      if (depth <= 10) return null;

      const scale = fov / depth;
      return {
        x: cx + x1 * scale,
        y: cy + y1 * scale,
        scale,
        depth
      };
    };

    // Draw 3D Book
    const drawBook = (ctx, screenP, obj) => {
      const s = obj.size * screenP.scale;
      ctx.save();
      ctx.translate(screenP.x, screenP.y);

      const angle = obj.rotY;
      const cosA = Math.cos(angle);
      const width2 = s * cosA;

      ctx.fillStyle = obj.color;
      ctx.shadowBlur = 12 * screenP.scale;
      ctx.shadowColor = obj.color;

      ctx.beginPath();
      ctx.moveTo(0, -s * 0.6);
      ctx.lineTo(-width2, -s * 0.5);
      ctx.lineTo(-width2, s * 0.5);
      ctx.lineTo(0, s * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -s * 0.6);
      ctx.lineTo(width2, -s * 0.5);
      ctx.lineTo(width2, s * 0.5);
      ctx.lineTo(0, s * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.52);
      ctx.lineTo(-width2 * 0.88, -s * 0.44);
      ctx.lineTo(-width2 * 0.88, s * 0.44);
      ctx.lineTo(0, s * 0.52);
      ctx.lineTo(width2 * 0.88, s * 0.44);
      ctx.lineTo(width2 * 0.88, -s * 0.44);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2 * screenP.scale;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.6);
      ctx.lineTo(0, s * 0.6);
      ctx.stroke();

      ctx.restore();
    };

    // Draw 3D Bus
    const drawBus = (ctx, screenP, obj) => {
      const s = obj.size * 1.25 * screenP.scale;
      ctx.save();
      ctx.translate(screenP.x, screenP.y);

      ctx.fillStyle = obj.color;
      ctx.shadowBlur = 14 * screenP.scale;
      ctx.shadowColor = obj.color;

      ctx.beginPath();
      ctx.roundRect(-s * 0.8, -s * 0.4, s * 1.6, s * 0.8, 5 * screenP.scale);
      ctx.fill();

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(-s * 0.7, -s * 0.3, s * 0.35, s * 0.28);
      ctx.fillRect(-s * 0.25, -s * 0.3, s * 0.4, s * 0.25);
      ctx.fillRect(s * 0.25, -s * 0.3, s * 0.4, s * 0.25);

      ctx.fillStyle = "rgba(254, 240, 138, 0.5)";
      ctx.beginPath();
      ctx.moveTo(-s * 0.8, -s * 0.1);
      ctx.lineTo(-s * 1.45, -s * 0.3);
      ctx.lineTo(-s * 1.45, s * 0.2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(-s * 0.45, s * 0.4, s * 0.18, 0, Math.PI * 2);
      ctx.arc(s * 0.45, s * 0.4, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Draw 3D Laptop
    const drawLaptop = (ctx, screenP, obj) => {
      const s = obj.size * screenP.scale;
      ctx.save();
      ctx.translate(screenP.x, screenP.y);

      ctx.shadowBlur = 14 * screenP.scale;
      ctx.shadowColor = obj.color;

      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = 1.8 * screenP.scale;
      ctx.beginPath();
      ctx.roundRect(-s * 0.7, -s * 0.6, s * 1.4, s * 0.9, 4 * screenP.scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#020617";
      ctx.fillRect(-s * 0.62, -s * 0.52, s * 1.24, s * 0.74);

      ctx.fillStyle = obj.color;
      ctx.fillRect(-s * 0.5, -s * 0.4, s * 0.65, s * 0.05);
      ctx.fillRect(-s * 0.5, -s * 0.28, s * 0.85, s * 0.05);
      ctx.fillRect(-s * 0.5, -s * 0.16, s * 0.45, s * 0.05);
      ctx.fillRect(-s * 0.5, -s * 0.04, s * 0.7, s * 0.05);

      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.35);
      ctx.lineTo(s * 0.85, s * 0.35);
      ctx.lineTo(s * 0.7, s * 0.55);
      ctx.lineTo(-s * 0.7, s * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Draw 3D Graduation Cap
    const drawCap = (ctx, screenP, obj) => {
      const s = obj.size * screenP.scale;
      ctx.save();
      ctx.translate(screenP.x, screenP.y);

      ctx.shadowBlur = 14 * screenP.scale;
      ctx.shadowColor = obj.color;

      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.5);
      ctx.lineTo(s * 0.9, 0);
      ctx.lineTo(0, s * 0.3);
      ctx.lineTo(-s * 0.9, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, 0.05 * s);
      ctx.lineTo(s * 0.4, 0.05 * s);
      ctx.lineTo(s * 0.3, s * 0.45);
      ctx.lineTo(-s * 0.3, s * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.8 * screenP.scale;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.lineTo(s * 0.7, s * 0.25);
      ctx.stroke();

      ctx.restore();
    };

    // Draw 3D Cube
    const drawCube = (ctx, screenP, obj) => {
      const s = obj.size * 0.7 * screenP.scale;
      ctx.save();
      ctx.translate(screenP.x, screenP.y);

      ctx.strokeStyle = obj.color;
      ctx.lineWidth = 1.4 * screenP.scale;
      ctx.shadowBlur = 12 * screenP.scale;
      ctx.shadowColor = obj.color;

      const rot = obj.rotY;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      const dx = s * cosR;
      const dy = s * sinR * 0.5;

      ctx.strokeRect(-dx, -s + dy, dx * 2, s * 1.4);
      ctx.strokeRect(-dx * 0.5, -s * 0.6, dx * 2, s * 1.4);

      ctx.beginPath();
      ctx.moveTo(-dx, -s + dy);
      ctx.lineTo(-dx * 0.5, -s * 0.6);
      ctx.moveTo(dx, -s + dy);
      ctx.lineTo(dx * 1.5, -s * 0.6);
      ctx.moveTo(-dx, s * 0.4 + dy);
      ctx.lineTo(-dx * 0.5, s * 0.8);
      ctx.moveTo(dx, s * 0.4 + dy);
      ctx.lineTo(dx * 1.5, s * 0.8);
      ctx.stroke();

      ctx.restore();
    };

    // Main Render Loop
    const render = () => {
      ctx.fillStyle = "rgba(10, 15, 30, 0.38)";
      ctx.fillRect(0, 0, width, height);

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      cameraRotY = (mouseX / width) * 0.5;
      cameraRotX = (mouseY / height) * 0.5;

      const cx = width / 2;
      const cy = height / 2;
      const fov = isMobile ? 420 : 520;

      const projected = [];

      objects3D.forEach((obj) => {
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.z += obj.vz;

        obj.rotX += obj.vRotX;
        obj.rotY += obj.vRotY;
        obj.rotZ += obj.vRotZ;

        const boundX = isMobile ? 600 : 1000;
        const boundY = isMobile ? 500 : 800;

        if (obj.x < -boundX) obj.x = boundX;
        if (obj.x > boundX) obj.x = -boundX;
        if (obj.y < -boundY) obj.y = boundY;
        if (obj.y > boundY) obj.y = -boundY;
        if (obj.z < -350) obj.z = 1050;
        if (obj.z > 1050) obj.z = -350;

        const screenP = project3D(obj.x, obj.y, obj.z, cx, cy, fov);
        if (screenP && screenP.x >= -100 && screenP.x <= width + 100 && screenP.y >= -100 && screenP.y <= height + 100) {
          projected.push({ obj, screenP });
        }
      });

      projected.sort((a, b) => b.screenP.depth - a.screenP.depth);

      projected.forEach(({ obj, screenP }) => {
        if (obj.type === "book") drawBook(ctx, screenP, obj);
        else if (obj.type === "bus") drawBus(ctx, screenP, obj);
        else if (obj.type === "laptop") drawLaptop(ctx, screenP, obj);
        else if (obj.type === "cap") drawCap(ctx, screenP, obj);
        else if (obj.type === "cube") drawCube(ctx, screenP, obj);
      });

      // Ambient connecting constellation beams
      ctx.lineWidth = 0.75;
      const beamDist = isMobile ? 100 : 145;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i].screenP;
          const p2 = projected[j].screenP;
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < beamDist) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / beamDist) * 0.25;
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
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
      icon: <FaCalculator className="text-2xl sm:text-3xl text-amber-400" />,
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
      icon: <FaRobot className="text-2xl sm:text-3xl text-emerald-400" />,
      tagline: "Natural Language Vector Document Query Engine",
      description:
        "Integrated Retrieval Augmented Generation (RAG) assistant leveraging Pinecone vector embeddings and Google Gemini AI. Students and faculty ask natural language questions about syllabus, past papers, and reference books.",
      highlights: [
        "Vector search powered by Pinecone & Google Gemini AI",
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
      icon: <FaUserTie className="text-2xl sm:text-3xl text-indigo-400" />,
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
      icon: <FaGraduationCap className="text-2xl sm:text-3xl text-cyan-400" />,
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
      icon: <FaChalkboardTeacher className="text-2xl sm:text-3xl text-purple-400" />,
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
      icon: <FaUserGraduate className="text-2xl sm:text-3xl text-blue-400" />,
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
      icon: <FaBus className="text-2xl sm:text-3xl text-yellow-400" />,
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
      icon: <FaBriefcase className="text-2xl sm:text-3xl text-rose-400" />,
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
      icon: <FaBook className="text-2xl sm:text-3xl text-teal-400" />,
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
      icon: <FaShieldAlt className="text-2xl sm:text-3xl text-pink-400" />,
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

  // Filtered modules based on active category tab
  const filteredModules =
    activeTab === "all"
      ? modules
      : modules.filter((m) => m.category === activeTab);

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
  const isMultiYear = billingCycle === "multiyear";

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Interactive 3D Canvas Background (Books, Buses, Laptops, Caps, Cubes) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 opacity-80 sm:opacity-90"
      />

      {/* Dynamic Radial Gradient Glow Overlays */}
      <div className="fixed top-0 left-1/4 w-64 sm:w-[32rem] h-64 sm:h-[32rem] bg-indigo-600/15 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-64 sm:w-[32rem] h-64 sm:h-[32rem] bg-cyan-600/15 rounded-full blur-[100px] sm:blur-[160px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed top-1/3 right-4 w-48 sm:w-96 h-48 sm:h-96 bg-purple-600/15 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none z-0" />

      {/* Main Content Container */}
      <div className="relative z-10">
        {/* Header Navigation Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 py-3.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <FaGraduationCap className="text-lg sm:text-xl text-indigo-400" />
                </div>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                  ECAP ERP
                </span>
                <span className="block text-[9px] sm:text-[10px] font-mono text-cyan-400 tracking-widest uppercase font-bold">
                  Campus Administration Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <button
                onClick={() => scrollToSection("modules")}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Modules
              </button>
              <button
                onClick={() => scrollToSection("aws-architecture")}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                AWS EC2 Advantage
              </button>
              <button
                onClick={() => scrollToSection("roi-calculator")}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                ROI Calculator
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Pricing Tiers
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              >
                Sign In Portal
              </Link>
              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Schedule Demo
              </button>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setShowInquiryModal(true)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-indigo-600 cursor-pointer shadow-md"
              >
                Demo
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-base"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2 text-xs font-semibold text-slate-300 animate-fade-in">
              <button
                onClick={() => scrollToSection("modules")}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Campus Modules
              </button>
              <button
                onClick={() => scrollToSection("aws-architecture")}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                AWS EC2 Advantage
              </button>
              <button
                onClick={() => scrollToSection("roi-calculator")}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                ROI & Savings Calculator
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Commercial Pricing Tiers
              </button>
              <Link
                to="/"
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-bold text-center mt-1"
              >
                Sign In Portal
              </Link>
            </div>
          )}
        </header>

        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 pt-12 pb-16 md:pt-24 md:pb-28 max-w-7xl mx-auto text-center">
          {/* Price Cut Alert Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] sm:text-xs font-semibold mb-6 sm:mb-8 backdrop-blur-md max-w-full text-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <FaBolt className="text-amber-400 shrink-0 text-xs" />
            <span className="truncate sm:whitespace-normal">AWS EC2 Powered: <strong>80%+ Reduced Pricing</strong> Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-snug sm:leading-tight max-w-5xl mx-auto mb-4 sm:mb-6 px-1">
            The Next-Generation{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              AI & OBE Powered
            </span>{" "}
            Campus ERP System
          </h1>

          <p className="text-xs sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed font-normal px-2">
            Automate accreditation with zero-formula 7-sheet ExcelJS compilers, AI RAG vector tutors, digital bus pass systems, and <strong>drastically reduced AWS EC2 cloud pricing</strong> starting at just ₹29,999/yr.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-12 sm:mb-16 w-full max-w-md sm:max-w-none mx-auto px-2">
            <button
              onClick={() => setShowInquiryModal(true)}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <FaRocket className="text-sm" /> Request Quote & Live Demo
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/90 transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer"
            >
              View Pricing Tiers <FaArrowRight className="text-xs text-indigo-400" />
            </button>
          </div>

          {/* Platform Stat Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto px-1">
            {[
              { num: "₹29,999/yr", label: "Starting Reduced Price", icon: <FaTag className="text-emerald-400" /> },
              { num: "80% OFF", label: "Cost Cut via AWS EC2", icon: <FaServer className="text-cyan-400" /> },
              { num: "7-Sheet", label: "Native Excel Compiler", icon: <FaFileExcel className="text-indigo-400" /> },
              { num: "99.9%", label: "AWS Cloud Uptime SLA", icon: <FaCloud className="text-amber-400" /> }
            ].map((stat, i) => (
              <div
                key={i}
                className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md text-center transform hover:-translate-y-1 transition-all"
              >
                <div className="flex justify-center mb-1.5 text-base sm:text-xl">{stat.icon}</div>
                <div className="text-base sm:text-2xl font-extrabold text-white mb-0.5 font-mono">
                  {stat.num}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 font-medium leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 10 MODULES DIRECTORY SECTION */}
        <section id="modules" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 px-2">
              Comprehensive Institutional Modules
            </h2>
            <p className="text-xs sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto px-2">
              Tailored high-performance workspaces for Principal, HODs, Faculty, Students, Accounts, Transport, and Library teams.
            </p>

            {/* Category Filter Tabs (Swipeable on mobile) */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 overflow-x-auto no-scrollbar pb-2 px-1 justify-start sm:justify-center">
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
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all shrink-0 cursor-pointer ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredModules.map((mod) => (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className="group relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="p-3 rounded-xl bg-slate-800/80 group-hover:scale-105 transition-transform">
                      {mod.icon}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:py-1 rounded-full border ${mod.badgeColor}`}
                    >
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                    {mod.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs font-medium text-indigo-400/90 mb-2.5">
                    {mod.tagline}
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[10px] sm:text-[11px] truncate max-w-[70%]">
                    {mod.kpi}
                  </span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-1 shrink-0 group-hover:translate-x-1 transition-transform">
                    Details <FaArrowRight className="text-[10px]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: WHY COST IS SO LOW USING AWS EC2 */}
        <section id="aws-architecture" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/40 border border-cyan-500/40 backdrop-blur-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <FaServer className="text-cyan-400 animate-pulse" /> AWS EC2 Cloud Cost Breakdown
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4">
              Why Is ECAP ERP So Affordable? <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">The AWS EC2 Advantage</span>
            </h2>

            <p className="text-xs sm:text-base md:text-lg text-slate-300 max-w-3xl mb-8 sm:mb-10 leading-relaxed font-normal">
              By replacing traditional legacy on-premise physical servers with optimized AWS EC2 Graviton cloud instances, we cut campus infrastructure overhead by over <strong>80%</strong>. We pass every rupee of these server savings straight to your institution.
            </p>

            {/* AWS Architectural Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div
                onClick={() => setAwsDetailTab("graviton")}
                className={`p-4 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "graviton"
                    ? "bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-500/20"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-80"
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl sm:text-2xl mb-3">
                  <FaMicrochip />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">1. Graviton3 ARM Compute</h3>
                <p className="text-[11px] sm:text-xs text-cyan-300/80 font-mono mb-2">40% Price-Performance Boost</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AWS Graviton ARM-based EC2 instances (`t4g.small` / `c6g.xlarge`) use 60% less energy and provide 40% higher throughput per dollar than legacy x86 CPUs.
                </p>
              </div>

              <div
                onClick={() => setAwsDetailTab("autoscale")}
                className={`p-4 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "autoscale"
                    ? "bg-slate-900 border-indigo-400 shadow-xl shadow-indigo-500/20"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-80"
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl sm:text-2xl mb-3">
                  <FaChartLine />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">2. Auto-Scaling Clusters</h3>
                <p className="text-[11px] sm:text-xs text-indigo-300/80 font-mono mb-2">70% Peak Load Savings</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traffic peaks during 9 AM morning attendance & exam entries. AWS Auto-Scaling adds EC2 nodes only during peak hours and scales down off-hours.
                </p>
              </div>

              <div
                onClick={() => setAwsDetailTab("capex")}
                className={`p-4 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "capex"
                    ? "bg-slate-900 border-emerald-400 shadow-xl shadow-emerald-500/20"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-80"
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl sm:text-2xl mb-3">
                  <FaHdd />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">3. Zero Hardware CapEx</h3>
                <p className="text-[11px] sm:text-xs text-emerald-300/80 font-mono mb-2">Zero Campus Rack Buying</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eliminates ₹15L - ₹25L upfront server purchases, UPS battery maintenance, dedicated server rooms, and full-time on-site server sysadmin salaries.
                </p>
              </div>

              <div
                onClick={() => setAwsDetailTab("cdn")}
                className={`p-4 sm:p-6 rounded-2xl border transition-all cursor-pointer ${
                  awsDetailTab === "cdn"
                    ? "bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/20"
                    : "bg-slate-950/80 border-slate-800 hover:border-slate-700 opacity-80"
                }`}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl sm:text-2xl mb-3">
                  <FaCloud />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">4. S3 & CloudFront CDN</h3>
                <p className="text-[11px] sm:text-xs text-amber-300/80 font-mono mb-2">Zero EC2 RAM Overload</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Study materials, PDFs, student photos, and digital bus passes are served via S3 & CloudFront edge nodes, keeping EC2 server RAM footprint near zero.
                </p>
              </div>
            </div>

            {/* Dynamic AWS Detail Drawer */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 mb-6 sm:mb-8 text-xs text-slate-300">
              {awsDetailTab === "graviton" && (
                <div className="space-y-1.5">
                  <span className="font-bold text-cyan-400 block text-xs sm:text-sm">💡 Graviton3 Architecture Breakdown:</span>
                  <p>AWS Graviton processors utilize custom 64-bit Arm Neoverse cores designed specifically for cloud workloads. By running ECAP microservices on `t4g.small` EC2 instances, we achieve 40% higher request throughput per dollar compared to 5th-generation x86 servers.</p>
                </div>
              )}
              {awsDetailTab === "autoscale" && (
                <div className="space-y-1.5">
                  <span className="font-bold text-indigo-400 block text-xs sm:text-sm">📈 Auto-Scaling Dynamic Capacity:</span>
                  <p>Campus traffic follows a 10-hour daily operational cycle. During 8:30 AM – 10:30 AM attendance spikes, AWS Auto-Scaling automatically spins up worker containers across Target Tracking Policies, and scales down to minimal baseline off-hours, reducing idle runtime bills by 70%.</p>
                </div>
              )}
              {awsDetailTab === "capex" && (
                <div className="space-y-1.5">
                  <span className="font-bold text-emerald-400 block text-xs sm:text-sm">💾 CapEx vs OpEx Financial Model:</span>
                  <p>Legacy ERP software requires high upfront Capital Expenditure (CapEx) for physical server racks, diesel power backups, air-conditioned server rooms, and dedicated hardware sysadmins. ECAP ERP shifts this entirely to a pay-as-you-go cloud model with zero initial hardware investment.</p>
                </div>
              )}
              {awsDetailTab === "cdn" && (
                <div className="space-y-1.5">
                  <span className="font-bold text-amber-400 block text-xs sm:text-sm">☁️ Edge CDN & S3 Asset Offloading:</span>
                  <p>All student study notes, PDF question papers, profile photos, and QR bus passes are stored directly on Amazon S3 and served via CloudFront global edge locations. This keeps EC2 server CPU & RAM usage focused 100% on fast API processing.</p>
                </div>
              )}
            </div>

            {/* Visual Side-by-Side Cost Comparison Graphic */}
            <div className="bg-slate-950 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <FaBolt className="text-amber-400 shrink-0" /> Cost Breakdown Comparison
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-center">
                {/* Traditional On-Premise Box */}
                <div className="p-5 sm:p-6 rounded-2xl bg-red-950/20 border border-red-500/30 relative">
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 w-max mb-3">
                    Legacy Hardware Model
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-red-300 mb-1.5">Traditional Legacy ERP</h4>
                  <div className="text-2xl sm:text-3xl font-black text-red-400 font-mono mb-3">₹3,50,000 / year</div>
                  <ul className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-start gap-2">❌ On-premise server hardware depreciation: ₹1,50,000</li>
                    <li className="flex items-start gap-2">❌ On-site server sysadmin salary share: ₹1,20,000</li>
                    <li className="flex items-start gap-2">❌ AC server room power & UPS batteries: ₹80,000</li>
                    <li className="flex items-start gap-2">❌ Manual backup risks & hardware failures</li>
                  </ul>
                </div>

                {/* ECAP AWS EC2 Box */}
                <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500 relative shadow-xl shadow-emerald-500/10">
                  <div className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 w-max mb-3">
                    80%+ Reduced Cloud Rate
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-emerald-300 mb-1.5">ECAP ERP on AWS EC2</h4>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono mb-3 flex items-baseline gap-2 flex-wrap">
                    <span>₹29,999 / year</span>
                    <span className="text-xs text-emerald-400 font-sans font-semibold">(Starting Tier)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> AWS Graviton EC2 compute node: ₹14,000</li>
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> AWS S3 Automated Backups & CDN: ₹5,999</li>
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> Full ERP License & Quarterly Updates: ₹10,000</li>
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> 99.9% Cloud Uptime SLA & zero IT hassle</li>
                  </ul>
                </div>
              </div>

              {/* Net Savings Bar */}
              <div className="mt-6 sm:mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono uppercase text-emerald-400 tracking-widest block">Net Campus Cost Reduction</span>
                  <span className="text-base sm:text-xl md:text-2xl font-black text-white">Save over ₹3,20,000 / Year per Institution</span>
                </div>
                <button
                  onClick={() => setShowInquiryModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg cursor-pointer shrink-0"
                >
                  Get AWS Cloud Quote
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: INSTITUTIONAL ROI & COST-SAVINGS CALCULATOR */}
        <section id="roi-calculator" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 px-2">
              Institutional ROI & Savings Calculator
            </h2>
            <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto px-2">
              Calculate exact time and monetary savings achieved by replacing legacy manual workflows with ECAP ERP.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center bg-slate-900/80 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-800 backdrop-blur-xl">
            {/* Sliders */}
            <div className="lg:col-span-1 space-y-5 sm:space-y-6">
              <div>
                <label className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Student Capacity</span>
                  <span className="text-indigo-400 font-mono font-bold">{studentCount} Students</span>
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
                  <span className="text-cyan-400 font-mono font-bold">{facultyCount} Members</span>
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
                <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
                  ₹{Math.round(studentCount * (isMultiYear ? 10.2 : 12)).toLocaleString()} / year
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (Just ₹{(isMultiYear ? 10.2 : 12).toFixed(2)} per student per year!)
                </span>
              </div>
            </div>

            {/* Savings Output Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaClock className="text-2xl sm:text-3xl text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1 font-mono">
                  {roiStats.facultyHours}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Faculty Administrative Hours Saved / Year
                </div>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaFileExcel className="text-2xl sm:text-3xl text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1 font-mono">
                  ₹{roiStats.moneySaved}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Estimated Paper & Audit Printing Costs Saved
                </div>
              </div>

              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaAward className="text-2xl sm:text-3xl text-amber-400 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1 font-mono">
                  {roiStats.naacDays} Days
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Saved during NAAC / NBA Audit Cycle
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: COMMERCIAL LICENSING TIERS */}
        <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4">
              <FaTag /> Transparent & Accurately Reduced Cloud Pricing
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 px-2">
              Commercial Licensing Tiers
            </h2>
            <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Thanks to AWS EC2 Graviton efficiency, we offer the most competitive pricing in the education tech market. Zero hidden fees.
            </p>

            {/* Billing Toggle (Annual vs 3-Year Institutional Contract) */}
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-full overflow-x-auto">
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  billingCycle === "annual"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Standard Annual
              </button>
              <button
                onClick={() => setBillingCycle("multiyear")}
                className={`px-3.5 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  billingCycle === "multiyear"
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                3-Year Contract <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">SAVE 15%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Standard Campus Tier */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Standard Campus</h3>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    🔥 80% PRICE CUT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Ideal for single engineering or degree colleges up to 2,500 students.</p>
                
                {/* Reduced Price Header */}
                <div className="mb-6">
                  <div className="text-xs text-slate-400 line-through mb-0.5 font-mono">Original: ₹1,50,000 / yr</div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹{isMultiYear ? "25,499" : "29,999"}
                    <span className="text-xs text-slate-400 font-sans font-normal">/ year</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                    Only ~₹11.99 per student / year
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Full 10 ERP Workspaces Included</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Automated OBE 7-Sheet Excel Generator</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Transport Digital Pass Generator</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Parent Portal Tokenized Access</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-emerald-400 shrink-0" /> Standard Email & Phone Support</li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                Inquire Standard Tier
              </button>
            </div>

            {/* Enterprise Autonomous University (Featured) */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-950 border-2 border-indigo-500 backdrop-blur-xl transition-all flex flex-col justify-between relative shadow-2xl shadow-indigo-500/20 transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-lg">
                Most Popular Autonomous Tier
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 mt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Enterprise University</h3>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px] font-bold">
                    ⚡ 86% SAVINGS
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mb-6">Designed for autonomous colleges & multi-branch universities up to 8,000 students.</p>
                
                {/* Reduced Price Header */}
                <div className="mb-6">
                  <div className="text-xs text-indigo-300/60 line-through mb-0.5 font-mono">Original: ₹4,50,000 / yr</div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹{isMultiYear ? "50,999" : "59,999"}
                    <span className="text-xs text-indigo-200 font-sans font-normal">/ year</span>
                  </div>
                  <div className="text-[11px] text-cyan-300 font-semibold mt-1">
                    Only ~₹7.50 per student / year
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-200 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Everything in Standard Tier</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Integrated AI RAG Library Assistant</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Custom Regulation Mapping (R22, R18)</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Custom Domain Integration & Branding</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-indigo-400 shrink-0" /> Dedicated On-Site Faculty Training</li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-extrabold transition-all shadow-lg shadow-indigo-500/30 cursor-pointer"
              >
                Request Enterprise Proposal
              </button>
            </div>

            {/* SaaS Managed Cloud Tier (AWS EC2) */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">SaaS Managed Cloud</h3>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                    ☁️ AWS EC2 HOSTED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Fully managed cloud hosting with automated quarterly feature updates & 0 maintenance.</p>
                
                {/* Reduced Price Header */}
                <div className="mb-6">
                  <div className="text-xs text-slate-400 line-through mb-0.5 font-mono">Original: ₹99,999 / yr</div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹{isMultiYear ? "33,999" : "39,999"}
                    <span className="text-xs text-slate-400 font-sans font-normal">/ year</span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-semibold mt-1">
                    Includes AWS EC2 Server & Storage Costs
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> Managed AWS EC2 Graviton Instance</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> Automated Daily Database Backups (S3)</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> Unlimited Parent Magic-Link Traffic</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> CloudFront CDN Static File Hosting</li>
                  <li className="flex items-center gap-2"><FaCheckCircle className="text-cyan-400 shrink-0" /> 24/7 Priority Cloud Infrastructure Support</li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                Inquire Cloud SaaS
              </button>
            </div>
          </div>
        </section>

        {/* SYSTEM ARCHITECTURE & TECH STACK SECTION */}
        <section id="tech-stack" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-2xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-6 text-center">
              System Tech Stack & Architecture
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaTerminal className="text-2xl sm:text-3xl text-indigo-400 mb-3 mx-auto" />
                <h3 className="text-base font-bold text-white mb-1">Frontend UI</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  React.js, Tailwind CSS, Framer Motion, HTML5 Canvas 3D rendering, and Redux state management.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaServer className="text-2xl sm:text-3xl text-cyan-400 mb-3 mx-auto" />
                <h3 className="text-base font-bold text-white mb-1">Backend API</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Node.js, Express REST services, JWT security tokens, and biometric attendance integrations.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaCloud className="text-2xl sm:text-3xl text-emerald-400 mb-3 mx-auto" />
                <h3 className="text-base font-bold text-white mb-1">Database & Storage</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  MongoDB with Mongoose ODM schemas, S3 media asset storage, and index optimizations.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <FaFileExcel className="text-2xl sm:text-3xl text-amber-400 mb-3 mx-auto" />
                <h3 className="text-base font-bold text-white mb-1">Report Compilers</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ExcelJS engine for pre-filled template parsing, mark validation, and multi-sheet formula compilation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-8 sm:py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-xs text-slate-400 text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                E
              </div>
              <span className="font-bold text-slate-200 text-sm">ECAP ERP</span>
              <span className="hidden sm:inline">— Educational Campus Portal</span>
            </div>
            <div>Developed & Designed by Laxmi Ganji</div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setShowInquiryModal(true)} className="hover:text-indigo-400 cursor-pointer">
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
        <div
          onClick={() => setSelectedModule(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <FaTimes />
            </button>

            <div className="flex items-center gap-3 sm:gap-4 mb-4 pr-8">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-800 shrink-0">{selectedModule.icon}</div>
              <div>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedModule.badgeColor}`}>
                  {selectedModule.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{selectedModule.title}</h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-indigo-300 font-medium mb-3 sm:mb-4">{selectedModule.tagline}</p>
            <p className="text-xs text-slate-300 leading-relaxed mb-5 sm:mb-6">{selectedModule.description}</p>

            <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Core Capabilities:</h4>
              {selectedModule.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Key Metric / USP:</span>
              <span className="font-bold text-indigo-300 text-[11px] sm:text-xs">{selectedModule.kpi}</span>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedModule(null);
                  setShowInquiryModal(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer text-center"
              >
                Inquire About This Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALES INQUIRY MODAL */}
      {showInquiryModal && (
        <div
          onClick={() => setShowInquiryModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-indigo-500/40 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowInquiryModal(false)}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">Schedule Commercial Demo</h3>
            <p className="text-xs text-slate-400 mb-5">
              Submit your institution details to receive reduced AWS EC2 commercial quotes & feature walk-throughs.
            </p>

            {formSubmitted ? (
              <div className="p-5 sm:p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                <FaCheckCircle className="text-3xl sm:text-4xl text-emerald-400 mx-auto" />
                <h4 className="text-base sm:text-lg font-bold text-white">Inquiry Received!</h4>
                <p className="text-xs text-slate-300">
                  Thank you! Our commercial team will contact your institution shortly with custom AWS EC2 pricing details.
                </p>
                <button
                  onClick={() => { setFormSubmitted(false); setShowInquiryModal(false); }}
                  className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFormSubmitted(true);
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Robert Smith"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="St. Peter's Engineering College"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                    <input
                      type="email"
                      required
                      placeholder="principal@institution.edu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student Capacity</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                    <option>Under 1,000 Students (₹29,999/yr)</option>
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-all cursor-pointer mt-2"
                >
                  Submit Commercial Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio3D;

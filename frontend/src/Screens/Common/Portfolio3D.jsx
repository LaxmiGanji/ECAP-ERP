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
  FaClock,
  FaAward,
  FaServer,
  FaCloud,
  FaMicrochip,
  FaChartLine,
  FaBolt,
  FaTag,
  FaHdd,
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

  // AWS state
  const [awsDetailTab, setAwsDetailTab] = useState("graviton");

  // ROI Calculator state
  const [studentCount, setStudentCount] = useState(2500);
  const [facultyCount, setFacultyCount] = useState(150);

  // Form submit notification message state
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Add-on calculator state
  const [selectedAddons, setSelectedAddons] = useState(["faculty", "attendance", "obe"]);

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
      id: "geofence_faculty",
      category: "ai",
      badge: "Faculty Security AI",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      title: "Faculty Geofence & Face AI Attendance",
      icon: <FaShieldAlt className="text-2xl sm:text-3xl text-emerald-400" />,
      tagline: "GPS Location Geofencing & Touchless AI Facial Recognition",
      description:
        "Enforces tamper-proof faculty attendance logging with campus boundary GPS geofencing radius validation and real-time AI biometric face match verification.",
      highlights: [
        "🛰️ Campus boundary GPS geofence radius check-in for faculty",
        "🎯 Touchless AI biometric face match verification",
        "🚫 Anti-spoofing & proxy attendance prevention engine",
        "📊 Real-time HOD dashboard & automated leave reconciliation"
      ],
      kpi: "100% Location-Verified Faculty Attendance"
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
  const perStudentMonthlyRate = 16.66;
  const perStudentSemRate = 100; // ₹100 per student for 6 months (1 semester)
  const perStudentAnnualRate = 200; // ₹200 per student for 1 year (2 semesters)

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
            Automate accreditation with zero-formula 7-sheet ExcelJS compilers, AI RAG vector tutors, digital bus pass systems, and <strong>transparent multi-tenant AWS cloud deployment</strong> starting at just <strong>₹16.66/month per student</strong> (<strong>₹100 for 6 months / 1 sem</strong> per student).
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
              { num: "₹16.66 / mo", label: "Per Student Monthly Rate", icon: <FaTag className="text-emerald-400" /> },
              { num: "₹100 / sem", label: "Per Student 6 Months (1 Sem)", icon: <FaServer className="text-cyan-400" /> },
              { num: "₹200 / yr", label: "Per Student Annual (2 Sem)", icon: <FaChartLine className="text-indigo-400" /> },
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

        {/* 11 MODULES DIRECTORY SECTION */}
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
                { id: "all", label: "All 11 Modules" },
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
                    <span>₹3,930 / month</span>
                    <span className="text-xs text-emerald-400 font-sans font-semibold">(Standard) to ₹5,999/mo (Enterprise 5k+)</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> Standard AWS EC2 (`t4g.small`): ₹3,930/mo (₹47,160/yr)</li>
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> Enterprise 5k+ Students + 100 GB SSD: ₹5,999/mo (₹71,988/yr)</li>
                    <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> Custom Domain (.edu.in / .com) + Free Cloudflare SSL: Included</li>
                  </ul>
                </div>
              </div>

              {/* Net Savings Bar */}
              <div className="mt-6 sm:mt-8 p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono uppercase text-emerald-400 tracking-widest block">Flexible Infrastructure Scaling</span>
                  <span className="text-base sm:text-xl md:text-2xl font-black text-white">Standard ₹3,930/mo | Enterprise 5k+ ₹5,999/mo</span>
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
                <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono flex flex-col gap-0.5">
                  <span>₹{Math.round(studentCount * perStudentSemRate).toLocaleString()} / semester (6 months)</span>
                  <span className="text-xs font-bold text-cyan-300">₹{Math.round(studentCount * perStudentMonthlyRate).toLocaleString()} / month</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  (₹16.66 per student for 1 month | ₹100 per student for 6 months / 1 sem)
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
              <FaTag /> Transparent Multi-Tenant SaaS Pricing
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 px-2">
              Commercial Licensing Plans
            </h2>
            <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Shared multi-tenant AWS cloud deployment — guaranteed profitable pricing for engineering & autonomous institutions.
            </p>
          </div>

          {/* 3 PLAN CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {/* Standard Plan */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">🥉 Standard Plan</h3>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                    CORE + CO-PO ATTAINMENT
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Core ERP modules plus complete Outcome-Based Education (CO-PO) Engine.</p>
                
                <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
                    ₹6,93,616
                    <span className="text-xs text-slate-400 font-sans font-normal">/ 6 months (1 sem)</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 font-bold mt-0.5">
                    Total: ₹13,87,232 / year
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 border-t border-slate-800/60 pt-1 flex justify-between">
                    <span>Formula: <strong>₹13.62L Expenditure + ₹25k Module</strong></span>
                  </div>
                </div>

                <div className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider mb-2">
                  📦 Included Package Modules:
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mb-6 sm:mb-8">
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>📊 <strong>OBE & CO-PO Attainment Engine</strong>: 7-Sheet NAAC/NBA ExcelJS Compiler</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>🔑 <strong>Auth & Role Control</strong>: Student, Faculty, Parent, HOD & Admin Login</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>📋 <strong>Attendance Management</strong>: Subject-wise attendance & absentee alerts</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>📝 <strong>Marks & Exam Entry</strong>: CIE marks, End-Sem grading & results</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>🔔 <strong>Notice Board Broadcasting</strong>: Emergency alerts & college news</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>🎓 <strong>Student & Parent Portal</strong>: Web access for grades & attendance</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-emerald-400 shrink-0 mt-0.5" /> <span>💼 <strong>Fixed Ops Expenditure Included</strong>: AWS + Domain + Salary + SMS</span></li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                Inquire Standard Plan
              </button>
            </div>

            {/* Premium Plan (Featured) */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-950 border-2 border-amber-500 backdrop-blur-xl transition-all flex flex-col justify-between relative shadow-2xl shadow-amber-500/10 transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-lg">
                ⭐ Most Popular Plan
              </div>

              <div>
                <div className="flex justify-between items-center mb-3 mt-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white">🥈 Premium Plan</h3>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    ANDROID APP + AI SUITE
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mb-4">Full ERP with Native Android App & AI Gemini Assistant.</p>
                
                <div className="mb-4 p-3 rounded-xl bg-slate-950/90 border border-amber-500/30">
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-baseline gap-1">
                    ₹7,18,616
                    <span className="text-xs text-indigo-200 font-sans font-normal">/ 6 months (1 sem)</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 font-bold mt-0.5">
                    Total: ₹14,37,232 / year
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 border-t border-slate-800/80 pt-1 flex justify-between">
                    <span>Formula: <strong>₹13.62L Expenditure + ₹75k Module</strong></span>
                  </div>
                </div>

                <div className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider mb-2">
                  🚀 Included & Customizable Modules:
                </div>
                <ul className="space-y-2 text-xs text-slate-200 mb-6 sm:mb-8">
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>📱 <strong>Native Android & iOS Mobile App Included</strong>: Push alerts & digital pass</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>🤖 <strong>AI Gemini Assistant Integration</strong>: Google Gemini RAG Q&A bot</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>🛰️ <strong>Faculty Geofence & Facial Recognition AI Attendance</strong>: Location-verified check-in</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>📊 <strong>OBE & CO-PO Attainment Engine</strong>: 7-Sheet NAAC ExcelJS Compiler</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>📦 <strong>All Core Modules Included</strong>: Auth, Attendance, Marks & Notices</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>🛠️ <strong>3 Customizable Add-on Modules</strong>: Transport, Library, Accounts, Placement</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-amber-400 shrink-0 mt-0.5" /> <span>💼 <strong>Fixed Ops Expenditure Included</strong>: AWS + Domain + Salary + SMS</span></li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                Get Premium Plan
              </button>
            </div>

            {/* Customizable Plan */}
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-900/70 border border-purple-500/50 hover:border-purple-400 backdrop-blur-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white">🥇 Customizable Plan</h3>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    100% À LA CARTE
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Tailored à la carte selection for universities & multi-campus custom scaling.</p>
                
                <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono flex items-baseline gap-1">
                    ₹7,56,116
                    <span className="text-xs text-slate-400 font-sans font-normal">/ 6 months (1 sem)</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 font-bold mt-0.5">
                    Total: ₹15,12,232+ / year
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 border-t border-slate-800/60 pt-1 flex justify-between">
                    <span>Formula: <strong>₹13.62L Expenditure + Custom Modules</strong></span>
                  </div>
                </div>

                <div className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider mb-2">
                  🧩 Tailored Enterprise Modules:
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mb-6 sm:mb-8">
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-purple-400 shrink-0 mt-0.5" /> <span><strong>100% À la Carte Custom Selection</strong>: Pick & pay for any module combination</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-purple-400 shrink-0 mt-0.5" /> <span>🤖 <strong>Full AI Suite</strong>: Gemini RAG Assistant + AI Question Generator</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-purple-400 shrink-0 mt-0.5" /> <span>📱 <strong>White-Label Native Mobile Apps</strong>: Custom branded for college</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-purple-400 shrink-0 mt-0.5" /> <span>🔐 <strong>Multi-Tenant Data Security Vault</strong>: Enterprise tenant isolation & AES-256 encryption</span></li>
                  <li className="flex items-start gap-2"><FaCheckCircle className="text-purple-400 shrink-0 mt-0.5" /> <span>⚡ <strong>Dedicated AWS Cluster & Storage</strong>: Multi-campus load balancing</span></li>
                </ul>
              </div>

              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-3 sm:py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all border border-purple-500 cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>

          {/* DETAILED PLAN-BY-PLAN COMPARISON TABLE */}
          <div className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl mb-12">
            <div className="text-center mb-8">
              <span className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-2">
                📋 FEATURE-BY-FEATURE COMPARISON
              </span>
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
                Compare All Plans Side-by-Side
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Detailed feature availability matrix for Starter, Professional, and Enterprise plans.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-white font-bold w-1/3">Feature</th>
                    <th className="p-3.5 text-blue-300 text-center font-bold">🥉 Standard Plan<br/><span className="text-[10px] text-slate-400 font-normal">₹6,93,616 / sem (₹13.62L Exp + ₹25k)</span></th>
                    <th className="p-3.5 text-amber-400 text-center font-extrabold bg-amber-500/10 border-x border-amber-500/30">🥈 Premium Plan ⭐<br/><span className="text-[10px] text-amber-200 font-normal">₹7,18,616 / sem (₹13.62L Exp + ₹75k)</span></th>
                    <th className="p-3.5 text-purple-300 text-center font-bold">🥇 Customizable Plan<br/><span className="text-[10px] text-slate-400 font-normal">₹7,56,116 / sem (₹13.62L Exp + Custom)</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className="bg-slate-900/60 font-bold text-amber-400 text-[11px] uppercase tracking-wider"><td colSpan={4} className="p-2.5">👥 Capacity & Scale</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Max Students Supported</td><td className="p-3 text-center font-bold text-blue-300">5,000</td><td className="p-3 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">10,000</td><td className="p-3 text-center font-bold text-purple-300">10,000</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Max Faculty & Staff Accounts</td><td className="p-3 text-center">300</td><td className="p-3 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">600</td><td className="p-3 text-center font-bold text-purple-300">600</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Cloud File Storage</td><td className="p-3 text-center font-bold text-blue-300">2 TB</td><td className="p-3 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">10 TB</td><td className="p-3 text-center font-bold text-purple-300">10 TB</td></tr>

                  <tr className="bg-slate-900/60 font-bold text-indigo-400 text-[11px] uppercase tracking-wider"><td colSpan={4} className="p-2.5">🔐 Security & Authentication</td></tr>
                  <tr><td className="p-3">JWT Token Authentication</td><td className="p-3 text-center text-emerald-400">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Google OAuth 2.0 Integration</td><td className="p-3 text-center text-emerald-400">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Two-Factor Authentication (OTP)</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">SSO / IP Whitelisting</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-rose-500 bg-amber-500/5 border-x border-amber-500/20">❌</td><td className="p-3 text-center text-emerald-400">✅</td></tr>

                  <tr className="bg-slate-900/60 font-bold text-cyan-400 text-[11px] uppercase tracking-wider"><td colSpan={4} className="p-2.5">📦 Core Institutional Modules</td></tr>
                  <tr><td className="p-3">Attendance Management</td><td className="p-3 text-center text-emerald-400">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Marks & Examination Entry</td><td className="p-3 text-center text-emerald-400">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Notice Board & Broadcasting</td><td className="p-3 text-center text-emerald-400">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Faculty & HOD Workspaces</td><td className="p-3 text-center text-emerald-400">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Geofencing & Facial Recognition (Faculty)</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20 font-bold">✅</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td></tr>
                  <tr><td className="p-3 font-semibold text-white">OBE & CO-PO Attainment Engine ⭐</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20 font-bold">✅</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td></tr>
                  <tr><td className="p-3">Transport Fleet Management</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Library System & Cataloging</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Placement Cell & Pipeline</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Accounts & Fee Governance</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>

                  <tr className="bg-slate-900/60 font-bold text-purple-400 text-[11px] uppercase tracking-wider"><td colSpan={4} className="p-2.5">⚡ Premium & Innovation Features</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Mobile App (PWA & Android)</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 font-bold bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td></tr>
                  <tr><td className="p-3 font-semibold text-white">AI Assistant (Google Gemini RAG)</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 font-bold bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td></tr>
                  <tr><td className="p-3">White Label Branding</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-rose-500 bg-amber-500/5 border-x border-amber-500/20">❌</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Multi-Campus Dashboard</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-rose-500 bg-amber-500/5 border-x border-amber-500/20">❌</td><td className="p-3 text-center text-emerald-400">✅</td></tr>

                  <tr className="bg-slate-900/60 font-bold text-rose-400 text-[11px] uppercase tracking-wider"><td colSpan={4} className="p-2.5">🛠️ Support & SLA Services</td></tr>
                  <tr><td className="p-3">Email Support SLA</td><td className="p-3 text-center">48 Hours</td><td className="p-3 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">24 Hours</td><td className="p-3 text-center font-bold text-purple-300">Priority</td></tr>
                  <tr><td className="p-3">WhatsApp Support</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-emerald-400 bg-amber-500/5 border-x border-amber-500/20">✅</td><td className="p-3 text-center text-emerald-400">✅</td></tr>
                  <tr><td className="p-3">Phone Support</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-rose-500 bg-amber-500/5 border-x border-amber-500/20">❌</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Dedicated Account Manager</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-rose-500 bg-amber-500/5 border-x border-amber-500/20">❌</td><td className="p-3 text-center text-emerald-400 font-bold">✅</td></tr>
                  <tr><td className="p-3 font-semibold text-white">Uptime Guarantee SLA</td><td className="p-3 text-center text-slate-500">—</td><td className="p-3 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">99.5%</td><td className="p-3 text-center font-bold text-emerald-400">99.9%</td></tr>
                  <tr><td className="p-3">On-site Faculty Training</td><td className="p-3 text-center text-rose-500">❌</td><td className="p-3 text-center text-slate-300 bg-amber-500/5 border-x border-amber-500/20">2 Sessions</td><td className="p-3 text-center text-emerald-400 font-bold">1 Day On-Site</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ADD-ON MODULES & LIVE CALCULATOR */}
          <div className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl mb-12">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
                🧩 Reduced À la Carte Add-on Modules & Live Calculator
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Start with the Base Plan (₹4,999/yr) and add only the specific low-cost modules your institution needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
              {[
                { id: "base", label: "🏛️ Base Plan Infrastructure (Mandatory)", price: 4999, isBase: true },
                { id: "faculty", label: "🏢 Faculty & HOD Workspace", price: 2999 },
                { id: "attendance", label: "📋 Attendance Management", price: 3499 },
                { id: "marks", label: "📝 Marks & Examination", price: 3499 },
                { id: "obe", label: "📊 OBE & CO-PO Attainment ⭐", price: 4999 },
                { id: "transport", label: "🚍 Transport Management", price: 2499 },
                { id: "library", label: "📚 Library System & Cataloging", price: 1999 },
                { id: "placement", label: "💼 Placement Cell & Pipeline", price: 2499 },
                { id: "accounts", label: "💳 Accounts & Fee Governance", price: 3999 },
                { id: "mobile", label: "📱 Mobile App (PWA & Android/iOS)", price: 5999 },
                { id: "ai", label: "🤖 AI Assistant (Google Gemini)", price: 4999 },
                { id: "whatsapp", label: "🔔 WhatsApp Parent Bot Alerts", price: 2999 },
                { id: "payment", label: "💳 Online Payment Gateway (Razorpay/PayTM)", price: 1999 },
                { id: "training", label: "🚀 On-Site Faculty Training & Setup Support", price: 4999 },
                { id: "maintenance", label: "🛠️ Annual Maintenance & Core Updations (SLA)", price: 5999 },
                { id: "domain", label: "🌐 Custom Domain (.edu.in / .com) + SSL", price: 999 },
                { id: "backup", label: "💾 Automated Daily S3 Database Storage Vault", price: 1499 },
                /* 12 NEW FUTURE & INNOVATION ADD-ON MODULES */
                { id: "rfid", label: "🪪 Smart RFID & Biometric Gate Access Attendance", price: 3999 },
                { id: "alumni", label: "🚀 Alumni Network & Global Career Placement Portal", price: 2999 },
                { id: "hostel", label: "🏨 Hostel, Mess & Out-Pass Workflow Governance", price: 3499 },
                { id: "health", label: "🩺 Campus Health & Medical Records Vault", price: 1999 },
                { id: "blockchain", label: "🔐 Blockchain Digital Certificate Verification", price: 4999 },
                { id: "face_ai", label: "🎯 Biometric Face Recognition Attendance AI", price: 4999 },
                { id: "research", label: "🎓 Research Projects & Grant Management System", price: 2999 },
                { id: "gps", label: "🚌 Real-Time Bus GPS Live Tracking Mobile Pass", price: 2499 },
                { id: "exam_ai", label: "📝 AI Exam Question Paper Generator & Auto-Grader", price: 4499 },
                { id: "sports", label: "🏆 Extra-Curricular & Sports Quota Management", price: 1999 },
                { id: "soc_cyber", label: "🛡️ Cybersecurity SOC & Incident Audit Trail", price: 3999 },
                { id: "analytics_ai", label: "📊 Machine Learning Student Dropout Risk Analytics", price: 3499 }
              ].map((item) => {
                const isChecked = item.isBase || selectedAddons.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.isBase) return;
                      if (selectedAddons.includes(item.id)) {
                        setSelectedAddons(selectedAddons.filter((a) => a !== item.id));
                      } else {
                        setSelectedAddons([...selectedAddons, item.id]);
                      }
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? "bg-indigo-950/60 border-indigo-500/60 text-white"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={item.isBase}
                        onChange={() => {}}
                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0 ml-2">
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total Calculation Display */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 font-medium block">Custom Plan Estimated Annual Total:</span>
                <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono mt-0.5">
                  ₹
                  {(
                    4999 +
                    selectedAddons.reduce((acc, id) => {
                      const prices = {
                        faculty: 2999, attendance: 3499, marks: 3499, obe: 4999,
                        transport: 2499, library: 1999, placement: 2499, accounts: 3999,
                        mobile: 5999, ai: 4999, whatsapp: 2999, payment: 1999,
                        training: 4999, maintenance: 5999, domain: 999, backup: 1499,
                        rfid: 3999, alumni: 2999, hostel: 3499, health: 1999,
                        blockchain: 4999, face_ai: 4999, research: 2999, gps: 2499,
                        exam_ai: 4499, sports: 1999, soc_cyber: 3999, analytics_ai: 3499
                      };
                      return acc + (prices[id] || 0);
                    }, 0)
                  ).toLocaleString("en-IN")}
                  <span className="text-xs text-slate-400 font-sans font-normal"> / year</span>
                </div>
              </div>
              <button
                onClick={() => setShowInquiryModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
              >
                Inquire Custom Module Plan →
              </button>
            </div>
          </div>

          {/* DETAILED COST & OPERATIONAL OVERHEAD TRANSPARENCY TABLES */}
          <div className="p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-indigo-500/40 backdrop-blur-xl mb-12">
            <div className="text-center mb-8">
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest block mb-2">
                ⚡ TRANSPARENT COST & OPERATIONS BREAKDOWN
              </span>
              <h3 className="text-xl sm:text-3xl font-extrabold text-white mb-2">
                Why ECAP ERP Pricing Delivers High Value & Sustainability
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                Our pricing covers AWS Cloud Hosting infrastructure plus an active <strong>4-Member Dedicated Engineering Team</strong> providing continuous maintenance, security updates, and NAAC ExcelJS compiler upgrades.
              </p>
            </div>

            {/* TABLE 1: AWS INFRASTRUCTURE MONTHLY & ANNUAL COST */}
            <div className="mb-10">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>☁️ Table 1: AWS Infrastructure Cloud Service Costs</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">AWS Service</th>
                      <th className="p-3">Purpose & Specification</th>
                      <th className="p-3">USD / Month</th>
                      <th className="p-3">INR / Month</th>
                      <th className="p-3">INR / Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    <tr>
                      <td className="p-3 font-semibold text-white">EC2 t3.medium × 2</td>
                      <td className="p-3 font-sans text-slate-400">Node.js Express Cluster (2 Load-Balanced Instances)</td>
                      <td className="p-3">$62.00</td>
                      <td className="p-3">₹5,208</td>
                      <td className="p-3 text-amber-300">₹62,496</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">MongoDB Atlas M10</td>
                      <td className="p-3 font-sans text-slate-400">Managed High-Availability Database (Mumbai ap-south-1)</td>
                      <td className="p-3">$57.00</td>
                      <td className="p-3">₹4,788</td>
                      <td className="p-3 text-amber-300">₹57,456</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Application Load Balancer</td>
                      <td className="p-3 font-sans text-slate-400">AWS ALB Traffic Routing & Auto-Scaling Control</td>
                      <td className="p-3">$18.00</td>
                      <td className="p-3">₹1,512</td>
                      <td className="p-3 text-amber-300">₹18,144</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Amazon CloudFront CDN</td>
                      <td className="p-3 font-sans text-slate-400">Global Edge Asset Caching & HTTPS SSL Accelerator</td>
                      <td className="p-3">$7.00</td>
                      <td className="p-3">₹588</td>
                      <td className="p-3 text-amber-300">₹7,056</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Amazon S3 Storage Vault</td>
                      <td className="p-3 font-sans text-slate-400">PDF Bus Passes, Study Materials & Excel Exports Storage</td>
                      <td className="p-3">$1.50</td>
                      <td className="p-3">₹126</td>
                      <td className="p-3 text-amber-300">₹1,512</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Amazon SES & Route 53</td>
                      <td className="p-3 font-sans text-slate-400">College Email OTP Dispatch (~10k emails) & DNS Routing</td>
                      <td className="p-3">$2.00</td>
                      <td className="p-3">₹168</td>
                      <td className="p-3 text-amber-300">₹2,016</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">CloudWatch & Secrets Manager</td>
                      <td className="p-3 font-sans text-slate-400">24/7 Crash Alerts & Encrypted JWT / OAuth Key Vault</td>
                      <td className="p-3">$6.50</td>
                      <td className="p-3">₹546</td>
                      <td className="p-3 text-amber-300">₹6,552</td>
                    </tr>
                    <tr className="bg-slate-900 font-bold text-white">
                      <td className="p-3" colSpan={2}>🔴 TOTAL AWS CLOUD INFRASTRUCTURE EXPENSE</td>
                      <td className="p-3 text-cyan-300">$154.00</td>
                      <td className="p-3 text-cyan-300">₹12,936</td>
                      <td className="p-3 text-amber-400">₹1,55,232 / year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 2: COMPLETE OPERATIONAL EXPENSES & PER-STUDENT BREAKDOWN */}
            <div className="mb-10">
              <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>📋 Table 2: Complete Operational Overhead & Per-Student Cost Breakdown</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Expense Head / Service</th>
                      <th className="p-3">Scope & Operational Responsibility</th>
                      <th className="p-3">Monthly Cost</th>
                      <th className="p-3">Annual Expenses (INR)</th>
                      <th className="p-3 text-amber-300">Per Student Cost / Year <span className="text-[10px] text-slate-400 font-normal">(5k scale)</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span> AWS Cloud Hosting Infrastructure
                      </td>
                      <td className="p-3 font-sans text-slate-400">EC2 Node.js Cluster, MongoDB Atlas, Load Balancer, CloudFront CDN, S3 Storage & Secrets</td>
                      <td className="p-3 text-cyan-300">₹12,936 / mo</td>
                      <td className="p-3 font-bold text-cyan-300">₹1,55,232 / year</td>
                      <td className="p-3 font-bold text-amber-400">₹31.04 / student / yr <span className="text-[10px] text-slate-400 font-normal">(₹2.59/mo)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Custom Domain & SSL Security
                      </td>
                      <td className="p-3 font-sans text-slate-400">Institutional Domain (.edu.in / .com), DNS Routing & Automated SSL Certificate Vault</td>
                      <td className="p-3 text-emerald-300">₹417 / mo</td>
                      <td className="p-3 font-bold text-emerald-300">₹5,000 / year</td>
                      <td className="p-3 font-bold text-amber-400">₹1.00 / student / yr <span className="text-[10px] text-slate-400 font-normal">(₹0.08/mo)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span> 4-Member Engineering Team Salary
                      </td>
                      <td className="p-3 font-sans text-slate-400">Salary fund for 4 Dedicated Engineers (DevOps, MERN Dev, OBE Specialist, Client SLA Lead)</td>
                      <td className="p-3 text-purple-300">₹1,00,000 / mo</td>
                      <td className="p-3 font-bold text-purple-300">₹12,00,000 / year</td>
                      <td className="p-3 font-bold text-amber-400">₹240.00 / student / yr <span className="text-[10px] text-slate-400 font-normal">(₹20.00/mo)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> SMS & OTP Gateway Dispatch
                      </td>
                      <td className="p-3 font-sans text-slate-400">Two-Factor Auth Login OTPs, Parent Attendance Broadcast Alerts & Emergency Notifications</td>
                      <td className="p-3 text-amber-300">₹166 / mo</td>
                      <td className="p-3 font-bold text-amber-300">₹2,000 / year</td>
                      <td className="p-3 font-bold text-amber-400">₹0.40 / student / yr <span className="text-[10px] text-slate-400 font-normal">(₹0.03/mo)</span></td>
                    </tr>
                    <tr className="bg-slate-900 font-bold text-white">
                      <td className="p-3" colSpan={2}>🟣 TOTAL ANNUAL OPERATIONAL EXPENSES</td>
                      <td className="p-3 text-cyan-400">₹1,13,519 / mo</td>
                      <td className="p-3 font-mono text-emerald-400 text-sm">₹13,62,232 / year</td>
                      <td className="p-3 font-mono text-amber-300 text-sm">₹272.44 / student / yr <span className="text-[10px] text-slate-300 font-normal">(₹22.70/mo)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 3: MULTI-TENANT SAAS PROFITABILITY & ROI MATRIX */}
            <div>
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>📈 Table 3: Multi-Tenant Revenue vs Expenses & Net Profit Breakdown</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-300 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Client Scale</th>
                      <th className="p-3">Annual Revenue</th>
                      <th className="p-3">Total Operational Costs (AWS + 4-Member Team)</th>
                      <th className="p-3">Net Annual Profit</th>
                      <th className="p-3">Net Profit Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                    <tr>
                      <td className="p-3 font-semibold text-white">1 Client (Standard Plan 5,000 Students @ ₹100/sem)</td>
                      <td className="p-3 font-bold text-white">₹10,00,000 / yr</td>
                      <td className="p-3 text-slate-400">₹13,62,232 (AWS ₹1.55L + Domain ₹5k + Salary ₹12L + SMS ₹2k)</td>
                      <td className="p-3 text-amber-400 font-bold">Subsidized Ops Cover</td>
                      <td className="p-3 text-slate-400">Initial Infrastructure Phase</td>
                    </tr>
                    <tr className="bg-emerald-950/30">
                      <td className="p-3 font-semibold text-amber-400">5 Clients (Premium Plan 5,000 Students @ ₹100/sem)</td>
                      <td className="p-3 font-extrabold text-cyan-300">₹50,00,000 / yr</td>
                      <td className="p-3 text-slate-300">₹14,75,232 (AWS Scaled + Full Expenses)</td>
                      <td className="p-3 text-emerald-300 font-extrabold text-sm">₹35,24,768 / yr</td>
                      <td className="p-3 text-emerald-400 font-bold">70.5% Net Margin</td>
                    </tr>
                    <tr className="bg-indigo-950/40">
                      <td className="p-3 font-semibold text-purple-300">10 Clients (Premium Plan 5,000 Students @ ₹100/sem)</td>
                      <td className="p-3 font-extrabold text-cyan-300">₹1,00,00,000 / yr</td>
                      <td className="p-3 text-slate-300">₹15,25,232 (AWS Scaled + Team Ops)</td>
                      <td className="p-3 text-emerald-300 font-extrabold text-sm">₹84,74,768 / yr</td>
                      <td className="p-3 text-emerald-400 font-bold">84.7% Net Margin</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 font-sans">
                💡 <strong>Per Student Cost Breakdown</strong>: Standard student billing is <strong>₹16.66 per student per month</strong> (₹100/sem = ₹200/year). Complete operational overheads (AWS Cloud ₹2.59/mo + 4-Member Engineering Team Salary ₹20.00/mo + Domain ₹0.08/mo + SMS ₹0.03/mo) total <strong>₹22.70 per student per month</strong> (₹272.44/student/year).
              </p>
              <p className="text-[11px] text-slate-400 mt-3 font-sans">
                💡 <strong>Cost Per Student Metric</strong>: Standard student pricing is <strong>₹16.66 per student per month</strong> (which equals <strong>₹100 per student for 6 months / 1 semester</strong>). AWS hosting overhead remains under ₹2.59/student/month, giving your institution maximum cost efficiency.
              </p>
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

        {/* FUTURISTIC INNOVATION ADD-ON MODULES SECTION */}
        <section id="addons-showcase" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-2xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3.5 py-1 rounded-full border border-purple-500/20">
                🚀 Futuristic Innovation Add-On Suite (12+ Modules)
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-4 mb-3">
                Extend Your Campus ERP With Next-Gen Innovations
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Plug-and-play add-on modules designed to digitize specialized campus operations, biometric gates, AI auto-grading, and predictive student risk analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {/* Addon 1 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">📇</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Hardware IoT</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Smart RFID & Biometric Gate Access</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Automated campus turnstile entry logging with real-time SMS alerts to parents when students arrive or depart from campus gates.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹3,999 / year</span>
                </div>
              </div>

              {/* Addon 2 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🎓</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">Placement & Alumni</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Alumni Network & Placement Portal</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Alumni directory registry, job posting board, mentorship scheduling, and institutional donation vault with tax receipt generator.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹2,999 / year</span>
                </div>
              </div>

              {/* Addon 3 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🏢</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Hostel & Mess</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Hostel, Mess & Out-Pass Workflow</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Digital student out-pass approval system, room allotment, mess attendance tracking, and warden emergency alert notifications.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹3,499 / year</span>
                </div>
              </div>

              {/* Addon 4 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🩺</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Health Vault</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Campus Health & Medical Vault</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Student emergency blood group database, campus doctor visit logs, prescription archives, and instant parent emergency call alerts.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹1,999 / year</span>
                </div>
              </div>

              {/* Addon 5 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">📜</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Blockchain Security</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Blockchain Certificate Verification</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Tamper-proof digital degree & mark sheet hashing stored on blockchain ledger for instant global background check verification.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹4,999 / year</span>
                </div>
              </div>

              {/* Addon 6 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">👁️</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">AI Biometrics</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Biometric Face Recognition AI</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Touchless camera-based facial attendance logging for classrooms and examination halls with proxy attendance detection.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹4,999 / year</span>
                </div>
              </div>

              {/* Addon 7 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🔬</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">R&D Governance</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Research Projects & Grant System</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Faculty research funding management, patent application tracking, research journal submissions, and NIRF publication metrics.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹2,999 / year</span>
                </div>
              </div>

              {/* Addon 8 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🚌</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">GPS Telemetry</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Real-Time Bus GPS Tracking Pass</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Live GPS bus tracking on mobile app, automated arrival notifications for students/parents, and digital QR bus pass verification.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹2,499 / year</span>
                </div>
              </div>

              {/* Addon 9 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">📝</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">AI Exam Engine</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">AI Question Paper & Auto-Grader</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Bloom's taxonomy question paper generator, automated optical answer script evaluation, and rubric-based CIE marking.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹4,499 / year</span>
                </div>
              </div>

              {/* Addon 10 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🏆</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Sports & Clubs</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Sports & Extra-Curricular Portal</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Inter-college tournament registrations, sports quota mark allocations, club activity logs, and digital merit certificates.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹1,999 / year</span>
                </div>
              </div>

              {/* Addon 11 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🛡️</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Cyber SOC</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Cybersecurity SOC & Threat Audit</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Real-time threat monitoring dashboard, automated IP brute-force blocking, vulnerability auditing, and compliance reporting.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹3,999 / year</span>
                </div>
              </div>

              {/* Addon 12 */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🔮</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">ML Predictive AI</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">ML Student Dropout Risk Analytics</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Machine learning predictive early-warning model flagging at-risk students based on attendance patterns & CIE performance trends.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Budget Rate:</span>
                  <span className="text-amber-400 font-bold">₹3,499 / year</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DATA & PROJECT SECURITY ARCHITECTURE SECTION */}
        <section id="security" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-2xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                🛡️ Enterprise Security & Data Governance
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-4 mb-3">
                Institutional Data & Project Security Infrastructure
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Bank-grade encryption, zero-trust RBAC access controls, automated cloud backups, and multi-tenant data isolation engineered into every layer of ECAP ERP.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl mb-4 border border-emerald-500/20">
                  <FaShieldAlt />
                </div>
                <h3 className="text-base font-bold text-white mb-2">JWT & RBAC Access Control</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stateless JSON Web Tokens with cryptographic signature verification. Strict Role-Based Access Control (RBAC) isolates permissions for Admin, Principal, HOD, Faculty, Student, and Parent accounts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl mb-4 border border-cyan-500/20">
                  <FaShieldAlt />
                </div>
                <h3 className="text-base font-bold text-white mb-2">TLS 1.3 & AES-256 Encryption</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  256-bit SSL/TLS end-to-end encryption for all web and API traffic. Database records and sensitive files are protected with hardware-level AES-256 data-at-rest encryption on MongoDB Atlas.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl mb-4 border border-purple-500/20">
                  <FaCloud />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Multi-Tenant Data Isolation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Logical multi-tenancy with mandatory tenant key scoping prevents cross-institutional data leakage. Each institution operates in an isolated secure namespace.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl mb-4 border border-amber-500/20">
                  <FaServer />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Automated Hourly Cloud Backups</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Continuous point-in-time recovery with automated hourly snapshots archived to AWS S3 Glacier Object Vault with 99.999999999% (11 9s) data durability.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xl mb-4 border border-indigo-500/20">
                  <FaShieldAlt />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Bcrypt Hashing & Secrets Vault</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Password security with salted Bcrypt hashing (12 rounds). Zero plaintext storage. AWS Secrets Manager securely handles database connection strings and OAuth keys.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-xl mb-4 border border-rose-500/20">
                  <FaCheckCircle />
                </div>
                <h3 className="text-base font-bold text-white mb-2">DDoS Protection & Audit Logs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AWS WAF and Shield protect Node.js server endpoints from malicious volumetric DDoS attacks, SQL/NoSQL injection, and XSS exploits while logging full activity audit trails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM BENCHMARK COMPARISON SECTION */}
        <section id="comparison" className="py-12 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl bg-slate-900/90 border border-indigo-500/30 backdrop-blur-2xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
                🏆 Architectural Superiority Benchmark
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-4 mb-3">
                Why ECAP ERP Outperforms Traditional Campus ERP Systems
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                A side-by-side technical evaluation highlighting the modern AI, OBE automation, and cost advantages of our next-gen platform against legacy software.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4 w-1/4">Evaluation Category</th>
                    <th className="p-4 w-5/12 text-emerald-400 bg-emerald-950/20 border-x border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-white">🚀 ECAP ERP System</span>
                        <span className="text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">⭐ OUR PROJECT</span>
                      </div>
                    </th>
                    <th className="p-4 w-5/12 text-slate-400">
                      <span className="font-extrabold text-sm text-slate-300">🏢 Traditional / Legacy Campus ERPs</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
                  <tr>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> OBE & CO-PO Attainment
                    </td>
                    <td className="p-4 bg-emerald-950/20 border-x border-emerald-500/30 font-medium text-emerald-300">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold text-sm">✅</span>
                        <span><strong>Automated 7-Sheet ExcelJS Engine</strong>: Zero-formula calculation, instant CO-PO attainment mapping & direct NAAC/NBA exports.</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold text-sm">❌</span>
                        <span><strong>Manual Spreadsheet Entry</strong>: High risk of human formula error, tedious manual calculation, no direct NBA mapping.</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Artificial Intelligence (AI)
                    </td>
                    <td className="p-4 bg-emerald-950/20 border-x border-emerald-500/30 font-medium text-emerald-300">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold text-sm">✅</span>
                        <span><strong>Integrated Google Gemini AI Tutors</strong>: RAG-based 24/7 student query resolution, AI question generator & intelligent insights.</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold text-sm">❌</span>
                        <span><strong>No Built-In AI Intelligence</strong>: Static forms, slow ticket-based manual support, zero automated tutoring.</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pricing Transparency & ROI
                    </td>
                    <td className="p-4 bg-emerald-950/20 border-x border-emerald-500/30 font-medium text-emerald-300">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold text-sm">✅</span>
                        <span><strong>₹22.70 / student / month (₹272.44/yr)</strong>: Transparent operational overhead model including AWS cloud + 4-member SLA engineering team.</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold text-sm">❌</span>
                        <span><strong>Expensive Per-User Licensing</strong>: Opaque pricing, expensive annual maintenance contracts (AMC), hidden per-module fees.</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span> Mobile & Transport Pass
                    </td>
                    <td className="p-4 bg-emerald-950/20 border-x border-emerald-500/30 font-medium text-emerald-300">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold text-sm">✅</span>
                        <span><strong>Native Android & PWA Mobile Apps</strong>: Real-time push notifications, digital bus pass with QR validation & parent tracking.</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold text-sm">❌</span>
                        <span><strong>Desktop-Only Web Interface</strong>: Non-responsive mobile access, no native app push notifications or digital bus passes.</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Cloud Hosting & Scalability
                    </td>
                    <td className="p-4 bg-emerald-950/20 border-x border-emerald-500/30 font-medium text-emerald-300">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold text-sm">✅</span>
                        <span><strong>AWS Multi-Tenant Cloud Architecture</strong>: Load-balanced EC2 cluster, 99.9% uptime SLA, automated hourly backups & 10 TB storage.</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold text-sm">❌</span>
                        <span><strong>On-Premise Legacy Servers</strong>: High risk of server crashes during exam result releases, manual server maintenance.</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span> Dedicated Support SLA
                    </td>
                    <td className="p-4 bg-emerald-950/20 border-x border-emerald-500/30 font-medium text-emerald-300">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold text-sm">✅</span>
                        <span><strong>4-Member Dedicated Engineering SLA Team</strong>: Active DevOps, MERN dev, OBE specialist & client lead with 24/7 monitoring.</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold text-sm">❌</span>
                        <span><strong>Slow Support Resolution</strong>: Days/weeks for ticket resolution, extra charges for custom features and upgrades.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
                  <label className="block text-slate-300 font-semibold mb-1">Student Capacity & Plan</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                    <option>Standard Plan (₹6,93,616/sem: Core Modules + CO-PO Attainment)</option>
                    <option>Premium Plan (₹7,18,616/sem: Native Android App + AI Assistant)</option>
                    <option>Customizable Plan (₹7,56,116/sem: À la Carte Modules & Enterprise Scale)</option>
                    <option>Custom Per-Student & À la Carte Module Plan</option>
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

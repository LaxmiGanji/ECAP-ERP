document.addEventListener('DOMContentLoaded', () => {
  // Select DOM Elements
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.nav-dot');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const playBtn = document.getElementById('playBtn');
  const pageIndicator = document.getElementById('pageIndicator');
  const playIcon = document.getElementById('playIcon');

  let currentSlide = 0;
  const totalSlides = slides.length;
  let autoplayInterval = null;
  let isAutoplay = false;

  // Initialize navigation & trigger cover stats counter
  updateNavigation();
  triggerStatsCounter();

  // Slide Go-to Function
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    // Reset classes for transition direction
    slides.forEach((slide, idx) => {
      slide.classList.remove('active-slide', 'prev-slide');
      if (idx < index) {
        slide.classList.add('prev-slide');
      }
    });

    // Activate current slide
    slides[index].classList.add('active-slide');
    
    // Update dots
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index].classList.add('active');

    currentSlide = index;
    updateNavigation();

    // Trigger statistics counters when entering cover page
    if (currentSlide === 0) {
      triggerStatsCounter();
    }
  }

  // Update Navigation buttons and indicator text
  function updateNavigation() {
    pageIndicator.textContent = `Page ${currentSlide + 1} of ${totalSlides}`;
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
  }

  // Statistics Counter Animation (Cover Page)
  function triggerStatsCounter() {
    // Target both old badge-num and new stat-num elements
    const stats = document.querySelectorAll('.badge-num, .stat-num[data-target]');
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'), 10);
      if (isNaN(target) || target === 0) return;
      const label = (stat.nextElementSibling || {}).textContent || '';
      let count = 0;
      const duration = 1500;
      const intervalSpeed = 30;
      const step = target / (duration / intervalSpeed);

      const counter = setInterval(() => {
        count += step;
        if (count >= target) {
          clearInterval(counter);
          // Format: GPS/uptime → %, modules/reports → +, else plain
          if (label.toLowerCase().includes('gps') || label.toLowerCase().includes('geofenced')) {
            stat.textContent = `${target}%`;
          } else if (target > 10 || label.toLowerCase().includes('module') || label.toLowerCase().includes('report')) {
            stat.textContent = `${target}+`;
          } else {
            stat.textContent = `${target}+`;
          }
        } else {
          stat.textContent = Math.floor(count);
        }
      }, intervalSpeed);

    });
  }

  // Nav Event Listeners
  prevBtn.addEventListener('click', () => {
    stopAutoplay();
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  });

  nextBtn.addEventListener('click', () => {
    stopAutoplay();
    if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stopAutoplay();
      goToSlide(index);
    });
  });

  // Keyboard Shortcuts Navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Space') {
      e.preventDefault();
      stopAutoplay();
      if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stopAutoplay();
      if (currentSlide > 0) goToSlide(currentSlide - 1);
    }
  });

  // Autoplay Presentations Manager
  playBtn.addEventListener('click', () => {
    if (isAutoplay) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  function startAutoplay() {
    isAutoplay = true;
    playIcon.innerHTML = `<path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`; // Pause SVG icon
    playBtn.title = "Pause Presentation";
    autoplayInterval = setInterval(() => {
      if (currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(0); // Loop back
      }
    }, 6000); // 6 seconds per slide
  }

  function stopAutoplay() {
    if (!isAutoplay) return;
    isAutoplay = false;
    playIcon.innerHTML = `<path fill="currentColor" d="M8 5v14l11-7z"/>`; // Play SVG icon
    playBtn.title = "Auto Play Presentation";
    clearInterval(autoplayInterval);
  }

  // ==============================================
  // INTERACTIVE ELEMENT 1: ERP MINDMAP SWITCHER
  // ==============================================
  const mindmapData = {
    student: {
      title: "Student Management",
      bullets: [
        "Dynamic Admission registers & profile uploads",
        "Daily and monthly attendance registers & calendar logs",
        "Scholarships eligibility tracking & applications",
        "Digital character, study & transfer certificates generation",
        "Training schedules & placement drive preparation",
        "Placement interviews registration and status tracking",
        "Grievance submission and response tracking console"
      ]
    },
    finance: {
      title: "Finance & Accounts",
      bullets: [
        "Tuition, hostel, and transport fee configurations",
        "Student fee logs checking and invoice generation",
        "Online payment gateway integration and receipts",
        "Automatic concessions allocations & dues trackers",
        "Import/export of payment registers in bulk",
        "Administrative ledger reporting and payment slips",
        "Financial auditing summaries & accounts ledger logs"
      ]
    },
    academics: {
      title: "Academics & Curriculums",
      bullets: [
        "Timetables configuration & sections assignment",
        "Lesson planning & daily classroom dairy updates",
        "Assessments and assignments portals with grading locks",
        "Direct CO-PO examinations configurations",
        "Digital Library resources cataloging & access checkouts",
        "Online classes live streaming & links registers",
        "Automatic marksheet verification and printouts templates"
      ]
    },
    promodules: {
      title: "Pro-Modules",
      bullets: [
        "Smart Library catalogue indexing (books & newspapers logs)",
        "Transport management (routes setup, digital bus pass PDF)",
        "Central inventory database (assets allocation, barcode flags)",
        "Campus service requests console (facility tickets management)",
        "Hostel registers (room availability checker, allocation logs)",
        "Gate register (visitors login, campus entry security logs)"
      ]
    },
    hr: {
      title: "Human Resource",
      bullets: [
        "Faculty profile registers (documents, achievements upload)",
        "Biometric hardware integration for staff attendance logs",
        "Payroll configurations (salary slips, basic pay, deductions)",
        "Income tax projection worksheets generation",
        "Annual performance appraisal tracking console",
        "Job openings & recruitments dashboard tracker"
      ]
    },
    utility: {
      title: "Utility & Analytics Tools",
      bullets: [
        "Front office registries (visitors log, postal dispatches)",
        "Configurable widgets dashboards & customized analytics",
        "Data import/export drivers (Excel, CSV, PDF exporter)",
        "MIS statistics compilation & departmental audits templates",
        "Custom reports designer (ad-hoc template generators)"
      ]
    }
  };

  const mindmapNodes = document.querySelectorAll('.mindmap-node');
  const detailTitle = document.getElementById('mindmapDetailTitle');
  const detailList = document.getElementById('mindmapDetailList');

  mindmapNodes.forEach(node => {
    node.addEventListener('click', () => {
      // Toggle active states
      mindmapNodes.forEach(n => n.classList.remove('active'));
      node.classList.add('active');

      // Swap details panel information
      const role = node.getAttribute('data-role');
      const data = mindmapData[role];
      if (data) {
        detailTitle.textContent = data.title;
        detailList.innerHTML = '';
        data.bullets.forEach(bullet => {
          const li = document.createElement('li');
          li.textContent = bullet;
          detailList.appendChild(li);
        });
      }
    });
  });

  // ==============================================
  // INTERACTIVE ELEMENT 2: RADIAL INTEGRATION ORBIT
  // ==============================================
  const orbitNodes = document.querySelectorAll('.orbit-node');
  const centerText = document.querySelector('.photo-title');

  orbitNodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      const title = node.getAttribute('data-title');
      centerText.textContent = title;
      centerText.style.color = '#F58220'; // Accent color change
      centerText.style.fontWeight = '800';
    });

    node.addEventListener('mouseleave', () => {
      centerText.textContent = 'ECAP SPHN';
      centerText.style.color = '#FFFFFF';
      centerText.style.fontWeight = '700';
    });
  });

  // ==============================================
  // INTERACTIVE ELEMENT 3: LIGHTBULB FEATURES RING
  // ==============================================
  const bulbNodes = document.querySelectorAll('.bulb-feature-node');
  const bulbGlow = document.querySelector('.bulb-glow');

  bulbNodes.forEach(node => {
    node.addEventListener('mouseenter', () => {
      // Glow bulb brighter on feature hover
      bulbGlow.style.fill = 'rgba(245, 130, 32, 0.5)';
      bulbGlow.style.filter = 'blur(12px)';
    });

    node.addEventListener('mouseleave', () => {
      bulbGlow.style.fill = 'rgba(245, 130, 32, 0.15)';
      bulbGlow.style.filter = 'blur(8px)';
    });
  });
});

// Stakeholder Tab Switcher (Page 3)
window.showStakeholder = function(index) {
  const groups = document.querySelectorAll('.stakeholder-group');
  const tabs = document.querySelectorAll('.role-tab');

  groups.forEach((group, idx) => {
    group.classList.remove('active-group');
    tabs[idx].classList.remove('active');
  });

  groups[index].classList.add('active-group');
  tabs[index].classList.add('active');
};

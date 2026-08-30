const ExcelJS = require("exceljs");
const path = require("path");

async function createDeploymentBudgetExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sphorthy Engineering College ECAP ERP Team";
  workbook.lastModifiedBy = "ECAP ERP AI System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ----------------------------------------------------
  // SHEET 1: Dynamic Budget Calculator
  // ----------------------------------------------------
  const sheet = workbook.addWorksheet("Dynamic Budget Calculator", {
    views: [{ showGridLines: true }],
  });

  // Column definitions
  sheet.columns = [
    { header: "", key: "colA", width: 4 },
    { header: "", key: "colB", width: 42 },
    { header: "", key: "colC", width: 22 },
    { header: "", key: "colD", width: 20 },
    { header: "", key: "colE", width: 48 },
  ];

  // Title Block
  sheet.mergeCells("B2:E2");
  const titleCell = sheet.getCell("B2");
  titleCell.value = "SPHOORTHY ENGINEERING COLLEGE - ECAP ERP DEPLOYMENT BUDGET MODEL";
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 35;

  sheet.mergeCells("B3:E3");
  const subtitleCell = sheet.getCell("B3");
  subtitleCell.value = "Dynamic Infrastructure Cost Calculator (Change Student Count in Cell C5 to Recalculate All Costs)";
  subtitleCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF94A3B8" } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 22;

  // Section Header: Inputs
  sheet.mergeCells("B5:E5");
  const inputHeader = sheet.getCell("B5");
  inputHeader.value = "1. DYNAMIC INPUT CONTROLS & ASSUMPTIONS (EDITABLE CELLS)";
  inputHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  inputHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
  sheet.getRow(5).height = 24;

  // Inputs Rows
  const inputs = [
    { row: 6, label: "Number of Active Students (MAIN DRIVER)", val: 5000, fmt: "#,##0", isInput: true, note: "Change this number to dynamically update all costs!" },
    { row: 7, label: "Faculty & Staff Ratio (Est. 8%)", formula: "=ROUND(C6*0.08, 0)", fmt: "#,##0", isInput: false, note: "Automatically calculated (approx. 400 staff)" },
    { row: 8, label: "INR / USD Exchange Rate (₹ per $)", val: 82.5, fmt: "₹#,##0.00", isInput: true, note: "Current USD to INR rate" },
    { row: 9, label: "Target Working Days per Month", val: 22, fmt: "0", isInput: false, note: "Standard college academic working days" },
    { row: 10, label: "Domain & Pilot Launch Setup Fee (₹)", val: 5000, fmt: "₹#,##0", isInput: true, note: "Fixed Pilot Launch & Custom College Domain setup" },
  ];

  inputs.forEach((item) => {
    sheet.getCell(`B${item.row}`).value = item.label;
    sheet.getCell(`B${item.row}`).font = { name: "Calibri", size: 10, bold: item.isInput };
    
    const cellVal = sheet.getCell(`C${item.row}`);
    if (item.formula) {
      cellVal.value = { formula: item.formula };
    } else {
      cellVal.value = item.val;
    }
    cellVal.font = { name: "Calibri", size: 11, bold: true, color: { argb: item.isInput ? "FF0369A1" : "FF000000" } };
    cellVal.numberFormat = item.fmt;
    cellVal.alignment = { horizontal: "right" };

    if (item.isInput) {
      cellVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
      cellVal.border = {
        top: { style: "thin", color: { argb: "FF0284C7" } },
        bottom: { style: "thin", color: { argb: "FF0284C7" } },
        left: { style: "thin", color: { argb: "FF0284C7" } },
        right: { style: "thin", color: { argb: "FF0284C7" } },
      };
    }

    sheet.getCell(`E${item.row}`).value = item.note;
    sheet.getCell(`E${item.row}`).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF64748B" } };
    sheet.getRow(item.row).height = 20;
  });

  // Section Header: One-time Setup
  sheet.mergeCells("B12:E12");
  const setupHeader = sheet.getCell("B12");
  setupHeader.value = "2. ONE-TIME FIXED SETUP & INITIALIZATION COSTS";
  setupHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  setupHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3730A3" } };
  sheet.getRow(12).height = 24;

  // Table Headers
  sheet.getCell("B13").value = "Item Description";
  sheet.getCell("C13").value = "Cost in INR (₹)";
  sheet.getCell("D13").value = "Cost in USD ($)";
  sheet.getCell("E13").value = "Cost Basis & Specs";

  ["B13", "C13", "D13", "E13"].forEach((c) => {
    sheet.getCell(c).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1E293B" } };
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    sheet.getCell(c).border = { bottom: { style: "medium", color: { argb: "FF94A3B8" } } };
  });
  sheet.getRow(13).height = 20;

  // One Time Items
  const oneTimeItems = [
    { row: 14, label: "Custom Domain & Pilot Launch Setup", inrFormula: "=C10", basis: "Fixed college custom subdomain & SSL configuration" },
    { row: 15, label: "TRAI DLT SMS Entity Registration", inrVal: 5900, basis: "One-time Government DLT portal registration fee in India" },
    { row: 16, label: "Initial Cloud Security & SSL Certificate", inrVal: 2500, basis: "Wildcard SSL & Cloudflare WAF firewall rule provisioning" },
  ];

  oneTimeItems.forEach((item) => {
    sheet.getCell(`B${item.row}`).value = item.label;
    sheet.getCell(`B${item.row}`).font = { name: "Calibri", size: 10 };

    const cCell = sheet.getCell(`C${item.row}`);
    if (item.inrFormula) cCell.value = { formula: item.inrFormula };
    else cCell.value = item.inrVal;
    cCell.font = { name: "Calibri", size: 10 };
    cCell.numberFormat = "₹#,##0";

    const dCell = sheet.getCell(`D${item.row}`);
    dCell.value = { formula: `=C${item.row}/C8` };
    dCell.font = { name: "Calibri", size: 10 };
    dCell.numberFormat = "$#,##0.00";

    sheet.getCell(`E${item.row}`).value = item.basis;
    sheet.getCell(`E${item.row}`).font = { name: "Calibri", size: 9, color: { argb: "FF475569" } };
    sheet.getRow(item.row).height = 20;
  });

  // Subtotal One-Time Setup
  sheet.getCell("B17").value = "SUBTOTAL: ONE-TIME SETUP COSTS";
  sheet.getCell("B17").font = { name: "Calibri", size: 10, bold: true };
  sheet.getCell("C17").value = { formula: "=SUM(C14:C16)" };
  sheet.getCell("C17").font = { name: "Calibri", size: 10, bold: true };
  sheet.getCell("C17").numberFormat = "₹#,##0";
  sheet.getCell("D17").value = { formula: "=SUM(D14:D16)" };
  sheet.getCell("D17").font = { name: "Calibri", size: 10, bold: true };
  sheet.getCell("D17").numberFormat = "$#,##0.00";
  ["B17", "C17", "D17", "E17"].forEach((c) => {
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    sheet.getCell(c).border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
    };
  });
  sheet.getRow(17).height = 22;

  // Section Header: Monthly Recurring Infrastructure
  sheet.mergeCells("B19:E19");
  const monthlyHeader = sheet.getCell("B19");
  monthlyHeader.value = "3. MONTHLY RECURRING OPERATIONAL COSTS (DYNAMICALLY SCALED BY STUDENT COUNT)";
  monthlyHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  monthlyHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } };
  sheet.getRow(19).height = 24;

  // Table Headers
  sheet.getCell("B20").value = "Infrastructure Layer / Service";
  sheet.getCell("C20").value = "Monthly Cost (₹)";
  sheet.getCell("D20").value = "Monthly Cost ($)";
  sheet.getCell("E20").value = "Capacity Sizing & Volume Formulas";

  ["B20", "C20", "D20", "E20"].forEach((c) => {
    sheet.getCell(c).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF064E3B" } };
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA7F3D0" } };
    sheet.getCell(c).border = { bottom: { style: "medium", color: { argb: "FF059669" } } };
  });
  sheet.getRow(20).height = 20;

  // Monthly Recurring Items
  const monthlyItems = [
    {
      row: 21,
      label: "Frontend Web Hosting (Cloudflare Pages)",
      inrFormula: "0",
      basis: "Free Plan: Unlimited global bandwidth, edge CDN caching & SSL",
    },
    {
      row: 22,
      label: "Backend API Service (Render App Instance)",
      inrFormula: "=IF(C6<=1000, 580, IF(C6<=5000, 2050, IF(C6<=10000, 4125, 8250)))",
      basis: "Scales automatically: 512MB (<1k), 2GB (1-5k), 4GB (5-10k), 8GB (10k+)",
    },
    {
      row: 23,
      label: "Database Cluster (MongoDB Atlas Dedicated)",
      inrFormula: "=IF(C6<=2000, 4750, IF(C6<=5000, 4750, 9500))",
      basis: "M10 Dedicated Instance ($0.08/hr) - 2GB RAM, 10GB storage, 1 vCPU",
    },
    {
      row: 24,
      label: "AWS S3 File Storage (Certificates, PDFs, Photos)",
      inrFormula: "=ROUND((C6 * 0.02 * 0.023 * C8) + 100, 0)",
      basis: "Formula: Est. 20 MB storage/student @ ₹1.90/GB/month + transfer",
    },
    {
      row: 25,
      label: "Transactional SMS Gateway (DLT Approved)",
      inrFormula: "=ROUND(C6 * 5 * 0.15, 0)",
      basis: "Formula: Est. 5 SMS/student/month @ ₹0.15/SMS (Attendance alerts & OTPs)",
    },
    {
      row: 26,
      label: "Transactional Email Service (AWS SES API)",
      inrFormula: "=ROUND(C6 * 20 * 0.00825, 0)",
      basis: "Formula: Est. 20 emails/student/month @ $0.10 per 1,000 emails",
    },
    {
      row: 27,
      label: "System Maintenance & Security Contingency (10%)",
      inrFormula: "=ROUND(SUM(C21:C26)*0.10, 0)",
      basis: "10% buffer for bandwidth spikes, emergency backups & SLA monitoring",
    },
  ];

  monthlyItems.forEach((item) => {
    sheet.getCell(`B${item.row}`).value = item.label;
    sheet.getCell(`B${item.row}`).font = { name: "Calibri", size: 10 };

    const cCell = sheet.getCell(`C${item.row}`);
    cCell.value = { formula: item.inrFormula };
    cCell.font = { name: "Calibri", size: 10 };
    cCell.numberFormat = "₹#,##0";

    const dCell = sheet.getCell(`D${item.row}`);
    dCell.value = { formula: `=C${item.row}/C8` };
    dCell.font = { name: "Calibri", size: 10 };
    dCell.numberFormat = "$#,##0.00";

    sheet.getCell(`E${item.row}`).value = item.basis;
    sheet.getCell(`E${item.row}`).font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };
    sheet.getRow(item.row).height = 20;
  });

  // Subtotal Monthly Recurring
  sheet.getCell("B28").value = "TOTAL MONTHLY OPERATIONAL COST";
  sheet.getCell("B28").font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF065F46" } };
  sheet.getCell("C28").value = { formula: "=SUM(C21:C27)" };
  sheet.getCell("C28").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF065F46" } };
  sheet.getCell("C28").numberFormat = "₹#,##0";
  sheet.getCell("D28").value = { formula: "=SUM(D21:D27)" };
  sheet.getCell("D28").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF065F46" } };
  sheet.getCell("D28").numberFormat = "$#,##0.00";

  ["B28", "C28", "D28", "E28"].forEach((c) => {
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
    sheet.getCell(c).border = {
      top: { style: "thin", color: { argb: "FF10B981" } },
      bottom: { style: "double", color: { argb: "FF047857" } },
    };
  });
  sheet.getRow(28).height = 24;

  // Section Header: Summary & KPIs
  sheet.mergeCells("B30:E30");
  const summaryHeader = sheet.getCell("B30");
  summaryHeader.value = "4. EXECUTIVE FINANCIAL SUMMARY & PER-STUDENT KEY PERFORMANCE INDICATORS";
  summaryHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sheet.getRow(30).height = 24;

  // KPI Rows
  const kpis = [
    { row: 31, label: "Total Monthly Recurring Cost (INR & USD)", inrFormula: "=C28", isBold: true, highlight: false },
    { row: 32, label: "Total Annual Operational Cost (12 Months)", inrFormula: "=C28*12", isBold: true, highlight: false },
    { row: 33, label: "FIRST YEAR TOTAL BUDGET (One-Time Setup + 12 Months Operating)", inrFormula: "=C17+(C28*12)", isBold: true, highlight: true },
    { row: 34, label: "Per-Student Annual Infrastructure Cost (₹ / Student / Year)", inrFormula: "=ROUND(C33/C6, 2)", isBold: true, highlight: false, isPerStudent: true },
    { row: 35, label: "Per-Student Monthly Infrastructure Cost (₹ / Student / Month)", inrFormula: "=ROUND(C34/12, 2)", isBold: true, highlight: false, isPerStudent: true },
  ];

  kpis.forEach((kpi) => {
    sheet.getCell(`B${kpi.row}`).value = kpi.label;
    sheet.getCell(`B${kpi.row}`).font = { name: "Calibri", size: kpi.highlight ? 11 : 10, bold: kpi.isBold };

    const cCell = sheet.getCell(`C${kpi.row}`);
    cCell.value = { formula: kpi.inrFormula };
    cCell.font = { name: "Calibri", size: kpi.highlight ? 12 : 11, bold: true, color: { argb: kpi.highlight ? "FF047857" : "FF000000" } };
    cCell.numberFormat = kpi.isPerStudent ? "₹#,##0.00" : "₹#,##0";

    const dCell = sheet.getCell(`D${kpi.row}`);
    dCell.value = { formula: `=C${kpi.row}/C8` };
    dCell.font = { name: "Calibri", size: kpi.highlight ? 12 : 11, bold: true, color: { argb: kpi.highlight ? "FF047857" : "FF000000" } };
    dCell.numberFormat = kpi.isPerStudent ? "$#,##0.00" : "$#,##0.00";

    if (kpi.highlight) {
      ["B33", "C33", "D33", "E33"].forEach((c) => {
        sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
        sheet.getCell(c).border = {
          top: { style: "medium", color: { argb: "FF059669" } },
          bottom: { style: "medium", color: { argb: "FF059669" } },
        };
      });
    }

    sheet.getRow(kpi.row).height = kpi.highlight ? 26 : 22;
  });

  // Save Workbook
  const filePath = path.join(__dirname, "../ECAP_ERP_College_Deployment_Budget_Calculator.xlsx");
  await workbook.xlsx.writeFile(filePath);
  console.log(`\n🎉 Excel Workbook successfully generated at:\n${filePath}\n`);
}

createDeploymentBudgetExcel().catch(console.error);

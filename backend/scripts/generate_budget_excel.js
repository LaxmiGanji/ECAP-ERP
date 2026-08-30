const ExcelJS = require("exceljs");
const path = require("path");

async function createDeploymentBudgetExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sphoorthy Engineering College ECAP ERP Team";
  workbook.lastModifiedBy = "ECAP ERP System";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ----------------------------------------------------
  // SHEET 1: Dynamic Budget Calculator (INR Only with Per Year Column)
  // ----------------------------------------------------
  const sheet = workbook.addWorksheet("ERP Deployment Budget Model", {
    views: [{ showGridLines: true }],
  });

  // Column definitions
  sheet.columns = [
    { header: "", key: "colA", width: 4 },
    { header: "", key: "colB", width: 46 },
    { header: "", key: "colC", width: 24 },
    { header: "", key: "colD", width: 24 },
    { header: "", key: "colE", width: 55 },
  ];

  // Title Block
  sheet.mergeCells("B2:E2");
  const titleCell = sheet.getCell("B2");
  titleCell.value = "SPHOORTHY ENGINEERING COLLEGE - ECAP ERP DEPLOYMENT BUDGET MODEL";
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(2).height = 36;

  sheet.mergeCells("B3:E3");
  const subtitleCell = sheet.getCell("B3");
  subtitleCell.value = "Dynamic Financial & Infrastructure Model in INR (Change Student Count in Cell C6 to Recalculate All Costs)";
  subtitleCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF94A3B8" } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(3).height = 22;

  // Section Header: Inputs
  sheet.mergeCells("B5:E5");
  const inputHeader = sheet.getCell("B5");
  inputHeader.value = "1. DYNAMIC INPUT CONTROLS & ASSUMPTIONS (EDITABLE CELL)";
  inputHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  inputHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
  sheet.getRow(5).height = 25;

  // Inputs Rows
  const inputs = [
    { row: 6, label: "Number of Active Students (MAIN COST DRIVER)", val: 5000, fmt: "#,##0", isInput: true, note: "Change this number to dynamically update all monthly & yearly totals!" },
    { row: 7, label: "Faculty & Staff Ratio (Est. 8%)", formula: "=ROUND(C6*0.08, 0)", fmt: "#,##0", isInput: false, note: "Calculated automatically (approx. 400 faculty & staff)" },
    { row: 8, label: "Target Working Days per Month", val: 22, fmt: "0", isInput: false, note: "Standard college academic working calendar days" },
    { row: 9, label: "Domain & Pilot Launch Setup Fee (Fixed ₹)", val: 5000, fmt: "₹#,##0", isInput: true, note: "Fixed Pilot Launch & Custom College Domain setup fee" },
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
    sheet.getRow(item.row).height = 21;
  });

  // Section Header: One-time Setup
  sheet.mergeCells("B11:E11");
  const setupHeader = sheet.getCell("B11");
  setupHeader.value = "2. ONE-TIME FIXED SETUP & INITIALIZATION COSTS (INR ₹)";
  setupHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  setupHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3730A3" } };
  sheet.getRow(11).height = 25;

  // Table Headers
  sheet.getCell("B12").value = "Item Description";
  sheet.getCell("C12").value = "Monthly Cost (₹ / Month)";
  sheet.getCell("D12").value = "Annual Cost (₹ / Year)";
  sheet.getCell("E12").value = "Detailed Pricing Basis & Component Breakdown";

  ["B12", "C12", "D12", "E12"].forEach((c) => {
    sheet.getCell(c).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1E293B" } };
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    sheet.getCell(c).border = { bottom: { style: "medium", color: { argb: "FF94A3B8" } } };
  });
  sheet.getRow(12).height = 21;

  // One Time Items
  const oneTimeItems = [
    { row: 13, label: "Custom Domain & Pilot Launch Setup", inrFormula: "=C9", basis: "Fixed setup for college subdomain (ecap.sphoorthy.edu.in) & SSL setup" },
    { row: 14, label: "TRAI DLT SMS Entity Registration", inrVal: 5900, basis: "One-time Government mandatory DLT portal Registration & Sender ID registration in India" },
    { row: 15, label: "Initial Cloud Security & SSL Certificate", inrVal: 2500, basis: "Wildcard SSL provisioning, DDoS protection & Cloudflare WAF firewall setup" },
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
    dCell.value = { formula: `=C${item.row}` }; // One-time equal to annual
    dCell.font = { name: "Calibri", size: 10 };
    dCell.numberFormat = "₹#,##0";

    sheet.getCell(`E${item.row}`).value = item.basis;
    sheet.getCell(`E${item.row}`).font = { name: "Calibri", size: 9, color: { argb: "FF475569" } };
    sheet.getRow(item.row).height = 21;
  });

  // Subtotal One-Time Setup
  sheet.getCell("B16").value = "SUBTOTAL: ONE-TIME SETUP COSTS";
  sheet.getCell("B16").font = { name: "Calibri", size: 10, bold: true };
  sheet.getCell("C16").value = { formula: "=SUM(C13:C15)" };
  sheet.getCell("C16").font = { name: "Calibri", size: 10, bold: true };
  sheet.getCell("C16").numberFormat = "₹#,##0";
  sheet.getCell("D16").value = { formula: "=SUM(D13:D15)" };
  sheet.getCell("D16").font = { name: "Calibri", size: 10, bold: true };
  sheet.getCell("D16").numberFormat = "₹#,##0";

  ["B16", "C16", "D16", "E16"].forEach((c) => {
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    sheet.getCell(c).border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
    };
  });
  sheet.getRow(16).height = 22;

  // Section Header: Monthly & Annual Recurring Infrastructure
  sheet.mergeCells("B18:E18");
  const monthlyHeader = sheet.getCell("B18");
  monthlyHeader.value = "3. MONTHLY & ANNUAL OPERATIONAL COSTS (SCALED DYNAMICALLY BY STUDENT COUNT)";
  monthlyHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  monthlyHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } };
  sheet.getRow(18).height = 25;

  // Table Headers
  sheet.getCell("B19").value = "Infrastructure Layer / Service Component";
  sheet.getCell("C19").value = "Monthly Cost (₹ / Month)";
  sheet.getCell("D19").value = "Annual Cost (₹ / Year)";
  sheet.getCell("E19").value = "Detailed Capacity Formulas & Unit Rate Breakdown";

  ["B19", "C19", "D19", "E19"].forEach((c) => {
    sheet.getCell(c).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF064E3B" } };
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA7F3D0" } };
    sheet.getCell(c).border = { bottom: { style: "medium", color: { argb: "FF059669" } } };
  });
  sheet.getRow(19).height = 21;

  // Monthly Recurring Items
  const monthlyItems = [
    {
      row: 20,
      label: "Frontend Web Hosting (Cloudflare Pages)",
      inrFormula: "0",
      basis: "100% Free Plan: Unlimited global bandwidth, CDN edge caching & SSL security",
    },
    {
      row: 21,
      label: "Backend API Compute (Render App Instance)",
      inrFormula: "=IF(C6<=1000, 580, IF(C6<=5000, 2050, IF(C6<=10000, 4125, 8250)))",
      basis: "Scales by user load: <1k (₹580/mo), 1-5k (₹2,050/mo), 5-10k (₹4,125/mo), 10k+ (₹8,250/mo)",
    },
    {
      row: 22,
      label: "Database Cluster (MongoDB Atlas Dedicated)",
      inrFormula: "=IF(C6<=2000, 4750, IF(C6<=5000, 4750, 9500))",
      basis: "M10 Dedicated Instance ($0.08/hr = ₹4,750/mo) - 2GB RAM, 10GB SSD, 1 vCPU",
    },
    {
      row: 23,
      label: "AWS S3 File Storage (Certificates, PDFs, Photos)",
      inrFormula: "=ROUND((C6 * 0.02 * 1.90) + 100, 0)",
      basis: "Est. 20 MB/student @ ₹1.90/GB/month + bandwidth (5,000 students = ~100 GB = ₹290/mo)",
    },
    {
      row: 24,
      label: "Transactional SMS Gateway (DLT Approved)",
      inrFormula: "=ROUND(C6 * 5 * 0.15, 0)",
      basis: "Est. 5 SMS/student/month @ ₹0.15/SMS (5,000 students = 25,000 SMS/mo = ₹3,750/mo)",
    },
    {
      row: 25,
      label: "Transactional Email Service (AWS SES API)",
      inrFormula: "=ROUND(C6 * 20 * 0.00825, 0)",
      basis: "Est. 20 emails/student/month @ ₹0.00825/email (5,000 students = 100,000 emails/mo = ₹825/mo)",
    },
    {
      row: 26,
      label: "System Maintenance & Security Contingency (10%)",
      inrFormula: "=ROUND(SUM(C20:C25)*0.10, 0)",
      basis: "10% contingency buffer for traffic spikes, DB storage scaling & 24/7 SLA monitoring",
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
    dCell.value = { formula: `=C${item.row}*12` };
    dCell.font = { name: "Calibri", size: 10 };
    dCell.numberFormat = "₹#,##0";

    sheet.getCell(`E${item.row}`).value = item.basis;
    sheet.getCell(`E${item.row}`).font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };
    sheet.getRow(item.row).height = 21;
  });

  // Subtotal Monthly & Annual Recurring
  sheet.getCell("B27").value = "TOTAL OPERATIONAL RECURRING COST";
  sheet.getCell("B27").font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF065F46" } };
  sheet.getCell("C27").value = { formula: "=SUM(C20:C26)" };
  sheet.getCell("C27").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF065F46" } };
  sheet.getCell("C27").numberFormat = "₹#,##0";
  sheet.getCell("D27").value = { formula: "=SUM(D20:D26)" };
  sheet.getCell("D27").font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF065F46" } };
  sheet.getCell("D27").numberFormat = "₹#,##0";

  ["B27", "C27", "D27", "E27"].forEach((c) => {
    sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
    sheet.getCell(c).border = {
      top: { style: "thin", color: { argb: "FF10B981" } },
      bottom: { style: "double", color: { argb: "FF047857" } },
    };
  });
  sheet.getRow(27).height = 25;

  // Section Header: Summary & KPIs
  sheet.mergeCells("B29:E29");
  const summaryHeader = sheet.getCell("B29");
  summaryHeader.value = "4. EXECUTIVE FINANCIAL SUMMARY & PER-STUDENT METRICS (INR ₹)";
  summaryHeader.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  sheet.getRow(29).height = 25;

  // KPI Rows
  const kpis = [
    { row: 30, label: "Total Monthly Recurring Cost (₹ / Month)", inrFormula: "=C27", dFormula: "=C27*12", isBold: true, highlight: false },
    { row: 31, label: "Total Annual Operational Cost (12 Months)", inrFormula: "=C27", dFormula: "=D27", isBold: true, highlight: false },
    { row: 32, label: "FIRST YEAR TOTAL BUDGET (One-Time Setup + 12 Months Operating)", inrFormula: "=C16+C27", dFormula: "=D16+D27", isBold: true, highlight: true },
    { row: 33, label: "Per-Student Annual Infrastructure Cost (₹ / Student / Year)", inrFormula: "=ROUND(D32/C6, 2)", dFormula: "=ROUND(D32/C6, 2)", isBold: true, highlight: false, isPerStudent: true },
    { row: 34, label: "Per-Student Monthly Infrastructure Cost (₹ / Student / Month)", inrFormula: "=ROUND(C33/12, 2)", dFormula: "=ROUND(D33/12, 2)", isBold: true, highlight: false, isPerStudent: true },
  ];

  kpis.forEach((kpi) => {
    sheet.getCell(`B${kpi.row}`).value = kpi.label;
    sheet.getCell(`B${kpi.row}`).font = { name: "Calibri", size: kpi.highlight ? 11 : 10, bold: kpi.isBold };

    const cCell = sheet.getCell(`C${kpi.row}`);
    cCell.value = { formula: kpi.inrFormula };
    cCell.font = { name: "Calibri", size: kpi.highlight ? 12 : 11, bold: true, color: { argb: kpi.highlight ? "FF047857" : "FF000000" } };
    cCell.numberFormat = kpi.isPerStudent ? "₹#,##0.00" : "₹#,##0";

    const dCell = sheet.getCell(`D${kpi.row}`);
    dCell.value = { formula: kpi.dFormula };
    dCell.font = { name: "Calibri", size: kpi.highlight ? 12 : 11, bold: true, color: { argb: kpi.highlight ? "FF047857" : "FF000000" } };
    dCell.numberFormat = kpi.isPerStudent ? "₹#,##0.00" : "₹#,##0";

    if (kpi.highlight) {
      [`B${kpi.row}`, `C${kpi.row}`, `D${kpi.row}`, `E${kpi.row}`].forEach((c) => {
        sheet.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
        sheet.getCell(c).border = {
          top: { style: "medium", color: { argb: "FF059669" } },
          bottom: { style: "medium", color: { argb: "FF059669" } },
        };
      });
    }

    sheet.getRow(kpi.row).height = kpi.highlight ? 26 : 22;
  });

  // Save Workbook with lock fallback
  const filePath1 = path.join(__dirname, "../ECAP_ERP_College_Deployment_Budget_Calculator.xlsx");
  const filePath2 = path.join(__dirname, "../../ECAP_ERP_College_Deployment_Budget_Calculator.xlsx");
  
  try {
    await workbook.xlsx.writeFile(filePath2);
    await workbook.xlsx.writeFile(filePath1);
    console.log(`\n🎉 Excel Workbook updated successfully in INR with Per Year column!\n`);
  } catch (err) {
    const fallbackPath = path.join(__dirname, "../../ECAP_ERP_College_Deployment_Budget_Calculator_v2.xlsx");
    await workbook.xlsx.writeFile(fallbackPath);
    console.log(`\n🎉 Excel Workbook saved as ECAP_ERP_College_Deployment_Budget_Calculator_v2.xlsx!\n`);
  }
}


createDeploymentBudgetExcel().catch(console.error);

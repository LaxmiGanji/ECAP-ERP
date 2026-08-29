const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Subject = require('../../models/Other/subject.model');
const StudentDetails = require('../../models/Students/details.model');
const Branch = require('../../models/Other/branch.model');

const TEMPLATE_PATH = path.join(__dirname, '../../templates/COPO_TEMPLATE.xlsx');

const getJntuRank = (s) => {
  const str = (typeof s === "object" ? (s?.enrollmentNo || s?.enrollment || s?.rollNo || s?.loginid || "") : (s || "")).toString().trim().toUpperCase();
  if (!str) return { prefix: "", rank: 0 };
  if (str.length < 3) return { prefix: str, rank: 0 };

  const prefix = str.substring(0, str.length - 2);
  const suff = str.substring(str.length - 2);

  if (/^\d{2}$/.test(suff)) return { prefix, rank: parseInt(suff, 10) };
  if (/^[A-Z]\d$/.test(suff)) {
    const charCode = suff.charCodeAt(0) - 65;
    const digit = parseInt(suff[1], 10);
    return { prefix, rank: 100 + charCode * 10 + digit };
  }
  return { prefix, rank: 9999 };
};

const sortEnrollmentNo = (a, b) => {
  const rA = getJntuRank(a);
  const rB = getJntuRank(b);

  if (rA.prefix !== rB.prefix) {
    return rA.prefix.localeCompare(rB.prefix, undefined, { numeric: true, sensitivity: "base" });
  }

  return rA.rank - rB.rank;
};

const formatBranchName = (branchName) => {
  if (!branchName) return "";
  let formatted = branchName.trim();
  if (!formatted.toLowerCase().startsWith('department of')) {
    formatted = `Department of ${formatted}`;
  }
  if (!formatted.toLowerCase().endsWith('program')) {
    formatted = `${formatted} Program`;
  }
  return formatted;
};

exports.generateTemplate = async (req, res) => {
  try {
    const { subjectId, branch, semester, facultyName, academicYear, iaQuestions, seeQuestions, assignmentQuestions, templateType } = req.body;

    if (!subjectId || !branch || !semester) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const subject = await Subject.findById(subjectId).populate('branch');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    const branchName = formatBranchName(subject?.branch?.name || branch);

    // 1. Fetch Students (Sorted by enrollmentNo using standard string sort for correct alphanumeric order)
    const students = await StudentDetails.find({ branch, semester });
    students.sort(sortEnrollmentNo);
      
    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found for given branch and semester' });
    }

    // 2. Load Excel Template
    if (!fs.existsSync(TEMPLATE_PATH)) {
      return res.status(500).json({ success: false, message: 'Template file not found on server' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    // 3. Inject Student Data and Questions
    const START_ROW = 13;

    // Process IA Marks Sheet
    const iaSheet = workbook.getWorksheet('IA Marks');
    if (iaSheet) {
      try {
        iaSheet.unMergeCells('AK6:AZ6');
      } catch (err) {}
      try {
        iaSheet.unMergeCells('AK7:AZ135');
      } catch (err) {}
      if (facultyName) iaSheet.getCell('J5').value = facultyName;
      iaSheet.getCell('N4').value = academicYear || "2024-2025";
      iaSheet.getCell('AC4').value = semester;
      iaSheet.getCell('AP4').value = subject.code;
      iaSheet.getCell('AY4').value = students.length;
      iaSheet.getCell('AI5').value = subject.name;
      iaSheet.getCell('D3').value = branchName;

      // Clear sample questions, CO mappings, and max marks
      for (let c = 4; c <= 59; c++) {
        iaSheet.getCell(7, c).value = null; // CO Mapped
        iaSheet.getCell(8, c).value = null; // Q. No
        iaSheet.getCell(9, c).value = null; // Max Marks
      }

      // Clear formula text notes and Kiran 200 in header area
      try {
        iaSheet.getCell('A3').value = null;
        iaSheet.getCell('B3').value = null;
        iaSheet.getCell('A4').value = null;
        iaSheet.getCell('B4').value = null;
      } catch (err) {}

      // Set header row heights and column widths
      iaSheet.getColumn('A').width = 8;
      iaSheet.getColumn('B').width = 18;
      iaSheet.getColumn('C').width = 32;

      iaSheet.getColumn('AK').width = 14;
      iaSheet.getColumn('AL').width = 14;
      iaSheet.getColumn('AM').width = 18;
      iaSheet.getColumn('AN').width = 20;
      iaSheet.getColumn('AO').width = 14;
      iaSheet.getColumn('AP').width = 14;
      iaSheet.getColumn('AQ').width = 18;
      iaSheet.getColumn('AR').width = 20;

      for (let c = 53; c <= 59; c++) {
        iaSheet.getColumn(c).width = 12;
      }

      iaSheet.getRow(6).height = 28;
      iaSheet.getRow(7).height = 26;
      iaSheet.getRow(8).height = 36;
      iaSheet.getRow(9).height = 26;

      // Inject IA Questions (using passed questions or subject.courseOutcomes fallback)
      const subjectCos = subject.courseOutcomes || [];
      const getQuestionName = (i) => `${Math.floor(i / 2) + 1}${i % 2 === 0 ? 'a' : 'b'}`;

      const effectiveIaQuestions = (iaQuestions && Array.isArray(iaQuestions) && iaQuestions.length > 0)
        ? iaQuestions
        : (subjectCos.length > 0
          ? subjectCos.map((c, i) => ({ qName: getQuestionName(i), co: c.coNumber, maxMarks: 5 }))
          : [{ qName: "1a", co: "CO1", maxMarks: 5 }]);

      let currentCol = 4; // Start at column D
      for (const q of effectiveIaQuestions) {
        if (currentCol === 37) {
          currentCol = 45; // Jump AK-AR
        }
        if (currentCol > 52) break; // Limit IA to AZ
        const coNum = String(q.co).replace(/co/i, '').trim();

        const c7 = iaSheet.getCell(7, currentCol);
        c7.value = `CO${coNum}`;
        c7.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c7.alignment = { vertical: 'middle', horizontal: 'center' };
        c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Soft Golden Yellow

        const c8 = iaSheet.getCell(8, currentCol);
        c8.value = q.qName;
        c8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Soft Pastel Green

        const c9 = iaSheet.getCell(9, currentCol);
        c9.value = Number(q.maxMarks) || 0;
        c9.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c9.alignment = { vertical: 'middle', horizontal: 'center' };
        c9.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }; // Soft Pastel Peach

        currentCol++;
      }

      // Inject JNTU IA-1 / IA-2 DES, OBJ, ASSIGN, and TOTAL columns with merged headers and RED highlight for TOTAL
      // IA-1 Header (AK6:AN6)
      try { iaSheet.unMergeCells('AK6:AN6'); } catch (e) {}
      iaSheet.mergeCells('AK6:AN6');
      const ak6 = iaSheet.getCell('AK6');
      ak6.value = "IA-1 Summary";
      ak6.font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF1F497D' } };
      ak6.alignment = { vertical: 'middle', horizontal: 'center' };
      ak6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

      // IA-2 Header (AO6:AR6)
      try { iaSheet.unMergeCells('AO6:AR6'); } catch (e) {}
      iaSheet.mergeCells('AO6:AR6');
      const ao6 = iaSheet.getCell('AO6');
      ao6.value = "IA-2 Summary";
      ao6.font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF1F497D' } };
      ao6.alignment = { vertical: 'middle', horizontal: 'center' };
      ao6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

      // IA-1 Columns (AK-AN)
      const ak8 = iaSheet.getCell(8, 37);
      ak8.value = "DES (20)";
      ak8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
      ak8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      ak8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      iaSheet.getCell(9, 37).value = 20;

      const al8 = iaSheet.getCell(8, 38);
      al8.value = "OBJ (10)";
      al8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
      al8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      al8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      iaSheet.getCell(9, 38).value = 10;

      const am8 = iaSheet.getCell(8, 39);
      am8.value = "ASSIGN/SPA (05)";
      am8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
      am8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      am8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      iaSheet.getCell(9, 39).value = 5;

      const an8 = iaSheet.getCell(8, 40);
      an8.value = "TOTAL MARKS (35)";
      an8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFF0000' } }; // RED Font
      an8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      an8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } }; // Light Red Highlight
      iaSheet.getCell(9, 40).value = 35;

      // IA-2 Columns (AO-AR)
      const ao8 = iaSheet.getCell(8, 41);
      ao8.value = "DES (20)";
      ao8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
      ao8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      ao8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      iaSheet.getCell(9, 41).value = 20;

      const ap8 = iaSheet.getCell(8, 42);
      ap8.value = "OBJ (10)";
      ap8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
      ap8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      ap8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      iaSheet.getCell(9, 42).value = 10;

      const aq8 = iaSheet.getCell(8, 43);
      aq8.value = "ASSIGN/SPA (05)";
      aq8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
      aq8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      aq8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      iaSheet.getCell(9, 43).value = 5;

      const ar8 = iaSheet.getCell(8, 44);
      ar8.value = "TOTAL MARKS (35)";
      ar8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFF0000' } }; // RED Font
      ar8.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      ar8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE6E6' } }; // Light Red Highlight
      iaSheet.getCell(9, 44).value = 35;

      // Format Assignment header BA6:BG6
      try { iaSheet.unMergeCells('BA6:BG6'); } catch (e) {}
      iaSheet.mergeCells('BA6:BG6');
      const ba6 = iaSheet.getCell('BA6');
      ba6.value = "Assignments / CIA";
      ba6.font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF1F497D' } };
      ba6.alignment = { vertical: 'middle', horizontal: 'center' };
      ba6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

      // Inject Assignment (CIA) Questions from UI (BA-BG)
      const safeAssQs = (assignmentQuestions && Array.isArray(assignmentQuestions) && assignmentQuestions.length > 0)
        ? assignmentQuestions
        : (subjectCos.length > 0
          ? subjectCos.map((c, i) => ({ qName: `CIA${i + 1}`, co: c.coNumber, maxMarks: 10 }))
          : []);

      let assCol = 53; // Start at column BA
      for (const q of safeAssQs) {
        if (assCol > 59) break; // Limit to BG
        const coStr = String(q.co).toUpperCase(); // e.g. "CO1"

        const c7 = iaSheet.getCell(7, assCol);
        c7.value = coStr;
        c7.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c7.alignment = { vertical: 'middle', horizontal: 'center' };
        c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

        const c8 = iaSheet.getCell(8, assCol);
        c8.value = q.qName;
        c8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c8.alignment = { vertical: 'middle', horizontal: 'center' };
        c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };

        const c9 = iaSheet.getCell(9, assCol);
        c9.value = Number(q.maxMarks) || 0;
        c9.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c9.alignment = { vertical: 'middle', horizontal: 'center' };
        c9.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };

        assCol++;
      }
    }

    // Process SEE Marks Sheet
    const seeSheet = workbook.getWorksheet('SEE Marks');
    if (seeSheet) {
      if (facultyName) seeSheet.getCell('I5').value = facultyName; // I5:R5 is merged
      seeSheet.getCell('L4').value = academicYear || "2024-2025";
      seeSheet.getCell('M4').value = `${subject.name}/${subject.code}`;
      seeSheet.getCell('AB4').value = semester;
      seeSheet.getCell('AM4').value = subject.code;
      seeSheet.getCell('AV4').value = students.length;
      seeSheet.getCell('AF5').value = subject.name;
      seeSheet.getCell('D3').value = branchName;

      // Set SEE level thresholds in row 11-13, column AY
      seeSheet.getCell('AY11').value = 60; // Level 1: 60% of max marks
      seeSheet.getCell('AY12').value = 70; // Level 2: 70% of max marks  
      seeSheet.getCell('AY13').value = 80; // Level 3: 80% of max marks
      seeSheet.getCell('AY10').value = 60; // Target percentage for meeting criteria

      // Clear formula text notes and Kiran 200 in header area
      try {
        seeSheet.getCell('A3').value = null;
        seeSheet.getCell('B3').value = null;
        seeSheet.getCell('A4').value = null;
        seeSheet.getCell('B4').value = null;
      } catch (err) {}

      // Set header row heights and column widths
      seeSheet.getColumn('A').width = 8;
      seeSheet.getColumn('B').width = 18;
      seeSheet.getColumn('C').width = 32;

      for (let c = 4; c <= 34; c++) {
        seeSheet.getColumn(c).width = 10;
      }

      seeSheet.getRow(6).height = 28;
      seeSheet.getRow(7).height = 26;
      seeSheet.getRow(8).height = 36;
      seeSheet.getRow(9).height = 26;

      // Clear sample questions, CO mappings, and max marks
      for (let c = 4; c <= 34; c++) {
        seeSheet.getCell(7, c).value = null;
        seeSheet.getCell(8, c).value = null;
        seeSheet.getCell(9, c).value = null;
      }

      // Inject SEE Questions (using passed questions or subject.courseOutcomes fallback)
      const subjectCos = subject.courseOutcomes || [];
      const getQuestionName = (i) => `${Math.floor(i / 2) + 1}${i % 2 === 0 ? 'a' : 'b'}`;
      const effectiveSeeQuestions = (seeQuestions && Array.isArray(seeQuestions) && seeQuestions.length > 0)
        ? seeQuestions
        : (subjectCos.length > 0
          ? subjectCos.map((c, i) => ({ qName: getQuestionName(i), co: c.coNumber, maxMarks: 10 }))
          : [{ qName: "1a", co: "CO1", maxMarks: 10 }]);

      let currentCol = 4;
      for (const q of effectiveSeeQuestions) {
        if (currentCol > 34) break;
        const coNum = String(q.co).replace(/co/i, '').trim();

        const c7 = seeSheet.getCell(7, currentCol);
        c7.value = `CO${coNum}`;
        c7.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c7.alignment = { vertical: 'middle', horizontal: 'center' };
        c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Soft Golden Yellow

        const c8 = seeSheet.getCell(8, currentCol);
        c8.value = q.qName;
        c8.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c8.alignment = { vertical: 'middle', horizontal: 'center' };
        c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } }; // Soft Pastel Green

        const c9 = seeSheet.getCell(9, currentCol);
        c9.value = Number(q.maxMarks) || 0;
        c9.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
        c9.alignment = { vertical: 'middle', horizontal: 'center' };
        c9.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } }; // Soft Pastel Peach

        currentCol++;
      }
    }

    // Process CES Sheet (clear dummy data)
    const cesSheet = workbook.getWorksheet('Course End Survey (CES)');
    if (cesSheet) {
      for(let r = 10; r <= 12; r++) {
        for(let c = 2; c <= 20; c++) {
          cesSheet.getCell(r, c).value = null;
        }
      }
    }

    // Process PO ATTAINMENT Sheet (Inject CO-PO mappings from DB)
    const poSheet = workbook.getWorksheet('PO ATTAINMENT');
    const validCOs = subject?.courseOutcomes?.map(co => parseInt(co.coNumber.replace(/co/i, ''))).filter(n => !isNaN(n)) || [1,2,3,4,5,6];
    
    if (poSheet && subject && subject.coPoMappings) {
      // Clear old mappings in B9:M14
      for(let r = 9; r <= 14; r++) {
        for(let c = 2; c <= 13; c++) {
          poSheet.getCell(r, c).value = null;
        }
      }
      // Inject new mappings
      subject.coPoMappings.forEach(mapping => {
        const coIdx = parseInt(String(mapping.coNumber).replace(/co/i, '')) || 0;
        const poIdx = parseInt(String(mapping.poNumber).replace(/po/i, '')) || 0;
        if (coIdx >= 1 && coIdx <= 6 && poIdx >= 1 && poIdx <= 12) {
          poSheet.getCell(8 + coIdx, 1 + poIdx).value = mapping.strength;
        }
      });
      
      // Hide invalid CO rows in PO ATTAINMENT
      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          poSheet.getRow(8 + i).hidden = true; // CO mapping row
          poSheet.getRow(23 + i).hidden = true; // CO calculation row
        } else {
          poSheet.getCell(8 + i, 1).value = `CO${i}`; // A9:A14
        }
      }
    }

    // Process CO Attainment Sheet
    const coAttainmentSheet = workbook.getWorksheet('CO Attainment');
    if (coAttainmentSheet && subject) {
      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          coAttainmentSheet.getRow(8 + i).hidden = true;
        } else {
          coAttainmentSheet.getCell(8 + i, 1).value = `CO${i}`;
        }
      }
      
      // Update average formulas to ignore 0 (from unused/hidden COs) and span all 6 COs
      coAttainmentSheet.getCell('D15').formula = 'IFERROR(ROUNDUP(AVERAGEIF(D9:D14, ">0"),2),"")';
      coAttainmentSheet.getCell('E15').formula = 'IFERROR(ROUNDUP(AVERAGEIF(E9:E14, ">0"),2),"")';
      coAttainmentSheet.getCell('F15').formula = 'IFERROR(ROUNDUP(AVERAGEIF(F9:F14, ">0"),2),"")';
    }

    const sheetsToUpdate = [iaSheet, seeSheet];
    
    for (const sheet of sheetsToUpdate) {
      if (!sheet) continue;
      
      // Reset counters for student list
      let currentRow = START_ROW;
      let index = 1;
      
      const maxCol = sheet.name === 'IA Marks' ? 59 : 34;
      const maxQCol = sheet.name === 'IA Marks' ? 'BG' : 'AH';
      
      const thinBorder = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
      };

      // Clear existing dummy data if any, and inject new data with full styling
      for (const student of students) {
        const studentName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
        const row = sheet.getRow(currentRow);
        row.height = 24; // Ensure ample height so student names do not squish or overlap

        const cellA = sheet.getCell(`A${currentRow}`);
        cellA.value = index++;
        cellA.alignment = { vertical: 'middle', horizontal: 'center' };
        cellA.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
        cellA.border = thinBorder;

        const cellB = sheet.getCell(`B${currentRow}`);
        cellB.value = student.enrollmentNo;
        cellB.alignment = { vertical: 'middle', horizontal: 'left' };
        cellB.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
        cellB.border = thinBorder;

        const cellC = sheet.getCell(`C${currentRow}`);
        cellC.value = studentName;
        cellC.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
        cellC.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
        cellC.border = thinBorder;

        // Apply borders, alignment, clean white fill, and font across all question/mark columns for this student
        for (let c = 4; c <= maxCol; c++) {
          const cell = sheet.getCell(currentRow, c);
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
          cell.border = thinBorder;
          cell.fill = undefined;
        }

        // Dynamically inject CO calculation formulas for this student row
        for (let i = 1; i <= 6; i++) {
          if (validCOs.includes(i)) {
            const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
            const sumColLetter = sheet.getColumn(startCol).letter;
            const countColLetter = sheet.getColumn(startCol + 1).letter;
            
            sheet.getCell(currentRow, startCol).value = { formula: `SUMIF($D$7:$${maxQCol}$7,"CO${i}",$D${currentRow}:$${maxQCol}${currentRow})` };
            sheet.getCell(currentRow, startCol + 1).value = { formula: `SUMIFS($D$9:$${maxQCol}$9,$D$7:$${maxQCol}$7,"CO${i}",$D${currentRow}:$${maxQCol}${currentRow},">"&-1)` };
            sheet.getCell(currentRow, startCol + 2).value = { formula: `ROUNDUP(IF(${countColLetter}${currentRow},${sumColLetter}${currentRow}/${countColLetter}${currentRow}%,0),2)` };
          }
        }

        // Dynamically inject custom IA formulas for DES, OBJ, ASSIGN, and TOTAL
        if (sheet.name === 'IA Marks') {
          // IA-1 DES (AK)
          sheet.getCell(`AK${currentRow}`).value = { formula: `SUM(D${currentRow}:S${currentRow})` };
          // IA-1 TOTAL (AN)
          sheet.getCell(`AN${currentRow}`).value = { formula: `AK${currentRow}+AL${currentRow}+AM${currentRow}` };
          
          // IA-2 DES (AO)
          sheet.getCell(`AO${currentRow}`).value = { formula: `SUM(U${currentRow}:AJ${currentRow})` };
          // IA-2 TOTAL (AR)
          sheet.getCell(`AR${currentRow}`).value = { formula: `AO${currentRow}+AP${currentRow}+AQ${currentRow}` };
        }
        
        currentRow++;
      }

      // Update the COUNTIF bounds in Row 11 to correctly reflect the total number of students
      const finalRow = Math.max(200, currentRow);
      for (let i = 1; i <= 6; i++) {
        if (validCOs.includes(i)) {
          const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
          const sumColLetter = sheet.getColumn(startCol).letter;
          const percColLetter = sheet.getColumn(startCol + 2).letter;
          
          sheet.getCell(11, startCol).value = { formula: `COUNTIF(${sumColLetter}13:${sumColLetter}${finalRow},">"&0)` };
          sheet.getCell(11, startCol + 2).value = { formula: `COUNTIF(${percColLetter}13:${percColLetter}${finalRow},">="&Z5)` };
        }
      }
      
      // Clear rows below if any old data remains
      const maxRow = Math.max(sheet.rowCount, START_ROW + 300);
      for (let r = currentRow; r <= maxRow; r++) {
        const row = sheet.getRow(r);
        row.height = undefined;
        for (let c = 1; c <= 100; c++) {
          const cell = sheet.getCell(r, c);
          cell.value = null;
          cell.formula = undefined;
          cell.sharedFormula = undefined;
          cell.border = undefined;
          cell.fill = undefined;
        }
      }

      // Hide invalid CO columns for this sheet
      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
          sheet.getColumn(startCol).hidden = true;
          sheet.getColumn(startCol + 1).hidden = true;
          sheet.getColumn(startCol + 2).hidden = true;
          
          // Clear header so formulas or visual presence is fully removed
          sheet.getCell(8, startCol).value = null;
          sheet.getCell(8, startCol + 1).value = null;
          sheet.getCell(8, startCol + 2).value = null;
        }
      }

      // Apply autofilter to student data rows
      sheet.autoFilter = `A12:${maxQCol}${currentRow > 13 ? currentRow - 1 : 13}`;
    }

    // Filter worksheets based on templateType if provided
    if (templateType === 'ia') {
      workbook.worksheets.forEach(sheet => {
        if (sheet.name !== 'IA Marks') {
          workbook.removeWorksheet(sheet.id);
        }
      });
    } else if (templateType === 'see') {
      workbook.worksheets.forEach(sheet => {
        if (sheet.name !== 'SEE Marks') {
          workbook.removeWorksheet(sheet.id);
        }
      });
    }

    const filename = templateType === 'ia'
      ? `IA_Marks_Template_${branchName}_Sem${semester}.xlsx`
      : templateType === 'see'
        ? `SEE_Marks_Template_${branchName}_Sem${semester}.xlsx`
        : `Final_COPO_Template_${branchName}_Sem${semester}.xlsx`;

    // 4. Send File
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Force Excel to recalculate all formulas when the file is opened
    workbook.calcProperties.fullCalcOnLoad = true;
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Server error while generating template' });
  }
};

const copySheetData = (srcSheet, destSheet, maxColIndex) => {
  srcSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 7 || rowNumber === 8 || rowNumber === 9 || rowNumber >= 13) {
      for (let colNumber = 1; colNumber <= maxColIndex; colNumber++) {
        const srcCell = row.getCell(colNumber);
        const destCell = destSheet.getCell(rowNumber, colNumber);
        destCell.value = srcCell.value;
      }
    }
  });
};

exports.uploadAndCalculate = async (req, res) => {
  try {
    const { subjectId } = req.body;
    const iaFileArray = req.files && req.files['iaFile'] ? req.files['iaFile'] : null;
    const seeFileArray = req.files && req.files['seeFile'] ? req.files['seeFile'] : null;

    if (!iaFileArray && !seeFileArray) {
      return res.status(400).json({ success: false, message: 'At least one of IA Marks or SEE Marks files is required' });
    }

    const subject = await Subject.findById(subjectId).populate('branch');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    console.log('--- Step 1: Loading Workbooks ---');
    
    // Load base template to run formulas properly
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    const iaSheet = workbook.getWorksheet('IA Marks');
    const seeSheet = workbook.getWorksheet('SEE Marks');

    if (iaSheet) {
      try {
        iaSheet.unMergeCells('AK6:AZ6');
      } catch (err) {}
      try {
        iaSheet.unMergeCells('AK7:AZ135');
      } catch (err) {}
    }

    // Pre-populate student list in both sheets first from database
    const branchName = subject.branch?.name || "";
    const students = await StudentDetails.find({ branch: branchName, semester: subject.semester });
    students.sort(sortEnrollmentNo);

    const START_ROW = 13;
    const branchNameFormatted = formatBranchName(branchName);

    const sheetsToPrepopulate = [iaSheet, seeSheet];
    for (const sheet of sheetsToPrepopulate) {
      if (!sheet) continue;
      sheet.getCell('D3').value = branchNameFormatted;
      let currentRow = START_ROW;
      let index = 1;
      const maxCol = sheet.name === 'IA Marks' ? 59 : 34;
      for (const student of students) {
        const studentName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
        sheet.getCell(`A${currentRow}`).value = index++;
        sheet.getCell(`B${currentRow}`).value = student.enrollmentNo;
        sheet.getCell(`C${currentRow}`).value = studentName;
        // Clear student marks columns to purge template dummy data
        for (let c = 4; c <= maxCol; c++) {
          sheet.getCell(currentRow, c).value = null;
        }
        currentRow++;
      }
    }

    if (iaFileArray && iaFileArray.length > 0) {
      const iaFileBuffer = iaFileArray[0].buffer;
      const iaWorkbook = new ExcelJS.Workbook();
      await iaWorkbook.xlsx.load(iaFileBuffer);
      const uploadedIaSheet = iaWorkbook.getWorksheet('IA Marks');
      if (uploadedIaSheet) {
        copySheetData(uploadedIaSheet, iaSheet, 59);
      }
    } else {
      // Clear question headers in iaSheet if not uploaded
      for (let c = 4; c <= 59; c++) {
        iaSheet.getCell(7, c).value = null;
        iaSheet.getCell(8, c).value = null;
        iaSheet.getCell(9, c).value = null;
      }
    }

    // Always inject custom columns headers in iaSheet
    // IA-1:
    // AK (37): IA-1 DES
    iaSheet.getCell(6, 37).value = "IA-1";
    iaSheet.getCell(7, 37).value = "";
    iaSheet.getCell(8, 37).value = "DES (20)";
    iaSheet.getCell(9, 37).value = 20;

    // AL (38): IA-1 OBJ
    iaSheet.getCell(6, 38).value = "IA-1";
    iaSheet.getCell(7, 38).value = "";
    iaSheet.getCell(8, 38).value = "OBJ (10)";
    iaSheet.getCell(9, 38).value = 10;

    // AM (39): IA-1 ASSIGN
    iaSheet.getCell(6, 39).value = "IA-1";
    iaSheet.getCell(7, 39).value = "";
    iaSheet.getCell(8, 39).value = "ASSIGN/SPA (05)";
    iaSheet.getCell(9, 39).value = 5;

    // AN (40): IA-1 TOTAL
    iaSheet.getCell(6, 40).value = "IA-1";
    iaSheet.getCell(7, 40).value = "";
    iaSheet.getCell(8, 40).value = "TOTAL MARKS (35)";
    iaSheet.getCell(9, 40).value = 35;

    // IA-2:
    // AO (41): IA-2 DES
    iaSheet.getCell(6, 41).value = "IA-2";
    iaSheet.getCell(7, 41).value = "";
    iaSheet.getCell(8, 41).value = "DES (20)";
    iaSheet.getCell(9, 41).value = 20;

    // AP (42): IA-2 OBJ
    iaSheet.getCell(6, 42).value = "IA-2";
    iaSheet.getCell(7, 42).value = "";
    iaSheet.getCell(8, 42).value = "OBJ (10)";
    iaSheet.getCell(9, 42).value = 10;

    // AQ (43): IA-2 ASSIGN
    iaSheet.getCell(6, 43).value = "IA-2";
    iaSheet.getCell(7, 43).value = "";
    iaSheet.getCell(8, 43).value = "ASSIGN/SPA (05)";
    iaSheet.getCell(9, 43).value = 5;

    // AR (44): IA-2 TOTAL
    iaSheet.getCell(6, 44).value = "IA-2";
    iaSheet.getCell(7, 44).value = "";
    iaSheet.getCell(8, 44).value = "TOTAL MARKS (35)";
    iaSheet.getCell(9, 44).value = 35;

    if (seeFileArray && seeFileArray.length > 0) {
      const seeFileBuffer = seeFileArray[0].buffer;
      const seeWorkbook = new ExcelJS.Workbook();
      await seeWorkbook.xlsx.load(seeFileBuffer);
      const uploadedSeeSheet = seeWorkbook.getWorksheet('SEE Marks');
      if (uploadedSeeSheet) {
        copySheetData(uploadedSeeSheet, seeSheet, 34);
      }
    } else {
      // Clear question headers in seeSheet if not uploaded
      for (let c = 4; c <= 34; c++) {
        seeSheet.getCell(7, c).value = null;
        seeSheet.getCell(8, c).value = null;
        seeSheet.getCell(9, c).value = null;
      }
    }

    // Inject formulas into base sheets
    const validCOs = subject?.courseOutcomes?.map(co => parseInt(co.coNumber.replace(/co/i, ''))).filter(n => !isNaN(n)) || [1,2,3,4,5,6];
    const sheetsToSetup = [iaSheet, seeSheet];
    
    for (const sheet of sheetsToSetup) {
      let currentRow = 13;
      let index = 1;
      const maxQCol = sheet.name === 'IA Marks' ? 'BG' : 'AH';
      
      while (sheet.getCell(currentRow, 2).value) {
        sheet.getCell(`A${currentRow}`).value = index++;
        
        for (let i = 1; i <= 6; i++) {
          if (validCOs.includes(i)) {
            const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
            const sumColLetter = sheet.getColumn(startCol).letter;
            const countColLetter = sheet.getColumn(startCol + 1).letter;
            
            sheet.getCell(currentRow, startCol).value = { formula: `SUMIF($D$7:$${maxQCol}$7,"CO${i}",$D${currentRow}:$${maxQCol}${currentRow})` };
            sheet.getCell(currentRow, startCol + 1).value = { formula: `SUMIFS($D$9:$${maxQCol}$9,$D$7:$${maxQCol}$7,"CO${i}",$D${currentRow}:$${maxQCol}${currentRow},">"&-1)` };
            sheet.getCell(currentRow, startCol + 2).value = { formula: `ROUNDUP(IF(${countColLetter}${currentRow},${sumColLetter}${currentRow}/${countColLetter}${currentRow}%,0),2)` };
          }
        }

        // Dynamically inject custom IA formulas for DES, OBJ, ASSIGN, and TOTAL
        if (sheet.name === 'IA Marks') {
          // IA-1 DES (AK)
          sheet.getCell(`AK${currentRow}`).value = { formula: `SUM(D${currentRow}:S${currentRow})` };
          // IA-1 TOTAL (AN)
          sheet.getCell(`AN${currentRow}`).value = { formula: `AK${currentRow}+AL${currentRow}+AM${currentRow}` };
          
          // IA-2 DES (AO)
          sheet.getCell(`AO${currentRow}`).value = { formula: `SUM(U${currentRow}:AJ${currentRow})` };
          // IA-2 TOTAL (AR)
          sheet.getCell(`AR${currentRow}`).value = { formula: `AO${currentRow}+AP${currentRow}+AQ${currentRow}` };
        }
        currentRow++;
      }

      const finalRow = Math.max(200, currentRow - 1);
      for (let i = 1; i <= 6; i++) {
        if (validCOs.includes(i)) {
          const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
          const sumColLetter = sheet.getColumn(startCol).letter;
          const percColLetter = sheet.getColumn(startCol + 2).letter;
          
          sheet.getCell(11, startCol).value = { formula: `COUNTIF(${sumColLetter}13:${sumColLetter}${finalRow},">"&0)` };
          sheet.getCell(11, startCol + 2).value = { formula: `COUNTIF(${percColLetter}13:${percColLetter}${finalRow},">="&Z5)` };
        }
      }

      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
          sheet.getColumn(startCol).hidden = true;
          sheet.getColumn(startCol + 1).hidden = true;
          sheet.getColumn(startCol + 2).hidden = true;
          
          sheet.getCell(8, startCol).value = null;
          sheet.getCell(8, startCol + 1).value = null;
          sheet.getCell(8, startCol + 2).value = null;
        }
      }
    }

    const getCellValue = (cell) => {
      if (!cell) return null;
      let val = cell.value;
      if (val && typeof val === 'object' && val.result !== undefined) {
        val = val.result;
      }
      if (typeof val === 'string' && val.includes('%')) {
        val = val.replace('%', '').trim();
      }
      return val;
    };

    const parseNum = (val, fallback) => {
      const n = Number(val);
      return isNaN(n) ? fallback : n;
    };

    // Get IA thresholds from the template
    const iaLevel1 = parseNum(getCellValue(iaSheet.getCell('BK1')), 40);
    const iaLevel2 = parseNum(getCellValue(iaSheet.getCell('BK2')), 50);
    const iaLevel3 = parseNum(getCellValue(iaSheet.getCell('BK3')), 60);
    const iaTargetPerc = parseNum(getCellValue(iaSheet.getCell('Z5')), 50);

    console.log('IA Thresholds:', { iaLevel1, iaLevel2, iaLevel3, iaTargetPerc });

    // Get SEE thresholds from the template
    const seeLevel1 = parseNum(getCellValue(seeSheet.getCell('AY11')), 60);
    const seeLevel2 = parseNum(getCellValue(seeSheet.getCell('AY12')), 70);
    const seeLevel3 = parseNum(getCellValue(seeSheet.getCell('AY13')), 80);
    const seeTargetPerc = parseNum(getCellValue(seeSheet.getCell('AY10')), 60);

    console.log('SEE Thresholds:', { seeLevel1, seeLevel2, seeLevel3, seeTargetPerc });

    const MAX_ROWS = 200;

    console.log('--- Step 2: Processing IA Marks ---');
    const iaCols = [];
    for (let c = 4; c <= 52; c++) { // D to AZ
      const coVal = getCellValue(iaSheet.getCell(7, c));
      const maxMarks = getCellValue(iaSheet.getCell(9, c));
      if (coVal && maxMarks > 0) {
        let coStr = String(coVal).replace(/co/i, '').trim();
        iaCols.push({ col: c, co: `CO${coStr}`, maxMarks: Number(maxMarks) });
      }
    }
    console.log('IA Columns found:', iaCols.length);

    let studentCount = 0;
    const iaCoScores = {};
    for (let r = START_ROW; r < START_ROW + MAX_ROWS; r++) {
      const usn = getCellValue(iaSheet.getCell(r, 2));
      if (!usn) continue;
      studentCount++;

      for (const colDef of iaCols) {
        const mark = getCellValue(iaSheet.getCell(r, colDef.col));
        if (mark !== null && mark !== '' && !isNaN(Number(mark))) {
           if (!iaCoScores[colDef.co]) iaCoScores[colDef.co] = { meetingTarget: 0, total: 0 };
           iaCoScores[colDef.co].total++;
           if ((Number(mark) / colDef.maxMarks) * 100 >= iaTargetPerc) {
             iaCoScores[colDef.co].meetingTarget++;
           }
        }
      }
    }

    const iaAttainment = {};
    for (const co in iaCoScores) {
      const stats = iaCoScores[co];
      const percMeeting = (stats.meetingTarget / stats.total) * 100;
      let level = 0;
      if (percMeeting >= iaLevel3) level = 3;
      else if (percMeeting >= iaLevel2) level = 2;
      else if (percMeeting >= iaLevel1) level = 1;
      iaAttainment[co] = { level, percMeeting };
      console.log(`IA ${co}: ${percMeeting.toFixed(2)}% meeting target -> Level ${level}`);
    }

    console.log('--- Step 3: Processing SEE Marks ---');
    const seeCols = [];
    for (let c = 4; c <= 34; c++) { 
      const coVal = getCellValue(seeSheet.getCell(7, c));
      const maxMarks = getCellValue(seeSheet.getCell(9, c));
      if (coVal && maxMarks > 0) {
        let coStr = String(coVal).replace(/co/i, '').trim();
        seeCols.push({ col: c, co: `CO${coStr}`, maxMarks: Number(maxMarks) });
      }
    }
    console.log('SEE Columns found:', seeCols.length);

    const seeCoScores = {};
    for (let r = START_ROW; r < START_ROW + MAX_ROWS; r++) {
      const usn = getCellValue(seeSheet.getCell(r, 2));
      if (!usn) continue;

      for (const colDef of seeCols) {
        const mark = getCellValue(seeSheet.getCell(r, colDef.col));
        if (mark !== null && mark !== '' && !isNaN(Number(mark))) {
           if (!seeCoScores[colDef.co]) seeCoScores[colDef.co] = { meetingTarget: 0, total: 0 };
           seeCoScores[colDef.co].total++;
           
           const perc = (Number(mark) / colDef.maxMarks) * 100;
           if (perc >= seeTargetPerc) {
             seeCoScores[colDef.co].meetingTarget++;
           }
        }
      }
    }

    const seeAttainment = {};
    for (const co in seeCoScores) {
      const stats = seeCoScores[co];
      const percMeeting = (stats.meetingTarget / stats.total) * 100;
      let level = 0;
      if (percMeeting >= seeLevel3) level = 3;
      else if (percMeeting >= seeLevel2) level = 2;
      else if (percMeeting >= seeLevel1) level = 1;
      seeAttainment[co] = { level, percMeeting };
      console.log(`SEE ${co}: ${percMeeting.toFixed(2)}% meeting target -> Level ${level}`);
    }

    console.log('--- Step 4: Processing Assignments (CIA) ---');
    const assignmentAttainment = {};
    const assCols = [];
    for (let c = 53; c <= 59; c++) {
      const coVal = getCellValue(iaSheet.getCell(7, c));
      const maxMarks = getCellValue(iaSheet.getCell(9, c));
      if (coVal && maxMarks > 0) {
        let coStr = String(coVal).replace(/co/i, '').trim();
        assCols.push({ col: c, co: `CO${coStr}`, maxMarks: Number(maxMarks) });
      }
    }
    console.log('Assignment Columns found:', assCols.length);

    if (assCols.length > 0) {
      const assCoScores = {};
      for (let r = START_ROW; r < START_ROW + MAX_ROWS; r++) {
        const usn = getCellValue(iaSheet.getCell(r, 2));
        if (!usn) continue;

        for (const colDef of assCols) {
          const mark = getCellValue(iaSheet.getCell(r, colDef.col));
          if (mark !== null && mark !== '' && !isNaN(Number(mark))) {
             if (!assCoScores[colDef.co]) assCoScores[colDef.co] = { meetingTarget: 0, total: 0 };
             assCoScores[colDef.co].total++;
             if ((Number(mark) / colDef.maxMarks) * 100 >= iaTargetPerc) {
               assCoScores[colDef.co].meetingTarget++;
             }
          }
        }
      }

      for (const co in assCoScores) {
        const stats = assCoScores[co];
        const percMeeting = (stats.meetingTarget / stats.total) * 100;
        let level = 0;
        if (percMeeting >= iaLevel3) level = 3;
        else if (percMeeting >= iaLevel2) level = 2;
        else if (percMeeting >= iaLevel1) level = 1;
        assignmentAttainment[co] = { level };
        console.log(`Assignment ${co}: Level ${level}`);
      }
    }

    console.log('--- Step 5: Combining CO Results ---');
    const iaWeight = (getCellValue(iaSheet.getCell('BG1')) || 40) / 100;
    const seeWeight = (getCellValue(iaSheet.getCell('BG2')) || 60) / 100;
    const directWeight = (getCellValue(iaSheet.getCell('BG3')) || 80) / 100;
    const indirectWeight = (getCellValue(iaSheet.getCell('BG4')) || 20) / 100;

    console.log('Weights:', { iaWeight, seeWeight, directWeight, indirectWeight });

    const allCOs = new Set([...Object.keys(iaAttainment), ...Object.keys(seeAttainment), ...Object.keys(assignmentAttainment)]);
    const finalCoResults = [];

    allCOs.forEach(co => {
      const iaLvl = iaAttainment[co]?.level || 0;
      const seeLvl = seeAttainment[co]?.level || 0;
      const assLvl = assignmentAttainment[co]?.level || 0;
      const indLvl = 2; // Default starting indirect level
      
      let formative = iaLvl;
      if (assLvl > 0 && iaLvl > 0) {
        formative = (iaLvl + assLvl) / 2;
      } else if (assLvl > 0) {
        formative = assLvl;
      }
      
      const direct = (iaWeight * formative) + (seeWeight * seeLvl);
      const overall = (directWeight * direct) + (indirectWeight * indLvl);

      finalCoResults.push({
        coNumber: co,
        iaLevel: iaLvl,
        seeLevel: seeLvl,
        assignmentLevel: assLvl > 0 ? assLvl : null,
        directAttainment: Number(direct.toFixed(2)),
        indirectAttainment: indLvl,
        overallAttainment: Number(overall.toFixed(2))
      });
    });

    // --- Calculate PO Attainment ---
    const pos = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12', 'PSO1', 'PSO2', 'PSO3'];
    const finalPoResults = [];

    for (const po of pos) {
      const mappings = subject.coPoMappings.filter(m => m.poNumber === po);
      if (mappings.length > 0) {
        let sumDirect = 0;
        let sumIndirect = 0;
        let countMapped = 0;

        mappings.forEach(mapping => {
          const coResult = finalCoResults.find(r => r.coNumber === mapping.coNumber);
          if (coResult && mapping.strength > 0) {
            sumDirect += (mapping.strength * coResult.directAttainment / 3);
            sumIndirect += (mapping.strength * coResult.indirectAttainment / 3);
            countMapped++;
          }
        });

        if (countMapped > 0) {
          const poDirect = Number((sumDirect / countMapped).toFixed(2));
          const poIndirect = Number((sumIndirect / countMapped).toFixed(2));
          const poAtt = Number((directWeight * poDirect + indirectWeight * poIndirect).toFixed(2));

          finalPoResults.push({
            poNumber: po,
            attainment: poAtt,
            directAttainment: poDirect,
            indirectAttainment: poIndirect
          });
        }
      }
    }

    console.log('PO Results:', finalPoResults);

    res.json({
      success: true,
      message: 'CO-PO Attainment calculated successfully!',
      results: {
        coAttainments: finalCoResults,
        poAttainments: finalPoResults,
        studentCount: studentCount,
        coPoMappings: subject.coPoMappings
      }
    });

  } catch (error) {
    console.error('CRITICAL ERROR in uploadAndCalculate:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error processing file', 
      error: error.message 
    });
  }
};

exports.exportWithResults = async (req, res) => {
  try {
    const { subjectId, academicYear, facultyName, branch, semester } = req.body;
    const iaFileArray = req.files && req.files['iaFile'] ? req.files['iaFile'] : null;
    const seeFileArray = req.files && req.files['seeFile'] ? req.files['seeFile'] : null;

    if (!iaFileArray && !seeFileArray) {
      return res.status(400).json({ success: false, message: 'At least one of IA Marks or SEE Marks files is required' });
    }

    const subject = await Subject.findById(subjectId).populate('branch');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Load base template to compile everything
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    const iaSheet = workbook.getWorksheet('IA Marks');
    const seeSheet = workbook.getWorksheet('SEE Marks');

    if (iaSheet) {
      try {
        iaSheet.unMergeCells('AK6:AZ6');
      } catch (err) {}
      try {
        iaSheet.unMergeCells('AK7:AZ135');
      } catch (err) {}
    }

    // Pre-populate student list in both sheets first from database
    const branchName = branch || subject.branch?.name || "";
    const students = await StudentDetails.find({ branch: branchName, semester: semester || subject.semester });
    students.sort(sortEnrollmentNo);

    const START_ROW = 13;
    const branchNameFormatted = formatBranchName(branchName);

    const sheetsToPrepopulate = [iaSheet, seeSheet];
    for (const sheet of sheetsToPrepopulate) {
      if (!sheet) continue;
      sheet.getCell('D3').value = branchNameFormatted;
      let currentRow = START_ROW;
      let index = 1;
      const maxCol = sheet.name === 'IA Marks' ? 59 : 34;
      for (const student of students) {
        const studentName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
        sheet.getCell(`A${currentRow}`).value = index++;
        sheet.getCell(`B${currentRow}`).value = student.enrollmentNo;
        sheet.getCell(`C${currentRow}`).value = studentName;
        // Clear student marks columns to purge template dummy data
        for (let c = 4; c <= maxCol; c++) {
          sheet.getCell(currentRow, c).value = null;
        }
        currentRow++;
      }
    }

    if (iaFileArray && iaFileArray.length > 0) {
      const iaFileBuffer = iaFileArray[0].buffer;
      const iaWorkbook = new ExcelJS.Workbook();
      await iaWorkbook.xlsx.load(iaFileBuffer);
      const uploadedIaSheet = iaWorkbook.getWorksheet('IA Marks');
      if (uploadedIaSheet) {
        copySheetData(uploadedIaSheet, iaSheet, 59);
      }
    } else {
      // Clear question headers in iaSheet if not uploaded
      for (let c = 4; c <= 59; c++) {
        iaSheet.getCell(7, c).value = null;
        iaSheet.getCell(8, c).value = null;
        iaSheet.getCell(9, c).value = null;
      }
    }

    // Always inject custom columns headers in iaSheet
    // IA-1:
    // AK (37): IA-1 DES
    iaSheet.getCell(6, 37).value = "IA-1";
    iaSheet.getCell(7, 37).value = "";
    iaSheet.getCell(8, 37).value = "DES (20)";
    iaSheet.getCell(9, 37).value = 20;

    // AL (38): IA-1 OBJ
    iaSheet.getCell(6, 38).value = "IA-1";
    iaSheet.getCell(7, 38).value = "";
    iaSheet.getCell(8, 38).value = "OBJ (10)";
    iaSheet.getCell(9, 38).value = 10;

    // AM (39): IA-1 ASSIGN
    iaSheet.getCell(6, 39).value = "IA-1";
    iaSheet.getCell(7, 39).value = "";
    iaSheet.getCell(8, 39).value = "ASSIGN/SPA (05)";
    iaSheet.getCell(9, 39).value = 5;

    // AN (40): IA-1 TOTAL
    iaSheet.getCell(6, 40).value = "IA-1";
    iaSheet.getCell(7, 40).value = "";
    iaSheet.getCell(8, 40).value = "TOTAL MARKS (35)";
    iaSheet.getCell(9, 40).value = 35;

    // IA-2:
    // AO (41): IA-2 DES
    iaSheet.getCell(6, 41).value = "IA-2";
    iaSheet.getCell(7, 41).value = "";
    iaSheet.getCell(8, 41).value = "DES (20)";
    iaSheet.getCell(9, 41).value = 20;

    // AP (42): IA-2 OBJ
    iaSheet.getCell(6, 42).value = "IA-2";
    iaSheet.getCell(7, 42).value = "";
    iaSheet.getCell(8, 42).value = "OBJ (10)";
    iaSheet.getCell(9, 42).value = 10;

    // AQ (43): IA-2 ASSIGN
    iaSheet.getCell(6, 43).value = "IA-2";
    iaSheet.getCell(7, 43).value = "";
    iaSheet.getCell(8, 43).value = "ASSIGN/SPA (05)";
    iaSheet.getCell(9, 43).value = 5;

    // AR (44): IA-2 TOTAL
    iaSheet.getCell(6, 44).value = "IA-2";
    iaSheet.getCell(7, 44).value = "";
    iaSheet.getCell(8, 44).value = "TOTAL MARKS (35)";
    iaSheet.getCell(9, 44).value = 35;

    if (seeFileArray && seeFileArray.length > 0) {
      const seeFileBuffer = seeFileArray[0].buffer;
      const seeWorkbook = new ExcelJS.Workbook();
      await seeWorkbook.xlsx.load(seeFileBuffer);
      const uploadedSeeSheet = seeWorkbook.getWorksheet('SEE Marks');
      if (uploadedSeeSheet) {
        copySheetData(uploadedSeeSheet, seeSheet, 34);
      }
    } else {
      // Clear question headers in seeSheet if not uploaded
      for (let c = 4; c <= 34; c++) {
        seeSheet.getCell(7, c).value = null;
        seeSheet.getCell(8, c).value = null;
        seeSheet.getCell(9, c).value = null;
      }
    }

    // Calculate studentCount dynamically from copied data
    let studentCount = 0;
    let scanRow = 13;
    while (iaSheet.getCell(scanRow, 2).value) {
      studentCount++;
      scanRow++;
    }

    // branchName is already declared above
    const semVal = semester || subject.semester;
    const formattedBranch = formatBranchName(branchName);

    if (facultyName) iaSheet.getCell('J5').value = facultyName;
    iaSheet.getCell('N4').value = academicYear || "2024-2025";
    iaSheet.getCell('AC4').value = semVal;
    iaSheet.getCell('AP4').value = subject.code;
    iaSheet.getCell('AY4').value = studentCount;
    iaSheet.getCell('AI5').value = subject.name;
    iaSheet.getCell('D3').value = formattedBranch;

    if (facultyName) seeSheet.getCell('I5').value = facultyName;
    seeSheet.getCell('L4').value = academicYear || "2024-2025";
    seeSheet.getCell('AB4').value = semVal;
    seeSheet.getCell('AM4').value = subject.code;
    seeSheet.getCell('AV4').value = studentCount;
    seeSheet.getCell('AF5').value = subject.name;
    seeSheet.getCell('D3').value = formattedBranch;

    // Inject formulas into base sheets
    const validCOs = subject?.courseOutcomes?.map(co => parseInt(co.coNumber.replace(/co/i, ''))).filter(n => !isNaN(n)) || [1,2,3,4,5,6];
    const sheetsToSetup = [iaSheet, seeSheet];
    
    for (const sheet of sheetsToSetup) {
      let currentRow = 13;
      let index = 1;
      const maxQCol = sheet.name === 'IA Marks' ? 'BG' : 'AH';
      
      while (sheet.getCell(currentRow, 2).value) {
        sheet.getCell(`A${currentRow}`).value = index++;
        
        for (let i = 1; i <= 6; i++) {
          if (validCOs.includes(i)) {
            const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
            const sumColLetter = sheet.getColumn(startCol).letter;
            const countColLetter = sheet.getColumn(startCol + 1).letter;
            
            sheet.getCell(currentRow, startCol).value = { formula: `SUMIF($D$7:$${maxQCol}$7,"CO${i}",$D${currentRow}:$${maxQCol}${currentRow})` };
            sheet.getCell(currentRow, startCol + 1).value = { formula: `SUMIFS($D$9:$${maxQCol}$9,$D$7:$${maxQCol}$7,"CO${i}",$D${currentRow}:$${maxQCol}${currentRow},">"&-1)` };
            sheet.getCell(currentRow, startCol + 2).value = { formula: `ROUNDUP(IF(${countColLetter}${currentRow},${sumColLetter}${currentRow}/${countColLetter}${currentRow}%,0),2)` };
          }
        }

        // Dynamically inject custom IA formulas for DES, OBJ, ASSIGN, and TOTAL
        if (sheet.name === 'IA Marks') {
          // IA-1 DES (AK)
          sheet.getCell(`AK${currentRow}`).value = { formula: `SUM(D${currentRow}:S${currentRow})` };
          // IA-1 TOTAL (AN)
          sheet.getCell(`AN${currentRow}`).value = { formula: `AK${currentRow}+AL${currentRow}+AM${currentRow}` };
          
          // IA-2 DES (AO)
          sheet.getCell(`AO${currentRow}`).value = { formula: `SUM(U${currentRow}:AJ${currentRow})` };
          // IA-2 TOTAL (AR)
          sheet.getCell(`AR${currentRow}`).value = { formula: `AO${currentRow}+AP${currentRow}+AQ${currentRow}` };
        }
        currentRow++;
      }

      const finalRow = Math.max(200, currentRow - 1);
      for (let i = 1; i <= 6; i++) {
        if (validCOs.includes(i)) {
          const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
          const sumColLetter = sheet.getColumn(startCol).letter;
          const percColLetter = sheet.getColumn(startCol + 2).letter;
          
          sheet.getCell(11, startCol).value = { formula: `COUNTIF(${sumColLetter}13:${sumColLetter}${finalRow},">"&0)` };
          sheet.getCell(11, startCol + 2).value = { formula: `COUNTIF(${percColLetter}13:${percColLetter}${finalRow},">="&Z5)` };
        }
      }

      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          const startCol = sheet.name === 'IA Marks' ? 61 + (i - 1) * 3 : 35 + (i - 1) * 3;
          sheet.getColumn(startCol).hidden = true;
          sheet.getColumn(startCol + 1).hidden = true;
          sheet.getColumn(startCol + 2).hidden = true;
          
          sheet.getCell(8, startCol).value = null;
          sheet.getCell(8, startCol + 1).value = null;
          sheet.getCell(8, startCol + 2).value = null;
        }
      }
    }

    const getCellValue = (cell) => {
      if (!cell) return null;
      let val = cell.value;
      if (val && typeof val === 'object' && val.result !== undefined) {
        val = val.result;
      }
      if (typeof val === 'string' && val.includes('%')) {
        val = val.replace('%', '').trim();
      }
      return val;
    };

    // Hide invalid COs in PO ATTAINMENT and CO Attainment
    const poSheet = workbook.getWorksheet('PO ATTAINMENT');
    if (poSheet) {
      for(let r = 9; r <= 14; r++) {
        for(let c = 2; c <= 13; c++) {
          poSheet.getCell(r, c).value = null;
        }
      }
      subject.coPoMappings.forEach(mapping => {
        const coIdx = parseInt(String(mapping.coNumber).replace(/co/i, '')) || 0;
        const poIdx = parseInt(String(mapping.poNumber).replace(/po/i, '')) || 0;
        if (coIdx >= 1 && coIdx <= 6 && poIdx >= 1 && poIdx <= 12) {
          poSheet.getCell(8 + coIdx, 1 + poIdx).value = mapping.strength;
        }
      });
      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          poSheet.getRow(8 + i).hidden = true;
          poSheet.getRow(23 + i).hidden = true;
        } else {
          poSheet.getCell(8 + i, 1).value = `CO${i}`;
        }
      }
    }

    const coAttainmentSheet = workbook.getWorksheet('CO Attainment');
    if (coAttainmentSheet) {
      for (let i = 1; i <= 6; i++) {
        if (!validCOs.includes(i)) {
          coAttainmentSheet.getRow(8 + i).hidden = true;
        } else {
          coAttainmentSheet.getCell(8 + i, 1).value = `CO${i}`;
        }
      }
      coAttainmentSheet.getCell('D15').formula = 'IFERROR(ROUNDUP(AVERAGEIF(D9:D14, ">0"),2),"")';
      coAttainmentSheet.getCell('E15').formula = 'IFERROR(ROUNDUP(AVERAGEIF(E9:E14, ">0"),2),"")';
      coAttainmentSheet.getCell('F15').formula = 'IFERROR(ROUNDUP(AVERAGEIF(F9:F14, ">0"),2),"")';
    }

    const results = JSON.parse(req.body.results || '{}');
    const uiData = JSON.parse(req.body.uiData || '{}');

    const directWeight = (getCellValue(iaSheet.getCell('BG3')) || 80) / 100;
    const indirectWeight = (getCellValue(iaSheet.getCell('BG4')) || 20) / 100;

    // 1. Course End Survey (CES)
    const cesSheet = workbook.getWorksheet('Course End Survey (CES)');
    if (cesSheet && uiData.cesCounts) {
      for (let i = 1; i <= 6; i++) {
        const coKey = `CO${i}`;
        const counts = uiData.cesCounts[coKey] || { rating1: 0, rating2: 0, rating3: 0 };
        cesSheet.getCell(10, 1 + i).value = Number(counts.rating1) || 0;
        cesSheet.getCell(11, 1 + i).value = Number(counts.rating2) || 0;
        cesSheet.getCell(12, 1 + i).value = Number(counts.rating3) || 0;
      }
    }

    // 2. CO Attainment Sheet
    if (coAttainmentSheet && results.coAttainments) {
      coAttainmentSheet.getCell('D7').value = directWeight;
      coAttainmentSheet.getCell('E7').value = indirectWeight;

      results.coAttainments.forEach(res => {
        const coIdx = parseInt(res.coNumber.replace(/co/i, ''));
        if (coIdx >= 1 && coIdx <= 6) {
          coAttainmentSheet.getCell(8 + coIdx, 4).value = res.directAttainment;
          
          const indLevel = (uiData.manualIndirect && uiData.manualIndirect[res.coNumber] !== undefined)
            ? Number(uiData.manualIndirect[res.coNumber])
            : res.indirectAttainment;

          coAttainmentSheet.getCell(8 + coIdx, 5).value = indLevel;
          
          const overallVal = Number((directWeight * res.directAttainment + indirectWeight * indLevel).toFixed(2));
          coAttainmentSheet.getCell(8 + coIdx, 6).value = overallVal;
          
          coAttainmentSheet.getCell(8 + coIdx, 7).value = res.iaLevel;
          coAttainmentSheet.getCell(8 + coIdx, 8).value = res.assignmentLevel;
          coAttainmentSheet.getCell(8 + coIdx, 9).value = res.seeLevel;

          // Update Subject Model
          const existingCoIndex = subject.courseOutcomes.findIndex(c => c.coNumber === res.coNumber);
          if (existingCoIndex >= 0) {
            subject.courseOutcomes[existingCoIndex].attainment = overallVal;
          }
        }
      });
      coAttainmentSheet.getCell(8, 7).value = 'IA Level';
      coAttainmentSheet.getCell(8, 8).value = 'Ass. Level';
      coAttainmentSheet.getCell(8, 9).value = 'SEE Level';

      subject.markModified('courseOutcomes');
    }

    // 3. PO Attainment Sheet
    if (poSheet && results.poAttainments) {
      // Clear shared formulas in row 18, 19, 20 to prevent ExcelJS prep error
      for (let c = 2; c <= 16; c++) {
        const cell18 = poSheet.getCell(18, c);
        cell18.value = null;
        cell18.formula = undefined;
        cell18.sharedFormula = undefined;

        const cell19 = poSheet.getCell(19, c);
        cell19.value = null;
        cell19.formula = undefined;
        cell19.sharedFormula = undefined;

        const cell20 = poSheet.getCell(20, c);
        cell20.value = null;
        cell20.formula = undefined;
        cell20.sharedFormula = undefined;
      }

      results.poAttainments.forEach(res => {
        const poMatch = res.poNumber.match(/PO(\d+)/i);
        if (poMatch) {
          const poIdx = parseInt(poMatch[1]);
          if (poIdx >= 1 && poIdx <= 12) {
            poSheet.getCell(18, 1 + poIdx).value = res.directAttainment;
            poSheet.getCell(19, 1 + poIdx).value = res.indirectAttainment;
            poSheet.getCell(20, 1 + poIdx).value = res.attainment;
          }
        }
        const psoMatch = res.poNumber.match(/PSO(\d+)/i);
        if (psoMatch) {
          const psoIdx = parseInt(psoMatch[1]);
          if (psoIdx >= 1 && psoIdx <= 3) {
            poSheet.getCell(18, 13 + psoIdx).value = res.directAttainment;
            poSheet.getCell(19, 13 + psoIdx).value = res.indirectAttainment;
            poSheet.getCell(20, 13 + psoIdx).value = res.attainment;
          }
        }

        const existingPoIndex = subject.poAttainments.findIndex(p => p.poNumber === res.poNumber);
        if (existingPoIndex >= 0) {
          subject.poAttainments[existingPoIndex].attainment = res.attainment;
        } else {
          subject.poAttainments.push({ poNumber: res.poNumber, attainment: res.attainment });
        }
      });
      subject.markModified('poAttainments');
    }

    await subject.save();

    // 4. Action Plan Sheet
    const actionPlanSheet = workbook.getWorksheet('Action Plan');
    if (actionPlanSheet) {
      if (uiData.actionPlan) {
        for (let i = 1; i <= 6; i++) {
          const coKey = `CO${i}`;
          const plan = uiData.actionPlan[coKey];
          if (plan) {
            actionPlanSheet.getCell(7 + i, 2).value = plan.target !== undefined ? Number(plan.target) : null;
            actionPlanSheet.getCell(7 + i, 5).value = plan.observation || '';
            actionPlanSheet.getCell(7 + i, 6).value = plan.action || '';
          }
        }
      }
      if (uiData.caym1Actions && Array.isArray(uiData.caym1Actions)) {
        uiData.caym1Actions.forEach((item, idx) => {
          if (idx < 7) {
            actionPlanSheet.getCell(16 + idx, 5).value = item.action || '';
            actionPlanSheet.getCell(16 + idx, 6).value = item.change || '';
          }
        });
      }
    }

    // 5. PO Attainment Action Plan Sheet
    const poActionPlanSheet = workbook.getWorksheet('PO Attainment Action Plan');
    if (poActionPlanSheet && uiData.poActionPlan) {
      for (let i = 1; i <= 12; i++) {
        const poKey = `PO${i}`;
        if (uiData.poActionPlan[poKey] !== undefined) {
          poActionPlanSheet.getCell(7 + i, 5).value = uiData.poActionPlan[poKey] || '';
        }
      }
      for (let i = 1; i <= 3; i++) {
        const psoKey = `PSO${i}`;
        if (uiData.poActionPlan[psoKey] !== undefined) {
          poActionPlanSheet.getCell(19 + i, 5).value = uiData.poActionPlan[psoKey] || '';
        }
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Final_COPO_Report_${subject.code}.xlsx`);
    workbook.calcProperties.fullCalcOnLoad = true;
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error in exportWithResults:', error);
    res.status(500).json({ success: false, message: 'Server error exporting file' });
  }
};
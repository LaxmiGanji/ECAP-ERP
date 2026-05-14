const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Subject = require('../../models/Other/subject.model');
const StudentDetails = require('../../models/Students/details.model');

const TEMPLATE_PATH = path.join(__dirname, '../../templates/COPO_TEMPLATE.xlsx');

exports.generateTemplate = async (req, res) => {
  try {
    const { subjectId, branch, semester, facultyName, academicYear, iaQuestions, seeQuestions, assignmentQuestions } = req.body;

    if (!subjectId || !branch || !semester) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }

    const subject = await Subject.findById(subjectId).populate('branch');
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    const branchName = subject?.branch?.name || branch;

    // 1. Fetch Students (Sorted by enrollmentNo using standard string sort for correct alphanumeric order)
    const students = await StudentDetails.find({ branch, semester })
      .sort({ enrollmentNo: 1 });
      
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

      // Inject IA Questions from UI (D-AZ)
      if (iaQuestions && Array.isArray(iaQuestions)) {
        let currentCol = 4; // Start at column D
        for (const q of iaQuestions) {
          if (currentCol > 52) break; // Limit IA to AZ
          const coNum = String(q.co).replace(/co/i, '').trim();
          iaSheet.getCell(7, currentCol).value = `CO${coNum}`;
          iaSheet.getCell(8, currentCol).value = q.qName;
          iaSheet.getCell(9, currentCol).value = Number(q.maxMarks) || 0;
          currentCol++;
        }
      }

      // Inject Assignment (CIA) Questions from UI (BA-BG)
      const safeAssQs = Array.isArray(assignmentQuestions) ? assignmentQuestions : [];
      let assCol = 53; // Start at column BA
      for (const q of safeAssQs) {
        if (assCol > 59) break; // Limit to BG
        const coStr = String(q.co).toUpperCase(); // e.g. "CO1"
        iaSheet.getCell(7, assCol).value = coStr;
        iaSheet.getCell(8, assCol).value = q.qName;
        iaSheet.getCell(9, assCol).value = Number(q.maxMarks) || 0;
        assCol++;
      }
    }

    // Process SEE Marks Sheet
    const seeSheet = workbook.getWorksheet('SEE Marks');
    if (seeSheet) {
      if (facultyName) seeSheet.getCell('I5').value = facultyName; // I5:R5 is merged
      seeSheet.getCell('M4').value = academicYear || "2024-2025";
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

      // Clear sample questions, CO mappings, and max marks
      for (let c = 4; c <= 34; c++) {
        seeSheet.getCell(7, c).value = null;
        seeSheet.getCell(8, c).value = null;
        seeSheet.getCell(9, c).value = null;
      }

      // Inject SEE Questions from UI
      if (seeQuestions && Array.isArray(seeQuestions)) {
        let currentCol = 4;
        for (const q of seeQuestions) {
          if (currentCol > 34) break;
          const coNum = String(q.co).replace(/co/i, '').trim();
          seeSheet.getCell(7, currentCol).value = `CO${coNum}`;
          seeSheet.getCell(8, currentCol).value = q.qName;
          seeSheet.getCell(9, currentCol).value = Number(q.maxMarks) || 0;
          currentCol++;
        }
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
      
      // Clear existing dummy data if any, and inject new data
      for (const student of students) {
        const studentName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
        sheet.getCell(`A${currentRow}`).value = index++;
        sheet.getCell(`B${currentRow}`).value = student.enrollmentNo;
        sheet.getCell(`C${currentRow}`).value = studentName;
        
        // Clear sample marks for this row
        for (let c = 4; c <= maxCol; c++) {
          sheet.getCell(currentRow, c).value = null;
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
      const maxRow = sheet.rowCount > START_ROW + 300 ? sheet.rowCount : START_ROW + 300;
      for (let r = currentRow; r <= maxRow; r++) {
        for (let c = 1; c <= 100; c++) {
          const cell = sheet.getCell(r, c);
          cell.value = null;
          cell.formula = undefined;
          cell.sharedFormula = undefined;
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

    // 4. Send File
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Final_COPO_Template_${branch}_Sem${semester}.xlsx`);
    
    // Force Excel to recalculate all formulas when the file is opened
    workbook.calcProperties.fullCalcOnLoad = true;
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Server error while generating template' });
  }
};

exports.uploadAndCalculate = async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!req.file || !subjectId) {
      return res.status(400).json({ success: false, message: 'File and subjectId are required' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    console.log('--- Step 1: Loading Workbook ---');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const iaSheet = workbook.getWorksheet('IA Marks');
    const seeSheet = workbook.getWorksheet('SEE Marks');
    const cesSheet = workbook.getWorksheet('Course End Survey (CES)');
    const coAttainmentSheet = workbook.getWorksheet('CO Attainment');
    
    if (!iaSheet || !seeSheet) {
      return res.status(400).json({ success: false, message: 'Invalid template structure. Missing IA Marks or SEE Marks sheet.' });
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

    // Get SEE thresholds from the template (from columns AY in SEE sheet)
    const seeLevel1 = parseNum(getCellValue(seeSheet.getCell('AY11')), 60);
    const seeLevel2 = parseNum(getCellValue(seeSheet.getCell('AY12')), 70);
    const seeLevel3 = parseNum(getCellValue(seeSheet.getCell('AY13')), 80);
    const seeTargetPerc = parseNum(getCellValue(seeSheet.getCell('AY10')), 60);

    console.log('SEE Thresholds:', { seeLevel1, seeLevel2, seeLevel3, seeTargetPerc });

    const MAX_ROWS = 200;
    const START_ROW = 13;

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

    const iaCoScores = {};
    for (let r = START_ROW; r < START_ROW + MAX_ROWS; r++) {
      const usn = getCellValue(iaSheet.getCell(r, 2)); // Column B is USN
      if (!usn) continue;

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
    console.log('SEE Target %:', seeTargetPerc);

    const seeCoScores = {};
    for (let r = START_ROW; r < START_ROW + MAX_ROWS; r++) {
      const usn = getCellValue(seeSheet.getCell(r, 2)); // Column B is USN
      if (!usn) continue;

      for (const colDef of seeCols) {
        const mark = getCellValue(seeSheet.getCell(r, colDef.col));
        if (mark !== null && mark !== '' && !isNaN(Number(mark))) {
           if (!seeCoScores[colDef.co]) seeCoScores[colDef.co] = { meetingTarget: 0, total: 0 };
           seeCoScores[colDef.co].total++;
           
           const perc = (Number(mark) / colDef.maxMarks) * 100;
           console.log(`- USN ${usn}: ${colDef.co} Mark=${mark}/${colDef.maxMarks} (${perc.toFixed(1)}%) - Target=${seeTargetPerc}%`);
           
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
      console.log(`SEE ${co}: ${percMeeting.toFixed(2)}% meeting target (${stats.meetingTarget}/${stats.total}) -> Level ${level}`);
    }

    console.log('--- Step 4: Processing Assignments (CIA) ---');
    const assignmentAttainment = {};
    const assCols = [];
    for (let c = 53; c <= 59; c++) { // BA to BG
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

    console.log('--- Step 5: Processing Indirect Attainment ---');
    const indirectAttainment = {};
    if (coAttainmentSheet) {
      for (let i = 1; i <= 6; i++) {
        const val = getCellValue(coAttainmentSheet.getCell(8 + i, 5));
        if (val !== null && !isNaN(Number(val))) {
          indirectAttainment[`CO${i}`] = { level: Number(val) };
          console.log(`Indirect CO${i}: Level ${val}`);
        }
      }
    }

    if (Object.keys(indirectAttainment).length === 0 && cesSheet) {
      for (let c = 2; c <= 7; c++) { // Columns B-G for CO1-CO6
        const coVal = getCellValue(cesSheet.getCell(4, c));
        const level = getCellValue(cesSheet.getCell(9, c));
        if (coVal && !isNaN(Number(level))) {
          let coNum = String(coVal).split('.')[1] || String(coVal).replace(/[^0-9]/g, '');
          indirectAttainment[`CO${coNum}`] = { level: Number(level) };
          console.log(`CES Indirect CO${coNum}: Level ${level}`);
        }
      }
    }

    console.log('--- Step 6: Combining CO Results ---');
    const iaWeight = (getCellValue(iaSheet.getCell('BG1')) || 40) / 100;
    const seeWeight = (getCellValue(iaSheet.getCell('BG2')) || 60) / 100;
    const directWeight = (getCellValue(iaSheet.getCell('BG3')) || 80) / 100;
    const indirectWeight = (getCellValue(iaSheet.getCell('BG4')) || 20) / 100;

    console.log('Weights:', { iaWeight, seeWeight, directWeight, indirectWeight });

    const allCOs = new Set([...Object.keys(iaAttainment), ...Object.keys(seeAttainment), ...Object.keys(assignmentAttainment), ...Object.keys(indirectAttainment)]);
    const finalCoResults = [];

    allCOs.forEach(co => {
      const iaLvl = iaAttainment[co]?.level || 0;
      const seeLvl = seeAttainment[co]?.level || 0;
      const assLvl = assignmentAttainment[co]?.level || 0;
      const indLvl = indirectAttainment[co]?.level || 2; // Default to 2 if not found
      
      // Formative assessment average of IA and Assignments (if both exist)
      let formative = iaLvl;
      if (assLvl > 0 && iaLvl > 0) {
        formative = (iaLvl + assLvl) / 2;
      } else if (assLvl > 0) {
        formative = assLvl;
      }
      
      const direct = (iaWeight * formative) + (seeWeight * seeLvl);
      const overall = (directWeight * direct) + (indirectWeight * indLvl);

      // Add or update to subject COs
      const existingCoIndex = subject.courseOutcomes.findIndex(c => c.coNumber === co);
      if (existingCoIndex >= 0) {
        subject.courseOutcomes[existingCoIndex].attainment = Number(overall.toFixed(2));
      } else {
        subject.courseOutcomes.push({
          coNumber: co,
          description: 'Auto-generated during upload',
          attainment: Number(overall.toFixed(2))
        });
      }

      finalCoResults.push({
        coNumber: co,
        iaLevel: iaLvl,
        seeLevel: seeLvl,
        assignmentLevel: assLvl > 0 ? assLvl : null,
        directAttainment: Number(direct.toFixed(2)),
        indirectAttainment: indLvl,
        overallAttainment: Number(overall.toFixed(2))
      });
      
      console.log(`${co}: IA=${iaLvl}, SEE=${seeLvl}, Assignment=${assLvl}, Indirect=${indLvl} -> Direct=${direct.toFixed(2)}, Overall=${overall.toFixed(2)}`);
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

          const existingPoIndex = subject.poAttainments.findIndex(p => p.poNumber === po);
          if (existingPoIndex >= 0) {
            subject.poAttainments[existingPoIndex].attainment = poAtt;
          } else {
            subject.poAttainments.push({ poNumber: po, attainment: poAtt });
          }

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

    // --- Save Results Back to Workbook ---
    const coSheet = workbook.getWorksheet('CO Attainment');
    if (coSheet) {
      // Write weights for documentation
      coSheet.getCell('D7').value = directWeight;
      coSheet.getCell('E7').value = indirectWeight;

      finalCoResults.forEach(res => {
        const coIdx = parseInt(res.coNumber.replace(/co/i, ''));
        if (coIdx >= 1 && coIdx <= 6) {
          // Standard CO Attainment Table
          coSheet.getCell(8 + coIdx, 4).value = res.directAttainment; // Col D
          coSheet.getCell(8 + coIdx, 5).value = res.indirectAttainment; // Col E
          coSheet.getCell(8 + coIdx, 6).value = res.overallAttainment; // Col F

          // Detailed Levels for Verification (Cols G, H, I)
          coSheet.getCell(8 + coIdx, 7).value = res.iaLevel;
          coSheet.getCell(8 + coIdx, 8).value = res.assignmentLevel;
          coSheet.getCell(8 + coIdx, 9).value = res.seeLevel;
        }
      });
      
      // Add headers for the new columns
      coSheet.getCell(8, 7).value = 'IA Level';
      coSheet.getCell(8, 8).value = 'Ass. Level';
      coSheet.getCell(8, 9).value = 'SEE Level';
    }

    const poSheet = workbook.getWorksheet('PO ATTAINMENT');
    if (poSheet) {
      finalPoResults.forEach(res => {
        const poMatch = res.poNumber.match(/PO(\d+)/i);
        if (poMatch) {
          const poIdx = parseInt(poMatch[1]);
          if (poIdx >= 1 && poIdx <= 12) {
            poSheet.getCell(20, 1 + poIdx).value = res.attainment; // Row 20 has the final attainment
          }
        }
        // Also handle PSOs if they are in row 21?
        const psoMatch = res.poNumber.match(/PSO(\d+)/i);
        if (psoMatch) {
          const psoIdx = parseInt(psoMatch[1]);
          if (psoIdx >= 1 && psoIdx <= 3) {
            poSheet.getCell(21, 1 + psoIdx).value = res.attainment;
          }
        }
      });
    }

    // Save the subject with new attainments
    await subject.save();

    // Send back the results
    res.json({
      success: true,
      message: 'CO-PO Attainment calculated and saved successfully!',
      results: {
        coAttainments: finalCoResults,
        poAttainments: finalPoResults
      }
    });

  } catch (error) {
    console.error('CRITICAL ERROR in uploadAndCalculate:', {
      message: error.message,
      stack: error.stack,
      subjectId: req.body.subjectId
    });
    res.status(500).json({ 
      success: false, 
      message: 'Server error processing file', 
      error: error.message 
    });
  }
};

exports.exportWithResults = async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!req.file || !subjectId) {
      return res.status(400).json({ success: false, message: 'File and subjectId are required' });
    }

    const subject = await Subject.findById(subjectId);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    // Parse results from request body
    const results = JSON.parse(req.body.results);

    const coSheet = workbook.getWorksheet('CO Attainment');
    if (coSheet && results.coAttainments) {
      results.coAttainments.forEach(res => {
        const coIdx = parseInt(res.coNumber.replace(/co/i, ''));
        if (coIdx >= 1 && coIdx <= 6) {
          coSheet.getCell(8 + coIdx, 4).value = res.directAttainment;
          coSheet.getCell(8 + coIdx, 5).value = res.indirectAttainment;
          coSheet.getCell(8 + coIdx, 6).value = res.overallAttainment;
          
          // Added detailed levels
          coSheet.getCell(8 + coIdx, 7).value = res.iaLevel;
          coSheet.getCell(8 + coIdx, 8).value = res.assignmentLevel;
          coSheet.getCell(8 + coIdx, 9).value = res.seeLevel;
        }
      });
      // Headers
      coSheet.getCell(8, 7).value = 'IA Level';
      coSheet.getCell(8, 8).value = 'Ass. Level';
      coSheet.getCell(8, 9).value = 'SEE Level';
    }

    const poSheet = workbook.getWorksheet('PO ATTAINMENT');
    if (poSheet && results.poAttainments) {
      results.poAttainments.forEach(res => {
        const poMatch = res.poNumber.match(/PO(\d+)/i);
        if (poMatch) {
          const poIdx = parseInt(poMatch[1]);
          if (poIdx >= 1 && poIdx <= 12) {
            poSheet.getCell(20, 1 + poIdx).value = res.attainment;
          }
        }
        const psoMatch = res.poNumber.match(/PSO(\d+)/i);
        if (psoMatch) {
          const psoIdx = parseInt(psoMatch[1]);
          if (psoIdx >= 1 && psoIdx <= 3) {
            poSheet.getCell(21, 1 + psoIdx).value = res.attainment;
          }
        }
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Calculated_COPO_Results.xlsx`);
    workbook.calcProperties.fullCalcOnLoad = true;
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error in exportWithResults:', error);
    res.status(500).json({ success: false, message: 'Server error exporting file' });
  }
};
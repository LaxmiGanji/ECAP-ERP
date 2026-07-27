const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Branch = require("../models/Other/branch.model.js");
const Subject = require("../models/Other/subject.model.js");
const StudentDetails = require("../models/Students/details.model.js");
const ExcelJS = require("exceljs");

const TEMPLATE_PATH = path.join(__dirname, "../templates/COPO_TEMPLATE.xlsx");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB!");

    const student = await StudentDetails.findOne();
    const subject = await Subject.findOne({ semester: student.semester }).populate("branch");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);
    const iaSheet = workbook.getWorksheet("IA Marks");

    // UNMERGE columns AK to AZ
    console.log("Unmerging cells...");
    try {
      iaSheet.unMergeCells('AK6:AZ6');
    } catch (e) {
      console.log("Unmerge AK6:AZ6 failed:", e.message);
    }
    try {
      iaSheet.unMergeCells('AK7:AZ135');
    } catch (e) {
      console.log("Unmerge AK7:AZ135 failed:", e.message);
    }

    // Now inject headers
    iaSheet.getCell(6, 37).value = "IA-1";
    iaSheet.getCell(7, 37).value = "";
    iaSheet.getCell(8, 37).value = "OBJ (10)";
    iaSheet.getCell(9, 37).value = 10;

    iaSheet.getCell(6, 38).value = "IA-1";
    iaSheet.getCell(7, 38).value = "";
    iaSheet.getCell(8, 38).value = "ASSIGN/SPA (05)";
    iaSheet.getCell(9, 38).value = 5;

    iaSheet.getCell(6, 39).value = "IA-1";
    iaSheet.getCell(7, 39).value = "";
    iaSheet.getCell(8, 39).value = "TOTAL MARKS (35)";
    iaSheet.getCell(9, 39).value = 35;

    iaSheet.getCell(6, 40).value = "IA-2";
    iaSheet.getCell(7, 40).value = "";
    iaSheet.getCell(8, 40).value = "OBJ (10)";
    iaSheet.getCell(9, 40).value = 10;

    iaSheet.getCell(6, 41).value = "IA-2";
    iaSheet.getCell(7, 41).value = "";
    iaSheet.getCell(8, 41).value = "ASSIGN/SPA (05)";
    iaSheet.getCell(9, 41).value = 5;

    iaSheet.getCell(6, 42).value = "IA-2";
    iaSheet.getCell(7, 42).value = "";
    iaSheet.getCell(8, 42).value = "TOTAL MARKS (35)";
    iaSheet.getCell(9, 42).value = 35;

    // Inject formula into row 13
    iaSheet.getCell("AM13").value = { formula: 'SUMIF($D$6:$AJ$6,"IA-1",D13:AJ13)+AK13+AL13' };
    iaSheet.getCell("AP13").value = { formula: 'SUMIF($D$6:$AJ$6,"IA-2",D13:AJ13)+AN13+AO13' };

    const outputPath = path.join(__dirname, "test_template_fixed.xlsx");
    await workbook.xlsx.writeFile(outputPath);
    console.log("File saved!");

    // Inspect the generated file cells
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(outputPath);
    const sheet = wb.getWorksheet("IA Marks");
    console.log("\nChecking AK to AP in output file:");
    for (let c = 37; c <= 42; c++) {
      const colLetter = sheet.getColumn(c).letter;
      const r6 = sheet.getRow(6).getCell(c).value;
      const r8 = sheet.getRow(8).getCell(c).value;
      const r9 = sheet.getRow(9).getCell(c).value;
      console.log(`${colLetter} (${c}) -> R6: ${JSON.stringify(r6)} | R8: ${JSON.stringify(r8)} | R9: ${JSON.stringify(r9)}`);
    }

    console.log("\nChecking Row 13 for student 1 formulas in AK to AP:");
    const r13 = sheet.getRow(13);
    for (let c = 37; c <= 42; c++) {
      const colLetter = sheet.getColumn(c).letter;
      console.log(`${colLetter}13 value:`, r13.getCell(c).value);
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    await mongoose.disconnect();
  }
}

run();

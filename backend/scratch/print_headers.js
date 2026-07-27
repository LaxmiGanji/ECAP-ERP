const ExcelJS = require("exceljs");
const path = require("path");

const templatePath = path.join(__dirname, "../templates/COPO_TEMPLATE.xlsx");

async function check() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const iaSheet = workbook.getWorksheet("IA Marks");
    if (!iaSheet) {
      console.log("No IA Marks sheet found!");
      return;
    }

    console.log("Column headers in IA Marks sheet (Row 6, 7, 8, 9):");
    for (let c = 1; c <= 100; c++) {
      const colLetter = iaSheet.getColumn(c).letter;
      const r6 = iaSheet.getRow(6).getCell(c).value || "";
      const r7 = iaSheet.getRow(7).getCell(c).value || "";
      const r8 = iaSheet.getRow(8).getCell(c).value || "";
      const r9 = iaSheet.getRow(9).getCell(c).value || "";
      if (r6 || r7 || r8 || r9) {
        console.log(`${colLetter} (${c}) -> R6: ${JSON.stringify(r6)} | R7: ${JSON.stringify(r7)} | R8: ${JSON.stringify(r8)} | R9: ${JSON.stringify(r9)}`);
      }
    }

  } catch (e) {
    console.error("Inspection failed:", e);
  }
}

check();

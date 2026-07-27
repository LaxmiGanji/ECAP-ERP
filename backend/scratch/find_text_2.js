const ExcelJS = require("exceljs");
const path = require("path");

const templatePath = path.join(__dirname, "../templates/COPO_TEMPLATE.xlsx");

async function search() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const iaSheet = workbook.getWorksheet("IA Marks");
    if (!iaSheet) {
      console.log("No IA Marks sheet found!");
      return;
    }

    console.log("Searching rows 1 to 15 for OBJ, ASSIGN, SPA, TOTAL:");
    for (let r = 1; r <= 15; r++) {
      const row = iaSheet.getRow(r);
      for (let c = 1; c <= 100; c++) {
        const cell = row.getCell(c);
        const val = String(cell.value || "");
        if (val.toLowerCase().includes("obj") || val.toLowerCase().includes("assign") || val.toLowerCase().includes("spa") || val.toLowerCase().includes("total")) {
          const colLetter = iaSheet.getColumn(c).letter;
          console.log(`Found at ${colLetter}${r}: ${JSON.stringify(cell.value)}`);
        }
      }
    }

  } catch (e) {
    console.error("Search failed:", e);
  }
}

search();

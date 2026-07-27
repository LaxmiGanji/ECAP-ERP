const ExcelJS = require("exceljs");
const path = require("path");

const templatePath = path.join(__dirname, "../templates/COPO_TEMPLATE.xlsx");

async function inspect() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const iaSheet = workbook.getWorksheet("IA Marks");
    if (!iaSheet) {
      console.log("No IA Marks sheet found!");
      return;
    }

    console.log("\nIA Marks Sheet columns O to Y (15 to 25):");
    for (let r = 5; r <= 13; r++) {
      const row = iaSheet.getRow(r);
      const rowCells = [];
      for (let c = 15; c <= 25; c++) {
        const cell = row.getCell(c);
        const colLetter = iaSheet.getColumn(c).letter;
        rowCells.push(`${colLetter}:${JSON.stringify(cell.value || "")}`);
      }
      console.log(`Row ${r}:`, rowCells.join(" | "));
    }

  } catch (e) {
    console.error("Inspection failed:", e);
  }
}

inspect();

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

    console.log("Searching for keywords...");
    iaSheet.eachRow((row, rowNum) => {
      row.eachCell((cell, colNum) => {
        const val = String(cell.value || "");
        if (val.toLowerCase().includes("obj") || val.toLowerCase().includes("assign") || val.toLowerCase().includes("spa") || val.toLowerCase().includes("total")) {
          const colLetter = iaSheet.getColumn(colNum).letter;
          console.log(`Found at ${colLetter}${rowNum}: ${JSON.stringify(cell.value)}`);
        }
      });
    });

  } catch (e) {
    console.error("Search failed:", e);
  }
}

search();

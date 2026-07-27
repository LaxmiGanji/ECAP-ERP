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

    console.log("Checking hidden status of columns AK to AP:");
    for (let c = 37; c <= 42; c++) {
      const col = iaSheet.getColumn(c);
      console.log(`Column ${col.letter} (${c}) -> hidden: ${col.hidden}`);
    }

  } catch (e) {
    console.error("Failed:", e);
  }
}

check();

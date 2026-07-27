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

    console.log("Merged ranges in IA Marks sheet:");
    Object.keys(iaSheet._merges).forEach(key => {
      const merge = iaSheet._merges[key];
      // Let's print merge if it overlaps with columns 14 to 22 (N to V)
      if (merge.left >= 14 && merge.right <= 22) {
        console.log(`Merge range: ${merge.model.address}`);
      }
    });

    console.log("\nRow 7 values for columns N to V:");
    const r7 = iaSheet.getRow(7);
    const r8 = iaSheet.getRow(8);
    const r9 = iaSheet.getRow(9);
    for (let c = 14; c <= 22; c++) {
      const colLetter = iaSheet.getColumn(c).letter;
      console.log(`${colLetter}7: ${r7.getCell(c).value} | ${colLetter}8: ${r8.getCell(c).value} | ${colLetter}9: ${r9.getCell(c).value}`);
    }

  } catch (e) {
    console.error("Failed:", e);
  }
}

check();

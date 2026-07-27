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

    console.log("All merged cell ranges in IA Marks sheet:");
    if (iaSheet.model && iaSheet.model.merges) {
      iaSheet.model.merges.forEach(merge => {
        console.log(`- ${merge}`);
      });
    }

  } catch (e) {
    console.error("Failed:", e);
  }
}

check();

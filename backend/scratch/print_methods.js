const ExcelJS = require("exceljs");
const path = require("path");

const templatePath = path.join(__dirname, "../templates/COPO_TEMPLATE.xlsx");

async function check() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  const sheet = workbook.getWorksheet("IA Marks");
  
  console.log("Worksheet functions:");
  const proto = Object.getPrototypeOf(sheet);
  Object.getOwnPropertyNames(proto).forEach(prop => {
    if (typeof sheet[prop] === 'function') {
      console.log(`- ${prop}`);
    }
  });
}

check();

const ExcelJS = require('exceljs');
const path = require('path');

async function test() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(__dirname, 'templates/COPO_TEMPLATE.xlsx'));
  
  const iaSheet = workbook.getWorksheet('IA Marks');
  
  // Clear
  for (let c = 4; c <= 59; c++) {
    iaSheet.getCell(7, c).value = null; 
    iaSheet.getCell(8, c).value = null; 
    iaSheet.getCell(9, c).value = null; 
  }
  
  // Inject
  iaSheet.getCell(7, 4).value = 1; // D7
  iaSheet.getCell(8, 4).value = '1a'; // D8
  iaSheet.getCell(9, 4).value = 5; // D9
  
  // Inject student mark
  iaSheet.getCell(13, 1).value = 'S1';
  iaSheet.getCell(13, 2).value = 'R1';
  iaSheet.getCell(13, 3).value = 'N1';
  iaSheet.getCell(13, 4).value = 5; // D13 = 5
  
  await workbook.xlsx.writeFile(path.join(__dirname, 'templates/test_exceljs.xlsx'));
  console.log("Written");
}

test();

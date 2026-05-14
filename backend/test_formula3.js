const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('SEE Marks');
  
  sheet.getCell('AI13').formula = `SUMIF($D$7:$AH$7,"1",$D13:$AH13)`;

  await workbook.xlsx.writeFile('test_formulas_v3.xlsx');
  console.log("Done");
}
test();

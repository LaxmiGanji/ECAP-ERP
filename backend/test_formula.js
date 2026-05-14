const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('SEE Marks');
  
  const i = 1;
  const maxQCol = 'AH';
  const currentRow = 13;
  const sumColLetter = 'AI';
  const countColLetter = 'AJ';

  sheet.getCell('AI13').formula = `SUMIF($D$7:$${maxQCol}$7,"${i}",$D${currentRow}:$${maxQCol}${currentRow})`;
  sheet.getCell('AJ13').formula = `SUMIFS($D$9:$${maxQCol}$9,$D$7:$${maxQCol}$7,"${i}",$D${currentRow}:$${maxQCol}${currentRow},">"&-1)`;
  sheet.getCell('AK13').formula = `ROUNDUP(IF(${countColLetter}${currentRow},${sumColLetter}${currentRow}/${countColLetter}${currentRow}%,0),2)`;

  await workbook.xlsx.writeFile('test_formulas.xlsx');
  console.log("Done");
}
test();

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const candidateSheets = ['CONE', 'CONE (2)', 'Cone FTD', 'NIVUS', 'UP', 'GOL O4R2', 'GOL O4R1', 'Amarok O4R2'];
  
  let output = '--- TAB ANALYSIS ---\n';
  candidateSheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 5);
      output += `\n=== SHEET: ${sheetName} ===\n`;
      output += `Headers: ${JSON.stringify(data[0])}\n`;
      output += `Row 1: ${JSON.stringify(data[1])}\n`;
    } else {
      output += `\n=== SHEET: ${sheetName} NOT FOUND ===\n`;
    }
  });
  
  fs.writeFileSync('scripts/tab_investigation.txt', output);
  console.log('Investigation results saved to scripts/tab_investigation.txt');
}

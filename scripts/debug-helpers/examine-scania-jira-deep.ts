import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['Scania (JIRA)'];
  if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('--- Scania (JIRA) DEEP DIVE ---');
    data.slice(0, 10).forEach((row, i) => {
       console.log(`Row ${i}: ${JSON.stringify(row)}`);
    });
  }
}

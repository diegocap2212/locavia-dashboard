import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['Cone FTD'];
  if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('--- Cone FTD DEEP DIVE ---');
    data.slice(0, 50).forEach((row, i) => {
       if (Array.isArray(row) && row.length > 5) {
          console.log(`Row ${i}: ${JSON.stringify(row)}`);
       }
    });
  }
}

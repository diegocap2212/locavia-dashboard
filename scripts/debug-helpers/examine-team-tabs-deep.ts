import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  ['NIVUS', 'UP'].forEach(name => {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n=== SHEET: ${name} (Rows: ${data.length}) ===`);
      data.slice(0, 100).forEach((row, i) => {
         if (Array.isArray(row) && row.some(cell => cell !== null && cell !== "")) {
           console.log(`Row ${i}: ${JSON.stringify(row)}`);
         }
      });
    }
  });
}

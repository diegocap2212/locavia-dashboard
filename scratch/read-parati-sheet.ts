import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  ['Cone CEM PARATI', 'Cone PARATI'].forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`\n=== SHEET: ${sheetName} ===`);
      console.log('Total rows:', json.length);
      console.log('First 10 rows:');
      json.slice(0, 15).forEach((row, idx) => {
        console.log(`Row ${idx+1}:`, JSON.stringify(row));
      });
    } else {
      console.log(`\nSheet ${sheetName} not found`);
    }
  });
} else {
  console.log('File not found');
}

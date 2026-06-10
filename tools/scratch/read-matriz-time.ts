import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['MATRIZ TIME'];
  if (sheet) {
    const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log('=== MATRIZ TIME ===');
    json.forEach((row, idx) => {
      if (row.length > 0) {
        console.log(`Row ${idx+1}:`, JSON.stringify(row));
      }
    });
  } else {
    console.log('Sheet MATRIZ TIME not found');
  }
} else {
  console.log('File not found');
}

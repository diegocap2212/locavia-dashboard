import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheets = ['Cone Escopo x TIME ', 'Cone Escopo - sem Release', 'Cone Time - sem Release'];
  
  sheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n=== SHEET: ${sheetName} ===`);
      json.slice(0, 20).forEach((row, idx) => {
        if (row.length > 0) {
          console.log(`Row ${idx+1}:`, JSON.stringify(row));
        }
      });
    } else {
      console.log(`\nSheet ${sheetName} not found`);
    }
  });
} else {
  console.log('File not found');
}

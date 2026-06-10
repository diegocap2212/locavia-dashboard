import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const files = [
  'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx',
  'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx'
];

files.forEach(f => {
  const filePath = path.join(process.cwd(), f);
  if (fs.existsSync(filePath)) {
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const sheet = workbook.Sheets['LEIA-ME'];
    if (sheet) {
      const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n=== LEIA-ME from ${f} ===`);
      json.forEach((row, idx) => {
        if (row.length > 0) {
          console.log(`Row ${idx+1}:`, JSON.stringify(row));
        }
      });
    } else {
      console.log(`\nLEIA-ME not found in ${f}`);
    }
  }
});

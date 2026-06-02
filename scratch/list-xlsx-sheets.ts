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
    console.log(`\nFile: ${f}`);
    console.log('Sheets:', workbook.SheetNames);
  } else {
    console.log(`\nFile not found: ${f}`);
  }
});

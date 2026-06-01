import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const files = [
  'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx',
  'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  console.log(`\n=== File: ${file} ===`);
  const workbook = XLSX.read(fs.readFileSync(filePath));
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const rows = range.e.r - range.s.r + 1;
    console.log(`- Sheet: ${name} (${rows} rows)`);
  });
});

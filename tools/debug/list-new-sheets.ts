import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (5).xlsx';
const filePath = path.join(process.cwd(), file);

console.log(`Checking file: ${filePath}`);
if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('Sheets found:', workbook.SheetNames);
  fs.writeFileSync('scripts/new_sheets.txt', workbook.SheetNames.join('\n'));
} else {
  console.error('File not found');
}

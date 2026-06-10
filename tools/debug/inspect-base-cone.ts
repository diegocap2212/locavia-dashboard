import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (5).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheetName = 'BASE CONE';
  const worksheet = workbook.Sheets[sheetName];
  
  if (worksheet) {
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Sheet: ' + sheetName);
    console.log('Headers:', json[0]);
    console.log('Sample data (row 1-3):', json.slice(1, 4));
  } else {
    console.error('Sheet not found: ' + sheetName);
  }
} else {
  console.error('File not found');
}

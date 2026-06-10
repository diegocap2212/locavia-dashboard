import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheetName = 'BASE CONE';
  const worksheet = workbook.Sheets[sheetName];
  
  if (worksheet) {
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('File: ' + file);
    console.log('Headers:', json[0]);
    console.log('Sample data (row 1):', json[1]);
  } else {
    console.error('Sheet not found: ' + sheetName);
  }
} else {
  console.error('File not found');
}

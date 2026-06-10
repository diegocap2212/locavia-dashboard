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
    console.log('Headers from BASE CONE:');
    console.log(JSON.stringify(json[0], null, 2));
    console.log('First data row:');
    console.log(JSON.stringify(json[1], null, 2));
  } else {
    console.log('Sheet BASE CONE not found');
  }
}

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.xlsx'));
console.log('Excel Files found:', files);

files.forEach(file => {
  console.log(`\n=== Inspecting: ${file} ===`);
  const workbook = XLSX.read(fs.readFileSync(path.join(rootDir, file)));
  console.log('Sheets:', workbook.SheetNames);
  
  const baseConeSheet = workbook.SheetNames.find(s => s.trim().toUpperCase() === 'BASE CONE');
  if (baseConeSheet) {
    const worksheet = workbook.Sheets[baseConeSheet];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length > 0) {
      console.log('BASE CONE Columns (first row):');
      console.log(data[0]);
    } else {
      console.log('BASE CONE is empty.');
    }
  } else {
    console.log('BASE CONE sheet not found in this file.');
  }
});

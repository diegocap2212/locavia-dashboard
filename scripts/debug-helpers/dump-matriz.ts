import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (5).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheetName = 'MATRIZ TIME';
  const worksheet = workbook.Sheets[sheetName];
  
  if (worksheet) {
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    fs.writeFileSync('scripts/matriz_time_full.json', JSON.stringify(json, null, 2));
    console.log('Saved to scripts/matriz_time_full.json');
  }
}

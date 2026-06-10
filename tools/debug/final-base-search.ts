import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const baseSheets = workbook.SheetNames.filter(name => name.toUpperCase().includes('BASE'));
  console.log(`--- BASE SEARCH RESULTS ---`);
  console.log(baseSheets);
  
  if (baseSheets.length > 0) {
    baseSheets.forEach(name => {
      const sheet = workbook.Sheets[name];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 5);
      console.log(`\n=== SHEET: ${name} ===`);
      console.log(JSON.stringify(data));
    });
  } else {
    console.log('No sheet found with "BASE" in the name.');
  }
}

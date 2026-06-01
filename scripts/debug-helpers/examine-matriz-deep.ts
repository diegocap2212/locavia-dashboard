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
    // Look for rows that contain car names
    const carNames = ['OPTIMUS', 'NIVUS', 'GOL', 'TERA', 'TAOS', 'FUSCA', 'UP', 'AMAROK'];
    json.forEach((row: any, i) => {
      if (Array.isArray(row)) {
        const rowStr = row.join(' ').toUpperCase();
        if (carNames.some(car => rowStr.includes(car))) {
          console.log(`Row ${i + 1}: ${JSON.stringify(row)}`);
        }
      }
    });
  }
}

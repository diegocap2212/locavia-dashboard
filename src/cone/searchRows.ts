import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILES = [
  'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx',
  'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx'
];

FILES.forEach(filename => {
  const filePath = path.join(__dirname, '../../', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File does not exist: ${filePath}`);
    return;
  }
  console.log(`Reading Excel file: ${filename}`);
  const workbook = XLSX.readFile(filePath);

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (!data) return;
    
    for (let r = 0; r < data.length; r++) {
      const row = data[r] || [];
      const has35 = row.some(v => v === 35 || String(v) === '35');
      const hasMinus35 = row.some(v => v === -35 || String(v) === '-35');
      
      if (has35 && hasMinus35) {
        console.log(`[${filename}] Match in sheet "${sheetName}" at Row ${r+1}:`);
        console.log(`  ${row.slice(0, 15).join(' | ')}`);
      }
    }
  });
});

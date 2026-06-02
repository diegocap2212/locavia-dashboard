import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data.json');
const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const item = raw.find((it: any) => it.Key === 'LI-940');
console.log('JSON item:', item);

// Let's check Excel in both files
const FILES = [
  'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx',
  'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx'
];

FILES.forEach(filename => {
  const filePath = path.join(__dirname, '../../', filename);
  if (!fs.existsSync(filePath)) return;
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (!data) return;
    
    for (let r = 0; r < data.length; r++) {
      const row = data[r] || [];
      if (row.includes('LI-940')) {
        console.log(`[${filename}] Found in sheet "${sheetName}" row ${r+1}:`);
        console.log(`  ${row.slice(0, 15).join(' | ')}`);
      }
    }
  });
});

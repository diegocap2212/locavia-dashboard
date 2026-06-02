import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

console.log(`Reading Excel file: ${EXCEL_FILE}`);
const workbook = XLSX.readFile(EXCEL_FILE);

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const range = sheet['!ref'];
  if (!range) continue;
  
  // Convert sheet to json
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  let found = false;
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const val = String(data[r][c] || '');
      if (val.includes('CEM-R1') || val === '58' && data[r].includes(35)) {
        console.log(`Found reference in sheet "${sheetName}" at Row ${r+1}, Col ${c+1}: "${val}"`);
        found = true;
        break;
      }
    }
    if (found) break;
  }
}

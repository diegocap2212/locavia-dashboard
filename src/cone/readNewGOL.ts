import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheetName = 'GOL O4R2';
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log(`--- ${sheetName} first 45 rows ---`);
for (let r = 0; r < Math.min(data.length, 45); r++) {
  const row = data[r] || [];
  const line = row.slice(0, 16).map(val => val === undefined || val === null ? '' : String(val)).join(' | ');
  console.log(`Row ${r + 1}: ${line}`);
}

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['GOL O4R2'];

console.log('--- Formulas in "GOL O4R2" ---');
const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const rows = [15, 16];

rows.forEach(r => {
  console.log(`\nRow ${r}:`);
  cols.forEach(col => {
    const cellRef = `${col}${r}`;
    const cell = sheet[cellRef];
    console.log(`${cellRef}: value="${cell?.v}", formula="${cell?.f}"`);
  });
});

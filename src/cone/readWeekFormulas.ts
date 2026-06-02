import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['Cone BAF'];

console.log('--- Formulas in "Cone BAF" columns J, K, L, M, N ---');
const cols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
const rows = [14, 15, 16]; // Try row 14, 15, 16

rows.forEach(r => {
  console.log(`\nRow ${r}:`);
  cols.forEach(col => {
    const cellRef = `${col}${r}`;
    const cell = sheet[cellRef];
    console.log(`  ${cellRef}: value="${cell?.v}", formula="${cell?.f}"`);
  });
});

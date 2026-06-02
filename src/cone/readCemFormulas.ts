import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['Cone CEM-R1'];

console.log('--- Formulas in "Cone CEM-R1" ---');
const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
const rows = [40, 41];

rows.forEach(r => {
  console.log(`\nRow ${r}:`);
  cols.forEach(col => {
    const cellRef = `${col}${r}`;
    const cell = sheet[cellRef];
    console.log(`  ${cellRef}: value="${cell?.v}", formula="${cell?.f}"`);
  });
});

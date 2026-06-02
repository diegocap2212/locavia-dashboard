import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['GOL O4R2'];

console.log('--- GOL O4R2 column F formulas (Rows 38-41) ---');
for (let r = 38; r <= 41; r++) {
  const cellRef = `F${r}`;
  const cell = sheet[cellRef];
  console.log(`${cellRef}: value="${cell?.v}", formula="${cell?.f}"`);
}

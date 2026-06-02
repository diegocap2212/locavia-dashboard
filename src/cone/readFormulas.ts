import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);

const sheets = ['Cone Time x Release (2)', 'Cone BAF'];

sheets.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return;
  console.log(`\n--- Formulas in sheet "${sheetName}" ---`);
  for (let r = 2; r <= 10; r++) {
    const cellRef = `C${r}`;
    const cell = sheet[cellRef];
    console.log(`${cellRef}: value="${cell?.v}", formula="${cell?.f}"`);
  }
});

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);

workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  // Excel cell addresses are 0-indexed in decode_cell or 1-indexed in A1 notation
  const c3 = sheet['C3']?.v;
  const c4 = sheet['C4']?.v;
  
  if (c3 !== undefined || c4 !== undefined) {
    console.log(`Sheet "${sheetName}": C3="${c3}", C4="${c4}"`);
  }
});

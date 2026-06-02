import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
console.log('Sheets in O4R2 Excel:', workbook.SheetNames);

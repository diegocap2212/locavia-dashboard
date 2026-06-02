import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['Cone CEM-R1'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log('Row 14 raw array:', data[13]);
console.log('Row 15 raw array:', data[14]);

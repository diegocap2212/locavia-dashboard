import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['BASE CONE'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log('Headers in BASE CONE (O4R2 Excel):');
console.log(data[0]);

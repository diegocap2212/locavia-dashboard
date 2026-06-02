import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log('Headers in _Locavia_ BASE CONE 2 (Jira):');
console.log(data[0]);

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
console.log('Defined names in workbook:');
if (workbook.Workbook && workbook.Workbook.Names) {
  workbook.Workbook.Names.forEach(n => {
    console.log(`Name: "${n.Name}", Ref: "${n.Ref}"`);
  });
} else {
  console.log('No defined names found under workbook.Workbook.Names');
}

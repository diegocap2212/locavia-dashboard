import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileCem = path.join(__dirname, '../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');
const fileGol = path.join(__dirname, '../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

console.log('CEM File Sheets:');
try {
  const wb = XLSX.readFile(fileCem);
  console.log(wb.SheetNames);
} catch (e: any) {
  console.error('Error reading CEM file:', e.message);
}

console.log('\nGOL File Sheets:');
try {
  const wb = XLSX.readFile(fileGol);
  console.log(wb.SheetNames);
} catch (e: any) {
  console.error('Error reading GOL file:', e.message);
}

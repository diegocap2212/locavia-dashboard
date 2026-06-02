import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

console.log(`Reading Excel file: ${EXCEL_FILE}`);
const workbook = XLSX.readFile(EXCEL_FILE);
console.log('Sheets found:', workbook.SheetNames);

// Let's find sheets related to CEM
const cemSheets = workbook.SheetNames.filter(name => name.includes('CEM'));
console.log('CEM sheets:', cemSheets);

// Let's read the CEM-R1 sheet if it exists
const sheetName = cemSheets[0] || 'CEM';
if (workbook.SheetNames.includes(sheetName)) {
  const sheet = workbook.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  console.log(`Sheet range: A1 to ${XLSX.utils.encode_cell({ r: range.e.r, c: range.e.c })}`);
  
  // Let's print the first 20 rows of columns A to N
  for (let r = 0; r <= 30; r++) {
    const row: string[] = [];
    for (let c = 0; c <= 15; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      row.push(cell ? String(cell.v) : '');
    }
    console.log(`Row ${r + 1}:`, row.join(' | '));
  }
}

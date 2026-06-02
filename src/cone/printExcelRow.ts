import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

const targetKeys = ['RM-3159', 'RM-3158'];

targetKeys.forEach(key => {
  for (let r = 0; r < data.length; r++) {
    const row = data[r] || [];
    if (row.includes(key)) {
      console.log(`Row ${r+1}:`, row.join(' | '));
      break;
    }
  }
});

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

const targetKeys = [
  'RM-3089', 'RM-3199', 'RM-3166', 'RM-3160', 'RM-3159',
  'RM-3158', 'RM-3154', 'RM-3153', 'RM-3152', 'RM-3151',
  'RM-3150', 'RM-3149', 'RM-3148', 'RM-3147', 'RM-3146'
];

targetKeys.forEach(key => {
  let found = false;
  for (let r = 0; r < data.length; r++) {
    const row = data[r] || [];
    if (row.includes(key)) {
      found = true;
      console.log(`Found ${key} in row ${r+1}: status="${row[8]}"`);
      break;
    }
  }
  if (!found) {
    console.log(`${key} NOT found in sheet`);
  }
});

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));

const sheet = workbook.Sheets['Cone SCANIA'];
const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
json.slice(10, 30).forEach((row, idx) => {
  console.log(`Row ${idx + 10}: ${JSON.stringify(row)}`);
});

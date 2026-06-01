import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['Cone da Release'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

console.log('--- Cone da Release ---');
rows.slice(0, 15).forEach((row, i) => {
    console.log(`Row ${i}: ${JSON.stringify(row)}`);
});

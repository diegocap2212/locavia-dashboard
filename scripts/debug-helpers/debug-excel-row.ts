import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));

['Cone SCANIA', 'Cone CEM OPTIMUS'].forEach(name => {
  console.log(`\n=== Sheet: ${name} ===`);
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    console.log('Sheet not found');
    return;
  }
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  console.log(`Found ${json.length} rows.`);
  json.slice(0, 10).forEach((row, idx) => {
    console.log(`Row ${idx}: ${JSON.stringify(row)}`);
  });
});

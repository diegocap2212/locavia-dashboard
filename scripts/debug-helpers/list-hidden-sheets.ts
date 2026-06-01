import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- ALL SHEETS (including hidden) ---');
  workbook.Workbook?.Sheets?.forEach(s => {
    console.log(`${s.name} (Hidden: ${s.Hidden !== 0})`);
  });
}

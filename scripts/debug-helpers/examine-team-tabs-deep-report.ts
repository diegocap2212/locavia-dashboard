import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  let output = '';
  ['NIVUS', 'UP'].forEach(name => {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      output += `\n=== SHEET: ${name} (Rows: ${data.length}) ===\n`;
      data.slice(0, 100).forEach((row, i) => {
         if (Array.isArray(row) && row.some(cell => cell !== null && cell !== "")) {
           output += `Row ${i}: ${JSON.stringify(row)}\n`;
         }
      });
    }
  });
  fs.writeFileSync('scripts/team_tabs_deep.txt', output);
  console.log('Deep analysis of team tabs saved to scripts/team_tabs_deep.txt');
}

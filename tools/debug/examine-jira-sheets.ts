import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  ['Scania (JIRA)', 'Amarok (via JIRA)'].forEach(name => {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n=== SHEET: ${name} ===`);
      // Find the first row that actually has data
      for (let i = 0; i < Math.min(data.length, 50); i++) {
        const row = data[i] as any[];
        if (Array.isArray(row) && row.length > 5) {
          console.log(`Row ${i} looks like headers: ${JSON.stringify(row)}`);
          break;
        }
      }
    }
  });
}

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  ['Scania (JIRA)', 'Amarok (via JIRA)', 'GOL (Release 3)'].forEach(name => {
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      console.log(`\n=== SHEET: ${name} ===`);
      console.log(`Headers: ${JSON.stringify(data[0])}`);
      console.log(`Row 1: ${JSON.stringify(data[1])}`);
    }
  });
}

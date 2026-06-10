import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['Cone FTD'];
  if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    fs.writeFileSync('scripts/cone_ftd_headers.txt', JSON.stringify(data[0], null, 2));
    fs.writeFileSync('scripts/cone_ftd_sample.txt', JSON.stringify(data[1], null, 2));
    console.log('Headers and sample saved to scripts/');
  }
}

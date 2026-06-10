import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['BASE CONE'];
  if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    let headerRowIdx = -1;
    for (let i = 0; i < 20; i++) {
      if (data[i] && data[i].some(c => String(c).includes('Chave') || String(c).includes('Status'))) {
        headerRowIdx = i;
        break;
      }
    }
    console.log('Headers in Excel sheet BASE CONE:');
    console.log(data[headerRowIdx]);
  }
} else {
  console.log('File not found');
}

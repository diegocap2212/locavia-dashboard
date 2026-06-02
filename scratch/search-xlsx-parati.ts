import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    json.forEach((row, rowIndex) => {
      const rowStr = JSON.stringify(row).toLowerCase();
      if (rowStr.includes('parati') || rowStr.includes('seminovos') || rowStr.includes('buy a feature')) {
        console.log(`Sheet: ${sheetName}, Row: ${rowIndex + 1}`);
        console.log(JSON.stringify(row));
      }
    });
  });
} else {
  console.log('File not found');
}

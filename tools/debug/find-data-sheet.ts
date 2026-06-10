import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- ALL SHEETS IN WORKBOOK ---');
  console.log(workbook.SheetNames);
  
  workbook.SheetNames.forEach(name => {
     const sheet = workbook.Sheets[name];
     const range = sheet['!ref'];
     if (range) {
        const decoded = XLSX.utils.decode_range(range);
        const colCount = decoded.e.c - decoded.s.c + 1;
        const rowCount = decoded.e.r - decoded.s.r + 1;
        if (colCount > 10 && rowCount > 10) {
           console.log(`Potential Data Sheet: "${name}" (Cols: ${colCount}, Rows: ${rowCount})`);
        }
     }
  });
}

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- GLOBAL SEARCH FOR "Status" ---');
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 0; i < data.length; i++) {
       const row = data[i];
       if (Array.isArray(row) && row.some(cell => String(cell).toLowerCase().includes('status'))) {
          console.log(`FOUND! Sheet: [${name}], Row: ${i + 1}, Value: "${JSON.stringify(row)}"`);
       }
    }
  });
}

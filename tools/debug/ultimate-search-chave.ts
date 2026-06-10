import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- ULTIMATE SEARCH FOR "Chave" ---');
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 0; i < data.length; i++) {
       const row = data[i];
       if (Array.isArray(row)) {
          for (let j = 0; j < row.length; j++) {
             if (String(row[j]).toLowerCase().includes('chave')) {
                console.log(`FOUND! Sheet: [${name}], Row: ${i + 1}, Col: ${j + 1}, Value: "${row[j]}"`);
             }
          }
       }
    }
  });
}

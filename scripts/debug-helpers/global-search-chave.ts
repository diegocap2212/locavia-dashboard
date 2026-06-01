import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- GLOBAL SEARCH FOR "Chave" ---');
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 0; i < data.length; i++) {
       const row = data[i];
       if (Array.isArray(row) && row.some(cell => String(cell).includes('Chave'))) {
          console.log(`FOUND "Chave" in Sheet: [${name}] at Row: ${i + 1}`);
          console.log(`Fields: ${JSON.stringify(row)}`);
          // Show first 3 data rows
          for (let j = 1; j <= 3 && i + j < data.length; j++) {
             console.log(`Sample Row ${j}: ${JSON.stringify(data[i+j])}`);
          }
       }
    }
  });
}

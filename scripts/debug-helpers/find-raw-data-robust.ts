import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- SEARCHING FOR RAW DATA ---');
  
  workbook.SheetNames.forEach(name => {
     const sheet = workbook.Sheets[name];
     const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
     if (data.length > 0) {
        const headerRow = data.find(row => Array.isArray(row) && row.some(cell => String(cell).toLowerCase().includes('chave')));
        if (headerRow) {
           console.log(`Potential Data Sheet: "${name}"`);
           console.log(`Header Row Content: ${JSON.stringify(headerRow)}`);
        }
     }
  });
}

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- DEEP SEARCH FOR JIRA DATA ---');
  
  workbook.SheetNames.forEach(name => {
     const sheet = workbook.Sheets[name];
     const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
     for (let i = 0; i < Math.min(data.length, 20); i++) {
        const row = data[i];
        if (Array.isArray(row) && row.some(cell => String(cell).toLowerCase().includes('chave'))) {
           console.log(`Found Jira Data! Sheet: "${name}" at Row: ${i + 1}`);
           console.log(`Fields: ${JSON.stringify(row)}`);
           return;
        }
     }
  });
}

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log('--- SEARCHING FOR JIRA KEYS (WA- or VAA-) ---');
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = JSON.stringify(row);
        if (rowStr.includes('WA-') || rowStr.includes('VAA-')) {
          console.log(`Found Data! Sheet: "${name}" at Row: ${i + 1}`);
          console.log(`Row Content: ${rowStr.substring(0, 500)}`);
          return; // Next sheet
        }
      }
    }
  });
}

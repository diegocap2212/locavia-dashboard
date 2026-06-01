import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  let output = '--- EXHAUSTIVE SEARCH FOR JIRA KEYS (WA- or VAA-) ---\n';
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let foundCount = 0;
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = JSON.stringify(row);
        if (rowStr.includes('WA-') || rowStr.includes('VAA-') || rowStr.includes('JAC-')) {
          if (foundCount === 0) {
            output += `\n>>> Found Data in Sheet: "${name}"\n`;
          }
          if (foundCount < 5) {
            output += `Row ${i + 1}: ${rowStr.substring(0, 500)}\n`;
          }
          foundCount++;
        }
      }
    }
    if (foundCount > 0) {
      output += `Total items found in "${name}": ${foundCount}\n`;
    }
  });

  fs.writeFileSync('scripts/exhaustive_jira_search.txt', output);
  console.log('Exhaustive search saved to scripts/exhaustive_jira_search.txt');
}

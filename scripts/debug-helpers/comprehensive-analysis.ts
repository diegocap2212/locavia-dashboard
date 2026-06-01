import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  let output = '--- COMPREHENSVE TAB ANALYSIS ---\n';
  
  workbook.SheetNames.forEach(name => {
    output += `\n=== SHEET: ${name} ===\n`;
    const sheet = workbook.Sheets[name];
    if (sheet) {
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 3);
      output += JSON.stringify(data, null, 2) + '\n';
    }
  });

  fs.writeFileSync('scripts/comprehensive_analysis.txt', output);
  console.log('Analysis saved to scripts/comprehensive_analysis.txt');
}

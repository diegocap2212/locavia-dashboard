import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  let output = '--- ALL SHEETS ---\n' + workbook.SheetNames.join('\n') + '\n\n';
  
  const baseSuggestions = workbook.SheetNames.filter(name => 
    name.toLowerCase().includes('base') || 
    name.toLowerCase().includes('cone')
  );
  
  output += '--- Base Suggestions ---\n' + baseSuggestions.join('\n') + '\n\n';

  baseSuggestions.concat(['NIVUS', 'UP', 'GOL O4R2']).forEach(sheetName => {
    output += `\n=== SHEET: ${sheetName} ===\n`;
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(0, 5);
      output += JSON.stringify(data) + '\n';
    } else {
      output += 'Sheet not found\n';
    }
  });

  fs.writeFileSync('new_file_analysis.txt', output);
}

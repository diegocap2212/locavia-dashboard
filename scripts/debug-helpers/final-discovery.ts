import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  let output = '--- DEEP DISCOVERY IN Cone LOCAVIA_Atual.xlsx ---\n';
  
  const rawDataMarkers = ['chave', 'status', 'tipo', 'resumo', 'key'];
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    for (let i = 0; i < Math.min(data.length, 50); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = JSON.stringify(row).toLowerCase();
        const matches = rawDataMarkers.filter(m => rowStr.includes(m));
        if (matches.length >= 3) {
          output += `\n>>> Potential Raw Data Source: "${name}" at Row ${i + 1}\n`;
          output += `Matched Markers: ${matches.join(', ')}\n`;
          output += `Fields: ${JSON.stringify(row)}\n`;
          
          if (data[i+1]) output += `Sample Row 1: ${JSON.stringify(data[i+1])}\n`;
          if (data[i+2]) output += `Sample Row 2: ${JSON.stringify(data[i+2])}\n`;
        }
      }
    }
  });

  fs.writeFileSync('scripts/discovery_report.txt', output);
  console.log('Report saved to scripts/discovery_report.txt');
}

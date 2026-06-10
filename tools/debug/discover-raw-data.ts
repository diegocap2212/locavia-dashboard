import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer);
  
  console.log('--- FILE DISCOVERY IN Cone LOCAVIA_Atual.xlsx ---');
  
  // 1. List all sheets and their visibility
  workbook.Workbook?.Sheets?.forEach(s => {
    console.log(`Sheet Name: [${s.name}], Hidden: ${s.Hidden !== 0}`);
  });

  // 2. Search for raw data markers in ALL sheets
  const rawDataMarkers = ['chave', 'status', 'tipo', 'resumo', 'key'];
  
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Check first 30 rows
    for (let i = 0; i < Math.min(data.length, 30); i++) {
      const row = data[i];
      if (Array.isArray(row)) {
        const rowStr = JSON.stringify(row).toLowerCase();
        const matches = rawDataMarkers.filter(m => rowStr.includes(m));
        if (matches.length >= 3) {
          console.log(`\n>>> Potential Raw Data Source: "${name}" at Row ${i + 1}`);
          console.log(`Matched Markers: ${matches.join(', ')}`);
          console.log(`Row Content: ${JSON.stringify(row)}`);
          
          // Print sample data from this sheet (next 5 rows)
          console.log('Sample Data:');
          for (let j = 1; j <= 5 && i + j < data.length; j++) {
             console.log(`Row ${i + 1 + j}: ${JSON.stringify(data[i + j])}`);
          }
        }
      }
    }
  });
}

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA_Atual.xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  
  // Find all sheets that might be the base
  const baseSuggestions = workbook.SheetNames.filter(name => 
    name.toLowerCase().includes('base') || 
    name.toLowerCase().includes('cone')
  );
  
  console.log('--- Base Suggestions ---');
  console.log(baseSuggestions);

  // Preview the first 5 rows of a few sheets
  const sheetsToPreview = baseSuggestions.slice(0, 5).concat(['NIVUS', 'UP', 'GOL O4R2']);
  
  sheetsToPreview.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(0, 5);
      console.log(JSON.stringify(data));
    } else {
      console.log('Sheet not found');
    }
  });
}

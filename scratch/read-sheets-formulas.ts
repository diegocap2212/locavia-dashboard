import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath), { cellFormula: true });
  
  ['Cone PARATI', 'Cone CEM PARATI'].forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      console.log(`\n=== Sheet: ${sheetName} Formulas ===`);
      // Print cells that contain formulas and references to BASE CONE
      for (const [cellRef, cell] of Object.entries(sheet)) {
        if (cell && typeof cell === 'object' && 'f' in cell) {
          const formula = String(cell.f);
          if (formula.includes('BASE CONE') || formula.includes('Jira')) {
            console.log(`${cellRef}: ${formula}`);
          }
        }
      }
    } else {
      console.log(`\nSheet ${sheetName} not found`);
    }
  });
} else {
  console.log('File not found');
}

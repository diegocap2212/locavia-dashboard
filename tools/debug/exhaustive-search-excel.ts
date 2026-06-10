import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const files = [
  'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx',
  'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx'
];

const isJiraKey = (val: any) => {
  if (typeof val !== 'string') return false;
  return /^[A-Z]{2,}-[0-9]+$/.test(val.trim());
};

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) return;
  
  const workbook = XLSX.read(fs.readFileSync(filePath));
  console.log(`\n\n==================== FILE: ${file} ====================`);
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const range = sheet['!ref'];
    if (!range) return;
    
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[];
    if (rows.length === 0) return;

    const keysFound = new Set<string>();
    let matchCount = 0;
    
    // Find if this sheet is relevant
    const nameLower = sheetName.toLowerCase();
    const isPossiblyRelevant = nameLower.includes('scania') || 
                               nameLower.includes('cem') || 
                               nameLower.includes('comp') || 
                               nameLower.includes('estoq') || 
                               nameLower.includes('multa') || 
                               nameLower.includes('optimus') || 
                               nameLower.includes('amarok');
                               
    if (!isPossiblyRelevant) return;
    
    rows.forEach((row: any) => {
      Object.values(row).forEach((cell: any) => {
        const str = String(cell).trim().toUpperCase();
        if (isJiraKey(str)) {
          keysFound.add(str);
        }
      });
    });

    if (keysFound.size > 0) {
       console.log(`Sheet [${sheetName}]: Found ${keysFound.size} unique JIRA keys.`);
       const sample = Array.from(keysFound).slice(0, 5).join(', ');
       console.log(`  Sample Keys: ${sample}...`);
    }
  });
});

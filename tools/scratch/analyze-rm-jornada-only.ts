import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
  const json: any[] = XLSX.utils.sheet_to_json(sheet);
  
  const rmRows = json.filter(row => {
    const key = String(row['Chave da item'] || row['Chave'] || '').trim().toUpperCase();
    return key.startsWith('RM-');
  });

  console.log(`Total RM rows: ${rmRows.length}`);
  
  const comboCounts: Record<string, number> = {};
  
  rmRows.forEach(row => {
    const rowKeys = Object.keys(row);
    const customTimeCol = rowKeys.find(k => k.toLowerCase() === 'campo personalizado (time)') || 'Campo personalizado (Time)';
    const jornadaCol = rowKeys.find(k => k.toLowerCase() === 'jornada') || 'Jornada';
    
    const customTimeVal = String(row[customTimeCol] || '').replace(/;;/g, '').trim().toUpperCase();
    const jornadaVal = String(row[jornadaCol] || '').replace(/;;/g, '').trim().toUpperCase();
    
    const comboKey = `Jornada (Jornada col): ${jornadaVal} | Squad (customTime): ${customTimeVal}`;
    comboCounts[comboKey] = (comboCounts[comboKey] || 0) + 1;
  });
  
  console.log('\nCombinations of Jornada and Squad in RM project:');
  Object.entries(comboCounts).sort((a, b) => b[1] - a[1]).forEach(([combo, count]) => {
    console.log(`- ${combo} => ${count} items`);
  });

} else {
  console.log('File not found');
}

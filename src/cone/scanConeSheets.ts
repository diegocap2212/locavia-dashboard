import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE = path.join(__dirname, '../../Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

const workbook = XLSX.readFile(EXCEL_FILE);

workbook.SheetNames.forEach(sheetName => {
  if (!sheetName.toUpperCase().includes('CONE')) return;
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  if (!data || data.length === 0) return;
  
  // Look for CEM-R1 or 58 or 2025-11-24 or similar
  let hasCemR1 = false;
  let has58 = false;
  let hasTargetDate = false;
  
  for (let r = 0; r < Math.min(data.length, 20); r++) {
    const row = data[r] || [];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]);
      if (val.includes('CEM-R1')) hasCemR1 = true;
      if (val === '58') has58 = true;
      if (val.includes('2025-11-24') || val === '45985' || val === '45987' || val === '45989') hasTargetDate = true;
    }
  }
  
  if (hasCemR1 || has58 || hasTargetDate) {
    console.log(`Sheet "${sheetName}" match indicators: CEM-R1=${hasCemR1}, 58=${has58}, Date=${hasTargetDate}`);
    // Print row 1-15
    for (let r = 0; r < Math.min(data.length, 15); r++) {
      console.log(`  Row ${r+1}: ${data[r]?.slice(0, 10).join(' | ')}`);
    }
  }
});

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['BASE CONE'];
const json = XLSX.utils.sheet_to_json(sheet) as any[];

if (json.length > 0) {
  const keys = Object.keys(json[0]);
  console.log('Headers:', keys);
  
  const timeCol = keys.find(k => k.toLowerCase().includes('time') || k.toLowerCase().includes('equipe'));
  console.log('Time Column found:', timeCol);
  
  if (timeCol) {
    const values = new Map<string, number>();
    json.forEach(row => {
      const val = String(row[timeCol] || 'EMPTY');
      values.set(val, (values.get(val) || 0) + 1);
    });
    console.log('\n--- Unique values in Time Column ---');
    Array.from(values.entries()).forEach(([k, v]) => console.log(`${k}: ${v}`));
  }
  
  const statusCol = keys.find(k => k.toLowerCase().includes('status'));
  console.log('\nStatus Column found:', statusCol);
}

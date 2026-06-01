import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (5).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheetName = 'BASE CONE';
  const worksheet = workbook.Sheets[sheetName];
  
  if (worksheet) {
    const json: any[] = XLSX.utils.sheet_to_json(worksheet);
    const prefixMap = new Map();
    
    json.forEach((row: any) => {
      const key = row['Chave da item'] || row['Key'] || '';
      const teamVal = row['time'] || row['Campo personalizado (Time)'] || '';
      if (key && key.includes('-')) {
        const prefix = key.split('-')[0];
        if (!prefixMap.has(prefix)) prefixMap.set(prefix, new Set());
        if (teamVal) prefixMap.get(prefix).add(String(teamVal).replace(/;;/g, '').trim());
      }
    });
    
    const output: Record<string, string[]> = {};
    for (const [prefix, teams] of prefixMap.entries()) {
      output[prefix] = Array.from(teams);
    }
    fs.writeFileSync('scripts/prefix_team_mapping.json', JSON.stringify(output, null, 2));
    console.log('Saved to scripts/prefix_team_mapping.json');
  }
}

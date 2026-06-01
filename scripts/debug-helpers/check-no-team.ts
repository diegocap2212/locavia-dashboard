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
    if (json.length > 0) {
      console.log('Available keys in first row:', Object.keys(json[0]));
    }
    
    const noTeamItems = json.filter((row: any) => {
      const teamValue = row['time'] || row['Campo personalizado (Time)'] || '';
      return !teamValue || String(teamValue).trim() === '' || String(teamValue).trim() === ';;';
    });
    
    const prefixes = new Set();
    noTeamItems.forEach(row => {
      const key = row['Chave da item'] || row['Key'] || '';
      if (key && typeof key === 'string' && key.includes('-')) {
        const prefix = key.split('-')[0];
        prefixes.add(prefix);
      }
    });

    const report = {
      totalWithoutTeam: noTeamItems.length,
      prefixes: Array.from(prefixes),
      samples: noTeamItems.slice(0, 20).map(row => ({
        key: row['Chave da item'] || row['Key'] || '',
        summary: row['Resumo'] || '',
        teamCol: row['time'],
        customTeamCol: row['Campo personalizado (Time)']
      }))
    };
    fs.writeFileSync('scripts/no_team_report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to scripts/no_team_report.json');
  }
}

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
    const json = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Sheet: ${sheetName}`);
    console.log(`Total records: ${json.length}`);
    
    // Count teams
    const teams = new Set();
    json.forEach((row: any) => {
      if (row['time']) teams.add(String(row['time']).replace(/;;/g, '').trim());
    });
    console.log('Teams found:', Array.from(teams));
  } else {
    console.error('Sheet not found');
  }
}

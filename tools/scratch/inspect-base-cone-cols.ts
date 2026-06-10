import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
  const json: any[] = XLSX.utils.sheet_to_json(sheet);
  
  console.log('Total rows:', json.length);
  if (json.length > 0) {
    console.log('Keys of first row:', Object.keys(json[0]));
    console.log('Row 1:', JSON.stringify(json[0]));
    console.log('Row 2:', JSON.stringify(json[1]));
    
    // Find some RM- items and print their fields
    const rmItems = json.filter(row => {
      const key = String(row['Chave da item'] || row['Chave'] || '').trim().toUpperCase();
      return key.startsWith('RM-');
    });
    console.log('\nKeys of first RM row:', Object.keys(rmItems[0]));
    console.log('RM Row 1:', JSON.stringify(rmItems[0]));
    console.log('RM Row 2:', JSON.stringify(rmItems[1]));
  }
} else {
  console.log('File not found');
}

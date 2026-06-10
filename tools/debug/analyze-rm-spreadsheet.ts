import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const rows = XLSX.utils.sheet_to_json(sheet) as any[];

const spreadsheetRMKeys = new Set<string>();
rows.forEach(row => {
    const key = String(row['Chave da item'] || row['Chave'] || '').trim().toUpperCase();
    if (key.startsWith('RM-')) {
        spreadsheetRMKeys.add(key);
    }
});

console.log(`Total RM- keys in Spreadsheet: ${spreadsheetRMKeys.size}`);
console.log('Sample RM- keys in spreadsheet:', Array.from(spreadsheetRMKeys).slice(0, 10));

// Also check the "Jornada" or "Natureza da Demanda" for these RM- items in the spreadsheet
const sampleRM = rows.find(row => String(row['Chave da item']).toUpperCase() === Array.from(spreadsheetRMKeys)[0]);
console.log(`\nSample row data for ${Array.from(spreadsheetRMKeys)[0]}:`);
console.log(JSON.stringify(sampleRM));

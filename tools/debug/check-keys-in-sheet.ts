import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const keysToCheck = ['RM-3480', 'RM-3472', 'RM-3465', 'JVE-3533', 'RM-3416'];

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const rows = XLSX.utils.sheet_to_json(sheet) as any[];

const spreadsheetKeys = new Set<string>();
rows.forEach(row => {
    const key = row['Chave'] || row['Key'] || row['Issue key'];
    if (key) spreadsheetKeys.add(String(key).trim().toUpperCase());
});

keysToCheck.forEach(k => {
    console.log(`Key ${k}: ${spreadsheetKeys.has(k) ? 'FOUND' : 'NOT FOUND'}`);
});

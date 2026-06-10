import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const bfCemReleases = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);

const dashItems = jiraData.filter((i: any) => bfCemReleases.has(i.Release));
const statusExclusions = [
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
];
const filteredDashItems = dashItems.filter(i => !statusExclusions.includes(String(i.Status).toUpperCase()));
const dashKeys = new Set(filteredDashItems.map(i => i.Key));

// Load Spreadsheet
const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const rows = XLSX.utils.sheet_to_json(sheet) as any[];

const spreadsheetKeys = new Set<string>();
rows.forEach(row => {
    const key = row['Chave da item'] || row['Chave'] || row['Key'] || row['Issue key'];
    if (key) spreadsheetKeys.add(String(key).trim().toUpperCase());
});

console.log(`Keys in Dash (Filtered): ${dashKeys.size}`);
console.log(`Keys in Spreadsheet: ${spreadsheetKeys.size}`);

const inDashButNotSpreadsheet = Array.from(dashKeys).filter(k => !spreadsheetKeys.has(k));
const inSpreadsheetButNotDash = Array.from(spreadsheetKeys).filter(k => {
    if (dashKeys.has(k)) return false;
    // Check if it's one of our releases
    const row = rows.find(r => (r['Chave da item'] || r['Chave']) === k);
    const rel = String(row?.['Release'] || '').toUpperCase();
    if (!bfCemReleases.has(rel.split(';')[0])) return false;
    // Check if it's NOT excluded by status
    const status = String(row?.['Status'] || '').toUpperCase();
    if (statusExclusions.includes(status)) return false;
    return true;
});

console.log(`\nIn Dash but NOT in Spreadsheet: ${inDashButNotSpreadsheet.length}`);
console.log(`In Spreadsheet but NOT in Dash: ${inSpreadsheetButNotDash.length}`);

if (inDashButNotSpreadsheet.length > 0) {
    console.log('\nSample in Dash only:', inDashButNotSpreadsheet.slice(0, 5));
}
if (inSpreadsheetButNotDash.length > 0) {
    console.log('\nSample in Spreadsheet only:', inSpreadsheetButNotDash.slice(0, 5));
}

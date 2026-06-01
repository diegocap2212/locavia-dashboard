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
  'PRIORIZADO', 'PRONTO PRA DESENVOLVER', 'PRONTO PARA DESENVOLVER', 'NOVAS ATIVIDADES'
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

const inDashButNotSpreadsheet = Array.from(dashKeys).filter(k => !spreadsheetKeys.has(k));

console.log(`In Dash but NOT in Spreadsheet: ${inDashButNotSpreadsheet.length}`);

if (inDashButNotSpreadsheet.length > 0) {
    console.log('\nAll in Dash only (to check creation dates and teams):');
    const items = inDashButNotSpreadsheet.map(k => {
        const i = dashItems.find(item => item.Key === k);
        return { Key: k, Status: i.Status, Release: i.Release, Team: i.Team, Created: i.Created };
    });
    // Sort by Created date descending
    items.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());
    console.table(items);
}

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Load src/data.json
const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const jiraKeys = new Set(jiraData.map((i: any) => i.Key));

const CONE_EXCLUDED_STATUSES = [
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
];

function normalizeStatus(s: string) {
    return String(s || '').toUpperCase();
}

function isIncludedInDash(item: any) {
    return !CONE_EXCLUDED_STATUSES.includes(normalizeStatus(item.Status));
}

const locaviaDashKeys = new Set(jiraData.filter((i: any) => 
    ['O4R1', 'O4R2', 'O4R3'].includes(i.Release) && isIncludedInDash(i)
).map((i: any) => i.Key));

console.log(`Dash Locavia Keys: ${locaviaDashKeys.size}`);

// Load O4R2 Spreadsheet
const o4r2File = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const o4r2Path = path.join(process.cwd(), o4r2File);
const workbook = XLSX.read(fs.readFileSync(o4r2Path));
const sheet = workbook.Sheets['RELEASE'];
const rows = XLSX.utils.sheet_to_json(sheet) as any[];

const spreadsheetKeys = new Set<string>();
const spreadsheetStatuses: Record<string, number> = {};

rows.forEach(row => {
    // Try to find Jira Key column
    const key = row['Chave'] || row['Key'] || row['Issue key'];
    const status = row['Status'];
    if (key && typeof key === 'string' && key.includes('-')) {
        spreadsheetKeys.add(key.trim().toUpperCase());
        const s = normalizeStatus(status);
        spreadsheetStatuses[s] = (spreadsheetStatuses[s] || 0) + 1;
    }
});

console.log(`Spreadsheet O4R2 Keys: ${spreadsheetKeys.size}`);

// Find missing keys
const inSpreadsheetButNotInDash = Array.from(spreadsheetKeys).filter(k => !locaviaDashKeys.has(k));
const inDashButNotInSpreadsheet = Array.from(locaviaDashKeys).filter(k => !spreadsheetKeys.has(k));

console.log(`\nIn Spreadsheet but NOT in Dash: ${inSpreadsheetButNotInDash.length}`);
console.log(`In Dash but NOT in Spreadsheet: ${inDashButNotInSpreadsheet.length}`);

// Sample of missing keys
console.log('\nSample in Spreadsheet but not in Dash:', inSpreadsheetButNotInDash.slice(0, 10));

// Check if they exist in Jira Data at all (even if filtered)
const missingButInJiraRaw = inSpreadsheetButNotInDash.filter(k => jiraKeys.has(k));
console.log(`Keys in Spreadsheet that are in Jira Data but FILTERED OUT: ${missingButInJiraRaw.length}`);

if (missingButInJiraRaw.length > 0) {
    const samples = missingButInJiraRaw.slice(0, 5).map(k => {
        const item = jiraData.find((i: any) => i.Key === k);
        return { Key: k, Status: item.Status, Release: item.Release };
    });
    console.log('Sample of filtered items:', samples);
}

console.log('\nSpreadsheet Status Distribution:');
console.table(spreadsheetStatuses);

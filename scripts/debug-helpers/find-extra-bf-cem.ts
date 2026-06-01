import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const bfCemReleases = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);

const dashKeys = new Set(jiraData.filter((i: any) => bfCemReleases.has(i.Release)).map((i: any) => i.Key));

// Load Spreadsheet
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

console.log(`Keys in Dash (Synced): ${dashKeys.size}`);
console.log(`Keys in Spreadsheet: ${spreadsheetKeys.size}`);

const inDashButNotSpreadsheet = Array.from(dashKeys).filter(k => !spreadsheetKeys.has(k));
console.log(`\nIn Dash but NOT in Spreadsheet: ${inDashButNotSpreadsheet.length}`);

if (inDashButNotSpreadsheet.length > 0) {
    console.log('Sample extra items:', inDashButNotSpreadsheet.slice(0, 10));
    // Let's see their summary/team to help the user identify them
    const samples = inDashButNotSpreadsheet.slice(0, 5).map(k => {
        const item = jiraData.find((i: any) => i.Key === k);
        return { Key: k, Summary: item.Summary, Team: item.Team, Release: item.Release };
    });
    console.table(samples);
}

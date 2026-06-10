import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Dash keys for Locavia
const locaviaReleases = new Set(['O4R1', 'O4R2', 'O4R3']);
const locaviaExcluded = ['DESCARTADO', 'CANCELADO', 'NOGO'];
const dashLocaviaItems = jiraData.filter((i: any) => 
    locaviaReleases.has(i.Release) && !locaviaExcluded.includes(String(i.Status).toUpperCase())
);
const dashKeys = new Set(dashLocaviaItems.map((i: any) => i.Key));

// Spreadsheet keys for Locavia
const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['BASE CONE'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

const headers = data[0];
const keyIdx = headers.findIndex(c => String(c).includes('Chave'));
const statusIdx = headers.findIndex(c => String(c).includes('Status'));
const releaseIdx = headers.findIndex(c => String(c).includes('Release') || String(c).includes('Fix Version'));

const spreadsheetKeys = new Set<string>();
const spreadsheetItems = [];

for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[keyIdx]) continue;
    const key = String(row[keyIdx]).trim().toUpperCase();
    const status = String(row[statusIdx] || '').toUpperCase();
    const rel = String(row[releaseIdx] || '').toUpperCase();
    
    if ((rel.includes('O4R1') || rel.includes('O4R2') || rel.includes('O4R3')) && status !== 'DESCARTADO') {
        spreadsheetKeys.add(key);
        spreadsheetItems.push({ Key: key, Status: status, Release: rel });
    }
}

console.log(`Dash Locavia Keys: ${dashKeys.size}`);
console.log(`Spreadsheet Locavia Keys (Filtered): ${spreadsheetKeys.size}`);

const inDashButNotSpreadsheet = Array.from(dashKeys).filter(k => !spreadsheetKeys.has(k));
const inSpreadsheetButNotDash = Array.from(spreadsheetKeys).filter(k => !dashKeys.has(k));

console.log(`\nIn Dash but NOT in Spreadsheet: ${inDashButNotSpreadsheet.length}`);
console.log(`In Spreadsheet but NOT in Dash: ${inSpreadsheetButNotDash.length}`);

if (inDashButNotSpreadsheet.length > 0) {
    console.log('\nSample in Dash only:', inDashButNotSpreadsheet.slice(0, 5));
    console.table(inDashButNotSpreadsheet.slice(0, 5).map(k => {
        const i = dashLocaviaItems.find(item => item.Key === k);
        return { Key: k, Status: i.Status, Release: i.Release, Created: i.Created };
    }));
}

if (inSpreadsheetButNotDash.length > 0) {
    console.log('\nSample in Spreadsheet only:', inSpreadsheetButNotDash.slice(0, 5));
    console.table(inSpreadsheetButNotDash.slice(0, 5).map(k => {
        const i = spreadsheetItems.find(item => item.Key === k);
        return i;
    }));
}

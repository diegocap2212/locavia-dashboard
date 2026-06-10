import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const rows = XLSX.utils.sheet_to_json(sheet) as any[];

const spreadsheetKeys = rows.map(row => String(row['Chave'] || row['Key'] || row['Issue key']).trim().toUpperCase()).filter(k => k !== 'UNDEFINED');

const foundInJira = jiraData.find((i: any) => spreadsheetKeys.includes(i.Key));

if (foundInJira) {
    console.log(`Found item ${foundInJira.Key} in both.`);
    console.log(`Labels: ${JSON.stringify(foundInJira.Labels)}`);
    // I'll also check if there's any specific field I should look at in the spreadsheet
    const sheetRow = rows.find(r => String(r['Chave'] || r['Key'] || r['Issue key']).trim().toUpperCase() === foundInJira.Key);
    console.log(`Spreadsheet Row: ${JSON.stringify(sheetRow)}`);
} else {
    console.log('No common items found between synced data and spreadsheet.');
}

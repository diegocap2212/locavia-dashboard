import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');
const ws = wb.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const data = XLSX.utils.sheet_to_json(ws) as any[];

console.log(`Total rows in _Locavia_ BASE CONE 2 (Jira) sheet: ${data.length}`);

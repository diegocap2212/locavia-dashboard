import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../data.json');
const EXCEL_FILE = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');

const rawJson = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as any[];
const jsonCem = rawJson.filter(it => it.Release === 'CEM-R1');

const workbook = XLSX.readFile(EXCEL_FILE);
const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const excelRows = XLSX.utils.sheet_to_json(sheet) as any[];

const excelCem = excelRows.filter((row: any) => {
  const rel = String(row['Release'] || '');
  return rel.includes('CEM-R1');
});

console.log(`data.json CEM-R1 items count: ${jsonCem.length}`);
console.log(`Excel CEM-R1 items count: ${excelCem.length}`);

// Let's find keys in json but not in excel
const excelKeys = new Set(excelCem.map((r: any) => r['Chave da item'] || r['Key']));
const jsonKeys = new Set(jsonCem.map(it => it.Key));

const onlyInJson = jsonCem.filter(it => !excelKeys.has(it.Key));
const onlyInExcel = excelCem.filter((r: any) => !jsonKeys.has(r['Chave da item'] || r['Key']));

console.log(`Only in data.json count: ${onlyInJson.length}`);
if (onlyInJson.length > 0) {
  console.log('Sample only in data.json:', onlyInJson.slice(0, 10).map(it => ({ Key: it.Key, Status: it.Status })));
}

console.log(`Only in Excel count: ${onlyInExcel.length}`);
if (onlyInExcel.length > 0) {
  console.log('Sample only in Excel:', onlyInExcel.slice(0, 10).map((r: any) => ({ Key: r['Chave da item'], Status: r['Status'] })));
}

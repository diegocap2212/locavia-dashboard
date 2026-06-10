import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const xlsxFile = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const csvFile = 'base_cone.csv';

const xlsxPath = path.join(process.cwd(), xlsxFile);
const csvPath = path.join(process.cwd(), csvFile);

if (!fs.existsSync(xlsxPath) || !fs.existsSync(csvPath)) {
  console.log('Missing files.');
  process.exit(1);
}

// 1. Read CSV Keys
const rawCsv = fs.readFileSync(csvPath, 'latin1');
const csvRecords = parse(rawCsv, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });
const csvKeysMap = new Map<string, any>();
csvRecords.forEach((r: any) => {
  const key = r['Chave da item'] || r['Chave'] || r['Key'] || Object.values(r)[1];
  if (key) csvKeysMap.set(String(key).trim().toUpperCase(), r);
});

// 2. Read XLSX Keys
const workbook = XLSX.read(fs.readFileSync(xlsxPath));
const sheet = workbook.Sheets['BASE CONE'];
const xlsxRecords = XLSX.utils.sheet_to_json(sheet) as any[];
const xlsxKeysMap = new Map<string, any>();
xlsxRecords.forEach((r: any) => {
  const key = r['Chave da item'] || r['Chave'] || r['Key'];
  if (key) xlsxKeysMap.set(String(key).trim().toUpperCase(), r);
});

console.log(`Total Keys in CSV: ${csvKeysMap.size}`);
console.log(`Total Keys in XLSX BASE CONE: ${xlsxKeysMap.size}`);

// Find missing in CSV but present in XLSX
const inXlsxNotInCsv: string[] = [];
xlsxKeysMap.forEach((val, key) => {
  if (!csvKeysMap.has(key)) {
    inXlsxNotInCsv.push(key);
  }
});

console.log(`\nItems in XLSX but NOT in CSV (${inXlsxNotInCsv.length}):`);
// Group by Team to see where they belong
const teamGroup: Record<string, string[]> = {};
inXlsxNotInCsv.forEach(key => {
  const item = xlsxKeysMap.get(key);
  const team = String(item['Campo personalizado (Time)'] || 'EMPTY');
  if (!teamGroup[team]) teamGroup[team] = [];
  teamGroup[team].push(`${key} (${item['Resumo']})`);
});

Object.entries(teamGroup).forEach(([team, items]) => {
  console.log(`\n--- Team: ${team} (${items.length} items) ---`);
  items.slice(0, 10).forEach(i => console.log(`  - ${i}`));
  if (items.length > 10) console.log(`  ... and ${items.length - 10} more`);
});

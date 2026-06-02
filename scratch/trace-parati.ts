import fs from 'fs';
import { parse } from 'csv-parse/sync';

const rawCsv = fs.readFileSync('base_cone.csv', 'latin1');
const records = parse(rawCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true,
  delimiter: ';'
});

const row = records.find((r: any) => {
  const key = String(r['Chave da item'] || r['Chave'] || '').trim().toUpperCase();
  return key === 'RM-3388';
});

console.log('Row in base_cone.csv:', JSON.stringify(row, null, 2));

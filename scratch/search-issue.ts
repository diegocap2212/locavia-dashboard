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

const hit = records.find((r: any) => {
  return String(r['Chave da item'] || r['Key'] || '').includes('LI-940');
});

console.log('LI-940 in CSV:', hit);

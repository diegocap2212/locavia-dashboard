import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const csvPath = path.resolve(process.cwd(), 'base_cone.csv');
if (!fs.existsSync(csvPath)) {
  console.error('base_cone.csv not found');
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'latin1');
const records = parse(raw, {
  delimiter: ';',
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true
});

console.log(`Total rows: ${records.length}`);
console.log('Sample rows:');
for (let i = 0; i < 15; i++) {
  const r = records[i];
  if (!r) break;
  console.log(`Row ${i}:`);
  console.log(`  Key: ${r['Chave da item'] || r['Key']}`);
  console.log(`  Status: ${r['Status']}`);
  console.log(`  Time (customfield): ${r['Campo personalizado (Time)']}`);
  console.log(`  time (last col): ${r['time']}`);
  console.log(`  Release (customfield): ${r['Campo personalizado (Release)']}`);
  console.log(`  release (last col): ${r['release']}`);
}

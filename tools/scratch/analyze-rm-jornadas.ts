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

const headers = Object.keys(records[0]);
console.log('Headers:', headers);

const rmRecords = records.filter((r: any) => {
  const key = String(r['Chave da item'] || r['Chave'] || '').trim().toUpperCase();
  return key.startsWith('RM-');
});

console.log(`\nTotal RM records: ${rmRecords.length}`);

// Group by Jornada and Time
const groups: Record<string, number> = {};
const jornadaField = headers.find(h => h.toLowerCase().includes('jornada'));
const timeField = headers.find(h => h.toLowerCase().includes('time'));
const customTimeField = headers.find(h => h.toLowerCase().includes('campo personalizado (time)'));

rmRecords.forEach((r: any) => {
  const j = jornadaField ? String(r[jornadaField] || '').replace(/;;/g, '').trim() : '';
  const t = timeField ? String(r[timeField] || '').replace(/;;/g, '').trim() : '';
  const ct = customTimeField ? String(r[customTimeField] || '').replace(/;;/g, '').trim() : '';
  const key = `${j} | Time: ${t} | CustomTime: ${ct}`;
  groups[key] = (groups[key] || 0) + 1;
});

console.log('\nGrouped RM records:');
Object.entries(groups).sort((a,b) => b[1] - a[1]).forEach(([key, count]) => {
  console.log(`${key} => ${count}`);
});

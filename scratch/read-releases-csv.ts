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

const releasesMap: Record<string, number> = {};
records.forEach((r: any) => {
  const rel = r['release'] || r['Campo personalizado (Release)'] || '';
  releasesMap[rel] = (releasesMap[rel] || 0) + 1;
});

console.log('Releases in base_cone.csv:', releasesMap);

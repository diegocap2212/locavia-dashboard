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
const projects = ['WA', 'VAA', 'SN', 'RM', 'CTO', 'APV', 'LKD'];

projects.forEach(p => {
  const pRows = records.filter((r: any) => {
    const key = String(r['Chave da item'] || r['Chave'] || '').trim().toUpperCase();
    return key.startsWith(p + '-');
  });
  console.log(`\n=== PROJECT: ${p} (${pRows.length} rows) ===`);
  if (pRows.length > 0) {
    const sample = pRows[0];
    console.log(`Key: ${sample['Chave da item'] || sample['Chave']}`);
    console.log(`time: "${sample['time']}"`);
    console.log(`Campo personalizado (Time): "${sample['Campo personalizado (Time)']}"`);
    console.log(`Campo personalizado (Jornada): "${sample['Campo personalizado (Jornada)'] || sample['Jornada']}"`);
  }
});

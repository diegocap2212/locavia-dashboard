import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const csvPath = path.join(process.cwd(), 'base_cone.csv');
const rawCsv = fs.readFileSync(csvPath, 'latin1');
const records = parse(rawCsv, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });

console.log(`--- Analisando colunas de Time no base_cone.csv (Amostra) ---`);
records.slice(0, 20).forEach((r: any) => {
  console.log(`Key: ${r['Chave da item'] || r['Key']} | Campo personalizado (Time): "${r['Campo personalizado (Time)']}" | time: "${r['time']}"`);
});
